import { EmailTemplate, SmsTemplate } from '../../types';

interface DocumentRequiredData {
  tradeId: string;
  docType?: string;
  [key: string]: unknown;
}

export function documentRequiredTemplate(data: DocumentRequiredData): {
  email: EmailTemplate;
  sms: SmsTemplate;
} {
  const tradeUrl = `https://azaka.finance/trade/${data.tradeId}`;

  return {
    email: {
      subject: `Document Required: ${data.tradeId}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Required</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Azaka Trade Finance</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #f59e0b; margin-top: 0;">📄 Document Action Required</h2>
    
    <p>A document has been submitted or is required for trade ${data.tradeId}.</p>
    
    <div style="background: #fffbeb; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="margin: 5px 0;"><strong>Trade ID:</strong> ${data.tradeId}</p>
      ${data.docType ? `<p style="margin: 5px 0;"><strong>Document Type:</strong> ${data.docType}</p>` : ''}
      <p style="margin: 5px 0;"><strong>Status:</strong> Pending Review</p>
    </div>
    
    <p><strong>Action Required:</strong> Please review and verify the submitted documents to proceed with the trade.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${tradeUrl}" style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Review Documents</a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #666; text-align: center;">
      All documents are stored on IPFS with cryptographic verification.
    </p>
  </div>
</body>
</html>
      `,
    },
    sms: {
      message: `Azaka: Document ${data.docType || 'update'} for trade ${data.tradeId}. Review required. ${tradeUrl}`,
    },
  };
}
