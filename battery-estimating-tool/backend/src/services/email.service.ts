import { transporter } from '@/config/mail.config';
import { logger } from '@/services/logger.service';

if (!process.env.GMAIL_USER) throw new Error("GMAIL_USER is not set");

/**
 * Sends an HTML email via the configured SMTP transporter.
 *
 * @param to - Recipient email address.
 * @param subject - Subject line of the email.
 * @param html - HTML body of the email.
 *
 * @throws {Error} If the email fails to send.
 *
 * @remarks
 * Emails are sent from the address set in `GMAIL_USER`.
 * This function is fire-and-forget safe when called with `void`,
 * but will throw if awaited and the send fails.
 */
export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: `"Battery SOC Benchmark" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    logger.error('email.service - Failed to send email', { to, subject, err });
    throw new Error('Failed to send email.');
  }
};

