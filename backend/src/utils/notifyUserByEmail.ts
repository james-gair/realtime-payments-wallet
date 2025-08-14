import nodemailer from "nodemailer";
import sql from "../database/client";

interface SendEmailParams {
  email: string;
  firstName?: string;
  subject: string;
  message: {
    text?: string;
    html?: string;
  };
}

export async function sendEmailToUserByAccountId(
  accountId: number,
  subject: string,
  message: {
    text?: string;
    html?: string;
  }
) {
  const userResult = await sql`
    SELECT email, first_name FROM accounts WHERE account_id = ${accountId}
  `;
  if (userResult.length === 0) return;

  const { email, first_name } = userResult[0];
  sendEmailByEmail(email, subject, message, first_name);
}

export async function sendEmailByEmail(
  email: string,
  subject: string,
  message: { text?: string; html?: string },
  firstName?: string
) {
  const greeting = `Dear ${firstName || "customer"},\n\n`;
  const htmlGreeting = `<p>Dear ${firstName || "customer"},</p>`;
  // 1. Choose transporter
  let transporter;
  // we use a test account for development
  if (process.env.NODE_ENV === "development") {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } else {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Email credentials are not set in environment variables");
    }
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // 2. Add greeting if message is provided
  const fullText = message.text ? `${greeting}${message.text}` : undefined;
  const fullHtml = message.html ? `${htmlGreeting}${message.html}` : undefined;

  // 3. Send it
  const info = await transporter.sendMail({
    from: '"Fintech App" <no-reply@fintech.test>',
    to: email,
    subject,
    text: fullText,
    html: fullHtml,
  });

  if (process.env.NODE_ENV === "development") {
    console.log(`📬 Preview email: ${nodemailer.getTestMessageUrl(info)}`);
  }
}
