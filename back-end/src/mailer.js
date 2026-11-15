import nodemailer from "nodemailer";
import "dotenv/config";

const transporter =
  process.env.MAIL_ENABLED === "true"
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
    : null;

export async function deliver({ fromName, replyTo, to, subject, text }) {
  if (!transporter) return { sent: false };
  try {
    await transporter.sendMail({
      from: `"${fromName}" <${process.env.SMTP_USER}>`,
      replyTo,
      to,
      subject,
      text,
    });
    console.log("Mail sent to", to);
    return { sent: true };
  } catch (err) {
    console.error("Mail failed:", err.message);
    return { sent: false };
  }
}