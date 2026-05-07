import { EmailTemplate, SmsTemplate } from '../../types';

interface TradeExpiringData {
  tradeId: string;
  expiryLedger?: number;
  hoursRemaining?: number;
  [key: string]: unknown;
}

export function tradeExpiringTemplate(data: TradeExpiringData): {
  email: EmailTemplate;
  sms: SmsTemplate;
} {
  const tradeUrl = `https://azaka.finance/trade/${data.tradeId}`;
  const hoursRemaining = data.hoursRemaining || 48;

  return {
    email: {
      subject: `⚠️ Trade Expiring Soon: ${data.tradeId}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trade Expiring Soon</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Azaka Trade Finance</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #ef4444; margin-top: 0;">⚠️ Trade Expiring Soon</h2>
    
    <p><strong>Urgent:</strong> Trade ${data.tradeId} will expire in approximately ${hoursRemaining} hours.</p>
    
    <div style="background: #fef2f2; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ef4444;">
      <p style="margin: 5px 0;"><strong>Trade ID:</strong> ${data.tradeId}</p>
      <p style="margin: 5px 0;"><strong>Time Remaining:</strong> ~${hoursRemaining} hours</p>
      ${data.expiryLedger ? `<p style="margin: 5px 0;"><strong>Expiry Ledger:</strong> ${data.expiryLedger}</p>` : ''}
      <p style="margin: 5px 0;"><strong>Status:</strong> ⚠️ Expiring Soon</p>
    </div>
    
    <p><strong>Action Required:</strong></p>
    <ul style="line-height: 1.8;">
      <li>Complete all pending document submissions</li>
      <li>Verify all required documents</li>
      <li>Settle the trade before expiry</li>
    </ul>
    
    <p style="color: #ef4444; font-weight: 600;">If the trade expires, funds will be returned to the importer and the trade will be cancelled.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${tradeUrl}" style="background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Take Action Now</a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #666; text-align: center;">
      This is an automated reminder. Trade expiry is enforced by smart contract.
    </p>
  </div>
</body>
</html>
      `,
    },
    sms: {
      message: `Azaka URGENT: Trade ${data.tradeId} expires in ~${hoursRemaining}h. Complete documents now or trade will be cancelled. ${tradeUrl}`,
    },
  };
}
