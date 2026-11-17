import { useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { embeddedCheckoutUrl, handleCheckoutMessage, type Appearance, type CheckoutCallbacks } from './core.js';

export { embeddedCheckoutUrl, handleCheckoutMessage } from './core.js';
export type { Appearance, CheckoutCallbacks, CheckoutEvent } from './core.js';

export interface EmbeddedCheckoutProps extends CheckoutCallbacks {
  /** The `client_secret` of a session created on your server with `ui_mode: "embedded"`. */
  clientSecret: string;
  appearance?: Appearance;
  style?: StyleProp<ViewStyle>;
  /** @internal Another Mercy Pay address, for tests. */
  baseUrl?: string;
}

/**
 * The Mercy Pay payment form inside your app: mobile money and card, 3D Secure included.
 * Give it the room of a screen.
 *
 * ```tsx
 * <EmbeddedCheckout clientSecret={clientSecret} onSuccess={() => navigation.goBack()} />
 * ```
 */
export function EmbeddedCheckout({ clientSecret, appearance, style, baseUrl, ...callbacks }: EmbeddedCheckoutProps) {
  // The latest callbacks, without reloading the form when the parent renders.
  const latest = useRef<CheckoutCallbacks>(callbacks);
  latest.current = callbacks;

  return (
    <WebView
      style={style}
      source={{ uri: embeddedCheckoutUrl(clientSecret, appearance, baseUrl) }}
      onMessage={(event: WebViewMessageEvent) => handleCheckoutMessage(event.nativeEvent.data, latest.current)}
      // Web pages only: a bank's 3D Secure step stays inside, nothing else opens.
      originWhitelist={['https://*', 'http://*']}
      javaScriptEnabled
      domStorageEnabled
      setSupportMultipleWindows={false}
    />
  );
}
