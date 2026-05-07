import axios from 'axios';
import config from '../config';
import { logger } from '../utils/logger';

const TERMII_API_URL = 'https://api.ng.termii.com/api/sms/send';

/**
 * Normalize phone number to E.164 format
 * Assumes Nigerian numbers if no country code provided
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, '');

  // If starts with 0, replace with +234 (Nigeria)
  if (normalized.startsWith('0')) {
    normalized = '234' + normalized.slice(1);
  }

  // Add + if not present
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }

  return normalized;
}

export async function sendSms(to: string, message: string): Promise<void> {
  const normalizedPhone = normalizePhoneNumber(to);

  try {
    const response = await axios.post(
      TERMII_API_URL,
      {
        to: normalizedPhone,
        from: 'Azaka',
        sms: message,
        type: 'plain',
        channel: 'generic',
        api_key: config.TERMII_API_KEY,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.message !== 'Successfully Sent') {
      logger.error({ response: response.data, to: normalizedPhone }, 'Termii API error');
      throw new Error(`Termii error: ${response.data.message}`);
    }

    logger.debug({ messageId: response.data.message_id, to: normalizedPhone }, 'SMS sent via Termii');
  } catch (error) {
    logger.error({ error, to: normalizedPhone }, 'Failed to send SMS');
    throw error;
  }
}
