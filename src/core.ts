import type { Appearance, CheckoutEvent } from '@mercy-pay/js';

export type { Appearance, CheckoutEvent } from '@mercy-pay/js';

export interface CheckoutCallbacks {
  onReady?: (event: Extract<CheckoutEvent, { type: 'ready' }>) => void;
  onProcessing?: (event: Extract<CheckoutEvent, { type: 'processing' }>) => void;
  /** Updates your app. Only the payment.succeeded webhook your server receives proves the payment. */
  onSuccess?: (event: Extract<CheckoutEvent, { type: 'payment_succeeded' }>) => void;
  /** The customer can try again in the form. */
  onFailure?: (event: Extract<CheckoutEvent, { type: 'payment_failed' }>) => void;
  onExpired?: (event: Extract<CheckoutEvent, { type: 'expired' }>) => void;
  /** The form can't open: a wrong secret, or a session that no longer exists. */
  onError?: (event: Extract<CheckoutEvent, { type: 'error' }>) => void;
  /** Every message, before its own callback. */
  onEvent?: (event: CheckoutEvent) => void;
}

const DEFAULT_BASE_URL = 'https://mercy-pay.com';

const CLIENT_SECRET = /^cs_[0-9A-Za-z]{26}_secret_[0-9A-Za-z]{32}$/;

/**
 * The form's address for the React Native bridge. Throws on a value that can't be a client
 * secret. Built by hand: React Native's URL object can't set query parameters.
 */
export function embeddedCheckoutUrl(clientSecret: string, appearance: Appearance = {}, baseUrl: string = DEFAULT_BASE_URL): string {
  if (!CLIENT_SECRET.test(String(clientSecret))) {
    throw new Error('Mercy Pay : clientSecret invalide. Passez le client_secret d\'une session créée avec ui_mode "embedded".');
  }

  const params: Array<[string, string]> = [['client_secret', clientSecret], ['bridge', 'react-native']];

  if (appearance.theme === 'light' || appearance.theme === 'dark') {
    params.push(['theme', appearance.theme]);
  }

  const color = appearance.color?.replace(/^#/, '');
  if (color && /^[0-9a-fA-F]{6}$/.test(color)) {
    params.push(['color', color.toLowerCase()]);
  }

  if (typeof appearance.radius === 'number' && Number.isFinite(appearance.radius)) {
    params.push(['radius', String(Math.min(24, Math.max(0, Math.round(appearance.radius))))]);
  }

  const query = params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');

  return `${baseUrl.replace(/\/+$/, '')}/integre/v1/paiement?${query}`;
}

/** Hands one message from the web view to the right callback. Anything else is ignored. */
export function handleCheckoutMessage(raw: string, callbacks: CheckoutCallbacks): void {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }

  if (data === null || typeof data !== 'object') {
    return;
  }

  const message = data as Record<string, unknown>;
  if (message.source !== 'mercy-pay' || typeof message.type !== 'string') {
    return;
  }

  const event = message as unknown as CheckoutEvent;
  callbacks.onEvent?.(event);

  switch (event.type) {
    case 'ready':
      callbacks.onReady?.(event);
      break;
    case 'processing':
      callbacks.onProcessing?.(event);
      break;
    case 'payment_succeeded':
      callbacks.onSuccess?.(event);
      break;
    case 'payment_failed':
      callbacks.onFailure?.(event);
      break;
    case 'expired':
      callbacks.onExpired?.(event);
      break;
    case 'error':
      callbacks.onError?.(event);
      break;
  }
}
