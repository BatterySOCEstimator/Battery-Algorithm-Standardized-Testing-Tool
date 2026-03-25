/**
 * Email test script - sends a test email to a specified address.
 *
 * Usage: npx tsx src/services/utils/test_email.ts <email>
 *
 * @remarks
 * Requires GMAIL_USER and mail config env vars to be set.
 * Not intended for production use.
 */
import 'dotenv/config';
import { sendEmail } from '@/services/email.service';

const to = process.argv[2];

if (!to) {
    console.error("Please provide an email address: npx tsx src/utils/test_email.ts <email>");
    process.exit(1);
}

const main = async () => {
    await sendEmail(
        to,
        'Your model is ready',
        '<p>Your model <strong>TestModel1</strong> has been processed.</p>'
    );
    console.log(`Email sent to ${to}`);
};

main().catch((err) => {
    console.error("Failed to send email:", err);
    process.exit(1);
});