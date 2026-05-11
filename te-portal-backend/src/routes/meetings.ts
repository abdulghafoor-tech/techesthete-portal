import { Router, Request, Response } from "express";
import authenticateToken from "../../middleware/authMiddleware";
import db from "../../models";
import { sendMeetingInvitations, validateResponseToken } from "../services/meetingEmailService";
import { sendMeetingConfirmationDM, sendMeetingInvitationDM } from "../services/meetingDMService";

const meetingsRouter = Router({ mergeParams: true });
const { Meeting, MeetingParticipant, User } = db;

// Public endpoint for email response links (no authentication required)
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 9.1, 9.2, 9.3, 9.4, 9.5
meetingsRouter.get("/:meetingId/respond", async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const { token, action } = req.query;

    // Validate required parameters
    if (!token || typeof token !== "string") {
      return res.status(400).send(generateErrorPage("Invalid Request", "Missing or invalid token parameter."));
    }

    if (!action || (action !== "accept" && action !== "decline")) {
      return res.status(400).send(generateErrorPage("Invalid Request", "Invalid action parameter. Must be 'accept' or 'decline'."));
    }

    // Validate JWT token
    const payload = validateResponseToken(token);
    if (!payload) {
      return res.status(401).send(generateErrorPage("Token Expired or Invalid", "This response link has expired or is invalid. Please contact the meeting organizer."));
    }

    // Verify token matches the meeting ID
    if (payload.meetingId !== parseInt(meetingId)) {
      return res.status(403).send(generateErrorPage("Invalid Token", "This token is not valid for this meeting."));
    }

    // Verify meeting exists
    const meeting = await Meeting.findByPk(meetingId, {
      include: [{
        model: User,
        as: 'organizer',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!meeting) {
      return res.status(404).send(generateErrorPage("Meeting Not Found", "The meeting you're trying to respond to does not exist."));
    }

    // Verify participant exists
    const participant = await MeetingParticipant.findOne({
      where: { meetingId, userId: payload.userId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!participant) {
      return res.status(404).send(generateErrorPage("Participant Not Found", "You are not a participant in this meeting."));
    }

    // Update participant response status
    const responseStatus = action === "accept" ? "accepted" : "declined";
    await participant.update({ responseStatus });

    // Emit socket event for real-time status update
    // Requirements: 5.1, 5.2, 5.3
    try {
      const io = req.app.get("io");
      const meetingData = meeting.toJSON() as any;
      const participantData = (participant as any).user;

      io.to(`user:${meetingData.organizerId}`).emit("meeting_response_updated", {
        meetingId: parseInt(meetingId),
        participantId: payload.userId,
        participantName: participantData.name,
        responseStatus,
      });

      console.log(`✅ Emitted meeting_response_updated to organizer ${meetingData.organizerId}`);
    } catch (error: any) {
      console.error(`❌ Failed to emit meeting_response_updated for meeting ${meetingId}:`, error.message);
    }

    // Send confirmation DM if accepted
    // Requirements: 4.1, 4.2, 4.5
    if (action === "accept") {
      try {
        const io = req.app.get("io");
        const meetingData = meeting.toJSON() as any;
        const organizerData = meetingData.organizer;

        await sendMeetingConfirmationDM(
          {
            id: meetingData.id,
            title: meetingData.title,
            startTime: meetingData.startTime,
            endTime: meetingData.endTime,
            workspaceId: meetingData.workspaceId,
          },
          { userId: payload.userId },
          { id: organizerData.id, name: organizerData.name },
          io
        );
      } catch (error: any) {
        // Log error but don't fail the response
        console.error(`❌ Failed to send confirmation DM for meeting ${meetingId}:`, error.message);
      }
    }

    // Return success page
    const meetingData = meeting.toJSON() as any;
    const participantData = (participant as any).user;
    res.send(generateSuccessPage(meetingData, participantData, action as string));

  } catch (error: any) {
    console.error("Error processing meeting response:", error);
    res.status(500).send(generateErrorPage("Server Error", "An error occurred while processing your response. Please try again later."));
  }
});

// Create a meeting
// Requirements: 1.1, 1.2, 1.6, 7.1, 7.2, 7.3
// Email invitations are ONLY sent during meeting creation, NOT on edits
meetingsRouter.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { title, description, startTime, endTime, location, meetingLink, participantIds } = req.body;
    const workspaceId = (req as any).params.workspaceId;
    const organizerId = (req as any).user.id;

    const meeting = await Meeting.create({
      title,
      description,
      startTime,
      endTime,
      workspaceId,
      organizerId,
      location,
      meetingLink,
      status: 'scheduled'
    });

    // Add participants (ensure organizer is included and deduplicate)
    if (participantIds && Array.isArray(participantIds)) {
      // Add organizer if not already in the list and deduplicate
      const uniqueParticipantIds = [...new Set([organizerId, ...participantIds])];
      
      const participants = uniqueParticipantIds.map((userId: number) => ({
        meetingId: meeting.id,
        userId,
        responseStatus: userId === organizerId ? 'accepted' : 'pending'
      }));
      
      await MeetingParticipant.bulkCreate(participants);
    } else {
      // If no participants provided, at least add the organizer
      await MeetingParticipant.create({
        meetingId: meeting.id,
        userId: organizerId,
        responseStatus: 'accepted'
      });
    }

    // Send email invitations and DMs asynchronously (fire-and-forget)
    // Requirements: 1.1, 1.2, 1.6, 7.1, 7.2, 7.3, 8.3, 8.4
    // Email and DM sending happens after meeting creation to ensure meeting is saved even if they fail
    setImmediate(async () => {
      try {
        // Fetch participants with user data
        const participantsWithUsers = await MeetingParticipant.findAll({
          where: { meetingId: meeting.id },
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }]
        });

        // Fetch organizer data
        const organizer = await User.findByPk(organizerId, {
          attributes: ['id', 'name', 'email']
        });

        if (organizer) {
          const organizerData = organizer.toJSON();
          const meetingData = meeting.toJSON();
          const io = req.app.get('io');

          // Send email invitations
          await sendMeetingInvitations(
            meetingData,
            participantsWithUsers.map((p: any) => ({
              userId: p.userId,
              user: p.user
            })),
            organizerData
          );

          // Send DM invitations to all participants (excluding organizer)
          console.log(`📨 Sending meeting invitation DMs to ${participantsWithUsers.length} participants`);
          
          for (const participant of participantsWithUsers) {
            if (participant.userId !== organizerId) {
              await sendMeetingInvitationDM(
                {
                  id: meetingData.id,
                  title: meetingData.title,
                  description: meetingData.description,
                  startTime: meetingData.startTime,
                  endTime: meetingData.endTime,
                  workspaceId: meetingData.workspaceId,
                  location: meetingData.location,
                  meetingLink: meetingData.meetingLink,
                },
                { userId: participant.userId, user: (participant as any).user },
                { id: organizerData.id, name: organizerData.name },
                io
              );
            }
          }
          
          console.log(`✅ Meeting invitations sent (email + DM) for meeting ${meeting.id}`);
        }
      } catch (error: any) {
        console.error(`❌ Error sending meeting invitations for meeting ${meeting.id}:`, error.message);
      }
    });

    res.status(201).json({ success: true, meeting });
  } catch (error: any) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ message: "Error creating meeting", error: error.message });
  }
});

// Get all meetings for a workspace
meetingsRouter.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const workspaceId = (req as any).params.workspaceId;
    const userId = (req as any).user.id;

    const meetings = await Meeting.findAll({
      where: { workspaceId },
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'email', 'image']
        },
        {
          model: MeetingParticipant,
          as: 'participants',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'image']
          }]
        }
      ],
      order: [['startTime', 'ASC']]
    });

    res.json({ success: true, meetings });
  } catch (error: any) {
    console.error("Error fetching meetings:", error);
    res.status(500).json({ message: "Error fetching meetings", error: error.message });
  }
});

// Get a single meeting by ID
meetingsRouter.get("/:meetingId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const userId = (req as any).user.id;

    const meeting = await Meeting.findByPk(meetingId, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'email', 'image']
        },
        {
          model: MeetingParticipant,
          as: 'participants',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'image']
          }]
        }
      ]
    });

    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    res.json({ success: true, meeting });
  } catch (error: any) {
    console.error("Error fetching meeting:", error);
    res.status(500).json({ message: "Error fetching meeting", error: error.message });
  }
});

// Update meeting response status (from calendar or DM)
meetingsRouter.patch("/:meetingId/response", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const { responseStatus } = req.body;
    const userId = (req as any).user.id;

    console.log(`📝 Meeting response update: Meeting ${meetingId}, User ${userId}, Status: ${responseStatus}`);

    // Validate responseStatus
    if (!responseStatus || !['accepted', 'declined', 'pending'].includes(responseStatus)) {
      console.log('❌ Invalid response status:', responseStatus);
      return res.status(400).json({ 
        success: false,
        message: "Invalid response status. Must be 'accepted', 'declined', or 'pending'" 
      });
    }

    // Check if meeting exists
    const meeting = await Meeting.findByPk(meetingId, {
      include: [{
        model: User,
        as: 'organizer',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!meeting) {
      console.log('❌ Meeting not found:', meetingId);
      return res.status(404).json({ 
        success: false,
        message: "Meeting not found" 
      });
    }

    const participant = await MeetingParticipant.findOne({
      where: { meetingId, userId }
    });

    if (!participant) {
      console.log('❌ Participant not found for meeting:', { meetingId, userId });
      console.log('💡 Creating participant record...');
      
      // Create participant if they don't exist (edge case handling)
      try {
        const newParticipant = await MeetingParticipant.create({
          meetingId,
          userId,
          responseStatus
        });
        console.log('✅ Created new participant record:', newParticipant);
      } catch (createError: any) {
        console.error('❌ Failed to create participant:', createError);
        return res.status(404).json({ 
          success: false,
          message: "You are not a participant in this meeting" 
        });
      }
    } else {
      await participant.update({ responseStatus });
      console.log(`✅ Updated participant response status to: ${responseStatus}`);
    }

    const meetingData = meeting.toJSON() as any;
    const io = req.app.get("io");

    // Emit socket event for real-time status update to organizer
    try {
      const participantUser = await User.findByPk(userId, {
        attributes: ['id', 'name']
      });

      io.to(`user:${meetingData.organizerId}`).emit("meeting_response_updated", {
        meetingId: parseInt(meetingId),
        participantId: userId,
        participantName: (participantUser as any)?.name || 'Unknown',
        responseStatus,
      });

      console.log(`✅ Emitted meeting_response_updated to organizer ${meetingData.organizerId}`);
    } catch (error: any) {
      console.error(`❌ Failed to emit meeting_response_updated for meeting ${meetingId}:`, error.message);
    }

    // Emit to all participants for calendar sync
    try {
      const allParticipants = await MeetingParticipant.findAll({
        where: { meetingId },
        attributes: ['userId']
      });

      allParticipants.forEach((p: any) => {
        io.to(`user:${p.userId}`).emit("meeting_status_changed", {
          meetingId: parseInt(meetingId),
          participantId: userId,
          responseStatus,
        });
      });

      console.log(`✅ Emitted meeting_status_changed to all participants`);
    } catch (error: any) {
      console.error(`❌ Failed to emit meeting_status_changed:`, error.message);
    }

    // Send confirmation DM if accepted
    if (responseStatus === "accepted") {
      try {
        await sendMeetingConfirmationDM(
          {
            id: meetingData.id,
            title: meetingData.title,
            startTime: meetingData.startTime,
            endTime: meetingData.endTime,
            workspaceId: meetingData.workspaceId,
          },
          { userId },
          { id: meetingData.organizer.id, name: meetingData.organizer.name },
          io
        );
        console.log(`✅ Sent confirmation DM to user ${userId}`);
      } catch (error: any) {
        console.error(`❌ Failed to send confirmation DM for meeting ${meetingId}:`, error.message);
      }
    }

    res.json({ success: true, message: "Response updated", responseStatus });
  } catch (error: any) {
    console.error("Error updating response:", error);
    res.status(500).json({ 
      success: false,
      message: "Error updating response", 
      error: error.message 
    });
  }
});

// Delete meeting
meetingsRouter.delete("/:meetingId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const userId = (req as any).user.id;

    const meeting = await Meeting.findByPk(meetingId);

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if ((meeting as any).organizerId !== userId) {
      return res.status(403).json({ message: "Only organizer can delete meeting" });
    }

    await meeting.destroy();

    res.json({ success: true, message: "Meeting deleted" });
  } catch (error: any) {
    console.error("Error deleting meeting:", error);
    res.status(500).json({ message: "Error deleting meeting", error: error.message });
  }
});

// Helper functions for HTML response pages
// Requirements: 3.2, 3.3, 3.6

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const generateSuccessPage = (meeting: any, participant: any, action: string): string => {
  const actionText = action === "accept" ? "accepted" : "declined";
  const actionEmoji = action === "accept" ? "✓" : "✗";
  const actionColor = action === "accept" ? "#27ae60" : "#e74c3c";

  const locationInfo = meeting.meetingLink
    ? `<p><strong>Meeting Link:</strong> <a href="${meeting.meetingLink}" style="color: #3498db;">${meeting.meetingLink}</a></p>`
    : meeting.location
    ? `<p><strong>Location:</strong> ${meeting.location}</p>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Response Confirmed</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; width: 80px; height: 80px; border-radius: 50%; background-color: ${actionColor}; color: white; font-size: 48px; line-height: 80px;">
            ${actionEmoji}
          </div>
        </div>

        <h1 style="color: #2c3e50; text-align: center; margin-bottom: 10px;">Response Confirmed</h1>
        <p style="text-align: center; font-size: 18px; color: #555; margin-bottom: 30px;">
          You have <strong>${actionText}</strong> the meeting invitation
        </p>

        <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #3498db; margin-top: 0; font-size: 20px;">${meeting.title}</h2>
          
          ${meeting.description ? `<p style="color: #555; margin: 10px 0;">${meeting.description}</p>` : ""}
          
          <div style="margin: 15px 0;">
            <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${formatDate(meeting.startTime)}</p>
            <p style="margin: 8px 0;"><strong>🕐 Time:</strong> ${formatTime(meeting.startTime)} – ${formatTime(meeting.endTime)}</p>
            <p style="margin: 8px 0;"><strong>👤 Organized by:</strong> ${meeting.organizer.name}</p>
            ${locationInfo}
          </div>
        </div>

        ${action === "accept" ? `
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #155724;">
              📧 A confirmation message has been sent to your account.
            </p>
          </div>
        ` : ""}

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #777; font-size: 14px;">You can close this window now.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateErrorPage = (title: string, message: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; width: 80px; height: 80px; border-radius: 50%; background-color: #e74c3c; color: white; font-size: 48px; line-height: 80px;">
            ✗
          </div>
        </div>

        <h1 style="color: #e74c3c; text-align: center; margin-bottom: 10px;">${title}</h1>
        <p style="text-align: center; font-size: 16px; color: #555; margin-bottom: 30px;">
          ${message}
        </p>

        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #721c24; font-size: 14px;">
            If you continue to experience issues, please contact the meeting organizer directly.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #777; font-size: 14px;">You can close this window now.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default meetingsRouter;
