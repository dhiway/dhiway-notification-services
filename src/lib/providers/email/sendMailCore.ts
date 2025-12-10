import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

let transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

interface Email_request {
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  to: string;
  subject: string;
  html: string;
  activationUrl?: string;
  cc?: string;
}

const {
  MAIL_LOG,
  SMTP_AWS_SES,
  SMTP_GMAIL,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  GMAIL_USER,
  GMAIL_PASS,
} = process.env;

async function initTransporter() {
  if (transporter) return;

  if (String(SMTP_AWS_SES).toLowerCase() === 'true') {
    try {
      const sesClient = new SESv2Client({
        region: AWS_REGION!,
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID!,
          secretAccessKey: AWS_SECRET_ACCESS_KEY!,
        },
      });

      transporter = nodemailer.createTransport({
        SES: { sesClient, SendEmailCommand },
      });
    } catch (err) {
      console.log('AWS TRANSPORTER ERROR: ', err);
    }
  } else if (String(SMTP_GMAIL).toLowerCase() === 'true') {
    try {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: GMAIL_USER!,
          pass: GMAIL_PASS!,
        },
      });
    } catch (err) {
      console.log('GMAIL TRANSPORTER ERROR: ', err);
    }
  } else {
    throw new Error('No valid mail transport configuration found.');
  }
}

export async function sendMail({
  fromName,
  fromEmail,
  replyTo,
  to,
  subject,
  html,
  activationUrl,
  cc,
}: Email_request): Promise<{ ok: boolean }> {
  if (MAIL_LOG === 'true') {
    console.log('📧 Sending mail to:', to);
    if (activationUrl) console.log('🔗 Activation URL/OTP:', activationUrl);
  }

  await initTransporter();

  try {
    const result = await transporter.sendMail({
      from: `${fromName} <${SMTP_GMAIL === 'true' ? GMAIL_USER : fromEmail}>`,
      to,
      replyTo,
      cc,
      subject,
      text: html.replace(/<[^>]+>/g, ''),
      html,
    });

    if (MAIL_LOG === 'true') {
      console.log('✅ Email sent:', result.messageId);
    }

    return { ok: true };
  } catch (err) {
    console.error('❌ Email sending error:', err);
    return { ok: false };
  }
}
