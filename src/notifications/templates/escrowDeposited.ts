import { EmailTemplate, SmsTemplate } from '../../types';

interface EscrowDepositedData {
  tradeId: string;
  amount: string;
  asset: string;
  [key: string]: unknown;
}

export function escrowDepositedTemplate(data: EscrowDepositedData): {
  email: EmailTemplate;
  sms: SmsTemplate;
} {
  const tradeUrl = `https://azaka.finance/trade/${data.tradeId}`;

  return {
    email: {
      subject: `Escrow Deposited: ${data.tradeId}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Escrow Deposited</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Azaka Trade Finance</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #10b981; margin-top: 0;">✓ Funds Locked in Escrow</h2>
    
    <p>Great news! The importer has deposited funds into escrow. The trade is now active.</p>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
      <p style="margin: 5px 0;"><strong>Trade ID:</strong> ${data.tradeId}</p>
      <p style="margin: 5px 0;"><strong>Amount Locked:</strong> ${data.amount} ${data.asset}</p>
      <p style="margin: 5px 0;"><strong>Status:</strong> Active</p>
    </div>
    
    <p><strong>Next Step:</strong> Exporter should arrange shipment and submit required documents.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${tradeUrl}" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View Trade</a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #666; text-align: center;">
      Funds are secured by Soroban smart contracts and will be released upon document verification.
    </p>
  </div>
</body>
</html>
      `,
    },
    sms: {
      message: `Azaka: Escrow deposited for trade ${data.tradeId}. ${data.amount} ${data.asset} locked. Trade is now active. ${tradeUrl}`,
    },
  };
}
