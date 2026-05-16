import { EmailTemplate, SmsTemplate } from '../../types';
import { tradeCreatedTemplate } from './tradeCreated';
import { escrowDepositedTemplate } from './escrowDeposited';
import { documentRequiredTemplate } from './documentRequired';
import { tradeSettledTemplate } from './tradeSettled';
import { tradeExpiringTemplate } from './tradeExpiring';

interface TemplateData {
  tradeId: string;
  [key: string]: unknown;
}

const templates: Record<
  string,
  (data: TemplateData) => { email: EmailTemplate; sms: SmsTemplate }
> = {
  tradeCreated: (data) => tradeCreatedTemplate(data as Parameters<typeof tradeCreatedTemplate>[0]),
  escrowDeposited: (data) => escrowDepositedTemplate(data as Parameters<typeof escrowDepositedTemplate>[0]),
  documentRequired: documentRequiredTemplate,
  documentSubmitted: documentRequiredTemplate, // Reuse same template
  tradeSettled: tradeSettledTemplate,
  tradeExpiring: tradeExpiringTemplate,
  tradeCancelled: (data) => ({
    email: {
      subject: `Trade ${data.tradeId} Cancelled`,
      html: `<p>Trade ${data.tradeId} has been cancelled.</p>`,
    },
    sms: {
      message: `Azaka: Trade ${data.tradeId} has been cancelled.`,
    },
  }),
  tradeExpired: (data) => ({
    email: {
      subject: `Trade ${data.tradeId} Expired`,
      html: `<p>Trade ${data.tradeId} has expired.</p>`,
    },
    sms: {
      message: `Azaka: Trade ${data.tradeId} has expired.`,
    },
  }),
};

export function getEmailTemplate(eventType: string, data: TemplateData): EmailTemplate {
  const template = templates[eventType];
  if (!template) {
    return {
      subject: `Azaka Trade Update: ${data.tradeId}`,
      html: `<p>Trade ${data.tradeId} has been updated.</p>`,
    };
  }
  return template(data).email;
}

export function getSmsTemplate(eventType: string, data: TemplateData): SmsTemplate {
  const template = templates[eventType];
  if (!template) {
    return {
      message: `Azaka: Trade ${data.tradeId} updated.`,
    };
  }
  return template(data).sms;
}
