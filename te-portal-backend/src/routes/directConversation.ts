import { Router, Request, Response } from "express";
import authenticateToken from "../../middleware/authMiddleware";
import { authorizeWorkspaceRole } from "../../middleware/authorizeWorkspaceRole";
import dotenv from "dotenv";
import { Op } from "sequelize";
dotenv.config();

const directConversationRouter = Router({ mergeParams: true });
import db from "../../models";
const { DirectConversation, DirectMessage, WorkspaceMembers } = db;



directConversationRouter.post(
  "/",
  authenticateToken,
  authorizeWorkspaceRole(["Admin", "Manager", "Member"]),
  async (req: Request, res: Response) => {
    try {
      const userOneId = (req as any).user.id;
      const { userTwoId } = req.body;
      const { workspaceId } = req.params;

      if (!userTwoId) {
        return res.status(400).json({ message: "userTwoId is required" });
      }

      if (userOneId === userTwoId) {
        return res
          .status(400)
          .json({ message: "Cannot create conversation with yourself" });
      }

    
      const [firstUserId, secondUserId] =
        userOneId < userTwoId
          ? [userOneId, userTwoId]
          : [userTwoId, userOneId];

      
      let conversation = await DirectConversation.findOne({
        where: {
          workspaceId,
          userOneId: firstUserId,
          userTwoId: secondUserId,
        },
      });

      
      if (!conversation) {
        conversation = await DirectConversation.create({
          workspaceId,
          userOneId: firstUserId,
          userTwoId: secondUserId,
        });
      }

      return res.status(200).json({
        conversationId: conversation.id,
      });
    } catch (error) {
      console.error("Error creating direct conversation:", error);
      res.status(500).json({ message: "Error creating direct conversation" });
    }
  }
);


directConversationRouter.get(
  "/",
  authenticateToken,
  authorizeWorkspaceRole(["Admin", "Manager", "Member"]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { workspaceId } = req.params;

      console.log(` Fetching conversations for user ${userId} in workspace ${workspaceId}`);

      const conversations = await DirectConversation.findAll({
        where: {
          workspaceId,
          [Op.or]: [{ userOneId: userId }, { userTwoId: userId }],
        },
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
        ],
        order: [['updatedAt', 'DESC']]
      });

      console.log(`✅ Found ${conversations.length} conversations in workspace ${workspaceId}`);
      console.log('Conversations:', conversations.map((c: any) => ({
        id: c.id,
        workspaceId: c.workspaceId,
        userOneId: c.userOneId,
        userTwoId: c.userTwoId,
        userOne: c.userOne?.name,
        userTwo: c.userTwo?.name
      })));

      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Error fetching conversations" });
    }
  }
);

directConversationRouter.get(
  "/:id",
  authenticateToken,
  authorizeWorkspaceRole(["Admin", "Manager", "Member"]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { workspaceId } = req.params;
      const { id } = req.params;
      const conversation = await DirectConversation.findOne({
        where: {
          id,
          workspaceId,
          [Op.or]: [{ userOneId: userId }, { userTwoId: userId }],
        },
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

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const messages = await DirectMessage.findAll({
        where: { conversationId: conversation.id },
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
      
      console.log('📭 Found', messages.length, 'messages for conversation:', conversation.id);
      
      // Get reply counts for all messages
      const messageIds = messages.map((msg: any) => msg.id);
      const replyCounts = await DirectMessage.findAll({
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
      const transformedMessages = messages.map((msg: any) => ({
        ...msg.toJSON(),
        senderName: msg.User?.name || 'Unknown User',
        senderImage: msg.User?.image || null,
        senderId: msg.User?.id || msg.senderId,
        replyCount: replyCountMap.get(msg.id) || 0
      }));
      
      console.log('✅ Returning conversation data with', transformedMessages.length, 'messages');
      res.status(200).json({
        conversationId: conversation.id,
        userOneId: conversation.userOneId,
        userTwoId: conversation.userTwoId,
        userOne: conversation.userOne,
        userTwo: conversation.userTwo,
        participants: {
          userOneId: conversation.userOneId,
          userTwoId: conversation.userTwoId,
        },
        messages: transformedMessages,
      });
    } catch (error) {
      console.error("Error fetching direct conversations:", error);
      res.status(500).json({ message: "Error fetching direct conversations" });
    }
  }
);

// Delete conversation (Admin only)
directConversationRouter.delete(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const userRoleId = (req as any).user.roleId;
      const { workspaceId, id } = req.params;

      console.log(`🗑️ Delete conversation request: conversationId=${id}, userId=${userId}, roleId=${userRoleId}`);

      // Check if user is admin (roleId 1)
      if (userRoleId !== 1) {
        return res.status(403).json({ message: "Only admins can delete conversations" });
      }

      const conversation = await DirectConversation.findOne({
        where: {
          id,
          workspaceId
        }
      });

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Delete all messages in the conversation
      await DirectMessage.destroy({
        where: { conversationId: id }
      });

      // Delete the conversation
      await conversation.destroy();

      console.log(`✅ Conversation ${id} deleted successfully`);

      res.json({ message: "Conversation deleted successfully" });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Error deleting conversation" });
    }
  }
);

export default directConversationRouter;