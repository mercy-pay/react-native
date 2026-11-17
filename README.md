# Mercy Pay pour React Native

Affichez le formulaire de paiement [Mercy Pay](https://mercy-pay.com) dans votre app React Native : mobile money et carte bancaire, 3D Secure comprise. Aucune donnée de paiement ne passe par votre app.

```sh
npm install @mercy-pay/react-native react-native-webview
```

Avec Expo : `npx expo install @mercy-pay/react-native react-native-webview`.

## 1. Créez la session sur votre serveur

Avec votre clé API, jamais dans l'app : `POST /api/v1/checkout_sessions` avec `ui_mode: "embedded"`. Renvoyez à l'app le `client_secret` de la réponse. Voir le [guide du paiement intégré](https://docs.mercy-pay.com/payments/embedded).

## 2. Affichez le formulaire

Sur un écran à lui :

```tsx
import { EmbeddedCheckout } from '@mercy-pay/react-native';

export function PaymentScreen({ route, navigation }) {
  return (
    <EmbeddedCheckout
      style={{ flex: 1 }}
      clientSecret={route.params.clientSecret}
      appearance={{ radius: 12 }}
      onSuccess={() => navigation.navigate('Merci')}
      onError={() => navigation.goBack()} // session introuvable : créez-en une autre
    />
  );
}
```

| Prop | Rôle |
| --- | --- |
| `clientSecret` | Le `client_secret` de la session, obligatoire. |
| `appearance` | `theme` (`light` ou `dark`), `color` (hexadécimal), `radius` (0 à 24). Par défaut, votre Image de marque. |
| `onReady`, `onProcessing` | Le formulaire est affiché, puis le paiement est lancé. |
| `onSuccess` | Le paiement a réussi, avec `payment` et `checkout_session`. |
| `onFailure` | Le paiement a échoué. Le client peut réessayer dans le formulaire. |
| `onExpired` | La session a expiré. |
| `onError` | Le formulaire ne peut pas s'ouvrir (`code: "session_unavailable"`). |
| `onEvent` | Chaque message. |

Apple Pay et Google Pay ne s'affichent pas dans une vue web : le client paie par mobile money ou par carte.

## Confirmez sur votre serveur

`onSuccess` met à jour votre app. Il ne prouve rien : confirmez la commande quand votre serveur reçoit le webhook `payment.succeeded`, signé.

## Licence

MIT
