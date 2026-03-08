import { BrevoClient } from '@getbrevo/brevo';

export const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY!,
});

// eslint-disable-next-line fp/no-nil
export async function sendEmail({
  subject,
  textContent,
  to,
}: {
  to: string;
  subject: string;
  textContent: string;
}): Promise<void> {
  const email = process.env.BREVO_SENDER_EMAIL!;
  const name = process.env.BREVO_SENDER_NAME!;

  // eslint-disable-next-line fp/no-unused-expression
  await brevo.transactionalEmails.sendTransacEmail({
    subject,
    textContent,
    sender: { name, email },
    to: [{ email: to }],
  });
}
