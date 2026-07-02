# Firebase Cloud Messaging (FCM) - Guide d'Implémentation Complet

## Vue d'ensemble

Ce guide explique l'intégration complète de **Firebase Cloud Messaging (FCM)** dans votre application Next.js 16.2.4. L'implémentation gère :

1. ✅ Enregistrement des appareils auprès de l'API Django
2. ✅ Réception des notifications en arrière-plan (Service Worker)
3. ✅ Affichage des notifications au premier plan (toasts)
4. ✅ Désinscription lors de la déconnexion
5. ✅ Historique des notifications

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                   │
├─────────────────────────────────────────────────────────┤
│
│  ┌──────────────────────────────────────────────────┐
│  │ lib/firebase.ts - Firebase Initialization        │
│  │ • initializeApp()                                │
│  │ • getMessaging()                                 │
│  │ • getFCMToken()                                  │
│  └──────────────────────────────────────────────────┘
│                        │
│                        ├─→ services/fcmService.ts
│                        │   • initializeFCM()
│                        │   • setupForegroundMessageListener()
│                        │   • cleanupFCM()
│                        │
│                        ├─→ public/firebase-messaging-sw.js
│                        │   (Service Worker - Background)
│                        │
│                        └─→ services/deviceService.ts
│                            • registerDevice()
│                            • unregisterDevice()
│                            • fetchNotifications()
│
│  ┌──────────────────────────────────────────────────┐
│  │ store/useAuthStore.ts - Auth Store              │
│  │ • login() → initializeFCM()                      │
│  │ • logout() → unregisterDevice() + cleanupFCM()  │
│  └──────────────────────────────────────────────────┘
│
│  ┌──────────────────────────────────────────────────┐
│  │ hooks/useFCM.ts - React Hook                    │
│  │ • useFCM() - Simple hook for setup              │
│  │ • useFCMWithStatus() - With status tracking     │
│  └──────────────────────────────────────────────────┘
│
│  ┌──────────────────────────────────────────────────┐
│  │ components/notifications/ - UI Components        │
│  │ • NotificationProvider.tsx                       │
│  │ • NotificationToast.tsx                          │
│  └──────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────┘
                        │
                        │ HTTP/REST
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend (Django)                     │
├─────────────────────────────────────────────────────────┤
│
│  POST /utilisateur/devices/register/
│  • Saves: { registration_token, platform: "web" }
│
│  POST /utilisateur/devices/unregister/
│  • Removes device registration
│
│  GET /utilisateur/notifications/
│  • Returns notification history
│
└─────────────────────────────────────────────────────────┘
                        │
                        │ (Firebase Admin SDK)
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Firebase Cloud Messaging                   │
├─────────────────────────────────────────────────────────┤
│  • Sends push messages to registered devices
│  • Routes to Service Worker (background)
│  • Routes to app (foreground)
└─────────────────────────────────────────────────────────┘
```

---

## Configuration Étape par Étape

### **Étape 1 : Configuration Firebase (déjà faite)**

Les fichiers suivants sont **déjà configurés** :

- `lib/firebase.ts` - Firebase App initialization avec config
- `public/firebase-messaging-sw.js` - Service Worker pour notifications background
- `services/api.ts` - Axios avec cookies/Bearer auth

**Variables d'environnement requises** (vérifiez votre `.env.local`):

```bash
# Firebase configuration (already in lib/firebase.ts hardcoded)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=F0KwqkUGUbWZxo-vWoyYJzB073iJlXFZrdfCEs4UeQk

# API Backend
NEXT_PUBLIC_API_URL=https://accessoires-exclusifs-api.onrender.com
```

### **Étape 2 : Services créés**

Trois nouveaux services ont été créés :

#### **a) `services/deviceService.ts`**
Gère l'enregistrement/désenregistrement auprès de l'API Django.

```typescript
import { deviceService } from '@/services/deviceService';

// Enregistrer un appareil
await deviceService.registerDevice(fcmToken);

// Dés-enregistrer un appareil
await deviceService.unregisterDevice(fcmToken);

// Récupérer l'historique des notifications
const notifications = await deviceService.fetchNotifications();
```

#### **b) `services/fcmService.ts`**
Service complet pour gérer FCM :

```typescript
import { 
  initializeFCM, 
  setupForegroundMessageListener, 
  cleanupFCM,
  getCachedToken 
} from '@/services/fcmService';

// 1. Initialize FCM (demande permission + récupère token)
const token = await initializeFCM(user);

// 2. Setup handler pour messages au premier plan
setupForegroundMessageListener((payload) => {
  console.log('Message reçu:', payload);
});

// 3. Cleanup au logout
cleanupFCM();

// 4. Récupérer le token actuel si disponible
const token = getCachedToken();
```

#### **c) `public/firebase-messaging-sw.js`**
Service Worker qui affiche les notifications en arrière-plan :

- Intercepte les messages de Firebase
- Affiche les notifications même si l'app est fermée
- Gère les clics sur les notifications

### **Étape 3 : Hook React pour simplifier**

Utilisez le hook `useFCM` dans vos composants :

#### **Option 1 : Setup simple**

```typescript
import { useFCM } from '@/hooks/useFCM';

export default function MyComponent() {
  // Automatically initialize FCM quand l'utilisateur est autentifié
  useFCM();

  return <div>Your content</div>;
}
```

#### **Option 2 : Avec handler personnalisé**

```typescript
export default function MyComponent() {
  useFCM({
    enableToasts: true,
    onMessage: (payload) => {
      // Votre logique custom
      console.log('Custom notification:', payload);
    },
  });

  return <div>Your content</div>;
}
```

#### **Option 3 : Avec suivi du statut**

```typescript
export default function MyComponent() {
  const { fcmStatus } = useFCMWithStatus();

  return (
    <div>
      Status: {fcmStatus}
      {/* idle | loading | ready | error */}
    </div>
  );
}
```

### **Étape 4 : Intégration au layout racine**

La meilleure pratique est d'utiliser `NotificationProvider` au niveau du layout racine :

```typescript
// app/layout.tsx
import NotificationProvider from '@/components/notifications/NotificationProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <NotificationProvider
          maxNotifications={3}        // Max 3 notifications simultanées
          autoDismissMs={6000}        // Disparaître après 6 secondes
        >
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
```

Ou si vous utilisez un provider Zustand existant :

```typescript
// app/layout.tsx
import NotificationProvider from '@/components/notifications/NotificationProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <YourExistingProviders>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </YourExistingProviders>
      </body>
    </html>
  );
}
```

---

## Flux Complet

### **1. Login → FCM Setup**

```
User logs in
  ↓
useAuthStore.login()
  ↓
auth/web/login/ endpoint
  ↓
set({ user, isAuthenticated: true })
  ↓
useAuthStore triggers → useFCM hook
  ↓
initializeFCM(user)
  ↓
1. Demande permission de notification
  2. Enregistre Service Worker
  3. Récupère token FCM
  4. Appelle POST /utilisateur/devices/register/ avec token
  5. Sauvegarde token en localStorage
  ↓
setupForegroundMessageListener()
  ↓
NotificationToast affichée quand message reçu
```

### **2. Message reçu (App fermée)**

```
Firebase envoie message
  ↓
Service Worker (firebase-messaging-sw.js) l'intercepte
  ↓
messaging.onBackgroundMessage()
  ↓
self.registration.showNotification()
  ↓
Notification système affichée (même app fermée)
  ↓
User clique
  ↓
notificationclick event
  ↓
Ouvre app et navigue vers URL spécifiée
```

### **3. Message reçu (App ouverte)**

```
Firebase envoie message
  ↓
Service Worker l'intercepte (mais app est active)
  ↓
onMessage() handler dans fcmService
  ↓
NotificationProvider l'attrape
  ↓
NotificationToast rendu
  ↓
Toast affiché avec animations
  ↓
Auto-dismissé après 6 secondes (configurable)
```

### **4. Logout → FCM Cleanup**

```
User logs out
  ↓
useAuthStore.logout()
  ↓
1. getCachedToken() → récupère token FCM
  2. deviceService.unregisterDevice(token)
       → POST /utilisateur/devices/unregister/
  3. cleanupFCM()
       → Supprime listeners
       → Efface localStorage
  4. api.post('auth/logout/')
  5. Efface localStorage auth
  6. set({ user: null, isAuthenticated: false })
  ↓
App resets
```

---

## API Django - Implémentation Backend Requise

Vérifiez que votre backend Django implémente ces endpoints :

### **1. Enregistrer un appareil**

```
POST /utilisateur/devices/register/

Request body:
{
  "registration_token": "string (FCM token)",
  "platform": "web"  // ou "ios", "android"
}

Response (201 Created):
{
  "id": 123,
  "registration_token": "...",
  "platform": "web",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

### **2. Dés-enregistrer un appareil**

```
POST /utilisateur/devices/unregister/

Request body:
{
  "registration_token": "string (FCM token)"
}

Response (200 OK):
{
  "status": "success",
  "message": "Device unregistered"
}
```

### **3. Récupérer notifications (Historique)**

```
GET /utilisateur/notifications/

Response (200 OK):
[
  {
    "id": 1,
    "title": "Commande confirmée",
    "body": "Votre commande #123 a été confirmée",
    "type": "order",
    "created_at": "2024-01-01T12:00:00Z",
    "read": false,
    "data": {
      "order_id": "123",
      "url": "/dashboard/orders/123"
    }
  },
  ...
]
```

---

## Composants et Utilisation

### **NotificationProvider** (au niveau du layout)

```typescript
<NotificationProvider
  fcmOptions={{
    enableToasts: true,
    onMessage: (payload) => {
      // Optionnel: custom handling
    }
  }}
  maxNotifications={3}
  autoDismissMs={6000}
>
  {children}
</NotificationProvider>
```

### **NotificationToast** (rendu automatiquement)

Toast stylisé avec :
- ✅ Icône contextuée (succès, erreur, warning, info)
- ✅ Animations fluides
- ✅ Barre de progression auto-dismiss
- ✅ Bouton fermeture

### **useFCM Hook** (dans vos composants)

```typescript
// Simple - juste init FCM
useFCM();

// Avec options
useFCM({
  enableToasts: false,
  onMessage: (payload) => {
    // Handle manually
  }
});

// Avec suivi de statut
const { fcmStatus } = useFCMWithStatus();
```

---

## Gestion des Erreurs

### **Permission refusée**

Si l'utilisateur refuse les notifications :
- Token ne sera pas obtenu
- deviceService ne sera pas appelé
- Message dans console : `Notification permission denied`

### **Service Worker non enregistré**

Si le SW échoue à s'enregistrer :
- Les notifications foreground fonctionneront
- Les notifications background ne fonctionneront pas
- Check console pour erreurs

### **Device déjà enregistré**

Backend doit gérer les doublons (idempotent) :
- POST /devices/register/ doit renvoyer l'existant au lieu de créer un doublon

### **Désinscription échouée**

Au logout, l'unregisterDevice() échoue mais le logout continue quand même :
- Priorize : clear session > unregister device
- C'est OK car token devient invalide de toute façon

---

## Debugging

### **Console Logs**

Tous les services incluent des logs préfixés :
- `[FCM Service]` - Services FCM
- `[Device Service]` - Enregistrement appareils
- `[Service Worker]` - Service Worker background
- `[useFCM]` - Hook

### **Vérifier le token en cache**

```typescript
// Dans la console browser
localStorage.getItem('fcm_token');
localStorage.getItem('fcm_token_timestamp');
```

### **Vérifier la permission**

```typescript
// Dans la console browser
Notification.permission  // "granted", "denied", "default"
```

### **Service Worker Status**

```typescript
// Dans la console browser
navigator.serviceWorker.getRegistrations()
  .then(registrations => console.log(registrations))
```

### **Firebase Messaging Instance**

```typescript
// Dans app code
import { getFirebaseMessaging } from '@/lib/firebase';
const messaging = getFirebaseMessaging();
console.log('Messaging:', messaging);
```

---

## Testing

### **1. Tester les permissions**

```bash
# Chrome DevTools → Onglet "Privacy" ou "Permissions"
# Réinitialiser permission pour tester requestPermission()
```

### **2. Tester avec fake messages**

Vous pouvez utiliser Firebase Console pour envoyer des test messages :
- Firebase Console → Cloud Messaging
- Créer une campagne
- Sélectionner token spécifique
- Envoyer

### **3. Tester depuis le backend**

```python
# Django admin ou script
from firebase_admin import messaging

message = messaging.MulticastMessage(
    notification=messaging.Notification(
        title='Test',
        body='Message de test'
    ),
    tokens=['<fcm_token>']
)
response = messaging.send_multicast(message)
```

---

## Fichiers Créés/Modifiés

### Créés :
- ✅ `services/deviceService.ts` - Enregistrement appareils
- ✅ `services/fcmService.ts` - FCM complet
- ✅ `public/firebase-messaging-sw.js` - Service Worker (maj)
- ✅ `hooks/useFCM.ts` - React hook
- ✅ `components/notifications/NotificationToast.tsx` - Toast UI
- ✅ `components/notifications/NotificationProvider.tsx` - Provider
- ✅ `FCM_IMPLEMENTATION.md` - Ce guide

### Modifiés :
- ✅ `store/useAuthStore.ts` - Ajout unregisterDevice au logout

### Existants (inchangés) :
- `lib/firebase.ts` - Déjà configuré
- `services/api.ts` - Déjà configuré

---

## Checklist d'Intégration

- [ ] Vérifier `.env.local` a `NEXT_PUBLIC_API_URL`
- [ ] Vérifier backend implémente les 3 endpoints `/utilisateur/devices/*`
- [ ] Importer `NotificationProvider` dans `app/layout.tsx`
- [ ] Tester login → permission notification
- [ ] Tester FCM token généré → registré backend
- [ ] Tester message depuis backend → toast affiché
- [ ] Tester logout → device unregistered
- [ ] Tester notification background (app fermée)
- [ ] Vérifier logs console `[FCM Service]`, `[Device Service]`

---

## Performance & Bonnes Pratiques

1. **Token caching** - Token réutilisé pendant 7 jours (configurable)
2. **Lazy loading** - FCM init seulement si user authenticated
3. **Cleanup au logout** - Éviter les memory leaks
4. **Error handling** - Graceful fallback si FCM échoue
5. **TypeScript** - Tous les services sont typés
6. **No polling** - Éviter de faire polling de notifications (utiliser webhook/push)

---

## Support & Troubleshooting

### Issues courants

**Q: Token ne s'obtient pas**
A: Vérifier permission notification, vérifier SW enregistré, check console logs

**Q: Backend ne reçoit pas register call**
A: Vérifier auth token valide, CORS headers, endpoint URL correct

**Q: Notifications background ne s'affichent pas**
A: Vérifier firebase-messaging-sw.js présent, vérifier browser support

**Q: Logout lent**
A: Normal si unregisterDevice appel réseau. Async/await dans logout.

---

## Prochaines Étapes

1. **Tester le flux complet** : Login → Message → Toast → Logout
2. **Implémenter backend** : Endpoints `/utilisateur/devices/*` et `/utilisateur/notifications/`
3. **Tester depuis Firebase Console** : Envoyer des messages de test
4. **Monitorer** : Vérifier logs, error tracking, analytics
5. **Optimiser** : Ajuster autoDismissMs, maxNotifications selon UX

---

**Version**: 1.0  
**Date**: 2024-12-02  
**Next.js**: 16.2.4  
**Firebase**: 10.5.0  
**TypeScript**: 5.x
