import { Router } from "express";
import userRouter from "../routes/users";
import workspaceRouter from "../routes/workspaces";
import channelRouter from "../routes/channel";
import directConversationRouter from "../routes/directConversation";
import uploadRouter from "../routes/upload";
import gmailRouter from "../routes/gmail";
import meetingsRouter from "../routes/meetings";

const router = Router();

router.use("/users", userRouter);
router.use("/workspaces", workspaceRouter);
router.use("/workspaces/:workspaceId/channels", channelRouter);
router.use("/workspaces/:workspaceId/direct-conversations", directConversationRouter);
router.use("/workspaces/:workspaceId/meetings", meetingsRouter);
router.use("/upload", uploadRouter);
router.use("/gmail", gmailRouter);

export default router;
