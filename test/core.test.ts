import { describe, expect, it, vi } from 'vitest';
import { embeddedCheckoutUrl, handleCheckoutMessage } from '../src/core.js';

const SECRET = `cs_${'0'.repeat(26)}_secret_${'a'.repeat(32)}`;

describe('embeddedCheckoutUrl', () => {
  it('opens the form on the React Native bridge, with the appearance asked', () => {
    const url = new URL(embeddedCheckoutUrl(SECRET, { theme: 'dark', radius: 8 }));

    expect(url.origin + url.pathname).toBe('https://mercy-pay.com/integre/v1/paiement');
    expect(url.searchParams.get('client_secret')).toBe(SECRET);
    expect(url.searchParams.get('bridge')).toBe('react-native');
    expect(url.searchParams.get('theme')).toBe('dark');
    expect(url.searchParams.get('radius')).toBe('8');
  });

  it('refuses anything that is not a session client secret', () => {
    expect(() => embeddedCheckoutUrl('mp_sandbox_123')).toThrow(/clientSecret invalide/);
  });
});

describe('handleCheckoutMessage', () => {
  it('hands each message to the right callback and ignores anything else', () => {
    const callbacks = { onEvent: vi.fn(), onSuccess: vi.fn(), onFailure: vi.fn(), onError: vi.fn() };

    handleCheckoutMessage(JSON.stringify({ source: 'mercy-pay', version: 1, type: 'payment_failed', checkout_session: 'cs_1', payment: 'pay_1', message: 'Solde insuffisant.' }), callbacks);
    handleCheckoutMessage(JSON.stringify({ source: 'mercy-pay', version: 1, type: 'payment_succeeded', checkout_session: 'cs_1', payment: 'pay_2' }), callbacks);
    handleCheckoutMessage(JSON.stringify({ source: 'mercy-pay', version: 1, type: 'error', code: 'session_unavailable' }), callbacks);
    handleCheckoutMessage(JSON.stringify({ source: 'autre', type: 'payment_succeeded' }), callbacks);
    handleCheckoutMessage('pas du json', callbacks);

    expect(callbacks.onEvent).toHaveBeenCalledTimes(3);
    expect(callbacks.onFailure).toHaveBeenCalledWith(expect.objectContaining({ message: 'Solde insuffisant.' }));
    expect(callbacks.onSuccess).toHaveBeenCalledWith(expect.objectContaining({ payment: 'pay_2' }));
    expect(callbacks.onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'session_unavailable' }));
  });
});
