import { Server, Socket } from "socket.io";
import WorkspaceMembers from "../../models/WorkspaceMembers";
import DirectConversation from "../../models/directConversation";
import DirectMessage from "../../models/directMessage";
import Attachment from "../../models/Attachment";
import Reaction from "../../models/Reaction";
import db from "../../models";
import { Op } from "sequelize";

export default function directConversationSocket(io: Server, socket: Socket) {
  const userId = (socket as any).user.id;

  
  socket.on("join-conversation", async ({ conversationId, workspaceId }) => {
    console.log('🔵 [DM] Join conversation request:', {
      conversationId,
      workspaceId,
      userId,
      socketId: socket.id
    });
    
    try {
      if (!conversationId || !workspaceId) {
        throw new Error("conversationId or workspaceId missing");
      }

      const membership = await WorkspaceMembers.findOne({
        where: {
          userId,
          workspaceId,
        },
      });

      if (!membership) {
        console.log('❌ [DM] User not member of workspace');
        socket.emit("join-error", {
          message: "You are not a member of this workspace",
        });
        return;
      }

      const conversation = await DirectConversation.findOne({
        where: {
          id: conversationId,
          [Op.or]: [{ userOneId: userId }, { userTwoId: userId }],
        },
      });

      if (!conversation) {
        console.log('❌ [DM] User not member of conversation');
        socket.emit("join-error", {
          message: "You are not a member of this conversation",
        });
        return;
      }

      const roomName = `conversation:${conversationId}`;
      socket.join(roomName);
      
      console.log('✅ [DM] User joined conversation:', {
        roomName,
        userId,
        socketId: socket.id,
        roomSize: io.sockets.adapter.rooms.get(roomName)?.size || 0
      });

      socket.emit("joined-conversation", {
        conversationId,
        message: "Joined conversation successfully",
      });
    } catch (error: any) {
      console.error("❌ [DM] Join conversation error:", error);
      socket.emit("error", {
        message: "Failed to join conversation: " + (error.message || 'Unknown error'),
      });
    }
  });

  
  socket.on("leave-conversation", ({ conversationId }) => {
    socket.leave(`conversation:${conversationId}`);
  });

  
  socket.on("send-direct-message", async (data: { conversationId: any; content: any; attachments?: any[] }) => {
    const { conversationId, content } = data;
    
    console.log('📨 [DM] Received send-direct-message event:', {
      conversationId,
      contentLength: content?.length || 0,
      attachmentsCount: data.attachments?.length || 0,
      userId,
      socketId: socket.id,
      rooms: Array.from(socket.rooms)
    });
    
    try {
      
      if ((!content || !content.trim()) && (!data.attachments || data.attachments.length === 0)) {
        console.log('⚠️ [DM] Empty message rejected');
        return socket.emit("error", {
          message: "Cannot send empty message",
        });
      }

      const conversation = await DirectConversation.findByPk(conversationId);
      if (!conversation) {
        console.log('❌ [DM] Conversation not found:', conversationId);
        return socket.emit("error", {
          message: "Conversation not found",
        });
      }

      console.log('✅ [DM] Conversation found:', {
        id: (conversation as any).id,
        userOneId: (conversation as any).userOneId,
        userTwoId: (conversation as any).userTwoId
      });

      // Verify user is part of the conversation
      const isParticipant = (conversation as any).userOneId === userId || (conversation as any).userTwoId === userId;
      if (!isParticipant) {
        console.log('❌ [DM] User not part of conversation');
        return socket.emit("error", {
          message: "You are not part of this conversation",
        });
      }

      // Auto-join the room if not already joined
      const roomName = `conversation:${conversationId}`;
      if (!socket.rooms.has(roomName)) {
        console.log('🔄 [DM] Auto-joining room:', roomName);
        socket.join(roomName);
      }

      console.log('💾 [DM] Creating direct message...');
      const message = await DirectMessage.create({
        conversationId,
        senderId: userId,
        content: content || '',
      });
      console.log('✅ [DM] Direct message created:', (message as any).id);

      
      let attachmentsData: any[] = [];
      if (data.attachments && Array.isArray(data.attachments)) {
        console.log('📎 [DM] Processing attachments:', data.attachments.length);
        const attachments = data.attachments.map((file: any) => ({
          url: file.url,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          directMessageId: (message as any).id,
        }));

        if (attachments.length > 0) {
          attachmentsData = await Attachment.bulkCreate(attachments);
          console.log('✅ [DM] Attachments created:', attachmentsData.length);
        }
      }

      const messageData = {
        id: (message as any).id,
        conversationId,
        content: (message as any).content,
        senderId: userId,
        senderName: (socket as any).user.name || `User ${userId}`,
        senderImage: (socket as any).user.image || null,
        createdAt: (message as any).createdAt,
        attachments: attachmentsData,
        isEdited: false,
        isPinned: false,
      };

      console.log('📤 [DM] Message data being sent:', {
        id: messageData.id,
        conversationId: messageData.conversationId,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        senderImage: messageData.senderImage,
        contentLength: messageData.content?.length || 0
      });
      console.log('📤 [DM] Emitting new_direct_message to room:', roomName);
      console.log('📤 [DM] Clients in room:', io.sockets.adapter.rooms.get(roomName)?.size || 0);
      io.to(roomName).emit("new_direct_message", messageData);
      console.log('✅ [DM] Message sent successfully');

      // Notify the recipient about the new conversation (if they haven't joined yet)
      const recipientId = (conversation as any).userOneId === userId 
        ? (conversation as any).userTwoId 
        : (conversation as any).userOneId;
      
      console.log('📢 [DM] Notifying recipient about new conversation:', recipientId);
      
      // Get recipient's socket(s) and emit conversation update
      const recipientSockets = await io.in(`user:${recipientId}`).fetchSockets();
      console.log('📢 [DM] Found recipient sockets:', recipientSockets.length);
      
      if (recipientSockets.length > 0) {
        // Fetch full conversation data with user info
        const fullConversation = await DirectConversation.findOne({
          where: { id: conversationId },
          include: [
            {
              model: db.User,
              as: 'userOne',
              attributes: ['id', 'name', 'email', 'image']
            },
            {
              model: db.User,
              as: 'userTwo',
              attributes: ['id', 'name', 'email', 'image']
            }
          ]
        });

        // Emit to recipient's personal room
        io.to(`user:${recipientId}`).emit("new_conversation", {
          conversation: fullConversation,
          message: messageData
        });
        console.log('✅ [DM] Conversation notification sent to recipient');
      }
    } catch (error: any) {
      console.error("❌ [DM] Send message error:", error);
      console.error("❌ [DM] Error stack:", error.stack);
      socket.emit("error", {
        message: "Failed to send message: " + (error.message || 'Unknown error'),
      });
    }
  });

  
  socket.on("edit-direct-message", async ({ messageId, content }) => {
    try {
      const message = await DirectMessage.findByPk(messageId);
      
      if (!message) {
        return socket.emit("error", { message: "Message not found" });
      }

      if ((message as any).senderId !== userId) {
        return socket.emit("error", { message: "Unauthorized" });
      }

      await message.update({ content, isEdited: true });

      io.to(`conversation:${(message as any).conversationId}`).emit("direct_message_edited", {
        messageId,
        content,
        isEdited: true,
      });
    } catch (error) {
      console.error("Edit direct message error:", error);
      socket.emit("error", { message: "Failed to edit message" });
    }
  });

  
  socket.on("delete-direct-message", async ({ messageId, conversationId }) => {
    try {
      const message = await DirectMessage.findByPk(messageId);
      
      if (!message) {
        return socket.emit("error", { message: "Message not found" });
      }

      if ((message as any).senderId !== userId) {
        return socket.emit("error", { message: "Unauthorized" });
      }

      await message.destroy();

      io.to(`conversation:${conversationId}`).emit("direct_message_deleted", {
        messageId,
        conversationId,
      });
    } catch (error) {
      console.error("Delete direct message error:", error);
      socket.emit("error", { message: "Failed to delete message" });
    }
  });

  // Typing indicators for direct messages
  socket.on("dm_typing_start", ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit("dm_user_typing", {
      userId,
      conversationId,
    });
  });

  socket.on("dm_typing_stop", ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit("dm_user_stopped_typing", {
      userId,
      conversationId,
    });
  });

  // Add reaction to direct message
  socket.on("add_dm_reaction", async ({ messageId, emoji }) => {
    console.log('👍 [DM] Add reaction:', { messageId, emoji, userId });
    
    try {
      const message = await DirectMessage.findByPk(messageId);
      
      if (!message) {
        console.log('❌ [DM] Message not found:', messageId);
        return socket.emit("error", { message: "Message not found" });
      }

      console.log('✅ [DM] Message found, checking for existing reaction...');

      // Check if reaction already exists
      const existingReaction = await Reaction.findOne({
        where: { directMessageId: messageId, userId, emoji },
      });

      if (existingReaction) {
        console.log('⚠️ [DM] Reaction already exists');
        return; // Already reacted
      }

      console.log('💾 [DM] Creating reaction...');
      const reaction = await Reaction.create({
        directMessageId: messageId,
        userId,
        emoji,
      });

      console.log('✅ [DM] Reaction created:', (reaction as any).id);

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

      console.log('📤 [DM] Emitting reaction_added to conversation:', `conversation:${(message as any).conversationId}`);
      io.to(`conversation:${(message as any).conversationId}`).emit("reaction_added", reactionData);
      console.log('✅ [DM] Reaction emitted successfully');
    } catch (error: any) {
      console.error("❌ [DM] Add reaction error:", error);
      console.error("❌ [DM] Error stack:", error.stack);
      socket.emit("error", { message: "Failed to add reaction: " + error.message });
    }
  });

  // Remove reaction from direct message
  socket.on("remove_dm_reaction", async ({ reactionId, messageId }) => {
    console.log('👎 [DM] Remove reaction:', { reactionId, messageId, userId });
    
    try {
      const reaction = await Reaction.findByPk(reactionId);
      
      if (!reaction) {
        console.log('❌ [DM] Reaction not found:', reactionId);
        return socket.emit("error", { message: "Reaction not found" });
      }

      if ((reaction as any).userId !== userId) {
        console.log('❌ [DM] Unauthorized to remove reaction');
        return socket.emit("error", { message: "Unauthorized" });
      }

      const message = await DirectMessage.findByPk(messageId);
      
      console.log('💾 [DM] Deleting reaction...');
      await reaction.destroy();
      console.log('✅ [DM] Reaction deleted');

      console.log('📤 [DM] Emitting reaction_removed to conversation:', `conversation:${(message as any).conversationId}`);
      io.to(`conversation:${(message as any).conversationId}`).emit("reaction_removed", {
        reactionId,
        messageId,
        userId,
      });
      console.log('✅ [DM] Reaction removal emitted successfully');
    } catch (error: any) {
      console.error("❌ [DM] Remove reaction error:", error);
      console.error("❌ [DM] Error stack:", error.stack);
      socket.emit("error", { message: "Failed to remove reaction: " + error.message });
    }
  });

  // Get thread replies for a direct message
  socket.on("get_dm_thread_replies", async ({ messageId }) => {
    try {
      const replies = await DirectMessage.findAll({
        where: { parentMessageId: messageId },
        include: [
          {
            model: db.User,
            attributes: ['id', 'name', 'email', 'image']
          },
          {
            model: db.Attachment,
            as: 'attachments',
            where: { isDeleted: false },
            required: false
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      const transformedReplies = replies.map((reply: any) => ({
        ...reply.toJSON(),
        senderName: reply.User?.name || 'Unknown User',
        senderImage: reply.User?.image || null,
        senderId: reply.User?.id || reply.senderId
      }));

      socket.emit("dm_thread_replies", {
        messageId,
        replies: transformedReplies
      });
    } catch (error) {
      console.error("Get DM thread replies error:", error);
      socket.emit("error", { message: "Failed to get thread replies" });
    }
  });

  // Send a reply in a DM thread
  socket.on("send_dm_thread_reply", async (data: {
    conversationId: number;
    parentMessageId: number;
    content: string;
    attachments?: any[]
  }) => {
    const { conversationId, parentMessageId, content, attachments } = data;

    try {
      // Validate parent message exists
      const parentMessage = await DirectMessage.findByPk(parentMessageId);
      if (!parentMessage) {
        return socket.emit("error", { message: "Parent message not found" });
      }

      // Check authorization
      const conversation = await DirectConversation.findByPk(conversationId);
      if (!conversation) {
        return socket.emit("error", { message: "Conversation not found" });
      }

      const isParticipant = (conversation as any).userOneId === userId || (conversation as any).userTwoId === userId;
      if (!isParticipant) {
        return socket.emit("error", { message: "Unauthorized" });
      }

      // Create the reply
      const reply = await DirectMessage.create({
        conversationId,
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
          directMessageId: (reply as any).id,
        }));

        if (attachmentRecords.length > 0) {
          attachmentsData = await Attachment.bulkCreate(attachmentRecords);
        }
      }

      // Get the updated reply count
      const replyCount = await DirectMessage.count({
        where: { parentMessageId }
      });

      // Emit to conversation room
      io.to(`conversation:${conversationId}`).emit("dm_thread_reply_added", {
        id: (reply as any).id,
        conversationId,
        content: (reply as any).content,
        senderId: userId,
        senderName: (socket as any).user.name || `User ${userId}`,
        senderImage: (socket as any).user.image || null,
        createdAt: (reply as any).createdAt,
        parentMessageId,
        attachments: attachmentsData,
        isEdited: false,
      });

      // Update parent message with reply count
      io.to(`conversation:${conversationId}`).emit("dm_message_thread_updated", {
        messageId: parentMessageId,
        replyCount: replyCount,
      });
    } catch (error) {
      console.error("Send DM thread reply error:", error);
      socket.emit("error", { message: "Failed to send thread reply" });
    }
  });

}