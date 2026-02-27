const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendWelcomeEmail = async (user) => {
  try {
    if (!user.email || !user.email.includes("@")) {
      console.log("Invalid email format:", user.email);
      return false;
    }
    const mailOptions = {
      from: `"Dance Katta" <${process.env.EMAIL_USER}>`,
      to: user.email.trim().toLowerCase(),
      subject: "Welcome to Dance Katta 🎉",
      html: `
        <h2>Welcome ${user.firstName}!</h2>
        <p>Your account has been successfully created.</p>
        <br/>
        <p>Start your dance journey with us 💃</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log("Email sent successfully to:", user.email);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};

module.exports = sendWelcomeEmail;
