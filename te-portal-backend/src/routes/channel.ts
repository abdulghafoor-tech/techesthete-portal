import { Router, Request, Response } from "express";
import authenticateToken from "../../middleware/authMiddleware";
import { authorizeWorkspaceRole } from "../../middleware/authorizeWorkspaceRole";
import dotenv from "dotenv";
dotenv.config();

const channelRouter = Router({ mergeParams: true });
import db from "../../models";
const { Channel, ChannelMember, WorkspaceMembers, ChannelMessage } = db;

// Debug endpoint to test database connection
channelRouter.get(
  "/debug/test",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const workspaceId = (req as any).params.workspaceId;
      console.log('🔍 Debug test for workspace:', workspaceId);
      
      // Test workspace query
      const workspace = await db.WorkSpace.findByPk(workspaceId);
      console.log('🔍 Workspace found:', workspace ? 'Yes' : 'No');
      
      // Test workspace members query
      const members = await WorkspaceMembers.findAll({
        where: { workspaceId },
        attributes: ['userId'],
        raw: true
      });
      console.log('🔍 Workspace members count:', members.length);
      
      res.json({
        success: true,
        workspace: workspace ? 'Found' : 'Not found',
        membersCount: members.length,
        members: members
      });
    } catch (error) {
      console.error('🔍 Debug test error:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }
);

interface Channel {
  id: number;
  name: string;
  workspaceId: number;
  type: "public" | "private";
}

//Create Channel
channelRouter.post(
  "/",
  authenticateToken,
  authorizeWorkspaceRole(["Admin", "Manager"]),
  async (req: Request, res: Response) => {
    console.log('\n========== CREATE CHANNEL REQUEST START ==========');
    let transaction;
    try {
      const { name, type = "public", members = [] } = req.body;
      const workspaceId = (req as any).params.workspaceId;
      const userId = (req as any).user.id;

      console.log('🔵 Request details:', {
        name,
        type,
        members,
        workspaceId,
        userId,
        body: JSON.stringify(req.body),
        params: JSON.stringify(req.params)
      });

      // Validation
      if (!name || !name.trim()) {
        console.log('❌ Validation failed: missing or empty name');
        return res.status(400).json({ message: "Channel name is required" });
      }

      if (!workspaceId) {
        console.log('❌ Validation failed: missing workspaceId');
        return res.status(400).json({ message: "Workspace ID is required" });
      }

      console.log('🔵 Starting transaction...');
      transaction = await db.sequelize.transaction();
      console.log('✅ Transaction started');

      // Verify workspace exists
      console.log('🔵 Checking if workspace exists...');
      const workspace = await db.WorkSpace.findByPk(workspaceId);
      if (!workspace) {
        await transaction.rollback();
        console.log('❌ Workspace not found:', workspaceId);
        return res.status(404).json({ message: "Workspace not found" });
      }
      console.log('✅ Workspace found:', (workspace as any).name);

      console.log('🔵 Creating channel in database...');
      const channel = await Channel.create({
        name: name.trim(),
        workspaceId: parseInt(workspaceId),
        type: type || "public",
      }, { transaction });

      console.log('✅ Channel created successfully:', {
        id: channel.id,
        name: (channel as any).name,
        type: (channel as any).type,
        workspaceId: (channel as any).workspaceId
      });

      // Add members based on channel type
      if (type === "public") {
        console.log('🔵 PUBLIC CHANNEL: Adding all workspace members...');
        
        console.log('🔵 Querying workspace members...');
        const allWorkspaceMembers = await WorkspaceMembers.findAll({
          where: { workspaceId },
          attributes: ['userId'],
          raw: true
        });

        console.log('🔵 Found workspace members:', allWorkspaceMembers.length);
        if (allWorkspaceMembers.length > 0) {
          console.log('🔵 Member IDs:', allWorkspaceMembers.map((m: any) => m.userId));
        }

        if (allWorkspaceMembers.length > 0) {
          try {
            console.log('🔵 Preparing member data for bulkCreate...');
            const memberData = allWorkspaceMembers.map((member: any) => ({
              channelId: channel.id,
              userId: member.userId,
              createdAt: new Date(),
              updatedAt: new Date()
            }));
            
            console.log('🔵 Member data prepared:', memberData.length, 'records');
            console.log('🔵 Sample member data:', JSON.stringify(memberData[0]));
            
            console.log('🔵 Executing bulkCreate...');
            const createdMembers = await ChannelMember.bulkCreate(memberData, { 
              transaction,
              validate: true,
              returning: true
            });
            console.log('✅ BulkCreate successful! Created', createdMembers.length, 'members');
          } catch (bulkError) {
            console.error('⚠️ BulkCreate failed:', bulkError);
            console.error('⚠️ Error details:', {
              name: bulkError instanceof Error ? bulkError.name : 'Unknown',
              message: bulkError instanceof Error ? bulkError.message : String(bulkError),
              stack: bulkError instanceof Error ? bulkError.stack : 'No stack'
            });
            
            console.log('🔵 Falling back to individual creates...');
            let successCount = 0;
            let failCount = 0;
            
            for (const member of allWorkspaceMembers) {
              try {
                await ChannelMember.create({
                  channelId: channel.id,
                  userId: member.userId,
                }, { transaction });
                successCount++;
              } catch (memberError) {
                failCount++;
                console.error('❌ Failed to add member:', member.userId, memberError);
              }
            }
            console.log(`✅ Individual creates completed: ${successCount} success, ${failCount} failed`);
          }
        } else {
          console.log('⚠️ No workspace members found - channel created without members');
        }
      } else if (type === "private") {
        console.log('🔵 PRIVATE CHANNEL: Adding creator and selected members...');
        
        const memberData = [{ 
          channelId: channel.id, 
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        }];

        // Add selected members (excluding creator to avoid duplicates)
        if (Array.isArray(members) && members.length > 0) {
          const uniqueMembers = [...new Set(members.filter(memberId => memberId !== userId))];
          console.log('🔵 Adding', uniqueMembers.length, 'additional members');
          uniqueMembers.forEach(memberId => {
            memberData.push({
              channelId: channel.id,
              userId: memberId,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          });
        }
        
        console.log('🔵 Creating', memberData.length, 'channel members...');
        await ChannelMember.bulkCreate(memberData, { transaction });
        console.log('✅ Added members to private channel:', memberData.length);
      }

      console.log('🔵 Committing transaction...');
      await transaction.commit();
      console.log('✅ Transaction committed successfully');
      
      // Get the plain channel object
      const channelData = channel.toJSON();
      console.log('📦 Channel data to return:', channelData);
      
      // Emit socket event (non-blocking)
      try {
        const io = (req as any).app.get('io');
        if (io) {
          console.log('📢 Emitting channel_created event');
          
          const allWorkspaceMembers = await WorkspaceMembers.findAll({
            where: { workspaceId },
            attributes: ['userId'],
            raw: true
          });
          
          const membersToNotify = type === "public" 
            ? allWorkspaceMembers.map((m: any) => m.userId)
            : [userId, ...members];
          
          membersToNotify.forEach((memberId: number) => {
            io.to(`user:${memberId}`).emit('channel_created', {
              channel: channelData,
              workspaceId
            });
          });
          
          console.log('✅ Notifications sent to', membersToNotify.length, 'members');
        }
      } catch (socketError) {
        console.error('⚠️ Socket notification failed (non-critical):', socketError);
      }
      
      console.log('📤 Sending response with status 201');
      console.log('========== CREATE CHANNEL REQUEST SUCCESS ==========\n');
      res.status(201).json(channelData);
    } catch (error) {
      console.log('========== CREATE CHANNEL REQUEST FAILED ==========');
      if (transaction) {
        try {
          console.log('🔄 Rolling back transaction...');
          await transaction.rollback();
          console.log('✅ Transaction rolled back');
        } catch (rollbackError) {
          console.error('❌ Rollback failed:', rollbackError);
        }
      }
      
      console.error("❌ ERROR DETAILS:");
      console.error("   Type:", error instanceof Error ? error.constructor.name : typeof error);
      console.error("   Name:", error instanceof Error ? error.name : 'Unknown');
      console.error("   Message:", error instanceof Error ? error.message : String(error));
      console.error("   Stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      if (error && typeof error === 'object') {
        console.error("   Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      }
      
      // Check for specific error types
      let errorMessage = "Error creating channel";
      let statusCode = 500;
      
      if (error instanceof Error) {
        if (error.name === 'SequelizeValidationError') {
          errorMessage = "Validation error: " + error.message;
          statusCode = 400;
        } else if (error.name === 'SequelizeUniqueConstraintError') {
          errorMessage = "Channel already exists or duplicate member";
          statusCode = 409;
        } else if (error.name === 'SequelizeForeignKeyConstraintError') {
          errorMessage = "Invalid workspace or user reference";
          statusCode = 400;
        } else if (error.name === 'SequelizeDatabaseError') {
          errorMessage = "Database error: " + error.message;
          statusCode = 500;
        } else {
          errorMessage = error.message;
        }
      }
      
      console.error("   Response:", { statusCode, errorMessage });
      console.log('========== CREATE CHANNEL REQUEST END ==========\n');
      
      res.status(statusCode).json({ 
        message: errorMessage,
        error: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.name : 'Unknown'
      });
    }
  }
);

//Get All Channels in a Workspace
channelRouter.get(
  "/",
  authenticateToken,
  authorizeWorkspaceRole(["Admin", "Manager", "Member"]),
  async (req: Request, res: Response) => {
    try {
      const workspaceId = (req as any).params.workspaceId;
      const userId = (req as any).user.id;
      
      console.log('📋 Fetching channels for workspace:', workspaceId, 'user:', userId);
      
      if (!workspaceId) {
        return res.status(400).json({ message: "Workspace ID is required" });
      }

      // Get all public channels in the workspace
      const publicChannels = await Channel.findAll({
        where: { 
          workspaceId,
          type: 'public'
        }
      });

      console.log('✅ Found public channels:', publicChannels.length);

      // Get private channels where user is a member
      const privateChannelMemberships = await ChannelMember.findAll({
        where: { userId },
        include: [{
          model: Channel,
          where: { 
            workspaceId,
            type: 'private'
          }
        }]
      });

      const privateChannels = privateChannelMemberships
        .map((membership: any) => membership.Channel)
        .filter(Boolean);

      console.log('✅ Found private channels user is member of:', privateChannels.length);

      // Combine public and private channels
      const allChannels = [...publicChannels, ...privateChannels];

      console.log('✅ Total channels returned:', allChannels.length);

      res.json(allChannels);
    } catch (error) {
      console.error("❌ Error fetching channels:", error);
      res.status(500).send("Error fetching channels");
    }
  }
);

//Get Channel by ID
channelRouter.get(
  "/:channelId",
  authenticateToken,
  authorizeWorkspaceRole(["Admin", "Manager", "Member"]),
  async (req: Request, res: Response) => {
    try {
      const channelId = req.params.channelId;
      const userId = (req as any).user.id;
      
      const channel = await Channel.findByPk(channelId);
      
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }

      // If it's a private channel, check if user is a member
      if ((channel as any).type === 'private') {
        const membership = await ChannelMember.findOne({
          where: { channelId, userId }
        });

        if (!membership) {
          return res.status(403).json({ 
            message: "You don't have access to this private channel" 
          });
        }
      }

      res.json(channel);
    } catch (error) {
      console.error("Error fetching channel:", error);
      res.status(500).send("Error fetching channel");
    }
  }
);


channelRouter.get(
  "/:channelId/members",
  authenticateToken,
  authorizeWorkspaceRole(["Admin", "Manager", "Member"]),
  async (req: Request, res: Response) => {
    try {
      const channelId = req.params.channelId;
      
      const members = await ChannelMember.findAll({
        where: { channelId },
        include: [
          {
            model: db.User,
            attributes: ['id', 'name', 'email', 'image']
          }
        ]
      });

    
      const users = members.map((member: any) => member.User).filter(Boolean);
      
      res.json({
        count: users.length,
        members: users
      });
    } catch (error) {
      console.error("Error fetching channel members:", error);
      res.status(500).send("Error fetching channel members");
    }
  }
);


channelRouter.delete(
  "/:channelId",
  authenticateToken,
  authorizeWorkspaceRole(["Admin", "Manager"]),
  async (req: Request, res: Response) => {
    const transaction = await db.sequelize.transaction();
    try {
      const channelId = req.params.channelId;

      if (!channelId) {
        await transaction.rollback();
        return res.status(400).json({ message: "Channel ID is required" });
      }

      const channel = await Channel.findByPk(channelId, { transaction });

      await channel?.destroy({ transaction });

      await ChannelMember?.destroy({
        where: { channelId },
        transaction,
      });

      await transaction.commit();

      res.json({ message: "Channel deleted successfully" });
    } catch (error) {
      await transaction.rollback();
      console.error("Error deleting channel:", error);
      res.status(500).send("Error deleting channel");
    }
  }
);


channelRouter.post(
  "/:channelId/add-member",
  authenticateToken,
  authorizeWorkspaceRole(["Admin", "Manager"]),
  async (req: Request, res: Response) => {
    try {
      const channelId = req.params.channelId;
      const { userId } = req.body;
      const workspaceId = Number((req as any).params.workspaceId);

      if (!userId || !channelId || !workspaceId) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const workspaceMember = await WorkspaceMembers.findOne({
        where: { workspaceId, userId },
      });

      if (!workspaceMember) {
        return res
          .status(404)
          .json({ message: "User is not a member of this workspace" });
      }

      // Check if user is already a member of the channel
      const existingMember = await ChannelMember.findOne({
        where: { channelId, userId },
      });

      if (existingMember) {
        return res.status(400).json({ message: "User is already a member of this channel" });
      }

      const channelMember = await ChannelMember.create({
        channelId,
        userId,
      });

      // Emit socket event to notify the added user
      const io = (req as any).app.get('io');
      if (io) {
        console.log('📢 Emitting member_added_to_channel event to user:', userId);
        
        // Get channel details
        const channel = await Channel.findByPk(channelId);
        
        if (channel) {
          // Notify the added user
          io.to(`user:${userId}`).emit('member_added_to_channel', {
            channel: {
              id: (channel as any).id,
              name: (channel as any).name,
              workspaceId: (channel as any).workspaceId,
              type: (channel as any).type,
            },
            workspaceId
          });
          
          console.log('✅ Member added notification sent');
        }
      }

      res.status(201).json({
        success: true,
        message: "User added to channel successfully",
        channelMember,
      });
    } catch (error) {
      console.error("Error adding user to channel:", error);
      res.status(500).json({ message: "Error adding user to channel" });
    }
  }
);
channelRouter.patch(
  "/:channelId/edit-channel",
  authenticateToken,
  authorizeWorkspaceRole(["Admin", "Manager"]),
  async (req: Request, res: Response) => {
    try {
      const { channelId } = req.params;
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Nothing to update." });
      }

      const channel = await Channel.findByPk(channelId);

      await channel?.update({
        ...(name && { name }),
      });

      res.json({ message: "Channel updated successfully." });
    } catch (error) {
      console.log("Error updating Channel", error),
        res.status(500).send("Error updating Channel");
    }
  }
);


channelRouter.delete(
  "/:channelId/remove-member",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const channelId = req.params.channelId;
      const { userId } = req.body;
      const requestingUserId = (req as any).user.id;
      const workspaceId = Number((req as any).params.workspaceId);

      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      // Check if user is a member of the workspace
      const workspaceMember = await WorkspaceMembers.findOne({
        where: { workspaceId, userId: requestingUserId },
        include: [{ model: db.Role, as: 'Role' }]
      });

      if (!workspaceMember) {
        return res.status(403).json({ message: "Not a member of this workspace" });
      }

      const userRole = (workspaceMember as any).Role?.title;
      const isAdminOrManager = userRole === "Admin" || userRole === "Manager";
      const isSelfRemoval = requestingUserId === userId;

      // Allow if user is admin/manager OR if user is removing themselves
      if (!isAdminOrManager && !isSelfRemoval) {
        return res.status(403).json({ 
          message: "You can only remove yourself from the channel" 
        });
      }

      const channelMember = await ChannelMember.findOne({
        where: { channelId, userId },
      });

      if (!channelMember) {
        return res.status(404).json({ message: "User not found in channel" });
      }

      await channelMember.destroy();

      const action = isSelfRemoval ? "left" : "removed from";
      res.json({ 
        message: `User ${action} channel successfully`,
        success: true 
      });
    } catch (error) {
      console.error("Error removing user from channel:", error);
      res.status(500).json({ 
        message: "Error removing user from channel",
        success: false 
      });
    }
  }
);

channelRouter.get(
  "/:channelId/messages",
  authenticateToken,
  authorizeWorkspaceRole(["Admin", "Manager", "Member"]),
  async (req: Request, res: Response) => {
    try {
      const channelId = req.params.channelId;
      const channel = await Channel.findByPk(channelId);

      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      
      const channelMessage = await ChannelMessage.findAll({
        where: { channelId },
        include: [
          {
            model: db.User,
            as: 'User',
            attributes: ['id', 'name', 'email', 'image']
          },
          {
            model: db.Attachment,
            as: 'attachments',
            required: false
          },
          {
            model: db.Reaction,
            as: 'reactions',
            required: false,
            include: [
              {
                model: db.User,
                as: 'user',
                attributes: ['id', 'name']
              }
            ]
          }
        ],
        order: [["createdAt", "ASC"]],
      });

      // Return empty array if no messages found (don't return 404)
      if (channelMessage.length === 0) {
        console.log('📭 No messages found for channel:', channelId);
        return res.json([]);
      }
      
      // Get reply counts for all messages
      const messageIds = channelMessage.map((msg: any) => msg.id);
      const replyCounts = await ChannelMessage.findAll({
        where: {
          parentMessageId: messageIds
        },
        attributes: [
          'parent_message_id',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        group: ['parent_message_id'],
        raw: true
      });

      // Create a map of message ID to reply count
      const replyCountMap = new Map();
      replyCounts.forEach((item: any) => {
        replyCountMap.set(item.parent_message_id, parseInt(item.count));
      });
      
      // Transform messages to include sender info and reply count at root level
      const transformedMessages = channelMessage.map((msg: any) => ({
        ...msg.toJSON(),
        senderName: msg.User?.name || 'Unknown User',
        senderImage: msg.User?.image || null,
        senderId: msg.User?.id || msg.senderId,
        replyCount: replyCountMap.get(msg.id) || 0
      }));
      
      console.log('✅ Returning', transformedMessages.length, 'messages for channel:', channelId);
      res.json(transformedMessages);
    } catch (error) {
      console.error("Error fetching channel messages:", error);
      res.status(500).send("Error fetching channel messages");
    }
  }
);

export default channelRouter;