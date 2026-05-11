import jwt from "jsonwebtoken";
import { transporter } from "../utils/mailer";

interface Meeting {
  id: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  meetingLink?: string;
}

interface User {
  id: number;
  email: string;
  name: string;
}

interface Participant {
  userId: number;
  user?: User;
}

interface TokenPayload {
  meetingId: number;
  userId: number;
}


export const generateResponseToken = (meetingId: number, userId: number): string => {
  const payload: TokenPayload = {
    meetingId,
    userId,
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "48h",
  });
};


export const validateResponseToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};


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


const generateEmailTemplate = (
  meeting: Meeting,
  organizer: User,
  participant: User,
  acceptUrl: string,
  declineUrl: string
): string => {
  const locationInfo = meeting.meetingLink
    ? `<p><strong>Meeting Link:</strong> <a href="${meeting.meetingLink}">${meeting.meetingLink}</a></p>`
    : meeting.location
    ? `<p><strong>Location:</strong> ${meeting.location}</p>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Meeting Invitation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
        <h1 style="color: #2c3e50; margin-top: 0;">📅 Meeting Invitation</h1>
        
        <div style="background-color: white; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #3498db; margin-top: 0;">${meeting.title}</h2>
          
          ${meeting.description ? `<p style="color: #555;">${meeting.description}</p>` : ""}
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #3498db;">
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${formatDate(meeting.startTime)}</p>
            <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${formatTime(meeting.startTime)} – ${formatTime(meeting.endTime)}</p>
            <p style="margin: 5px 0;"><strong>👤 Organized by:</strong> ${organizer.name}</p>
            ${locationInfo}
          </div>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; text-align: center;">
          <p>This invitation was sent to ${participant.email}</p>
          <p>Please respond to this meeting invitation in the app</p>
        </div>
      </div>
    </body>
    </html>
  `;
};


export const sendMeetingInvitations = async (
  meeting: Meeting,
  participants: Participant[],
  organizer: User
): Promise<void> => {
  const baseUrl = process.env.BACKEND_URL || "http://localhost:5000";

  for (const participant of participants) {
    
    if (!participant.user || participant.userId === organizer.id) {
      continue;
    }

    try {
     
      const token = generateResponseToken(meeting.id, participant.userId);

      
      const acceptUrl = `${baseUrl}/api/meetings/${meeting.id}/respond?token=${token}&action=accept`;
      const declineUrl = `${baseUrl}/api/meetings/${meeting.id}/respond?token=${token}&action=decline`;

      
      const html = generateEmailTemplate(
        meeting,
        organizer,
        participant.user,
        acceptUrl,
        declineUrl
      );

      // Send email
      await transporter.sendMail({
        from: process.env.EMAIL_USER || "noreply@techesthete.com",
        to: participant.user.email,
        subject: `Meeting Invitation: ${meeting.title}`,
        html,
      });

      console.log(`✅ Meeting invitation sent to ${participant.user.email} for meeting ${meeting.id}`);
    } catch (error: any) {
      
      console.error(
        `❌ Failed to send meeting invitation to ${participant.user?.email} for meeting ${meeting.id}:`,
        error.message
      );
    }
  }
};
