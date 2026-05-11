import { Request, Response, NextFunction } from "express";
import WorkspaceMembers from "../models/WorkspaceMembers";
import Role from "../models/Role";

export const authorizeWorkspaceRole =
  (allowedRoles: string[]) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = (req as any).user.id;
        const { workspaceId } = req.params;

        console.log('🔐 Authorization check:', {
          userId,
          workspaceId,
          allowedRoles
        });

        if (!workspaceId) {
          console.log('❌ No workspaceId provided');
          return res.status(400).json({
            message: "Workspace ID is required",
          });
        }

        const membership = await WorkspaceMembers.findOne({
          where: {
            userId,
            workspaceId,
          },
          include: [{ model: Role, as: 'Role' }],
        });

        console.log('🔐 Membership found:', membership ? {
          userId: (membership as any).userId,
          workspaceId: (membership as any).workspaceId,
          roleId: (membership as any).roleId,
          roleTitle: membership.Role?.title
        } : 'null');

        if (!membership || !membership.Role) {
          console.log('❌ User is not a member of workspace');
          return res.status(403).json({
            message: "You are not a member of this workspace",
          });
        }

        const roleTitle = membership.Role.title;

        if (!allowedRoles.includes(roleTitle)) {
          console.log('❌ User role not allowed:', roleTitle, 'Allowed:', allowedRoles);
          return res.status(403).json({
            message: "You do not have permission to perform this action",
          });
        }

        console.log('✅ Authorization passed');
        next();
      } catch (error) {
        console.error("❌ Authorization Error:", error);
        return res.status(500).json({
          message: "Authorization failed",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };
