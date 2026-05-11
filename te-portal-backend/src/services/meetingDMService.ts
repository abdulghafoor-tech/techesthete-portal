import { Server } from "socket.io";
import db from "../../models";

const { DirectConversation, DirectMessage, User } = db;

interface Meeting {
  id: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  workspaceId: number;
  location?: string;
  meetingLink?: string;
}

interface Participant {
  userId: number;
  user?: any;
}

interface Organizer {
  id: number;
  name: string;
}

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

export const sendMeetingInvitationDM = async (
  meeting: Meeting,
  participant: Participant,
  organizer: Organizer,
  io: Server
): Promise<void> => {
  try {
    if (participant.userId === organizer.id) {
      console.log(`⏭️ Skipping invitation DM to organizer (user ${participant.userId})`);
      return;
    }

    const [userOneId, userTwoId] = [organizer.id, participant.userId].sort((a, b) => a - b);

    let conversation = await DirectConversation.findOne({
      where: { workspaceId: meeting.workspaceId, userOneId, userTwoId },
    });

    if (!conversation) {
      conversation = await DirectConversation.create({
        workspaceId: meeting.workspaceId,
        userOneId,
        userTwoId,
      });
      console.log(`✅ Created new conversation ${(conversation as any).id} for meeting invitation`);
    }

    let invitationContent = `📅 Meeting Invitation

${organizer.name} has invited you to a meeting:

📋 Topic: ${meeting.title}`;

    if (meeting.description) {
      invitationContent += `\n📝 Description: ${meeting.description}`;
    }

    invitationContent += `\n📅 Date: ${formatDate(meeting.startTime)}
🕐 Time: ${formatTime(meeting.startTime)} – ${formatTime(meeting.endTime)}`;

    if (meeting.meetingLink) {
      invitationContent += `\n🔗 Link: ${meeting.meetingLink}`;
    } else if (meeting.location) {
      invitationContent += `\n📍 Location: ${meeting.location}`;
    }

    invitationContent += `\n\n⬇️ Please respond to this invitation:`;

    const message = await DirectMessage.create({
      conversationId: (conversation as any).id,
      senderId: organizer.id,
      content: invitationContent,
      meetingId: meeting.id,
      messageType: 'meeting_invitation',
    });

    console.log(`✅ Meeting invitation DM sent to user ${participant.userId} for meeting ${meeting.id}`);

    const messageData = {
      id: (message as any).id,
      conversationId: (conversation as any).id,
      content: invitationContent,
      senderId: organizer.id,
      senderName: organizer.name,
      senderImage: null,
      createdAt: (message as any).createdAt,
      attachments: [],
      isEdited: false,
      isPinned: false,
      meetingId: meeting.id,
      messageType: 'meeting_invitation',
    };

    io.to(`conversation:${(conversation as any).id}`).emit("new_direct_message", messageData);

    const recipientSockets = await io.in(`user:${participant.userId}`).fetchSockets();
    if (recipientSockets.length > 0) {
      const fullConversation = await DirectConversation.findOne({
        where: { id: (conversation as any).id },
        include: [
          { model: User, as: "userOne", attributes: ["id", "name", "email", "image"] },
          { model: User, as: "userTwo", attributes: ["id", "name", "email", "image"] },
        ],
      });

      io.to(`user:${participant.userId}`).emit("new_conversation", {
        conversation: fullConversation,
        message: messageData,
      });
    }
  } catch (error: any) {
    console.error(
      `❌ Failed to send meeting invitation DM to user ${participant.userId} for meeting ${meeting.id}:`,
      error.message
    );
  }
};

export const sendMeetingConfirmationDM = async (
  meeting: Meeting,
  participant: Participant,
  organizer: Organizer,
  io: Server
): Promise<void> => {
  try {
    const [userOneId, userTwoId] = [organizer.id, participant.userId].sort((a, b) => a - b);

    let conversation = await DirectConversation.findOne({
      where: { workspaceId: meeting.workspaceId, userOneId, userTwoId },
    });

    if (!conversation) {
      conversation = await DirectConversation.create({
        workspaceId: meeting.workspaceId,
        userOneId,
        userTwoId,
      });
      console.log(`✅ Created new conversation ${(conversation as any).id} for meeting confirmation`);
    }

    const confirmationContent = `📅 Meeting Confirmed
Topic: ${meeting.title}
Date: ${formatDate(meeting.startTime)}
Time: ${formatTime(meeting.startTime)} – ${formatTime(meeting.endTime)}
Organized by: ${organizer.name}
You have accepted this meeting invitation.`;

    const message = await DirectMessage.create({
      conversationId: (conversation as any).id,
      senderId: organizer.id,
      content: confirmationContent,
    });

    console.log(`✅ Meeting confirmation DM sent to user ${participant.userId} for meeting ${meeting.id}`);

    const messageData = {
      id: (message as any).id,
      conversationId: (conversation as any).id,
      content: confirmationContent,
      senderId: organizer.id,
      senderName: organizer.name,
      senderImage: null,
      createdAt: (message as any).createdAt,
      attachments: [],
      isEdited: false,
      isPinned: false,
    };

    io.to(`conversation:${(conversation as any).id}`).emit("new_direct_message", messageData);

    const recipientSockets = await io.in(`user:${participant.userId}`).fetchSockets();
    if (recipientSockets.length > 0) {
      const fullConversation = await DirectConversation.findOne({
        where: { id: (conversation as any).id },
        include: [
          { model: User, as: "userOne", attributes: ["id", "name", "email", "image"] },
          { model: User, as: "userTwo", attributes: ["id", "name", "email", "image"] },
        ],
      });

      io.to(`user:${participant.userId}`).emit("new_conversation", {
        conversation: fullConversation,
        message: messageData,
      });
    }
  } catch (error: any) {
    console.error(
      `❌ Failed to send meeting confirmation DM to user ${participant.userId} for meeting ${meeting.id}:`,
      error.message
    );
  }
};
