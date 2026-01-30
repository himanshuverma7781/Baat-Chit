import nodemailer from "nodemailer";

// Create reusable transporter
export const createEmailTransporter = () => {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD, // App password, not regular password
        },
    });
};

// Send OTP email
export const sendOtpEmail = async (email, otp) => {
    const transporter = createEmailTransporter();

    const mailOptions = {
        from: `"Baat-Chit" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Login OTP - Baat-Chit",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Baat-Chit Login Verification</h2>
        <p>Your one-time password (OTP) is:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #1f2937; margin: 0; font-size: 32px; letter-spacing: 8px;">${otp}</h1>
        </div>
        <p style="color: #6b7280;">This OTP will expire in 10 minutes.</p>
        <p style="color: #6b7280;">If you didn't request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #9ca3af; font-size: 12px;">Baat-Chit - Connect with Language Partners Worldwide</p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email}`);
        return true;
    } catch (error) {
        console.error("Error sending OTP email:", error);
        throw error;
    }
};
