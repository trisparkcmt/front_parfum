# Documentation de l'API - Boutique de Parfums & Laboratoire DIY

Cette documentation décrit en détail tous les points d'entrée (endpoints) de l'API Django actuelle. Elle explique comment les utiliser, les méthodes HTTP, les en-têtes requis, les données attendues (payload) et les données renvoyées (réponse).

---

## Sommaire

1. Authentification & Sécurité
2. Profil & Gestion Utilisateur (/api/v1/auth/)
3. Boutique & Catalogue (/api/v1/shop/)
4. Laboratoire DIY & Intelligence Artificielle (/api/v1/lab/)
5. Espace Prestataire & Workflows Monetbil
6. Espace Livreur
7. Administration de l'API (Réservé aux Admin)
8. Notifications & Demandes Prestataires (/api/v1/utilisateur/)
9. Commandes & Panier (/api/v1/orders/ - Désactivés)

---

## 1. Authentification & Sécurité

L'API utilise une stratégie de connexion hybride selon le type de client (Web vs Mobile/API direct).

### A. Clients Web (Navigateur)
- Endpoint de connexion : `POST /api/v1/auth/web/login/`
- Mécanisme : Les jetons JWT (`access` et `refresh`) sont stockés dans des cookies `HttpOnly` sécurisés gérés par le serveur. Le corps JSON de la réponse ne contient aucun jeton pour empêcher les attaques XSS.
- Sécurité additionnelle : Validation CSRF requise.

Exemple de requête (JSON):

```json
{
  "email": "user@example.com",
  "password": "mot_de_passe_securise"
}
```

Réponse (200 OK) : Les tokens sont envoyés via `Set-Cookie`. Le corps:

```json
{
  "user": {
    "pk": 1,
    "username": "user_email",
    "email": "user@example.com",
    "first_name": "Jean",
    "last_name": "Dupont"
  }
}
```

### B. Clients Mobiles & API
- Endpoint de connexion : `POST /api/v1/auth/mobile/login/`
- Mécanisme : Les jetons JWT sont renvoyés directement dans le corps de la réponse JSON. Le client doit stocker le jeton d'accès et l'envoyer dans l'en-tête `Authorization: Bearer <access_token>`.
- Cookies : Les cookies de réponse sont effacés pour éviter de polluer l'application mobile.

Réponse (200 OK) :

```json
{
  "access": "eyJhbGciOiJIUzI1NiIsIn...",
  "refresh": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": { /* données utilisateur */ }
}
```

---

## 2. Profil & Gestion Utilisateur (`/api/v1/auth/`)

Ces endpoints gèrent la connexion, l'inscription et la gestion du profil utilisateur.

### POST /api/v1/auth/web/login/
Connexion pour les applications Web.
- Headers : `Content-Type: application/json`
- Body: `{ "email": "user@example.com" | "telephone": "2376XXXXXXXX", "password": "mot_de_passe" }`
- Réponse (200) : tokens via `Set-Cookie` et objet `user`.

### POST /api/v1/auth/mobile/login/
Connexion pour mobile / API.
- Headers : `Content-Type: application/json`
- Body: identique à web/login
- Réponse (200) : JSON contenant `access`, `refresh`, et `user`.

### POST /api/v1/auth/login/
- Statut : Obsolète / Désactivé (renvoie 400 Bad Request).
- Description : Utiliser `/web/login/` ou `/mobile/login/`.

### POST /api/v1/auth/logout/
- Auth requis : Oui
- Déconnexion de l'utilisateur.
- Réponse (200 OK) : `{ "detail": "Successfully logged out." }`

### POST /api/v1/auth/registration/
- Inscription d'un nouvel utilisateur.
- Headers : `Content-Type: application/json`
- Body exemple :

```json
{
  "email": "nouveau@example.com",
  "password": "mot_de_passe_robuste",
  "password_confirm": "mot_de_passe_robuste",
  "first_name": "Alice",
  "last_name": "Merveille",
  "telephone": "237612345678"
}
```
{
  "username": "string5",
  "email": "user@example.com",
  "password1": Ghost1234",
  "password2": Ghost1234"
}

- Réponse (201 Created) : renvoie un accès ou message d'email de confirmation.

### GET /api/v1/auth/me/
- Auth requis : Oui
- Retourne profil complet (exemple):

```json
{
  "id": 1,
  "email": "jean.dupont@example.com",
  "telephone": "237699887766",
  "first_name": "Jean",
  "last_name": "Dupont",
  "role": "client",
  "client": { "id": 1, "date_naissance": "1990-05-15", "genre": "homme", "points_fidelite": 150, "date_creation": "2026-01-10T12:00:00Z" },
  "favoris": [ /* ... */ ],
  "parfums_personnalises": [],
  "commandes": []
}
```

### PUT / PATCH /api/v1/auth/me/
- Auth requis : Oui
- Modification du profil. Si téléphone modifié, fournir `current_password`.
- Exemple body:

```json
{ "first_name": "Jean-Pierre", "last_name": "Dupont", "telephone": "237655443322", "current_password": "votre_mot_de_passe_actuel" }
```

### POST /api/v1/auth/me/change-email/
- Auth requis : Oui
- Body:

```json
{
  "old_password": "votre_ancien_mdp",
  "new_password": "nouveau_mdp",
  "new_password_confirm": "nouveau_mdp_confirmation"
}
```
- Réponse (200) : confirmation d'envoi d'email.

---

## 3. Boutique & Catalogue (`/api/v1/shop/`)

Endpoints publics pour les parfums, accessoires, flacons et favoris (favoris requièrent auth).

### GET /api/v1/shop/parfums/
- Liste paginée des parfums actifs.
- Query params (optionnels) : `search`, `prix_min`, `prix_max`, `famille_olfactive`, `genre`, `est_nouveau`, `est_bestseller`, `ordering`.
- Réponse (200) : structure paginée:

```json
{
  "count": 25,
  "next": "http://.../?page=2",
  "previous": null,
  "results": [ { "id": 1, "nom": "Royal Oud", "slug": "royal-oud", "prix_unitaire": "35000.00", "image_principale": "http://.../royal-oud.jpg", "stock_quantite": 42, "is_favori": false } ]
}
```

### GET /api/v1/shop/parfums/{slug}/
- Détails complets d'un parfum par `slug`.

### POST /api/v1/shop/parfums/{slug}/favori/
- Auth requis : Oui
- Ajoute / retire des favoris. Réponse (200): `{ "status": "ajouté" | "retiré", "is_favori": true|false }`

### GET /api/v1/shop/accessoires/
- Liste paginée des accessoires. Query options: `type_accessoire`, `couleur`, `matiere`, `taille`, `prix_min`, `prix_max`, `en_stock`.

### GET /api/v1/shop/accessoires/{slug}/
- Détails accessoire par `slug`.

### POST /api/v1/shop/accessoires/{slug}/favori/
- Auth requis : Oui. Toggle favoris.

### GET /api/v1/shop/flacons/
- Liste paginée des flacons disponibles pour créations DIY.

### GET /api/v1/shop/favoris/
- Auth requis : Oui. Retourne les favoris de l'utilisateur.

---

## 4. Laboratoire DIY & Intelligence Artificielle (`/api/v1/lab/`)

Module pour essences, ingrédients, créations perso et recommandations IA.

### GET /api/v1/lab/essences/
- Liste des essences. Query: `famille_olfactive`, `genre`, `intensite`, `saison`, `prix_min`, `prix_max`.

### GET /api/v1/lab/ingredients/
- Liste des ingrédients de base.

### GET /api/v1/lab/parfums-perso/
- Auth requis : Oui. Liste créations perso de l'utilisateur.

### POST /api/v1/lab/parfums-perso/
- Auth requis : Oui. Crée un parfum personnalisé.
- Contraintes : Le volume total des essences ne doit pas dépasser 45% de la contenance du flacon.
- Body exemple:

```json
{
  "nom": "Ma douce nuit",
  "description": "Création fruitée et douce",
  "flacon": 2,
  "lignes": [ { "essence_catalogue": 1, "quantite_ml": 10.0 }, { "essence_personnalisee": null, "quantite_ml": 5.0 } ]
}
```
- Réponse (201) : parfum créé avec calcul du prix total.

### POST /api/v1/lab/parfums-perso/{id}/recalculer/
- Recalcule les prix si tarifs modifiés.

### POST /api/v1/lab/essences-perso/
- Créer une essence personnalisée à partir d'ingrédients bruts.
- Body exemple:

```json
{
  "nom": "Mon Essence de Rose Noire",
  "lignes": [ { "ingredient": 3, "quantite_ml": 8.5 } ]
}
```

### POST /api/v1/lab/ia-recommandation/
- Envoie un prompt textuel pour obtenir recommandations par IA (Gemini).
- Body exemple:

```json
{ "prompt": "Je cherche un parfum frais, avec des notes de citron et de menthe pour porter en été après le sport." }
```

- Réponse (200) : contiendra `message`, `quantite_demandee_ml`, `flacon`, `parfums_existants`, `essences_pre_faites`, `ingredients_sur_mesure`, `accessoires`.

---

## 5. Espace Prestataire & Workflows Monetbil

Gestion des prestataires, tableau de bord et payouts via Monetbil (Mobile Money).

### POST /api/v1/auth/prestataire/apply/
- Auth requis : Oui
- Permet à un client de postuler comme prestataire. Réponse (201) : demande créée (`en_attente`).

### GET /api/v1/auth/prestataire/dashboard/
- Auth requis : rôle prestataire. Renvoie statistiques, solde, code promo, etc.

### GET /api/v1/auth/prestataire/historique/
- Historique gains/débits. Query optionnelle: `type_operation`.

### GET /api/v1/auth/prestataire/payouts/
- Liste demandes de virement.

### POST /api/v1/auth/payout/webhook/ (Public)
- Webhook Monetbil pour statut des payouts.
- Body exemple:

```json
{ "processing_number": "payout_xxxxxxxxxxxx", "status": "success" | "failed" | "cancelled", "message": "Transaction réussie" }
```
- Réponse (200) : acquittement du webhook.

---

## 6. Espace Livreur

### GET /api/v1/auth/livreur/dashboard/
- Dashboard du livreur connecté. Exemple de réponse:

```json
{ "id": 1, "statut": "disponible", "nombre_livraisons": 142, "livraisons_actives": [] }
```

### GET /api/v1/auth/livreur/livraisons/
- Liste des livraisons attribuées au livreur. Query: `statut_livraison`.

### POST /api/v1/auth/livreur/livraisons/{id}/statut/
- Met à jour le statut d'une livraison (`action`: `livrer` | `echouer`).
- Exemple body pour échec:

```json
{ "action": "echouer", "motif": "Destinataire injoignable par téléphone après 3 tentatives" }
```

---

## 7. Administration de l'API (Réservé aux Admin)

Routes protégées pour les administrateurs (`is_staff=True`).

### GET /api/v1/auth/admin/users/
- Liste paginée recherchable. Query: `search`.

### PATCH /api/v1/auth/admin/users/{id}/toggle-status/
- Bloque ou débloque un utilisateur (`is_active`).

### GET /api/v1/auth/admin/prestataires/
- Liste prestataires. Query: `statut`.

### PATCH /api/v1/auth/admin/prestataires/validate/{id}/
- Valide postulation et assigne taux commission + code promo.
- Body exemple:

```json
{ "taux_commission": 12.5, "reduction_client_pourcentage": 5.0 }
```

### PATCH /api/v1/auth/admin/prestataires/{id}/update/
- Modifie caractéristiques prestataire.

### POST /api/v1/auth/admin/prestataires/{id}/payout/
- Déclenche virement Monetbil. Body:

```json
{ "montant": 25000.00 }
```
- Réponse (201) : objet payout créé.

### GET /api/v1/auth/admin/livreurs/
- Liste livreurs.

### POST /api/v1/auth/admin/livreurs/promote/
- Promeut un client au rang livreur. Body: `{ "user_id": 42 }`.

### POST /api/v1/auth/admin/commandes/{id}/affecter-livreur/
- Assigne une commande à un livreur. Body: `{ "livreur_id": 2 }`.

---

## 8. Notifications & Demandes Prestataires (`/api/v1/utilisateur/`)

### GET /api/v1/utilisateur/notifications/
- Auth requis : Administrateur.
- Retourne notifications globales ou destinées à l'admin connecté.

### GET /api/v1/utilisateur/prestataire-requests/
- Auth requis : Administrateur.
- Liste demandes d'adhésion en attente.

---

## 9. Commandes & Panier (`/api/v1/orders/` - Désactivés)

⚠️ Note technique : Les endpoints liés aux paniers et aux commandes sont définis dans `api/v1/urls/order_urls.py` mais sont actuellement commentés / désactivés dans le code. Les routes correspondantes ne répondront pas tant que le module de commande n'aura pas été réactivé.

---

## Bonnes pratiques & Sécurité

- Toujours utiliser HTTPS en production.
- Pour les clients web, s'assurer que les cookies `HttpOnly` et `Secure` sont activés et que CSRF est validé.
- Pour les clients mobiles/API, stocker les tokens JWT de façon sécurisée et implémenter une rotation/refresh des tokens.
- Limiter les quotas et appliquer des protections contre le bruteforce sur les endpoints d'authentification.

---

Si vous souhaitez que je génère une version Markdown plus technique (avec schémas de réponse JSON détaillés, exemples curl, et Postman collection), dites-moi quel format vous préférez et je l'ajoute.