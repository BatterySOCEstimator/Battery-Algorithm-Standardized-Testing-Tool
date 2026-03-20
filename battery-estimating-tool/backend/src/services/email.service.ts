import { transporter } from '@/config/mail.config';

// Simple email template function
export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: `"Battery SOC Benchmark" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Email send failed:', err);
    throw new Error('Failed to send email.');
  }
};

