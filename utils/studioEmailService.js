const nodemailer = require("nodemailer");

// ✅ Create transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Send Studio Under Review Email
const sendStudioUnderReviewEmail = async (toEmail, studioName) => {
  try {
    const mailOptions = {
      from: `"Dance Katta Studios" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Studio Application Submitted - Under Review",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 25px;">
          <h2>Hello ${studioName},</h2>

          <p>
            Thank you for registering your studio with <strong>Dance Katta</strong>.
          </p>

          <p>
            Your application is currently <strong>under review</strong>.
          </p>

          <p>
            You will receive another email once approved.
          </p>

          <br/>
          <p><strong>Team Dance Katta</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Studio under review email sent");
  } catch (error) {
    console.error("❌ Studio email error:", error.message);
  }
};

module.exports = {
  sendStudioUnderReviewEmail,
};
