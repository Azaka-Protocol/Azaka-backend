import { EmailTemplate, SmsTemplate } from '../../types';

interface TradeCreatedData {
  tradeId: string;
  exporter: string;
  importer: string;
  amount: string;
  asset: string;
  [key: string]: unknown;
}

export function tradeCreatedTemplate(data: TradeCreatedData): {
  email: EmailTemplate;
  sms: SmsTemplate;
} {
  const tradeUrl = `https://azaka.finance/trade/${data.tradeId}`;

  return {
    email: {
      subject: `New Trade Created: ${data.tradeId}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trade Created</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Azaka Trade Finance</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #667eea; margin-top: 0;">New Trade Created</h2>
    
    <p>A new trade has been created and is awaiting escrow deposit.</p>
    
    <div style="background: #f7f7f7; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Trade ID:</strong> ${data.tradeId}</p>
      <p style="margin: 5px 0;"><strong>Amount:</strong> ${data.amount} ${data.asset}</p>
      <p style="margin: 5px 0;"><strong>Exporter:</strong> ${data.exporter.slice(0, 8)}...${data.exporter.slice(-8)}</p>
      <p style="margin: 5px 0;"><strong>Importer:</strong> ${data.importer.slice(0, 8)}...${data.importer.slice(-8)}</p>
    </div>
    
    <p><strong>Next Step:</strong> The importer must deposit funds into escrow to activate the trade.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${tradeUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View Trade</a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #666; text-align: center;">
      This is an automated notification from Azaka. Your funds are secured by Soroban smart contracts on Stellar.
    </p>
  </div>
</body>
</html>
      `,
    },
    sms: {
      message: `Azaka: New trade ${data.tradeId} created for ${data.amount} ${data.asset}. Awaiting escrow deposit. View: ${tradeUrl}`,
    },
  };
}
