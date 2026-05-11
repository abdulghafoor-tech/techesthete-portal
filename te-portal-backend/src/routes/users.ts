import { Router, Request, Response } from "express";
import authMiddleware from "../../middleware/authMiddleware";
import { transporter } from "../utils/mailer";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const userRouter = Router();
import jwt from "jsonwebtoken";

import db from "../../models";
const { User, Token } = db;

interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  image: string;
  isInvited: boolean;
  roleId: number;
  workspaceName?: string; // Optional workspace name for new signups
}


userRouter.post(
  "/",
  async (req: Request<{}, {}, Omit<User, "id">>, res: Response) => {
    try {
      const { email, name, password, image, isInvited, roleId, workspaceName } = req.body;

      // Validate required fields
      if (!email || !name || !password || isInvited === undefined || !roleId) {
        return res.status(400).json({
          message: "Required fields: email, name, password, isInvited, roleId",
        });
      }

      // Validate workspace name for new signups (not invited users)
      if (!isInvited && !workspaceName) {
        return res.status(400).json({
          message: "Workspace name is required for new signups",
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          message: "User with this email already exists",
        });
      }

      // Generate verification token
      const verificationToken = jwt.sign(
        { email, timestamp: Date.now() },
        process.env.JWT_SECRET!,
        { expiresIn: "24h" }
      );

      // Create user with verification fields and store workspace name temporarily
      const newUser = await User.create({
        email,
        name,
        password,
        image: image || null,
        isInvited,
        roleId,
        isEmailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        workspaceName: workspaceName || null, // Store workspace name temporarily
      });

      // Send verification email
      const frontendUrl = process.env.FRONTEND_URL || "http://192.168.4.128:5173";
      const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verify Your Email - Slack Clone",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
              .info-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Welcome to Slack Clone!</h1>
              </div>
              <div class="content">
                <p>Hello ${name},</p>
                <p>Thank you for signing up! We're excited to have you on board.</p>
                <p>To complete your registration and start using Slack Clone, please verify your email address by clicking the button below:</p>
                <p style="text-align: center;">
                  <a href="${verificationUrl}" class="button">Verify Email Address</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px; font-size: 12px;">${verificationUrl}</p>
                <div class="info-box">
                  <strong>📌 Important:</strong>
                  <ul style="margin: 10px 0;">
                    <li>This verification link will expire in 24 hours</li>
                    <li>You won't be able to log in until you verify your email</li>
                    <li>If you didn't create this account, please ignore this email</li>
                  </ul>
                </div>
                <p>Once verified, you'll be able to:</p>
                <ul>
                  <li>✓ Create and join workspaces</li>
                  <li>✓ Chat with team members</li>
                  <li>✓ Share files and collaborate</li>
                  <li>✓ And much more!</li>
                </ul>
                <p>If you have any questions, feel free to reach out to our support team.</p>
                <p>Best regards,<br>The Slack Clone Team</p>
              </div>
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
                <p>&copy; 2026 Slack Clone. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      console.log("📧 Sending verification email to:", email);
      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Verification email sent successfully!");

      // For Ethereal (testing), get preview URL - only in development
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log("--------------------------------------------------");
        console.log("📧 Email Verification Sent!");
        console.log(`📬 To: ${email}`);
        console.log(`🔗 Verification URL: ${verificationUrl}`);
        console.log(`👁️  Preview Email: ${previewUrl}`);
        console.log("--------------------------------------------------");
      }

      // Return success without token (user must verify email first)
      // Only include previewUrl if EMAIL_PASS is not configured (testing mode)
      const isTestMode = !process.env.EMAIL_PASS;
      
      res.status(201).json({
        status: 201,
        success: true,
        message: "Registration successful! Please check your email to verify your account.",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          isEmailVerified: false,
        },
        ...(isTestMode && previewUrl && { previewUrl, testMode: true }), // Only include in test mode
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ 
        message: "Error creating user",
        error: error.message 
      });
    }
  });


userRouter.put("/profile", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, image, password } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (image) user.image = image;
    if (password) user.password = password; 

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).send("Error updating profile");
  }
});

userRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    console.log("🔐 Login attempt:", { email, passwordLength: password?.length });

    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(404).json({
        status: 404,
        success: false,
        msg: "User not found. Please check your email or sign up for a new account.",
      });
    }

    console.log("✅ User found:", { 
      id: user.id, 
      email: user.email, 
      isVerified: (user as any).isEmailVerified,
      storedPassword: user.password 
    });

    // Check if email is verified
    if (!(user as any).isEmailVerified) {
      console.log("❌ Email not verified");
      return res.status(403).json({
        status: 403,
        success: false,
        msg: "Please verify your email before logging in. Check your inbox for the verification link.",
      });
    }

    const isPasswordMatched = user.password === password;
    console.log("🔑 Password check:", { 
      provided: password, 
      stored: user.password, 
      matched: isPasswordMatched 
    });

    if (!isPasswordMatched) {
      console.log("❌ Password mismatch");
      return res.status(401).json({
        status: 401,
        success: false,
        msg: "Invalid credentials. Please check your email and password.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        roleId: user.roleId,
        roleTitle: (await user.getRole()).title,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    console.log("✅ Login successful for:", email);

    return res.status(200).json({
      status: 200,
      success: true,
      token: token,
      user: {
        id: user.id,
        roleId: user.roleId,
        image: user.image, 
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).send("Server Error");
  }
});


// Email verification endpoint
userRouter.get("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    console.log("📧 Email verification request received");
    console.log("Token:", token ? "Present" : "Missing");

    if (!token || typeof token !== 'string') {
      console.log("❌ No token provided");
      return res.status(400).json({
        success: false,
        message: "Verification token is required"
      });
    }

    // Verify the token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
      console.log("✅ Token decoded successfully:", { email: decoded.email });
    } catch (error) {
      console.log("❌ Token verification failed:", error);
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token"
      });
    }

    // Find user with this token
    const user = await User.findOne({
      where: {
        email: decoded.email,
        emailVerificationToken: token
      }
    });

    console.log("User lookup result:", user ? `Found user: ${(user as any).email}` : "User not found");

    if (!user) {
      console.log("❌ User not found with email:", decoded.email);
      return res.status(400).json({
        success: false,
        message: "Invalid verification token or user not found"
      });
    }

    // Check if already verified
    if ((user as any).isEmailVerified) {
      console.log("ℹ️ Email already verified for:", (user as any).email);
      return res.status(200).json({
        success: true,
        message: "Email already verified. You can now log in.",
        alreadyVerified: true
      });
    }

    // Check if token expired
    if (new Date() > new Date((user as any).emailVerificationExpires)) {
      console.log("❌ Token expired for:", (user as any).email);
      return res.status(400).json({
        success: false,
        message: "Verification link has expired. Please request a new one.",
        expired: true
      });
    }

    // Update user as verified
    await user.update({
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null
    });

    console.log(`✅ Email verified successfully for user: ${(user as any).email}`);

    // Create a workspace for the new user using their chosen workspace name
    const { WorkSpace, WorkspaceMembers } = db;
    try {
      // Use the workspace name they provided during signup, or fallback to default
      const workspaceName = (user as any).workspaceName || `${(user as any).name}'s Workspace`;
      const newWorkspace = await WorkSpace.create({
        name: workspaceName,
        ownerId: user.id
      });

      // Add user as a member of their own workspace with owner role (roleId: 1)
      await WorkspaceMembers.create({
        userId: user.id,
        workspaceId: newWorkspace.id,
        roleId: 1 // Owner role
      });

      // Clear the temporary workspaceName field
      await user.update({ workspaceName: null });

      console.log(`✅ Created workspace "${workspaceName}" for user ${(user as any).email}`);
    } catch (workspaceError) {
      console.error("⚠️ Failed to create workspace:", workspaceError);
      // Don't fail verification if workspace creation fails
    }

    // Send welcome email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: (user as any).email,
      subject: "Welcome to Slack Clone! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Email Verified Successfully!</h1>
            </div>
            <div class="content">
              <p>Hello ${(user as any).name},</p>
              <div class="success">
                <strong>🎉 Your email has been verified!</strong>
              </div>
              <p>You can now log in and start using Slack Clone.</p>
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://192.168.4.128:5173'}/login" class="button">Go to Login</a>
              </p>
              <p><strong>What's next?</strong></p>
              <ul>
                <li>Create or join a workspace</li>
                <li>Invite team members</li>
                <li>Start collaborating with your team</li>
                <li>Share files and messages</li>
              </ul>
              <p>If you have any questions, our support team is here to help!</p>
              <p>Best regards,<br>The Slack Clone Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; 2026 Slack Clone. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("✅ Welcome email sent");
    } catch (emailError) {
      console.error("⚠️ Failed to send welcome email:", emailError);
      // Don't fail the verification if email fails
    }

    return res.status(200).json({
      success: true,
      message: "Email verified successfully! You can now log in."
    });
  } catch (error) {
    console.error("❌ Email verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying email"
    });
  }
});


// Resend verification email
userRouter.post("/resend-verification", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a verification link has been sent."
      });
    }

    // Check if already verified
    if ((user as any).isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified. You can log in."
      });
    }

    // Generate new verification token
    const verificationToken = jwt.sign(
      { email, timestamp: Date.now() },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );

    // Update user with new token
    await user.update({
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || "http://192.168.4.128:5173";
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email - Slack Clone",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hello ${(user as any).name},</p>
              <p>You requested a new verification link for your Slack Clone account.</p>
              <p>Click the button below to verify your email address:</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px; font-size: 12px;">${verificationUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't request this, please ignore this email.</p>
              <p>Best regards,<br>The Slack Clone Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; 2026 Slack Clone. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    
    if (previewUrl) {
      console.log("--------------------------------------------------");
      console.log("📧 Verification Email Resent!");
      console.log(`📬 To: ${email}`);
      console.log(`👁️  Preview: ${previewUrl}`);
      console.log("--------------------------------------------------");
    }

    return res.status(200).json({
      success: true,
      message: "If an account exists with this email, a verification link has been sent.",
      ...(previewUrl && { previewUrl })
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Error sending verification email"
    });
  }
});


userRouter.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    console.log(" Password reset requested for:", email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log(" User not found, but returning success for security");
      
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link."
      });
    }

    console.log(" User found:", user.name);

    
    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" } 
    );

    console.log(" Reset token generated");

    
    await Token.create({
      userId: user.id,
      token: resetToken,
      type: "password_reset",
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    });

    console.log(" Token stored in database");

    
    const frontendUrl = process.env.FRONTEND_URL || "http://192.168.4.128:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    console.log(" Preparing to send email to:", email);
    console.log(" Reset URL:", resetUrl);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request - Slack Clone",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${user.name},</p>
              <p>We received a request to reset your password for your Slack Clone account.</p>
              <p>Click the button below to reset your password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
              <p>If you have any questions, please contact our support team.</p>
              <p>Best regards,<br>The Slack Clone Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; 2026 Slack Clone. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    console.log(" Sending email...");
    const info = await transporter.sendMail(mailOptions);
    console.log(" Email sent successfully!");

    // For Ethereal, get preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("--------------------------------------------------");
      console.log(" Password Reset Email Sent!");
      console.log(` To: ${email}`);
      console.log(` Reset URL: ${resetUrl}`);
      console.log(` Preview Email: ${previewUrl}`);
      console.log("--------------------------------------------------");
    }

    return res.status(200).json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset link.",
      ...(previewUrl && { previewUrl }) // Include preview URL for testing
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing password reset request"
    });
  }
});


userRouter.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required"
      });
    }

    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    
    const tokenRecord = await Token.findOne({
      where: {
        token,
        type: "password_reset",
        userId: decoded.id
      }
    });

    if (!tokenRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or already used reset token"
      });
    }

  
    if (new Date() > new Date(tokenRecord.expiresAt)) {
      await tokenRecord.destroy();
      return res.status(400).json({
        success: false,
        message: "Reset token has expired. Please request a new one."
      });
    }

  
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    
    user.password = newPassword;
    await user.save();

  
    await tokenRecord.destroy();

    
    await Token.destroy({
      where: {
        userId: decoded.id,
        type: "password_reset"
      }
    });

    // Send confirmation email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Successfully Reset - Slack Clone",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Password Reset Successful</h1>
            </div>
            <div class="content">
              <p>Hello ${user.name},</p>
              <div class="success">
                <strong>Your password has been successfully reset!</strong>
              </div>
              <p>You can now log in to your account using your new password.</p>
              <p><strong>Security Tips:</strong></p>
              <ul>
                <li>Never share your password with anyone</li>
                <li>Use a unique password for each account</li>
                <li>Consider using a password manager</li>
                <li>Enable two-factor authentication when available</li>
              </ul>
              <p>If you didn't make this change, please contact our support team immediately.</p>
              <p>Best regards,<br>The Slack Clone Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; 2026 Slack Clone. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password."
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error resetting password"
    });
  }
});


userRouter.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const users = await User.findAll();

    res.json(users);
  } catch (error) {
    console.error("Error fetching API:", error);
    res.status(500).send("Error fetching data from external API");
  }
});

// Get user profile by ID
userRouter.get("/:userId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'image', 'roleId', 'isInvited', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        roleId: user.roleId,
        isInvited: user.isInvited,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user profile"
    });
  }
});


userRouter.get("/workspace/:workspaceId/members", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const currentUserId = (req as any).user.id;

    console.log(` Fetching members for workspace ${workspaceId}, current user: ${currentUserId}`);

    
    const { WorkspaceMembers } = db;
    const members = await WorkspaceMembers.findAll({
      where: { workspaceId },
      include: [{
        model: User,
        as: "User", 
        attributes: ['id', 'name', 'email', 'image']
      }]
    });

    console.log(` Found ${members.length} total members in workspace`);
    console.log(' All members:', members.map((m: any) => ({ 
      id: m.id, 
      userId: m.userId, 
      workspaceId: m.workspaceId,
      user: m.User ? { id: m.User.id, name: m.User.name, email: m.User.email } : null
    })));

    
    const users = members
      .map((member: any) => member.User)
      .filter((user: any) => {
        if (!user) {
          console.log(' Found member without User data');
          return false;
        }
        if (user.id === currentUserId) {
          console.log(` Filtering out current user: ${user.name} (${user.id})`);
          return false;
        }
        console.log(` Including user: ${user.name} (${user.id})`);
        return true;
      });

    console.log(` Returning ${users.length} users after filtering current user`);
    console.log(' Final user list:', users.map((u: any) => ({ id: u.id, name: u.name, email: u.email })));

    res.json({ data: users, success: true });
  } catch (error) {
    console.error(" Error fetching workspace members:", error);
    res.status(500).json({ message: "Error fetching workspace members" });
  }
});

userRouter.delete("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const users = await User.findAll();

    res.json(users);
  } catch (error) {
    console.error("Error fetching API:", error);
    res.status(500).send("Error fetching data from external API");
  }
});


userRouter.post("/debug/create-test-user", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.body;
    const currentUserId = (req as any).user.id;
    
    if (!workspaceId) {
      return res.status(400).json({ message: "workspaceId is required" });
    }

    
    const testUser = await User.create({
      email: `testuser${Date.now()}@example.com`,
      name: `Test User ${Date.now()}`,
      password: 'password123',
      image: null,
      isInvited: true,
      roleId: 3 // Member role
    });


    const { WorkspaceMembers } = db;
    await WorkspaceMembers.create({
      userId: testUser.id,
      workspaceId: workspaceId,
      roleId: 3 // Member role
    });

    res.json({ 
      message: "Test user created and added to workspace",
      user: {
        id: testUser.id,
        name: testUser.name,
        email: testUser.email
      }
    });
  } catch (error) {
    console.error("Error creating test user:", error);
    res.status(500).json({ message: "Error creating test user" });
  }
});


userRouter.get("/debug/workspace/:workspaceId/all-members", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { WorkspaceMembers } = db;
    
    const members = await WorkspaceMembers.findAll({
      where: { workspaceId },
      include: [{
        model: User,
        as: "User", 
        attributes: ['id', 'name', 'email', 'image', 'isInvited']
      }]
    });

    const allUsers = await User.findAll({
      attributes: ['id', 'name', 'email', 'isInvited']
    });

    res.json({
      workspaceId,
      totalMembers: members.length,
      members: members.map((m: any) => ({
        membershipId: m.id,
        userId: m.userId,
        roleId: m.roleId,
        user: m.User
      })),
      allUsersInSystem: allUsers
    });
  } catch (error) {
    console.error("Error fetching debug info:", error);
    res.status(500).json({ message: "Error fetching debug info" });
  }
});


userRouter.get("/test-associations", async (req: Request, res: Response) => {
  try {
    const { WorkspaceMembers } = db;
    
    
    const members = await WorkspaceMembers.findAll({
      limit: 5, 
      include: [{
        model: User,
        as: "User",
        attributes: ['id', 'name', 'email']
      }]
    });

    res.json({
      message: "Association test successful - updated",
      totalFound: members.length,
      members: members.map((m: any) => ({
        membershipId: m.id,
        userId: m.userId,
        workspaceId: m.workspaceId,
        user: m.User
      }))
    });
  } catch (error: any) {
    console.error("Association test failed:", error);
    res.status(500).json({ 
      message: "Association test failed", 
      error: error.message 
    });
  }
});

export default userRouter;
