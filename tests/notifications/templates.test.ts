import { describe, it, expect } from 'vitest';
import { getEmailTemplate, getSmsTemplate } from '../../src/notifications/templates';

describe('Notification templates', () => {
  describe('Email templates', () => {
    it('should generate tradeCreated email', () => {
      const template = getEmailTemplate('tradeCreated', {
        tradeId: 'trade-123',
        exporter: 'GEXPORTER...',
        importer: 'GIMPORTER...',
        amount: '10000',
        asset: 'USDC',
      });

      expect(template.subject).toContain('trade-123');
      expect(template.html).toContain('trade-123');
      expect(template.html).toContain('10000');
      expect(template.html).toContain('USDC');
      expect(template.html).toContain('https://azaka.finance/trade/trade-123');
    });

    it('should generate escrowDeposited email', () => {
      const template = getEmailTemplate('escrowDeposited', {
        tradeId: 'trade-456',
        amount: '5000',
        asset: 'USDC',
      });

      expect(template.subject).toContain('Escrow Deposited');
      expect(template.html).toContain('5000 USDC');
      expect(template.html).toContain('Active');
    });

    it('should generate tradeSettled email', () => {
      const template = getEmailTemplate('tradeSettled', {
        tradeId: 'trade-789',
        amount: '15000',
        asset: 'USDC',
      });

      expect(template.subject).toContain('Settled');
      expect(template.html).toContain('Successfully');
      expect(template.html).toContain('15000 USDC');
    });

    it('should generate tradeExpiring email', () => {
      const template = getEmailTemplate('tradeExpiring', {
        tradeId: 'trade-999',
        hoursRemaining: 48,
        expiryLedger: 1000000,
      });

      expect(template.subject).toContain('Expiring Soon');
      expect(template.html).toContain('48 hours');
      expect(template.html).toContain('Urgent');
    });

    it('should handle unknown event types gracefully', () => {
      const template = getEmailTemplate('unknownEvent', {
        tradeId: 'trade-000',
      });

      expect(template.subject).toContain('trade-000');
      expect(template.html).toContain('updated');
    });
  });

  describe('SMS templates', () => {
    it('should generate concise tradeCreated SMS', () => {
      const template = getSmsTemplate('tradeCreated', {
        tradeId: 'trade-123',
        amount: '10000',
        asset: 'USDC',
      });

      expect(template.message).toContain('Azaka');
      expect(template.message).toContain('trade-123');
      expect(template.message.length).toBeLessThan(160); // SMS length limit
    });

    it('should generate urgent tradeExpiring SMS', () => {
      const template = getSmsTemplate('tradeExpiring', {
        tradeId: 'trade-999',
        hoursRemaining: 24,
      });

      expect(template.message).toContain('URGENT');
      expect(template.message).toContain('24h');
    });

    it('should include deep link in all SMS', () => {
      const template = getSmsTemplate('tradeSettled', {
        tradeId: 'trade-456',
      });

      expect(template.message).toContain('https://azaka.finance/trade/trade-456');
    });
  });
});
