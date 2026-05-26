# Documentation de l'API - Boutique de Parfums & Laboratoire DIY

Cette documentation décrit en détail tous les points d'entrée (endpoints) de l'API Django actuelle. Elle explique comment les utiliser, les méthodes HTTP, les en-têtes requis, les données attendues (payload) et les données renvoyées (réponse).

---

## Sommaire
1. [Authentification & Sécurité](#1-authentification--sécurite)
2. [Profil & Gestion Utilisateur (`/api/v1/auth/`)](#2-profil--gestion-utilisateur-apiv1auth)
3. [Boutique & Catalogue (`/api/v1/shop/`)](#3-boutique--catalogue-apiv1shop)
4. [Laboratoire DIY & Intelligence Artificielle (`/api/v1/lab/`)](#4-laboratoire-diy--intelligence-artificielle-apiv1lab)
5. [Espace Prestataire & Workflows Monetbil](#5-espace-prestataire--workflows-monetbil)
6. [Espace Livreur](#6-espace-livreur)
7. [Administration de l'API (Réservé aux Admin)](#7-administration-de-lapi-reserve-aux-admin)
8. [Notifications & Demandes Prestataires (`/api/v1/utilisateur/`)](#8-notifications--demandes-prestataires-apiv1utilisateur)
9. [Commandes & Panier (`/api/v1/orders/` - Désactivés)](#9-commandes--panier-apiv1orders---desactives)

---

## 1. Authentification & Sécurité

L'API utilise une stratégie de connexion hybride selon le type de client (Web vs Mobile/API direct).

### A. Clients Web (Navigateur)
* **Endpoint de connexion** : `/api/v1/auth/web/login/`
* **Mécanisme** : Les jetons JWT (`access` et `refresh`) sont stockés dans des **cookies HttpOnly** sécurisés gérés par le serveur. Le corps JSON de la réponse ne contient aucun jeton pour empêcher les attaques XSS.
* **Sécurité additionnelle** : Validation CSRF requise.

### B. Clients Mobiles & API
* **Endpoint de connexion** : `/api/v1/auth/mobile/login/`
* **Mécanisme** : Les jetons JWT sont renvoyés directement dans le **corps de la réponse JSON**. Le client doit stocker le jeton d'accès et l'envoyer dans l'en-tête de chaque requête authentifiée :
  ```http
  Authorization: Bearer <votre_jeton_access>
  ```
* **Cookies** : Les cookies de réponse sont effacés pour éviter de polluer l'application mobile.

---

## 2. Profil & Gestion Utilisateur (`/api/v1/auth/`)

Ces endpoints gèrent la connexion, l'inscription et la gestion du profil utilisateur.

### `POST /api/v1/auth/web/login/`
Connexion pour les applications Web.
* **Headers** : `Content-Type: application/json`
* **Corps (Request Body)** :
  ```json
  {
    "email": "user@example.com", // ou "telephone": "2376XXXXXXXX"
    "password": "mot_de_passe_securise"
  }
  ```
* **Réponse (200 OK)** :
  *(Les tokens access/refresh sont envoyés via l'en-tête `Set-Cookie`)*
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

### `POST /api/v1/auth/mobile/login/`
Connexion pour les applications mobiles ou les outils comme Insomnia/Postman.
* **Headers** : `Content-Type: application/json`
* **Corps (Request Body)** : Identique à `web/login/` (email/téléphone + mot de passe).
* **Réponse (200 OK)** :
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsIn...",
    "refresh": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "pk": 1,
      "username": "user_email",
      "email": "user@example.com",
      "first_name": "Jean",
      "last_name": "Dupont"
    }
  }
  ```

### `POST /api/v1/auth/login/`
* **Statut** : Obsolète / Désactivé (400 Bad Request).
* **Description** : Renvoie une erreur expliquant qu'il faut utiliser soit `/web/login/` soit `/mobile/login/`.

### `POST /api/v1/auth/logout/`
Déconnexion de l'utilisateur.
* **Auth requis** : Oui.
* **Réponse (200 OK)** :
  ```json
  {
    "detail": "Successfully logged out."
  }
  ```

### `POST /api/v1/auth/registration/`
Inscription d'un nouvel utilisateur.
* **Headers** : `Content-Type: application/json`
* **Corps (Request Body)** :
  ```json
  {
    "email": "nouveau@example.com",
    "password": "mot_de_passe_robuste",
    "password_confirm": "mot_de_passe_robuste",
    "first_name": "Alice",
    "last_name": "Merveille",
    "telephone": "237612345678" // Optionnel mais recommandé
  }
  ```
* **Réponse (201 Created)** : Renvoie le token d'accès ou un message indiquant qu'un email de confirmation a été envoyé.

### `GET /api/v1/auth/me/`
Récupère le profil complet de l'utilisateur connecté avec ses favoris, ses paniers et ses commandes.
* **Auth requis** : Oui.
* **Réponse (200 OK)** :
  ```json
  {
    "id": 1,
    "email": "jean.dupont@example.com",
    "telephone": "237699887766",
    "first_name": "Jean",
    "last_name": "Dupont",
    "role": "client", // 'client', 'prestataire', 'livreur', 'admin'
    "client": {
      "id": 1,
      "date_naissance": "1990-05-15",
      "genre": "homme",
      "points_fidelite": 150,
      "date_creation": "2026-01-10T12:00:00Z"
    },
    "favoris": [
      {
        "id": 3,
        "type_produit": "parfum",
        "produit_id": 5,
        "nom_produit": "Royal Oud",
        "prix_produit": "35000.00",
        "image_produit": "http://localhost:8000/media/parfums/royal-oud.jpg",
        "date_ajout": "2026-05-20T14:32:00Z"
      }
    ],
    "parfums_personnalises": [],
    "commandes": []
  }
  ```

### `PUT / PATCH /api/v1/auth/me/`
Modifie les informations de profil de l'utilisateur.
* **Auth requis** : Oui.
* **Note** : Si le numéro de téléphone est modifié, l'ancien mot de passe (`current_password`) est requis pour des raisons de sécurité. L'adresse email ne peut pas être modifiée ici (voir endpoint dédié ci-dessous).
* **Corps (Request Body)** :
  ```json
  {
    "first_name": "Jean-Pierre",
    "last_name": "Dupont",
    "telephone": "237655443322", // Si modifié :
    "current_password": "votre_mot_de_passe_actuel"
  }
  ```
* **Réponse (200 OK)** : Profil mis à jour.

### `POST /api/v1/auth/me/change-email/`
Initie une procédure de changement d'adresse email.
* **Auth requis** : Oui.
* **Corps (Request Body)** :
  ```json
  {
    "email": "nouveau.email@example.com",
    "current_password": "votre_mot_de_passe_actuel"
  }
  ```
* **Réponse (200 OK)** :
  ```json
  {
    "detail": "Un email de confirmation a été envoyé à la nouvelle adresse.",
    "email": "nouveau.email@example.com"
  }
  ```

---

## 3. Boutique & Catalogue (`/api/v1/shop/`)

Ces endpoints gèrent les catalogues publics de la boutique (Parfums, Accessoires, Flacons et Favoris). Ils sont accessibles à tous (lecture seule publique), sauf les favoris.

### `GET /api/v1/shop/parfums/`
Retourne la liste paginée de tous les parfums actifs.
* **Paramètres Query optionnels** :
  * `search` : Recherche dans le nom ou la description.
  * `prix_min` / `prix_max` : Filtrer par prix.
  * `famille_olfactive` : ex: `Boisé`, `Frais`...
  * `genre` : `femme`, `homme` ou `mixte`.
  * `est_nouveau` : `true`/`false`.
  * `est_bestseller` : `true`/`false`.
  * `ordering` : Tri ex: `prix_unitaire`, `-date_creation`, `nom`.
* **Réponse (200 OK)** :
  ```json
  {
    "count": 25,
    "next": "http://localhost:8000/api/v1/shop/parfums/?page=2",
    "previous": null,
    "results": [
      {
        "id": 1,
        "nom": "Royal Oud",
        "slug": "royal-oud",
        "reference_sku": "PARF-OUD-01",
        "description_courte": "Un parfum boisé d'exception.",
        "prix_unitaire": "35000.00",
        "prix_actuel": "35000.00",
        "en_promotion": false,
        "genre_cible": "mixte",
        "intensite": "forte",
        "image_principale": "http://localhost:8000/media/parfums/royal-oud.jpg",
        "stock_quantite": 42,
        "is_favori": false // true si l'utilisateur connecté l'a mis en favoris
      }
    ]
  }
  ```

### `GET /api/v1/shop/parfums/{slug}/`
Récupère les détails complets d'un parfum à partir de son slug.
* **Réponse (200 OK)** : Contient toutes les caractéristiques du parfum, les notes olfactives (tête, cœur, fond), les tags associés, ainsi que la liste des `produits_similaires`.

### `POST /api/v1/shop/parfums/{slug}/favori/`
Ajoute ou retire le parfum des favoris de l'utilisateur connecté.
* **Auth requis** : Oui.
* **Réponse (200 OK)** :
  ```json
  {
    "status": "ajouté", // ou "retiré"
    "is_favori": true // ou false
  }
  ```

### `GET /api/v1/shop/accessoires/`
Retourne la liste paginée de tous les accessoires (sacs, pochettes, diffuseurs, etc.).
* **Paramètres Query optionnels** : `type_accessoire` (ID), `couleur`, `matiere`, `taille`, `prix_min`, `prix_max`, `en_stock` (true/false).
* **Réponse (200 OK)** : Liste paginée des accessoires.

### `GET /api/v1/shop/accessoires/{slug}/`
Récupère les détails complets d'un accessoire via son slug.

### `POST /api/v1/shop/accessoires/{slug}/favori/`
Ajoute ou retire l'accessoire des favoris de l'utilisateur connecté.

### `GET /api/v1/shop/flacons/`
Retourne la liste paginée des flacons actifs pour les créations de parfums DIY.
* **Réponse (200 OK)** : Liste des flacons avec leur contenance (ml), hauteur, matière, prix et si le stock est suffisant (`stock_suffisant` : `true`/`false`).

### `GET /api/v1/shop/favoris/`
Liste tous les favoris de l'utilisateur connecté.
* **Auth requis** : Oui.

---

## 4. Laboratoire DIY & Intelligence Artificielle (`/api/v1/lab/`)

Ce module gère les essences, les ingrédients, les créations personnalisées et les recommandations par IA.

### `GET /api/v1/lab/essences/`
Liste toutes les essences disponibles au laboratoire.
* **Paramètres Query** : `famille_olfactive`, `genre`, `intensite`, `saison`, `prix_min`, `prix_max`.

### `GET /api/v1/lab/ingredients/`
Liste tous les ingrédients de base (matières premières pures) du laboratoire.

### `GET /api/v1/lab/parfums-perso/`
Liste toutes les créations de parfums personnalisés de l'utilisateur connecté.
* **Auth requis** : Oui.

### `POST /api/v1/lab/parfums-perso/`
Crée un parfum personnalisé avec sa formule (lignes d'essences).
* **Auth requis** : Oui.
* **Contrainte importante** : Le volume total des essences ajoutées ne doit pas dépasser **45% de la contenance du flacon** sélectionné (les 55% restants étant de l'alcool et des solvants de base).
* **Corps (Request Body)** :
  ```json
  {
    "nom": "Ma douce nuit",
    "description": "Création fruitée et douce",
    "flacon": 2, // ID du flacon
    "lignes": [
      {
        "essence_catalogue": 1, // ID de l'essence catalogue
        "quantite_ml": 10.0
      },
      {
        "essence_personnalisee": null, // ou ID d'une essence perso
        "quantite_ml": 5.0
      }
    ]
  }
  ```
* **Réponse (201 Created)** : Renvoie le parfum créé avec le prix total calculé dynamiquement.

### `POST /api/v1/lab/parfums-perso/{id}/recalculer/`
Recalcule manuellement les prix du parfum personnalisé en cas de changement de tarif des essences ou flacons.

### `POST /api/v1/lab/essences-perso/`
Permet au client de formuler sa propre essence personnalisée à partir d'ingrédients bruts.
* **Auth requis** : Oui.
* **Corps (Request Body)** :
  ```json
  {
    "nom": "Mon Essence de Rose Noire",
    "lignes": [
      {
        "ingredient": 3, // ID de l'ingrédient de base
        "quantite_ml": 8.5
      }
    ]
  }
  ```

### `POST /api/v1/lab/ia-recommandation/`
Envoie un prompt textuel décrivant un besoin olfactif ou une humeur et obtient des propositions de parfums existants, de formules sur mesure d'essences, d'ingrédients et de flacons via l'IA Gemini.
* **Corps (Request Body)** :
  ```json
  {
    "prompt": "Je cherche un parfum frais, avec des notes de citron et de menthe pour porter en été après le sport."
  }
  ```
* **Réponse (200 OK)** :
  ```json
  {
    "message": "Voici une recommandation basée sur votre demande : Un sillage ultra-frais et énergisant...",
    "quantite_demandee_ml": 50,
    "flacon": {
      "id": 1,
      "nom": "Flacon Standard 50ml",
      "prix_unitaire": "2500.00"
    },
    "parfums_existants": [], // Liste des parfums du catalogue correspondants
    "essences_pre_faites": [
      {
        "id": 4,
        "nom": "Essence de Citron Vert",
        "code_reference": "ESS-CIT-04",
        "prix_par_ml": "150.00",
        "quantite_ml": 15.0,
        "prix_total_quantite": "2250.00"
      }
    ],
    "ingredients_sur_mesure": [
      {
        "id": 12,
        "nom": "Extrait de Menthe Poivrée",
        "note_olfactive": "Cœur",
        "prix_par_ml": "300.00",
        "quantite_ml": 5.0,
        "prix_total_quantite": "1500.00"
      }
    ],
    "accessoires": []
  }
  ```

---

## 5. Espace Prestataire & Workflows Monetbil

Ces endpoints gèrent la postulation, le tableau de bord et les transactions financières (payouts Mobile Money Monetbil) des partenaires.

### `POST /api/v1/auth/prestataire/apply/`
Permet à un client de postuler pour devenir partenaire/prestataire.
* **Auth requis** : Oui.
* **Réponse (201 Created)** : Création de la demande en statut `en_attente`.

### `GET /api/v1/auth/prestataire/dashboard/`
Récupère les statistiques, gains et code promo du prestataire connecté.
* **Auth requis** : Oui (Rôle Prestataire Actif).
* **Réponse (200 OK)** :
  ```json
  {
    "id": 2,
    "solde_commission": "75000.00", // En FCFA
    "taux_commission": "15.0", // Pourcentage de gains par vente
    "reduction_client_pourcentage": "5.0", // Réduction offerte à ses clients via son code promo
    "code_promo": "ACC-X8Y2Z1A9",
    "statut": "actif",
    "total_gains": "120000.00",
    "total_retraits": "45000.00",
    "solde_bloque": "0.00",
    "payouts_recents": [],
    "historique_recent": []
  }
  ```

### `GET /api/v1/auth/prestataire/historique/`
Historique complet des gains et débits (commissions reçues ou retraits effectués).
* **Paramètre Query optionnel** : `type_operation` (ex: `commission`, `retrait`).

### `GET /api/v1/auth/prestataire/payouts/`
Liste des demandes de virement de commissions.

### `POST /api/v1/auth/payout/webhook/` (Public)
Webhook de réception des confirmations de Monetbil pour les transferts d'argent Mobile Money.
* **Description** : Monetbil appelle cet URL pour informer si un virement a réussi (`status=success`) ou échoué (`status=failed`). En cas d'échec, le solde du prestataire est automatiquement recrédité en base de données.
* **Corps (Request Body ou Paramètres GET)** :
  ```json
  {
    "processing_number": "payout_xxxxxxxxxxxx",
    "status": "success", // ou "failed", "cancelled"
    "message": "Transaction réussie"
  }
  ```
* **Réponse (200 OK)** : Webhook acquitté.

---

## 6. Espace Livreur

Gestion des livraisons pour les utilisateurs ayant le rôle de livreur.

### `GET /api/v1/auth/livreur/dashboard/`
Dashboard du livreur connecté.
* **Réponse (200 OK)** :
  ```json
  {
    "id": 1,
    "statut": "disponible", // 'disponible', 'en_livraison', 'inactif'
    "nombre_livraisons": 142,
    "livraisons_actives": [] // Liste des commandes avec statut_livraison = 'assignée'
  }
  ```

### `GET /api/v1/auth/livreur/livraisons/`
Liste des livraisons attribuées au livreur.
* **Paramètre Query optionnel** : `statut_livraison` (ex: `assignée`, `livrée`, `échouée`).

### `POST /api/v1/auth/livreur/livraisons/{id}/statut/`
Met à jour le statut d'une livraison attribuée.
* **Corps (Request Body)** :
  * Pour valider une livraison :
    ```json
    { "action": "livrer" }
    ```
  * Pour déclarer un échec de livraison :
    ```json
    {
      "action": "echouer",
      "motif": "Destinataire injoignable par téléphone après 3 tentatives"
    }
    ```
* **Réponse (200 OK)** : Statut mis à jour.

---

## 7. Administration de l'API (Réservé aux Admin)

Ces routes sont protégées et réservées exclusivement aux utilisateurs administrateurs (`is_staff = True`).

### `GET /api/v1/auth/admin/users/`
Liste paginée et recherchable de tous les comptes utilisateurs.
* **Paramètre Query** : `search` (recherche par nom, email, téléphone).

### `PATCH /api/v1/auth/admin/users/{id}/toggle-status/`
Bloque ou débloque un utilisateur (active/désactive `is_active`).

### `GET /api/v1/auth/admin/prestataires/`
Liste complète des prestataires du système.
* **Paramètre Query optionnel** : `statut` (ex: `en_attente`, `actif`, `suspendu`).

### `PATCH /api/v1/auth/admin/prestataires/validate/{id}/`
Valide la postulation d'un prestataire et lui assigne son taux de commission et un code promo.
* **Corps (Request Body)** :
  ```json
  {
    "taux_commission": 12.5, // 12.5% de commission
    "reduction_client_pourcentage": 5.0 // 5% de réduction pour le client final
  }
  ```
* **Réponse (200 OK)** : Génère un code promo et envoie un email de félicitations.

### `PATCH /api/v1/auth/admin/prestataires/{id}/update/`
Modifie les caractéristiques d'un prestataire (commission, statut, etc.).

### `POST /api/v1/auth/admin/prestataires/{id}/payout/`
Déclenche un virement réel d'argent via Monetbil Payout (Mobile Money) vers le numéro du prestataire.
* **Corps (Request Body)** :
  ```json
  {
    "montant": 25000.00 // Montant en FCFA à transférer
  }
  ```
* **Réponse (201 Created)** :
  ```json
  {
    "id": 12,
    "prestataire": 3,
    "montant": "25000.00",
    "telephone_destination": "237699887766",
    "reference_unique": "payout_abc123xyz",
    "statut": "en_cours"
  }
  ```

### `GET /api/v1/auth/admin/livreurs/`
Liste tous les livreurs enregistrés.

### `POST /api/v1/auth/admin/livreurs/promote/`
Promeut un client existant au rang de livreur.
* **Corps (Request Body)** :
  ```json
  { "user_id": 42 }
  ```

### `POST /api/v1/auth/admin/commandes/{id}/affecter-livreur/`
Assigne une commande à un livreur actif pour livraison.
* **Corps (Request Body)** :
  ```json
  { "livreur_id": 2 }
  ```

---

## 8. Notifications & Demandes Prestataires (`/api/v1/utilisateur/`)

Endpoints de communication et notifications système.

### `GET /api/v1/utilisateur/notifications/`
* **Auth requis** : Administrateur.
* **Description** : Renvoie les notifications globales ou destinées à l'administrateur connecté.

### `GET /api/v1/utilisateur/prestataire-requests/`
* **Auth requis** : Administrateur.
* **Description** : Liste les demandes d'adhésion en attente.

---

## 9. Commandes & Panier (`/api/v1/orders/` - Désactivés)

> ⚠️ **Note technique** : Les endpoints liés aux paniers, à la validation de commandes et aux listes de commandes clients sont configurés dans `api/v1/urls/order_urls.py` mais sont actuellement **commentés / désactivés** dans le code. Les routes correspondantes ne répondront pas tant que le module de commande n'aura pas été activé et ses vues finalisées.
