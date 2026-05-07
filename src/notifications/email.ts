import { Resend } from 'resend';
import config from '../config';
import { logger } from '../utils/logger';

const resend = new Resend(config.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Azaka <notifications@azaka.finance>',
      to,
      subject,
      html,
    });

    if (error) {
      logger.error({ error, to, subject }, 'Resend API error');
      throw new Error(`Resend error: ${error.message}`);
    }

    logger.debug({ emailId: data?.id, to }, 'Email sent via Resend');
  } catch (error) {
    logger.error({ error, to, subject }, 'Failed to send email');
    throw error;
  }
}
