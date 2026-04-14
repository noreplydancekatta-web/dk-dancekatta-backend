const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEnrollmentEmail = async ({
  studentEmail,
  studentName,
  batchName,
  studioName,
  styleName,
  levelName,
  fromDate,
  toDate,
  amountPaid,
  paymentId,
  paymentMethod,
}) => {
  try {
    if (!studentEmail || !studentEmail.includes("@")) {
      console.log("Invalid email format:", studentEmail);
      return false;
    }

    const formattedFrom = fromDate
      ? new Date(fromDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";

    const formattedTo = toDate
      ? new Date(toDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";

    const mailOptions = {
      from: `"Dance Katta" <${process.env.EMAIL_USER}>`,
      to: studentEmail.trim().toLowerCase(),
      subject: `🎉 Enrollment Confirmed – ${batchName} at ${studioName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: #3A5ED4; padding: 30px 24px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
            .header p { color: #ccd6ff; margin: 6px 0 0; font-size: 14px; }
            .body { padding: 28px 24px; color: #333; }
            .body h2 { margin-top: 0; font-size: 20px; }
            .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .details-table tr td { padding: 10px 12px; font-size: 14px; }
            .details-table tr:nth-child(odd) td { background: #f0f4ff; }
            .details-table tr td:first-child { font-weight: bold; color: #555; width: 40%; }
            .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; }
            .footer { background: #f9f9f9; text-align: center; padding: 16px; font-size: 12px; color: #999; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💃 Dance Katta</h1>
              <p>Enrollment Confirmation</p>
            </div>
            <div class="body">
              <h2>Hi ${studentName || "Student"}, you're enrolled! 🎉</h2>
              <p>Your enrollment has been confirmed. Here are your batch details:</p>

              <table class="details-table">
                <tr><td>Studio</td><td>${studioName}</td></tr>
                <tr><td>Batch</td><td>${batchName}</td></tr>
                <tr><td>Style</td><td>${styleName || "—"}</td></tr>
                <tr><td>Level</td><td>${levelName || "—"}</td></tr>
                <tr><td>Batch Period</td><td>${formattedFrom} → ${formattedTo}</td></tr>
                <tr><td>Amount Paid</td><td><strong>₹${amountPaid}</strong></td></tr>
                <tr><td>Payment Method</td><td>${paymentMethod}</td></tr>
                <tr><td>Transaction ID</td><td>${paymentId}</td></tr>
              </table>

              <p><span class="badge">✅ Payment Successful</span></p>
              <p style="margin-top: 24px;">See you on the dance floor! 🕺</p>
              <p>– The Dance Katta Team</p>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Dance Katta. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Enrollment email sent successfully to:", studentEmail);
    return true;
  } catch (error) {
    console.error("Enrollment email sending failed:", error);
    return false;
  }
};

module.exports = { sendEnrollmentEmail };