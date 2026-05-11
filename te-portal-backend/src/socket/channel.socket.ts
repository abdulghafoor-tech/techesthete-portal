import { Server, Socket } from "socket.io";
import Channel from "../../models/Channel";
import ChannelMember from "../../models/channelMember";
import ChannelMessage from "../../models/channelMessage";
import WorkspaceMembers from "../../models/WorkspaceMembers";
import Attachment from "../../models/Attachment";
import Reaction from "../../models/Reaction";
import db from "../../models";


export default function registerChannelSocket(
  io: Server,
  socket: Socket
) {
  const userId = (socket as any).user.id;


  socket.on(
    "join_channel",
    async ({ channelId, workspaceId }) => {
      console.log('🔵 [Channel] Join channel request:', {
        channelId,
        workspaceId,
        userId,
        socketId: socket.id
      });
      
      try {
        
        const workspaceMember = await WorkspaceMembers.findOne({
          where: {
            workspaceId,
            userId,
          },
        });

        if (!workspaceMember) {
          console.log('❌ [Channel] User not member of workspace');
          return socket.emit("error", {
            message: "You are not a member of this workspace",
          });
        }

        
        const channel = await Channel.findByPk(channelId);

        if (!channel) {
          console.log('❌ [Channel] Channel not found');
          return socket.emit("error", {
            message: "Channel not found",
          });
        }

        console.log('✅ [Channel] Channel found:', {
          id: (channel as any).id,
          name: (channel as any).name,
          type: (channel as any).type
        });

    
        if ((channel as any).type === "private") {
          const channelMember = await ChannelMember.findOne({
            where: {
              channelId,
              userId,
            },
          });

          if (!channelMember) {
            console.log('❌ [Channel] User not authorized for private channel');
            return socket.emit("error", {
              message: "You are not allowed to join this private channel",
            });
          }
        }

        
        const roomName = `channel:${channelId}`;
        socket.join(roomName);
        
        console.log('✅ [Channel] User joined channel:', {
          roomName,
          userId,
          socketId: socket.id,
          roomSize: io.sockets.adapter.rooms.get(roomName)?.size || 0
        });

        socket.emit("joined_channel", {
          channelId,
        });
      } catch (error: any) {
        console.error("❌ [Channel] Join channel error:", error);
        socket.emit("error", {
          message: "Failed to join channel: " + (error.message || 'Unknown error'),
        });
      }
    }
  );


  socket.on("leave_channel", ({ channelId }) => {
    socket.leave(`channel:${channelId}`);
  });

 
  socket.on(
    "send_message",
    async (data: { channelId: any; content: any; attachments?: any[]; parentMessageId?: number }) => {
      const { channelId, content, parentMessageId } = data;
      
      console.log('📨 [Channel] Received send_message event:', {
        channelId,
        contentLength: content?.length || 0,
        attachmentsCount: data.attachments?.length || 0,
        userId,
        socketId: socket.id,
        rooms: Array.from(socket.rooms)
      });
      
      try {
        // Allow messages with just attachments or just content
        if ((!content || !content.trim()) && (!data.attachments || data.attachments.length === 0)) {
          console.log('⚠️ [Channel] Empty message rejected');
          return;
        }

        // :one: Check channel exists
        const channel = await Channel.findByPk(channelId);
        if (!channel) {
          console.log('❌ [Channel] Channel not found:', channelId);
          return socket.emit("error", {
            message: "Channel not found",
          });
        }

        console.log('✅ [Channel] Channel found:', {
          id: (channel as any).id,
          name: (channel as any).name,
          type: (channel as any).type
        });

        // :two: Authorization check
        if ((channel as any).type === "private") {
          const channelMember = await ChannelMember.findOne({
            where: {
              channelId,
              userId,
            },
          });

          if (!channelMember) {
            console.log('❌ [Channel] User not authorized for private channel');
            return socket.emit("error", {
              message: "You cannot send messages in this channel",
            });
          }
        }

        // Auto-join the room if not already joined
        const roomName = `channel:${channelId}`;
        if (!socket.rooms.has(roomName)) {
          console.log('🔄 [Channel] Auto-joining room:', roomName);
          socket.join(roomName);
        }

        // :three: Store message in DB
        console.log('💾 [Channel] Creating message...');
        const message = await ChannelMessage.create({
          channelId,
          senderId: userId,
          content: content || '', // Allow empty content if there are attachments
          parentMessageId: parentMessageId || null,
        });
        console.log('✅ [Channel] Message created:', (message as any).id);

        // :three.five: Handle Attachments
        let attachmentsData: any[] = [];
        if (data.attachments && Array.isArray(data.attachments)) {
          console.log('📎 [Channel] Processing attachments:', data.attachments.length);
          const attachments = data.attachments.map((file: any) => ({
            url: file.url,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size,
            messageId: (message as any).id,
          }));

          if (attachments.length > 0) {
            attachmentsData = await Attachment.bulkCreate(attachments);
            console.log('✅ [Channel] Attachments created:', attachmentsData.length);
          }
        }

        const messageData = {
          id: (message as any).id,
          channelId,
          content: (message as any).content,
          senderId: userId,
          senderName: (socket as any).user.name || `User ${userId}`,
          senderImage: (socket as any).user.image || null,
          createdAt: (message as any).createdAt,
          attachments: attachmentsData,
          parentMessageId: parentMessageId || null,
          isEdited: false,
          isPinned: false,
        };

        // :four: Emit to channel room
        console.log('📤 [Channel] Message data being sent:', {
          id: messageData.id,
          channelId: messageData.channelId,
          senderId: messageData.senderId,
          senderName: messageData.senderName,
          senderImage: messageData.senderImage,
          contentLength: messageData.content?.length || 0
        });
        console.log('📤 [Channel] Emitting new_message to room:', roomName);
        console.log('📤 [Channel] Clients in room:', io.sockets.adapter.rooms.get(roomName)?.size || 0);
        io.to(roomName).emit("new_message", messageData);
        console.log('✅ [Channel] Message sent successfully');
      } catch (error: any) {
        console.error("❌ [Channel] Send message error:", error);
        console.error("❌ [Channel] Error stack:", error.stack);
        socket.emit("error", {
          message: "Failed to send message: " + (error.message || 'Unknown error'),
        });
      }
    }
  );

 
  socket.on("typing_start", ({ channelId }) => {
    socket.to(`channel:${channelId}`).emit("user_typing", {
      userId,
      userName: (socket as any).user.name || `User ${userId}`,
      channelId,
    });
  });

  socket.on("typing_stop", ({ channelId }) => {
    socket.to(`channel:${channelId}`).emit("user_stopped_typing", {
      userId,
      channelId,
    });
  });

 
  socket.on("edit_message", async ({ messageId, content }) => {
    try {
      const message = await ChannelMessage.findByPk(messageId);
      
      if (!message) {
        return socket.emit("error", { message: "Message not found" });
      }

      if ((message as any).senderId !== userId) {
        return socket.emit("error", { message: "Unauthorized" });
      }

      await message.update({ content, isEdited: true });

      io.to(`channel:${(message as any).channelId}`).emit("message_edited", {
        messageId,
        content,
        isEdited: true,
      });
    } catch (error) {
      console.error("Edit message error:", error);
      socket.emit("error", { message: "Failed to edit message" });
    }
  });

 
  socket.on("delete_message", async ({ messageId }) => {
    try {
      const message = await ChannelMessage.findByPk(messageId);
      
      if (!message) {
        return socket.emit("error", { message: "Message not found" });
      }

      if ((message as any).senderId !== userId) {
        return socket.emit("error", { message: "Unauthorized" });
      }

      const channelId = (message as any).channelId;
      await message.destroy();

      io.to(`channel:${channelId}`).emit("message_deleted", {
        messageId,
        channelId,
      });
    } catch (error) {
      console.error("Delete message error:", error);
      socket.emit("error", { message: "Failed to delete message" });
    }
  });

 
  socket.on("add_reaction", async ({ messageId, emoji }) => {
    console.log('👍 [Channel] Add reaction:', { messageId, emoji, userId });
    
    try {
      const message = await ChannelMessage.findByPk(messageId);
      
      if (!message) {
        console.log('❌ [Channel] Message not found:', messageId);
        return socket.emit("error", { message: "Message not found" });
      }

      console.log('✅ [Channel] Message found, checking for existing reaction...');

      // Check if reaction already exists
      const existingReaction = await Reaction.findOne({
        where: { messageId, userId, emoji },
      });

      if (existingReaction) {
        console.log('⚠️ [Channel] Reaction already exists');
        return; // Already reacted
      }

      console.log('💾 [Channel] Creating reaction...');
      const reaction = await Reaction.create({
        messageId,
        userId,
        emoji,
      });

      console.log('✅ [Channel] Reaction created:', (reaction as any).id);

      // Get user info for the reaction
      const user = await db.User.findByPk(userId);

      const reactionData = {
        messageId,
        userId,
        emoji,
        reactionId: (reaction as any).id,
        user: {
          id: userId,
          name: user?.name || (socket as any).user.name || 'Unknown User'
        }
      };

      console.log('📤 [Channel] Emitting reaction_added to channel:', `channel:${(message as any).channelId}`);
      io.to(`channel:${(message as any).channelId}`).emit("reaction_added", reactionData);
      console.log('✅ [Channel] Reaction emitted successfully');
    } catch (error: any) {
      console.error("❌ [Channel] Add reaction error:", error);
      console.error("❌ [Channel] Error stack:", error.stack);
      socket.emit("error", { message: "Failed to add reaction: " + error.message });
    }
  });

 
  socket.on("remove_reaction", async ({ reactionId, messageId }) => {
    console.log('👎 [Channel] Remove reaction:', { reactionId, messageId, userId });
    
    try {
      const reaction = await Reaction.findByPk(reactionId);
      
      if (!reaction) {
        console.log('❌ [Channel] Reaction not found:', reactionId);
        return socket.emit("error", { message: "Reaction not found" });
      }

      if ((reaction as any).userId !== userId) {
        console.log('❌ [Channel] Unauthorized to remove reaction');
        return socket.emit("error", { message: "Unauthorized" });
      }

      const message = await ChannelMessage.findByPk(messageId);
      
      console.log('💾 [Channel] Deleting reaction...');
      await reaction.destroy();
      console.log('✅ [Channel] Reaction deleted');

      console.log('📤 [Channel] Emitting reaction_removed to channel:', `channel:${(message as any).channelId}`);
      io.to(`channel:${(message as any).channelId}`).emit("reaction_removed", {
        reactionId,
        messageId,
        userId,
      });
      console.log('✅ [Channel] Reaction removal emitted successfully');
    } catch (error: any) {
      console.error("❌ [Channel] Remove reaction error:", error);
      console.error("❌ [Channel] Error stack:", error.stack);
      socket.emit("error", { message: "Failed to remove reaction: " + error.message });
    }
  });

 
  socket.on("pin_message", async ({ messageId }) => {
    try {
      const message = await ChannelMessage.findByPk(messageId);
      
      if (!message) {
        return socket.emit("error", { message: "Message not found" });
      }

      await message.update({ isPinned: true });

      io.to(`channel:${(message as any).channelId}`).emit("message_pinned", {
        messageId,
        isPinned: true,
      });
    } catch (error) {
      console.error("Pin message error:", error);
      socket.emit("error", { message: "Failed to pin message" });
    }
  });

  
  socket.on("unpin_message", async ({ messageId }) => {
    try {
      const message = await ChannelMessage.findByPk(messageId);
      
      if (!message) {
        return socket.emit("error", { message: "Message not found" });
      }

      await message.update({ isPinned: false });

      io.to(`channel:${(message as any).channelId}`).emit("message_unpinned", {
        messageId,
        isPinned: false,
      });
    } catch (error) {
      console.error("Unpin message error:", error);
      socket.emit("error", { message: "Failed to unpin message" });
    }
  });

  // ============================================================================
  // THREAD SUPPORT
  // ============================================================================

  // Get thread replies for a message
  socket.on("get_thread_replies", async ({ messageId }) => {
    try {
      const parentMessage = await ChannelMessage.findByPk(messageId);
      
      if (!parentMessage) {
        return socket.emit("error", { message: "Message not found" });
      }

      // Fetch all replies with user info, attachments, and reactions
      const replies = await ChannelMessage.findAll({
        where: { parentMessageId: messageId },
        include: [
          {
            model: (await import("../../models/User")).default,
            as: "User",
            attributes: ["id", "name", "email", "image"],
          },
          {
            model: Attachment,
            as: "attachments",
            required: false,
          },
          {
            model: (await import("../../models/Reaction")).default,
            as: "reactions",
            required: false,
            include: [
              {
                model: (await import("../../models/User")).default,
                as: "user",
                attributes: ["id", "name"],
              },
            ],
          },
        ],
        order: [["createdAt", "ASC"]],
      });

      socket.emit("thread_replies", {
        parentMessageId: messageId,
        replies: replies.map((reply: any) => ({
          id: reply.id,
          content: reply.content,
          senderId: reply.senderId,
          senderName: reply.User?.name || "Unknown",
          senderImage: reply.User?.image || null,
          createdAt: reply.createdAt,
          isEdited: reply.isEdited,
          attachments: reply.attachments || [],
          reactions: reply.reactions || [],
          parentMessageId: reply.parentMessageId,
        })),
      });
    } catch (error) {
      console.error("Get thread replies error:", error);
      socket.emit("error", { message: "Failed to fetch thread replies" });
    }
  });

  // Send a reply in a thread
  socket.on("send_thread_reply", async (data: { 
    channelId: number; 
    parentMessageId: number; 
    content: string; 
    attachments?: any[] 
  }) => {
    const { channelId, parentMessageId, content, attachments } = data;
    
    try {
      // Validate parent message exists
      const parentMessage = await ChannelMessage.findByPk(parentMessageId);
      if (!parentMessage) {
        return socket.emit("error", { message: "Parent message not found" });
      }

      // Check authorization
      const channel = await Channel.findByPk(channelId);
      if (!channel) {
        return socket.emit("error", { message: "Channel not found" });
      }

      if ((channel as any).type === "private") {
        const channelMember = await ChannelMember.findOne({
          where: { channelId, userId },
        });
        if (!channelMember) {
          return socket.emit("error", { message: "Unauthorized" });
        }
      }

      // Create the reply
      const reply = await ChannelMessage.create({
        channelId,
        senderId: userId,
        content: content || '',
        parentMessageId,
      });

      // Handle attachments
      let attachmentsData: any[] = [];
      if (attachments && Array.isArray(attachments)) {
        const attachmentRecords = attachments.map((file: any) => ({
          url: file.url,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          messageId: (reply as any).id,
        }));

        if (attachmentRecords.length > 0) {
          attachmentsData = await Attachment.bulkCreate(attachmentRecords);
        }
      }

      // Update parent message thread count and timestamp
      await parentMessage.update({
        threadReplyCount: ((parentMessage as any).threadReplyCount || 0) + 1,
        lastThreadReplyAt: new Date(),
      });

      // Get the updated reply count
      const replyCount = await ChannelMessage.count({
        where: { parentMessageId }
      });

      // Emit to channel room
      io.to(`channel:${channelId}`).emit("thread_reply_added", {
        id: (reply as any).id,
        channelId,
        content: (reply as any).content,
        senderId: userId,
        senderName: (socket as any).user.name || `User ${userId}`,
        senderImage: (socket as any).user.image || null,
        createdAt: (reply as any).createdAt,
        parentMessageId,
        attachments: attachmentsData,
        isEdited: false,
      });

      // Update parent message in main chat with reply count
      io.to(`channel:${channelId}`).emit("message_thread_updated", {
        messageId: parentMessageId,
        replyCount: replyCount,
        threadReplyCount: (parentMessage as any).threadReplyCount,
        lastThreadReplyAt: (parentMessage as any).lastThreadReplyAt,
      });
    } catch (error) {
      console.error("Send thread reply error:", error);
      socket.emit("error", { message: "Failed to send thread reply" });
    }
  });
}
