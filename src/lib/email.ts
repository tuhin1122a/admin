import nodeMailer, { SendMailOptions } from "nodemailer";

const transporter = nodeMailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendAdminVerificationTokenMail = async (
  email: string,
  token: string
) => {
  const options = {
    from: process.env.SMTP_USERNAME,
    to: email,
    html: `<html>
    <body>
      <div style="text-align: center; padding: 20px; font-family: Arial;">
        <h2>🔐 Admin Panel Login Code</h2>
        <p>Your OTP is: <strong style="font-size: 20px; color: #ff5722;">${token}</strong></p>
        <p>This code is valid for <strong>2 minutes</strong>. Do not share it.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    </body>
    </html>`,
  } as SendMailOptions;
  try {
    const res = await transporter.sendMail(options);

    console.log("EMAIL RESPONSE ", res);

    return true;
  } catch (error) {
    console.log("EMAIL ERROR ", error);
    return null;
  }
};
