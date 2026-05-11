
import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { transporter } from "../utils/mailer";
import crypto from "crypto";
import authenticateToken from "../../middleware/authMiddleware";
const {
  adminAuthorizeToken,
} = require("../../middleware/adminAuthorizationMiddleware");
import { authorizeWorkspaceRole } from "../../middleware/authorizeWorkspaceRole";
import dotenv from "dotenv";
dotenv.config();

const workspaceRouter = Router();
import db from "../../models";
import { where } from "sequelize";
import sequelize from "../../config/database";
const { WorkSpace, Token, WorkspaceMembers, ChannelMember, User, Channel } = db;

interface Workspace {
  id: number;
  name: string;
  ownerId: number;
}


workspaceRouter.post(
  "/",
  authenticateToken,  
  async (req: Request<{}, {}, Omit<Workspace, "id"> & { logo?: string }>, res: Response) => {
    try {
      const { name, logo } = req.body;
      const ownerId = (req as any).user.id;
      const roleId = (req as any).user.roleId;

      if (!name || !ownerId) {
        return res.status(400).json({
          message: "All fields (name and ownerId) are required.",
        });
      }

      
      const newWorkspace = await WorkSpace.create({
        name,
        logo,
        ownerId,
      });

      
      const newWorkspaceMembers = await WorkspaceMembers.create({
        workspaceId: newWorkspace.id,
        userId: ownerId,
        roleId,
      });

      res.status(201).json({ newWorkspace, newWorkspaceMembers });
    } catch (error: any) {
      console.error("FULL ERROR:", error);
      return res.status(500).json({
        message: error.message,
        name: error.name,
        parent: error.parent,
      });
    }
  }
);


workspaceRouter.put(
  "/:workspaceId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const workspaceId = req.params.workspaceId;
      const userId = (req as any).user.id;
      const { name, logo } = req.body;

      const workspace = await WorkSpace.findByPk(workspaceId);

      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }

      
      const isOwner = workspace.ownerId === userId;
      const membership = await WorkspaceMembers.findOne({
        where: { userId, workspaceId },
        include: [{ model: db.Role, as: 'Role' }],
      });

      const isAdmin = membership?.Role?.title === "Admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ 
          message: "Only workspace owners or admins can update workspace" 
        });
      }

      
      if (name) workspace.name = name;
      if (logo) workspace.logo = logo;

      await workspace.save();

      res.json({ message: "Workspace updated successfully", workspace });
    } catch (error) {
      console.error("Error updating workspace:", error);
      res.status(500).send("Error updating workspace");
    }
  }
);

workspaceRouter.get(
  "/",
  authenticateToken,  
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      
      const workspaceMembers = await WorkspaceMembers.findAll({
        where: { userId },
        include: [
          {
            model: WorkSpace,
            as: 'WorkSpace',
          }
        ],
      });

      
      const workspaces = workspaceMembers.map((wm: any) => wm.WorkSpace).filter(Boolean);

      res.json(workspaces);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      res.status(500).send("Error fetching workspaces");
    }
  }
);


workspaceRouter.post(
  "/:workspaceId/invite",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { email, roleId } = req.body;
      const workspaceId = req.params.workspaceId;
      const userId = (req as any).user.id;

      if (!email || !roleId) {
        return res
          .status(400)
          .json({ message: "Email and RoleId are required!" });
      }

      // Check if user is a member of this workspace
      const workspaceMember = await WorkspaceMembers.findOne({
        where: {
          workspaceId,
          userId,
        },
      });

      if (!workspaceMember) {
        return res.status(403).json({ message: "You are not a member of this workspace" });
      }

      
      const workspace = await WorkSpace.findByPk(workspaceId);
      const isOwner = workspace && (workspace as any).ownerId === userId;
      const userRole = await (workspaceMember as any).getRole();
      const isAdminOrManager = userRole && (userRole.title === "Admin" || userRole.title === "Manager");

      if (!isOwner && !isAdminOrManager) {
        return res.status(403).json({ message: "Only workspace owners, admins, or managers can invite users" });
      }

      const inviteToken = crypto.randomBytes(32).toString("hex");

      console.log(" Creating invite token for:", email);

      await Token.create({
        token: inviteToken,
        email: email,
        workspaceId: workspaceId,
        roleId: roleId,
        status: "active",
        type: "workspace_invite",
        action: "inviteUser",
      });

      console.log(" Token created successfully");

      const frontendUrl = process.env.FRONTEND_URL || "http://192.168.4.128:5173";
      const inviteLink = `${frontendUrl}/join-workspace?token=${inviteToken}`;

      console.log(" Sending invite email to:", email);
      console.log(" Invite link:", inviteLink);

      const info = await transporter.sendMail({
        from: '"Techesthete" <no-reply@te.com>',
        to: email,
        subject: "You're invited to join a Workspace!",
        html: `
          <h3>Welcome!</h3>
          <p>You have been invited to join Workspace #${workspaceId}.</p>
          <p>Click the link below to accept and create your account:</p>
          <a href="${inviteLink}" target="_blank">Join Workspace</a>
        `,
      });

      console.log(" Email sent successfully!");

      
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log("--------------------------------------------------");
        console.log(" Workspace Invite Email Sent!");
        console.log(` To: ${email}`);
        console.log(` Workspace ID: ${workspaceId}`);
        console.log(` Invite Link: ${inviteLink}`);
        console.log(` Preview Email: ${previewUrl}`);
        console.log("--------------------------------------------------");
      }

      return res.status(200).json({
        message: `Invite sent to ${email}`,
        ...(previewUrl && { previewUrl }),
      });
    } catch (error) {
      console.error("Invite Error:", error);
      return res.status(500).send("Server Error");
    }
  }
);


workspaceRouter.get("/join-workspace", async (req, res) => {
  try {
    const { token } = req.query;

    console.log(" Validating invite token:", token);

    if (!token) {
      console.log(" No token provided");
      return res.status(400).json({ message: "Token is required" });
    }

    const tokenRecord = await Token.findOne({
      where: { token, status: "active" },
    });

    console.log(" Token record found:", tokenRecord ? {
      id: tokenRecord.id,
      email: tokenRecord.email,
      workspaceId: tokenRecord.workspaceId,
      status: tokenRecord.status,
      createdAt: tokenRecord.createdAt
    } : "null");

    if (!tokenRecord) {
      console.log("❌ Invalid invite - token not found or inactive");
      return res.status(400).json({ message: "Invalid invite" });
    }

    const EXPIRY_IN_MS = 24 * 60 * 60 * 1000;

    const isExpired =
      Date.now() - new Date(tokenRecord.createdAt).getTime() > EXPIRY_IN_MS;

    console.log("⏰ Token age check:", {
      createdAt: tokenRecord.createdAt,
      ageInHours: (Date.now() - new Date(tokenRecord.createdAt).getTime()) / (60 * 60 * 1000),
      isExpired
    });

    if (isExpired) {
      console.log(" Token expired");
      await tokenRecord.update({ status: "inactive", isExpired: true });
      return res.status(400).json({ message: "Invite link has expired" });
    }

    console.log(" Token is valid");
    return res.status(200).json({
      token: tokenRecord.token,
    });
  } catch (error) {
    console.error(" Join Workspace Error:", error);
    return res.status(500).send("Server Error");
  }
});

workspaceRouter.post("/accept-invite", async (req, res) => {
  try {
    const { token, password, name, image } = req.body;

    console.log(' Processing invite acceptance:', { token, name, email: 'hidden' });

    const tokenRecord = await Token.findOne({
      where: { token, status: "active" },
    });
    
    if (!tokenRecord) {
      console.log(' Invalid or expired token');
      return res.status(400).json({ message: "Invalid or expired invite" });
    }

    console.log(' Valid token found:', {
      email: tokenRecord.email,
      workspaceId: tokenRecord.workspaceId,
      roleId: tokenRecord.roleId
    });

    let user = await User.findOne({ where: { email: tokenRecord.email } });
    if (!user) {
      console.log(' Creating new user for email:', tokenRecord.email);
      user = await User.create({
        email: tokenRecord.email,
        password,
        name,
        image,
        isInvited: true,
        roleId: tokenRecord.roleId,
        isEmailVerified: true, // Invited users are pre-verified
        emailVerificationToken: null,
        emailVerificationExpires: null,
      });
      console.log(' User created with ID:', user.id);
    } else {
      console.log(' User already exists with ID:', user.id);
    }


    const existingMember = await WorkspaceMembers.findOne({
      where: {
        userId: user.id,
        workspaceId: tokenRecord.workspaceId
      }
    });

    if (existingMember) {
      console.log(' User is already a member of this workspace');
    } else {
      console.log('➕ Adding user to workspace members');
      await WorkspaceMembers.create({
        userId: user.id,
        workspaceId: tokenRecord.workspaceId,
        roleId: tokenRecord.roleId,
      });
      console.log('✅ User added to workspace successfully');
    }

    tokenRecord.status = "inactive";
    tokenRecord.isExpired = true;
    await tokenRecord.save();
    console.log('🔒 Token marked as inactive');

    // Generate JWT token for auto-login
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, roleId: user.roleId },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    console.log('✅ JWT token generated for auto-login');

    return res.status(200).json({ 
      message: "Workspace joined successfully",
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        roleId: user.roleId
      }
    });
  } catch (error) {
    console.error("❌ Accept Invite Error:", error);
    return res.status(500).send("Server Error");
  }
});

// Get Workspace by ID
workspaceRouter.get(
  "/:workspaceId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const workspaceId = req.params.workspaceId;
      const userId = (req as any).user.id;

      // Check if user is member of this workspace
      const member = await WorkspaceMembers.findOne({
        where: { workspaceId, userId }
      });

      if (!member) {
        return res.status(403).json({ message: "Not a member of this workspace" });
      }

      const workspace = await WorkSpace.findByPk(workspaceId);
      res.json(workspace);
    } catch (error) {
      console.error("Error fetching workspace:", error);
      res.status(500).send("Error fetching workspace");
    }
  }
);

// Get Workspace Members
workspaceRouter.get(
  "/:workspaceId/members",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const workspaceId = req.params.workspaceId;
      const userId = (req as any).user.id;

      console.log('📋 Fetching members for workspace:', workspaceId);

      // Check if user is member of this workspace
      const member = await WorkspaceMembers.findOne({
        where: { workspaceId, userId }
      });

      if (!member) {
        console.log('❌ User not a member of workspace');
        return res.status(403).json({ message: "Not a member of this workspace" });
      }

      // Fetch all workspace members with user details
      const members = await WorkspaceMembers.findAll({
        where: { workspaceId },
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'name', 'email', 'image']
          }
        ]
      });

      console.log('✅ Found members:', members.length);

      // Extract user data from members
      const users = members
        .map((m: any) => m.User)
        .filter(Boolean);

      res.json({
        success: true,
        count: users.length,
        members: users
      });
    } catch (error) {
      console.error("❌ Error fetching workspace members:", error);
      res.status(500).json({ 
        success: false,
        message: "Error fetching workspace members" 
      });
    }
  }
);

// Delete Workspace by ID
workspaceRouter.delete(
  "/:workspaceId",
  authenticateToken,
  authorizeWorkspaceRole(["Admin"]),
  async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();

    try {
      const workspaceId = req.params.workspaceId;
      const userId = (req as any).user.id;

      const workspace = await WorkSpace.findByPk(workspaceId, { transaction });

      if (!workspace) {
        await transaction.rollback();
        return res.status(404).json({ message: "Workspace not found" });
      }

      if (workspace.ownerId !== userId) {
        await transaction.rollback();
        return res.status(403).json({
          message: "Only workspace owner can delete the workspace"
        });
      }

      const channels = await Channel.findAll({
        where: { workspaceId },
        attributes: ["id"],
        transaction,
      });

      const channelIds = channels.map((c: { id: any }) => c.id);

      if (channelIds.length > 0) {
        await ChannelMember.destroy({
          where: { channelId: channelIds },
          transaction,
        });
      }

      await Channel.destroy({
        where: { workspaceId },
        transaction,
      });

      await WorkspaceMembers.destroy({
        where: { workspaceId },
        transaction,
      });

      await Token.destroy({
        where: { workspaceId },
        transaction,
      });

      await workspace.destroy({ transaction });

      await transaction.commit();

      return res.json({
        message: "Workspace and all associated data deleted successfully"
      });

    } catch (error) {
      await transaction.rollback();
      console.error("Error deleting workspace:", error);
      return res.status(500).json({
        message: "Error deleting workspace",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);


workspaceRouter.delete(
  "/:workspaceId/remove-user",
  authenticateToken,
  authorizeWorkspaceRole(["Admin", "Manager"]),
  async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();

    try {
      const { workspaceId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      const channels = await Channel.findAll({
        where: { workspaceId },
        attributes: ["id"],
        transaction,
      });

      const channelIds = channels.map((c: { id: any }) => c.id);

      if (channelIds.length > 0) {
        await ChannelMember.destroy({
          where: {
            userId,
            channelId: channelIds,
          },
          transaction,
        });
      }

      const workspaceMember = await WorkspaceMembers.findOne({
        where: { workspaceId, userId },
        transaction,
      });

      if (!workspaceMember) {
        await transaction.rollback();
        return res.status(404).json({
          message: "User is not a member of this workspace",
        });
      }

      await workspaceMember.destroy({ transaction });

      await transaction.commit();

      res.json({
        message: "User removed from workspace and all channels successfully",
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error deleting workspace user:", error);
      res.status(500).send("Error deleting workspace user");
    }
  }
);

export default workspaceRouter;