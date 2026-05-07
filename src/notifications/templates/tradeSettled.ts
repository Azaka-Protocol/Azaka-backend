import { EmailTemplate, SmsTemplate } from '../../types';

interface TradeSettledData {
  tradeId: string;
  amount?: string;
  asset?: string;
  [key: string]: unknown;
}

export function tradeSettledTemplate(data: TradeSettledData): {
  email: EmailTemplate;
  sms: SmsTemplate;
} {
  const tradeUrl = `https://azaka.finance/trade/${data.tradeId}`;

  return {
    email: {
      subject: `Trade Settled: ${data.tradeId}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trade Settled</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Azaka Trade Finance</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #10b981; margin-top: 0;">🎉 Trade Successfully Settled</h2>
    
    <p>Congratulations! Trade ${data.tradeId} has been successfully completed and funds have been released.</p>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
      <p style="margin: 5px 0;"><strong>Trade ID:</strong> ${data.tradeId}</p>
      ${data.amount && data.asset ? `<p style="margin: 5px 0;"><strong>Amount Released:</strong> ${data.amount} ${data.asset}</p>` : ''}
      <p style="margin: 5px 0;"><strong>Status:</strong> ✓ Settled</p>
    </div>
    
    <p><strong>What's Next:</strong></p>
    <ul style="line-height: 1.8;">
      <li>Exporter: Payment has been released to your account</li>
      <li>Importer: Trade is complete, goods should be delivered</li>
      <li>All documents are permanently stored on IPFS</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${tradeUrl}" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View Trade Details</a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #666; text-align: center;">
      Thank you for using Azaka. Trade finance powered by Stellar blockchain.
    </p>
  </div>
</body>
</html>
      `,
    },
    sms: {
      message: `Azaka: Trade ${data.tradeId} settled successfully! ${data.amount ? `${data.amount} ${data.asset} released.` : ''} ${tradeUrl}`,
    },
  };
}
