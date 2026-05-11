import nodemailer from "nodemailer";

export let transporter: nodemailer.Transporter;

const createTransporter = async () => {
  // Check if Gmail credentials are configured
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log("✅ Using Gmail for emails");
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Fallback to Ethereal for testing (but don't show in production)
    console.log("⚠️  WARNING: Email credentials not configured!");
    console.log("📧 Using Ethereal test email service (emails won't be delivered)");
    console.log("🔧 To send real emails, configure EMAIL_USER and EMAIL_PASS in .env file");
    console.log("📖 See .env file for Gmail App Password setup instructions");
    
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // Verify connection
  try {
    await transporter.verify();
    console.log("✅ Mail server ready");
  } catch (err: any) {
    console.error("❌ Mail server error:", err.message);
  }

  return transporter;
};

// Initialize transporter
createTransporter().then(t => {
  transporter = t;
});
