import { describe, it, expect, vi, afterEach } from 'vitest';
import { logger, loggers } from '@/lib/logger';

// Pure unit tests for the structured logger helpers. lib/logger.ts only
// depends on winston (no DB), so this runs in the default suite. We spy on
// the underlying winston logger methods and assert each specialized helper
// emits at the right level with the right structured metadata.

describe('loggers structured helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('payment → info with event/amount/currency + extra details', () => {
    const spy = vi.spyOn(logger, 'info').mockImplementation(() => logger);
    loggers.payment('voucher_purchase', 5000, 'EUR', { purchaseId: 'p1' });
    expect(spy).toHaveBeenCalledWith(
      'Payment Event',
      expect.objectContaining({ event: 'voucher_purchase', amount: 5000, currency: 'EUR', purchaseId: 'p1' }),
    );
  });

  it('security → warn with event + userId', () => {
    const spy = vi.spyOn(logger, 'warn').mockImplementation(() => logger);
    loggers.security('login_failed', { ip: '1.2.3.4' }, 'u1');
    expect(spy).toHaveBeenCalledWith(
      'Security Event',
      expect.objectContaining({ event: 'login_failed', ip: '1.2.3.4', userId: 'u1' }),
    );
  });

  it('audit → info with action/actor/merchant', () => {
    const spy = vi.spyOn(logger, 'info').mockImplementation(() => logger);
    loggers.audit('campaign.updated', 'actor1', 'merch1', { changes: ['name'] });
    expect(spy).toHaveBeenCalledWith(
      'Audit Log',
      expect.objectContaining({ action: 'campaign.updated', actorId: 'actor1', merchantId: 'merch1', changes: ['name'] }),
    );
  });

  describe('fraud → severity maps to log level', () => {
    it('high → error', () => {
      const spy = vi.spyOn(logger, 'log').mockImplementation(() => logger);
      loggers.fraud('velocity', 'high', { count: 10 });
      expect(spy).toHaveBeenCalledWith('error', 'Fraud Signal', expect.objectContaining({ signal: 'velocity', severity: 'high', count: 10 }));
    });
    it('medium → warn', () => {
      const spy = vi.spyOn(logger, 'log').mockImplementation(() => logger);
      loggers.fraud('velocity', 'medium', {});
      expect(spy).toHaveBeenCalledWith('warn', 'Fraud Signal', expect.objectContaining({ severity: 'medium' }));
    });
    it('low → info', () => {
      const spy = vi.spyOn(logger, 'log').mockImplementation(() => logger);
      loggers.fraud('velocity', 'low', {});
      expect(spy).toHaveBeenCalledWith('info', 'Fraud Signal', expect.objectContaining({ severity: 'low' }));
    });
  });

  describe('database → error on failure, debug on success', () => {
    it('with error → error level incl. message + stack', () => {
      const errSpy = vi.spyOn(logger, 'error').mockImplementation(() => logger);
      const err = new Error('deadlock');
      loggers.database('update', 'Voucher', 12, err);
      expect(errSpy).toHaveBeenCalledWith(
        'Database Error',
        expect.objectContaining({ operation: 'update', table: 'Voucher', duration: 12, error: 'deadlock' }),
      );
    });
    it('no error → debug level', () => {
      const dbgSpy = vi.spyOn(logger, 'debug').mockImplementation(() => logger);
      loggers.database('select', 'Voucher', 3);
      expect(dbgSpy).toHaveBeenCalledWith(
        'Database Operation',
        expect.objectContaining({ operation: 'select', table: 'Voucher', duration: 3 }),
      );
    });
  });

  describe('email → info on success, error on failure', () => {
    it('success → info', () => {
      const spy = vi.spyOn(logger, 'info').mockImplementation(() => logger);
      loggers.email('receipt', 'a@b.com', true);
      expect(spy).toHaveBeenCalledWith('Email Sent', expect.objectContaining({ type: 'receipt', recipient: 'a@b.com' }));
    });
    it('failure → error with error string', () => {
      const spy = vi.spyOn(logger, 'error').mockImplementation(() => logger);
      loggers.email('receipt', 'a@b.com', false, 'smtp down');
      expect(spy).toHaveBeenCalledWith('Email Failed', expect.objectContaining({ type: 'receipt', recipient: 'a@b.com', error: 'smtp down' }));
    });
  });

  describe('external → info on success, error on failure', () => {
    it('success → info with duration', () => {
      const spy = vi.spyOn(logger, 'info').mockImplementation(() => logger);
      loggers.external('stripe', 'charge', true, 120);
      expect(spy).toHaveBeenCalledWith('External Service Call', expect.objectContaining({ service: 'stripe', operation: 'charge', duration: 120 }));
    });
    it('failure → error', () => {
      const spy = vi.spyOn(logger, 'error').mockImplementation(() => logger);
      loggers.external('stripe', 'charge', false, 120, 'timeout');
      expect(spy).toHaveBeenCalledWith('External Service Failed', expect.objectContaining({ service: 'stripe', error: 'timeout' }));
    });
  });

  it('request → http with method/url/status/duration', () => {
    const spy = vi.spyOn(logger, 'http').mockImplementation(() => logger);
    loggers.request('GET', '/api/x', 200, 42, 'u1');
    expect(spy).toHaveBeenCalledWith(
      'HTTP Request',
      expect.objectContaining({ method: 'GET', url: '/api/x', statusCode: 200, duration: 42, userId: 'u1' }),
    );
  });
});
