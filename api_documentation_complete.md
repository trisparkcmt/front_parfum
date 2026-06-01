# Documentation de l'API — Accessoire Exclusif

Cette documentation répertorie de manière exhaustive l'intégralité des endpoints de l'API de la plateforme **Accessoire Exclusif**, sans exception. Elle inclut les routes d'authentification standard (générées et personnalisées par `dj-rest-auth` / `allauth`), le catalogue boutique, le laboratoire de personnalisation (DIY/IA), le workflow complet des prestataires (partenaires) avec Monetbil Mobile Money, la gestion des livreurs, ainsi que les routes d'administration globale et les pages HTML gérées directement par le backend.

---

## 1. Principes Généraux de l'API

### URL de Base
- **Développement** : `http://localhost:8000/api/v1/`
- **Production** : `https://[domaine-production]/api/v1/`

### Authentification JWT
L'API utilise des jetons **JSON Web Tokens (JWT)**.
- Le header HTTP attendu est : `Authorization: Bearer <access_token>`.
- Deux flux de connexion sont proposés selon le client (Web ou Mobile/API), détaillés ci-dessous.

---

## 2. Authentification & Profils (`/api/v1/auth/`)

Ces endpoints gèrent l'authentification, l'inscription, la sécurité et les profils utilisateurs.

### 2.1 Connexion Web (Cookies sécurisés)
- **URL** : `/api/v1/auth/web/login/`
- **Méthode** : `POST`
- **Description** : Connexion optimisée pour les applications Web. Génère et stocke les jetons `access_token` et `refresh_token` dans des cookies HTTP sécurisés (`HttpOnly`, `SameSite=Lax`, `Secure`). Les jetons sont supprimés du corps de la réponse JSON pour prévenir les attaques XSS.
- **Données attendues (Request Body)** :
  ```json
  {
    "email": "user@example.com", // Requis si pas de téléphone
    "telephone": "6XXXXXXXX",    // Requis si pas d'email
    "password": "motdepassefort"  // Requis
  }
  ```
- **Réponses** :
  - **200 OK** (Succès) :
    ```json
    {
      "id": 1,
      "email": "user@example.com",
      "telephone": "6XXXXXXXX",
      "first_name": "Jean",
      "last_name": "Dupont",
      "role": "client"
    }
    ```
    *(Les cookies `access_token` et `refresh_token` sont inclus dans les en-têtes HTTP `Set-Cookie`)*
  - **400 Bad Request** (Identifiants invalides ou compte non activé) :
    ```json
    {
      "non_field_errors": ["Identifiants invalides."]
    }
    ```
    Si l'adresse email n'a pas encore été vérifiée :
    ```json
    {
      "non_field_errors": ["Votre adresse email n'est pas vérifiée. Un email de validation a été envoyé automatiquement."],
      "email_non_verifie": true,
      "email": "user@example.com"
    }
    ```

### 2.2 Connexion Mobile & API (JSON Direct)
- **URL** : `/api/v1/auth/mobile/login/`
- **Méthode** : `POST`
- **Description** : Connexion pour clients mobiles et API tierces. Renvoie les jetons d'accès et de rafraîchissement directement dans le corps JSON et supprime les cookies HTTP de la réponse.
- **Données attendues (Request Body)** :
  ```json
  {
    "email": "user@example.com",
    "password": "motdepassefort"
  }
  ```
- **Réponses** :
  - **200 OK** (Succès) :
    ```json
    {
      "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "email": "user@example.com",
        "telephone": "6XXXXXXXX",
        "first_name": "Jean",
        "last_name": "Dupont",
        "role": "client"
      }
    }
    ```
  - **400 Bad Request** : *(Identique au flux Web)*

### 2.3 Endpoint Obsolète de Connexion Générique
- **URL** : `/api/v1/auth/login/`
- **Méthode** : `POST`
- **Description** : Endpoint générique de `dj-rest-auth` désactivé pour des raisons de sécurité.
- **Réponse** :
  - **400 Bad Request** :
    ```json
    {
      "detail": "L'endpoint '/api/v1/auth/login/' est obsolète pour des raisons de sécurité. Veuillez utiliser '/api/v1/auth/web/login/' pour les applications Web (sécurité HttpOnly) ou '/api/v1/auth/mobile/login/' pour les clients Mobile/API."
    }
    ```

### 2.4 Inscription (Création de compte)
- **URL** : `/api/v1/auth/registration/`
- **Méthode** : `POST`
- **Description** : Enregistre un nouvel utilisateur. Soumis à une limitation anti-abus (IP et e-mail).
- **Données attendues (Request Body)** :
  ```json
  {
    "email": "nouveau@example.com",     // Requis, unique
    "password": "motdepasse_tres_fort",  // Requis
    "password_confirm": "motdepasse_tres_fort", // Requis
    "first_name": "Marc",                // Optionnel
    "last_name": "Koko",                  // Optionnel
    "telephone": "237699999999"          // Optionnel
  }
  ```
- **Réponses** :
  - **201 Created** (Succès) :
    ```json
    {
      "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
  - **400 Bad Request** (Mots de passe non concordants, e-mail existant, ou mot de passe trop faible) :
    ```json
    {
      "password_confirm": ["Les mots de passe ne correspondent pas."],
      "email": ["Cet e-mail est déjà utilisé."]
    }
    ```

### 2.5 Vérification de l'adresse email (Via API)
- **URL** : `/api/v1/auth/registration/verify-email/`
- **Méthode** : `POST`
- **Description** : Valide l'adresse e-mail de l'utilisateur à l'aide de la clé reçue par courriel.
- **Données attendues (Request Body)** :
  ```json
  {
    "key": "1a2b3c4d5e6f..." // Clé d'activation reçue dans l'email
  }
  ```
- **Réponses** :
  - **200 OK** :
    ```json
    {
      "detail": "ok"
    }
    ```
  - **400 Bad Request** (Clé expirée ou invalide) : Renvoie le code statut HTTP `400`.

### 2.6 Renvoi de l'email de vérification
- **URL** : `/api/v1/auth/registration/resend-email/`
- **Méthode** : `POST`
- **Description** : Renvoie un lien de validation d'email si le précédent a expiré. Soumis à une limitation anti-abus (quotidienne et courte durée).
- **Données attendues (Request Body)** :
  ```json
  {
    "email": "nouveau@example.com"
  }
  ```
- **Réponses** :
  - **201 Created** :
    ```json
    {
      "detail": "ok"
    }
    ```
  - **400 Bad Request** :
    ```json
    {
      "email": ["Cette adresse email est déjà vérifiée ou introuvable."]
    }
    ```

### 2.7 Déconnexion
- **URL** : `/api/v1/auth/logout/`
- **Méthode** : `POST`
- **Description** : Déconnecte l'utilisateur actuel, invalide le token et supprime les cookies HTTP.
- **Autorisation** : `AllowAny` (public)
- **Réponses** :
  - **200 OK** :
    ```json
    {
      "detail": "Successfully logged out."
    }
    ```

### 2.8 Demande de réinitialisation de mot de passe (Mot de passe oublié)
- **URL** : `/api/v1/auth/password/reset/`
- **Méthode** : `POST`
- **Description** : Envoie un email contenant un lien sécurisé pour réinitialiser le mot de passe.
- **Données attendues (Request Body)** :
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Réponses** :
  - **200 OK** :
    ```json
    {
      "detail": "Password reset e-mail has been sent."
    }
    ```

### 2.9 Confirmation de la réinitialisation de mot de passe (Via API)
- **URL** : `/api/v1/auth/password/reset/confirm/`
- **Méthode** : `POST`
- **Description** : Enregistre le nouveau mot de passe de l'utilisateur à partir du lien d'email contenant le jeton (`token`) et l'identifiant (`uid`).
- **Données attendues (Request Body)** :
  ```json
  {
    "uid": "MTI", // ID utilisateur encodé en base64
    "token": "a1b2c3d4-e5f6...", // Jeton à usage unique
    "new_password": "NouveauMotDePasseFort123!",
    "new_password_confirm": "NouveauMotDePasseFort123!"
  }
  ```
- **Réponses** :
  - **200 OK** :
    ```json
    {
      "detail": "Password has been reset with the new password."
    }
    ```
  - **400 Bad Request** (Token expiré ou mots de passe non identiques).

### 2.10 Changement de mot de passe (Connecté)
- **URL** : `/api/v1/auth/password/change/`
- **Méthode** : `POST`
- **Description** : Permet à un utilisateur connecté de modifier son mot de passe actuel.
- **Autorisation** : `IsAuthenticated` (Requis)
- **Données attendues (Request Body)** :
  ```json
  {
    "old_password": "MotDePasseActuel123!",
    "new_password": "NouveauMotDePasseFort456!",
    "new_password_confirm": "NouveauMotDePasseFort456!"
  }
  ```
- **Réponses** :
  - **200 OK** :
    ```json
    {
      "detail": "New password has been saved."
    }
    ```
  - **400 Bad Request** (Mot de passe actuel incorrect ou nouveau mot de passe trop faible).

### 2.11 Rafraîchissement du Jeton d'Accès
- **URL** : `/api/v1/auth/token/refresh/`
- **Méthode** : `POST`
- **Description** : Fournit un nouveau jeton d'accès (`access_token`) à partir du jeton de rafraîchissement (`refresh_token`).
- **Données attendues (Request Body)** (Mobile uniquement, pour le Web les cookies sont utilisés automatiquement) :
  ```json
  {
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Réponses** :
  - **200 OK** :
    ```json
    {
      "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
  - **401 Unauthorized** (Token invalide ou expiré).

### 2.12 Vérification de la validité d'un jeton
- **URL** : `/api/v1/auth/token/verify/`
- **Méthode** : `POST`
- **Description** : Permet de s'assurer qu'un jeton d'accès ou de rafraîchissement est toujours valide.
- **Données attendues (Request Body)** :
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Réponses** :
  - **200 OK** :
    ```json
    {}
    ```
  - **401 Unauthorized** (Token invalide).

### 2.13 Authentification Google
- **URL** : `/api/v1/auth/google/`
- **Méthode** : `POST`
- **Description** : Permet de s'authentifier à l'aide d'un compte Google (OAuth2).
- **Données attendues (Request Body)** :
  ```json
  {
    "access_token": "ya29.a0AR...",
    "code": "4/0Ad..."
  }
  ```
- **Réponses** :
  - **200 OK** (Renvoie les jetons JWT).

### 2.14 Données de profil simplifiées (dj-rest-auth)
- **URL** : `/api/v1/auth/user/`
- **Méthodes** : `GET`, `PUT`, `PATCH`
- **Description** : Accès direct aux champs du modèle `User` (email, prénom, nom).
- **Autorisation** : `IsAuthenticated` (Requis)
- **Réponses** :
  - **200 OK** :
    ```json
    {
      "pk": 1,
      "username": "dupontj",
      "email": "user@example.com",
      "first_name": "Jean",
      "last_name": "Dupont"
    }
    ```

### 2.15 Profil Utilisateur Complet Exclusif (Recommandé)
- **URL** : `/api/v1/auth/me/`
- **Méthodes** : `GET`, `PUT`, `PATCH`
- **Description** : Renvoie les informations complètes sur l'utilisateur : détails de son compte, ses favoris actifs, ses parfums personnalisés créés, ses commandes passées et ses préférences olfactives déduites.
- **Autorisation** : `IsAuthenticated` (Requis)
- **Données attendues pour PUT/PATCH** :
  ```json
  {
    "first_name": "Jean-Pierre",
    "last_name": "Dupont",
    "telephone": "237677777777",      // Requiert current_password si modifié
    "current_password": "motdepasse"   // Requis uniquement si le téléphone change
  }
  ```
- **Réponse GET - 200 OK** :
  ```json
  {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "telephone": "237677777777",
      "first_name": "Jean-Pierre",
      "last_name": "Dupont",
      "role": "client"
    },
    "client": {
      "id": 1,
      "date_naissance": "1995-06-15",
      "genre": "homme",
      "points_fidelite": 150,
      "date_creation": "2026-05-01T12:00:00Z"
    },
    "preferences": {
      "familles_olfactives": ["Boisé", "Oriental"],
      "humeurs": ["Énergique"],
      "saisons": ["Automne", "Hiver"],
      "occasions": ["Soirée"],
      "signes_astrologiques": [],
      "moments_journee": [],
      "genres": ["homme"]
    },
    "favoris": [
      {
        "id": 5,
        "type_produit": "parfum",
        "produit_id": 12,
        "nom_produit": "Royal Oud",
        "prix_produit": "35000.00",
        "image_produit": "http://localhost:8000/media/parfums/royal-oud.jpg",
        "detail_url": "http://localhost:8000/api/v1/shop/parfums/royal-oud/",
        "date_ajout": "2026-05-25T14:30:00Z"
      }
    ],
    "parfums_personnalises": [
      {
        "id": 1,
        "nom": "Ma Création N°1",
        "description": "Un parfum d'exception",
        "flacon_id": 2,
        "flacon_nom": "Flacon Cristal 100ml",
        "prix_essences": "12500.00",
        "prix_flacon_snapshot": "5000.00",
        "prix_total": "17500.00",
        "statut": "validé",
        "lignes": [
          {
            "id": 1,
            "essence_type": "catalogue",
            "essence_id": 4,
            "essence_nom": "Essence de Patchouli",
            "quantite_ml": 15.00,
            "prix_par_ml_snapshot": "500.00",
            "prix_ligne": "7500.00"
          }
        ]
      }
    ],
    "commandes": []
  }
  ```

### 2.16 Demande de Changement d'Email (Flux allauth sécurisé)
- **URL** : `/api/v1/auth/me/change-email/`
- **Méthode** : `POST`
- **Description** : Demande le changement d'e-mail. Un e-mail de validation est envoyé à la nouvelle adresse pour confirmer la modification.
- **Autorisation** : `IsAuthenticated` (Requis)
- **Données attendues (Request Body)** :
  ```json
  {
    "email": "nouveau_mail@example.com",
    "current_password": "motdepasseactuel" // Requis
  }
  ```
- **Réponses** :
  - **200 OK** :
    ```json
    {
      "detail": "Un email de confirmation a été envoyé à la nouvelle adresse.",
      "email": "nouveau_mail@example.com"
    }
    ```
  - **400 Bad Request** (Email déjà associé ou mot de passe actuel invalide).

---

## 3. Boutique & Catalogue (`/api/v1/shop/`)

Ces endpoints gèrent le catalogue public de la boutique (Parfums, Accessoires, Flacons, Favoris, Catégories, Tags).

### 3.1 Parfums
#### 3.1.1 Liste des Parfums
- **URL** : `/api/v1/shop/parfums/`
- **Méthode** : `GET`
- **Description** : Renvoie la liste paginée (50 par page) de tous les parfums actifs.
- **Filtres de recherche (Query Parameters)** :
  - `page` : Numéro de la page (ex : `?page=2`)
  - `limit` : Nombre d'éléments par page (max 100)
  - `search` : Recherche textuelle dans le nom, description et notes olfactives (ex : `?search=rose`)
  - `contenance_ml` : Contenance exacte (ex : `?contenance_ml=50`)
  - `est_bestseller` : Bestsellers uniquement (`?est_bestseller=true`)
  - `est_nouveau` : Nouveautés uniquement (`?est_nouveau=true`)
  - `famille_olfactive` : Famille (ex : `?famille_olfactive=Boisé`)
  - `genre` : Genre cible (`femme`, `homme`, `mixte`)
  - `humeur` : Humeur (ex : `?humeur=Romantique`)
  - `intensite` : `légère`, `moyenne`, `forte`, `très forte`
  - `occasion` : Occasion (ex : `?occasion=Soirée`)
  - `prix_min` / `prix_max` : Fourchette de prix en FCFA
  - `saison` : Saison recommandée (ex : `?saison=Été`)
  - `tags` : IDs de tags séparés par des virgules (ex : `?tags=1,3`)
  - `ordering` : Tri des résultats (`prix_unitaire`, `-prix_unitaire`, `nom`, `-date_creation`)
- **Réponse - 200 OK** :
  ```json
  {
    "count": 12,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 12,
        "nom": "Royal Oud",
        "slug": "royal-oud",
        "prix_unitaire": "35000.00",
        "prix_actuel": "35000.00",
        "en_promotion": false,
        "genre_cible": "mixte",
        "intensite": "forte",
        "est_nouveau": false,
        "est_bestseller": true,
        "image_principale": "http://localhost:8000/media/parfums/royal-oud.jpg",
        "is_favori": false,
        "categorie": 1
      }
    ]
  }
  ```

#### 3.1.2 Créer un Parfum
- **URL** : `/api/v1/shop/parfums/`
- **Méthode** : `POST`
- **Description** : Crée un nouveau parfum dans le catalogue.
- **Autorisation** : `IsAdminUser` (Réservé à l'Admin)
- **Données attendues (Request Body)** :
  *(Identique aux champs retournés dans le détail d'un parfum)*

#### 3.1.3 Détail d'un Parfum
- **URL** : `/api/v1/shop/parfums/{slug}/`
- **Méthode** : `GET`
- **Description** : Renvoie les informations complètes d'un parfum via son slug (incluant ses notes olfactives, ses produits similaires et s'il est actuellement en favori).
- **Réponse - 200 OK** :
  ```json
  {
    "id": 12,
    "nom": "Royal Oud",
    "slug": "royal-oud",
    "reference_sku": "PRF-ROY-OUD",
    "description_courte": "Un voyage olfactif oriental à base d'Oud rare.",
    "contenance_ml": 100,
    "prix_unitaire": "40000.00",
    "prix_actuel": "35000.00",
    "taux_reduction": 12.5,
    "en_promotion": true,
    "genre_cible": "mixte",
    "intensite": "forte",
    "notes_tete": "Citron, Cardamome",
    "notes_coeur": "Jasmin, Oud",
    "notes_fond": "Santal, Ambre, Musc",
    "tags": [
      {"id": 1, "nom": "Oriental", "slug": "oriental", "type": "famille_olfactive"},
      {"id": 5, "nom": "Soirée", "slug": "soiree", "type": "occasion"}
    ],
    "famille_olfactive": ["Oriental"],
    "humeurs_compatibles": ["Mystérieux"],
    "occasions": ["Soirée"],
    "saisons_compatibles": ["Hiver", "Automne"],
    "est_nouveau": false,
    "est_bestseller": true,
    "image_principale": "http://localhost:8000/media/parfums/royal-oud.jpg",
    "images_supplementaires": [],
    "stock_quantite": 45,
    "date_creation": "2026-05-10T08:00:00Z",
    "is_favori": false,
    "categorie": 1,
    "produits_similaires": [
      {
        "id": 15,
        "nom": "Oud Impérial",
        "slug": "oud-imperial",
        "prix_actuel": "42000.00",
        "image_principale": "http://localhost:8000/media/parfums/oud-imperial.jpg"
      }
    ]
  }
  ```

#### 3.1.4 Modifier / Supprimer un Parfum
- **URL** : `/api/v1/shop/parfums/{slug}/`
- **Méthodes** : `PUT`, `PATCH`, `DELETE`
- **Autorisation** : `IsAdminUser`

#### 3.1.5 Ajouter / Enlever des Favoris
- **URL** : `/api/v1/shop/parfums/{slug}/favori/`
- **Méthode** : `POST`
- **Description** : Action de bascule (toggle). Si le parfum est déjà dans les favoris, il est retiré. Sinon, il est ajouté.
- **Autorisation** : `IsAuthenticated`
- **Réponse - 200 OK** :
  ```json
  {
    "detail": "Parfum ajouté aux favoris." // Ou "Parfum retiré des favoris."
  }
  ```

#### 3.1.6 Bestsellers & Hotsellers
- **URL** : `/api/v1/shop/parfums/bestsellers/` (GET) -> Top 20 historique.
- **URL** : `/api/v1/shop/parfums/hotsellers/` (GET) -> Top 10 du mois en cours.

---

### 3.2 Accessoires
#### 3.2.1 Liste des Accessoires
- **URL** : `/api/v1/shop/accessoires/`
- **Méthode** : `GET`
- **Filtres (Query Params)** : `couleur`, `en_stock`, `matiere`, `taille`, `type_accessoire`, `type_nom`, `prix_min`, `prix_max`, `search`, `ordering`.
- **Réponse - 200 OK** :
  ```json
  {
    "count": 8,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 1,
        "nom": "Pochette de Transport en Cuir",
        "slug": "pochette-transport-cuir",
        "type_accessoire": {
          "id": 2,
          "nom": "Pochette",
          "slug": "pochette",
          "description": "Protection et voyage",
          "icone": "http://localhost:8000/media/icones/pochette.png"
        },
        "prix_unitaire": "8500.00",
        "prix_actuel": "8500.00",
        "en_promotion": false,
        "image_principale": "http://localhost:8000/media/accessoires/pochette.jpg",
        "is_favori": false
      }
    ]
  }
  ```

#### 3.2.2 Actions Administrateur & Détail
- **Créer** : `POST` `/api/v1/shop/accessoires/` (Admin)
- **Détail** : `GET` `/api/v1/shop/accessoires/{slug}/` (Public)
- **Modifier / Supprimer** : `PUT`, `PATCH`, `DELETE` `/api/v1/shop/accessoires/{slug}/` (Admin)
- **Favori** : `POST` `/api/v1/shop/accessoires/{slug}/favori/` (Connecté)
- **Bestsellers / Hotsellers** : `GET` `/api/v1/shop/accessoires/bestsellers/` | `/hotsellers/`

---

### 3.3 Flacons (Pour le Laboratoire)
#### 3.3.1 Liste des Flacons
- **URL** : `/api/v1/shop/flacons/`
- **Méthode** : `GET`
- **Description** : Renvoie tous les flacons disponibles pour le DIY.
- **Filtres** : `contenance_ml`, `couleur`, `en_stock` (true pour stock > seuil d'alerte), `matiere`, `type_flacon`, `type_nom`, `stock_min`, `stock_max`, `search`, `ordering`.
- **Réponse - 200 OK** :
  ```json
  {
    "count": 4,
    "results": [
      {
        "id": 2,
        "nom": "Flacon Cristal 100ml",
        "slug": "flacon-cristal-100ml",
        "type_flacon": {
          "id": 1,
          "nom": "Spray",
          "slug": "spray"
        },
        "contenance_ml": 100,
        "matiere": "Verre",
        "couleur": "Transparent",
        "prix_unitaire": "5000.00",
        "stock_quantite": 150,
        "stock_suffisant": true,
        "image_principale": "http://localhost:8000/media/flacons/cristal-100.jpg"
      }
    ]
  }
  ```

#### 3.3.2 Actions
- **Créer** : `POST` `/api/v1/shop/flacons/` (Admin)
- **Détail** : `GET` `/api/v1/shop/flacons/{id}/`
- **Modifier / Supprimer** : `PUT`, `PATCH`, `DELETE` `/api/v1/shop/flacons/{id}/` (Admin)

---

### 3.4 Liste des Favoris Directe
- **URL** : `/api/v1/shop/favoris/`
- **Méthodes** : `GET`, `POST`
- **Autorisation** : `IsAuthenticated`
- **GET - 200 OK** :
  ```json
  [
    {
      "id": 5,
      "date_ajout": "2026-05-25T14:30:00Z",
      "nom_produit": "Royal Oud",
      "prix_produit": "35000.00",
      "image_produit": "http://localhost:8000/media/parfums/royal-oud.jpg",
      "type_produit": "parfum",
      "slug_produit": "royal-oud",
      "id_produit": 12
    }
  ]
  ```
- **POST** (Ajouter favori par ID de produit) :
  ```json
  {
    "parfum": 12,       // Ou "accessoire": ID
  }
  ```
- **Supprimer favori** : `DELETE` `/api/v1/shop/favoris/{id}/`

---

### 3.5 Gestion des Classifications, Métadonnées et Produits d'Essence

Ces endpoints gèrent la création, la lecture, la modification et la suppression de toutes les métadonnées et structures de classification nécessaires au catalogue.

#### 3.5.1 Les Tags (Mots-clés olfactifs et thématiques)
- **URLs** :
  - Liste & Création : `/api/v1/shop/tags/` (`GET`, `POST`)
  - Détail, Modification & Suppression : `/api/v1/shop/tags/{slug}/` (`GET`, `PUT`, `PATCH`, `DELETE`)
- **Permissions** : Lecture publique (`AllowAny`), écriture réservée à l'administrateur (`IsAdminOrReadOnly`).
- **Données attendues pour la Création / Modification (POST/PUT/PATCH)** :
  ```json
  {
    "nom": "Mystérieux",
    "slug": "mysterieux",              // Auto-généré si absent
    "type": "humeur"                   // Requis. Choix : 'famille_olfactive', 'humeur', 'saison', 'occasion', 'signe_astrologique', 'moment_journee'
  }
  ```
- **Réponse - 201 Created / 200 OK** :
  ```json
  {
    "id": 8,
    "nom": "Mystérieux",
    "slug": "mysterieux",
    "type": "humeur"
  }
  ```

#### 3.5.2 Catégories de Parfums (Collections / Gammes)
- **URLs** :
  - Liste & Création : `/api/v1/shop/categories-parfum/` (`GET`, `POST`)
  - Détail, Modification & Suppression : `/api/v1/shop/categories-parfum/{id}/` (`GET`, `PUT`, `PATCH`, `DELETE`)
- **Permissions** : Lecture publique (`AllowAny`), écriture réservée à l'administrateur (`IsAdminOrReadOnly`).
- **Données attendues pour la Création / Modification (POST/PUT/PATCH)** :
  ```json
  {
    "nom": "Collection Prestige",
    "slug": "collection-prestige",
    "description": "Formulations uniques à base d'huiles rares.",
    "image": null,                     // Fichier image uploadé ou null
    "ordre_affichage": 1,
    "actif": true,
    "taux_reduction": 15.00            // Applique automatiquement 15% de réduction à tous les parfums de cette catégorie
  }
  ```
- **Réponse - 201 Created** :
  ```json
  {
    "id": 3,
    "nom": "Collection Prestige",
    "slug": "collection-prestige",
    "description": "Formulations uniques à base d'huiles rares.",
    "image": null,
    "ordre_affichage": 1,
    "actif": true,
    "taux_reduction": "15.00",
    "date_creation": "2026-06-01T11:20:00Z"
  }
  ```

#### 3.5.3 Types d'Accessoires
- **URLs** :
  - Liste & Création : `/api/v1/shop/types-accessoire/` (`GET`, `POST`)
  - Détail, Modification & Suppression : `/api/v1/shop/types-accessoire/{id}/` (`GET`, `PUT`, `PATCH`, `DELETE`)
- **Permissions** : Lecture publique (`AllowAny`), écriture réservée à l'administrateur (`IsAdminOrReadOnly`).
- **Données attendues pour la Création / Modification (POST/PUT/PATCH)** :
  ```json
  {
    "nom": "Bougie Parfumée",
    "slug": "bougie-parfumee",
    "description": "Créateurs d'ambiance",
    "icone": null                      // Image uploadée pour l'illustration
  }
  ```

#### 3.5.4 Types de Flacons
- **URLs** :
  - Liste & Création : `/api/v1/shop/types-flacon/` (`GET`, `POST`)
  - Détail, Modification & Suppression : `/api/v1/shop/types-flacon/{id}/` (`GET`, `PUT`, `PATCH`, `DELETE`)
- **Permissions** : Lecture publique (`AllowAny`), écriture réservée à l'administrateur (`IsAdminOrReadOnly`).
- **Données attendues pour la Création / Modification (POST/PUT/PATCH)** :
  ```json
  {
    "nom": "Spray Vaporisateur",
    "slug": "spray-vaporisateur",
    "description": "Diffusion fine en brume",
    "image": null                      // Fichier image d'illustration
  }
  ```

#### 3.5.5 Produits Essences Finis (Essences prêtes vendues en flacons individuels)
- **URLs** :
  - Liste & Création : `/api/v1/shop/produits-essence/` (`GET`, `POST`)
  - Détail, Modification & Suppression : `/api/v1/shop/produits-essence/{id}/` (`GET`, `PUT`, `PATCH`, `DELETE`)
- **Permissions** : Lecture publique (`AllowAny`), écriture réservée à l'administrateur (`IsAdminOrReadOnly`).
- **Données attendues pour la Création / Modification (POST/PUT/PATCH)** :
  ```json
  {
    "essence": 4,                      // ID de l'essence brute sous-jacente
    "taille_ml": 30,                   // Contenance en ml (ex: 10, 30, 50, 100)
    "prix": "18000.00",                // Prix de vente
    "prix_promotionnel": "15000.00",   // Optionnel
    "stock_disponible": 75,
    "actif": true
  }
  ```
- **Réponse - 201 Created** :
  ```json
  {
    "id": 15,
    "essence": 4,
    "taille_ml": 30,
    "prix": "18000.00",
    "prix_promotionnel": "15000.00",
    "prix_actuel": "15000.00",
    "prix_par_ml": "500.00",
    "stock_disponible": 75,
    "stock_precedent": 0,
    "actif": true
  }
  ```

---

## 4. Laboratoire DIY & Assistant IA (`/api/v1/lab/`)

Ce module gère le laboratoire créatif et l'intelligence artificielle pour la formulation sur mesure.

### 4.1 Recommandation IA par Prompt Libre
- **URL** : `/api/v1/lab/ia-recommandation/`
- **Méthode** : `POST`
- **Description** : Analyse un prompt rédigé en langage naturel par l'utilisateur, interroge l'IA Gemini et formule des propositions de parfums existants, de mélanges d'essences brutes, d'ingrédients sur mesure, ou d'accessoires assortis.
- **Autorisation** : `AllowAny` (public)
- **Données attendues (Request Body)** :
  ```json
  {
    "prompt": "Je cherche un parfum boisé et épicé, très mystérieux pour une soirée d'hiver."
  }
  ```
- **Réponse - 200 OK** :
  ```json
  {
    "message": "D'après vos envies de mystère et d'épices, voici une proposition sur mesure...",
    "quantite_demandee_ml": 50,
    "flacon": {
      "id": 2,
      "nom": "Flacon Cristal 50ml",
      "prix_unitaire": "3500.00"
    },
    "parfums_existants": [
      {
        "id": 12,
        "nom": "Royal Oud",
        "prix_unitaire": "35000.00",
        "image_principale": "http://localhost:8000/media/parfums/royal-oud.jpg"
      }
    ],
    "essences_pre_faites": [
      {
        "id": 4,
        "lot_essence_id": 1,
        "nom": "Essence de Patchouli",
        "code_reference": "ESS-PAT",
        "prix_par_ml": "500.00",
        "quantite_ml": 10.5,
        "prix_total_quantite": "5250.00"
      }
    ],
    "ingredients_sur_mesure": [
      {
        "id": 8,
        "nom": "Huile essentielle de Cèdre Noir",
        "prix_par_ml": "600.00",
        "quantite_ml": 4.5,
        "prix_total_quantite": "2700.00"
      }
    ],
    "accessoires": []
  }
  ```

### 4.2 Essences Brutes (Matières Premières)
- **URL** : `/api/v1/lab/essences/`
- **Méthode** : `GET`
- **Description** : Retourne toutes les essences actives utilisables en laboratoire.
- **Filtres (Query Params)** : `famille_olfactive`, `genre`, `humeur`, `intensite`, `moment_journee`, `occasion`, `ordering`, `prix_min`, `prix_max`, `saison`, `search`, `signe_astrologique`, `stock_min`, `tags`.
- **Réponse - 200 OK** :
  ```json
  {
    "count": 14,
    "results": [
      {
        "id": 4,
        "nom": "Essence de Patchouli",
        "slug": "essence-patchouli",
        "code_reference": "ESS-PAT",
        "prix_par_ml": "500.00",
        "genre_cible": "mixte",
        "intensite": "forte",
        "actif": true
      }
    ]
  }
  ```
- **Créer / Modifier / Supprimer** : `/api/v1/lab/essences/` & `/{id}/` (Admin)

### 4.3 Ingrédients de Base
- **URL** : `/api/v1/lab/ingredients/` (GET, POST) & `/{id}/` (GET, PUT, PATCH, DELETE)
- **Description** : Ingrédients élémentaires pour la création d'essences sur mesure.

### 4.4 Essences Personnalisées (Sur Mesure par le Client)
- **URL** : `/api/v1/lab/essences-perso/`
- **Méthodes** : `GET`, `POST`
- **Description** : Permet au client de formuler ses propres essences en combinant des ingrédients bruts.
- **Autorisation** : `IsAuthenticated`
- **Données attendues pour la Création (POST)** :
  ```json
  {
    "nom": "Mon Essence Boisée Secrète",
    "lignes": [
      {
        "ingredient": 8, // ID Ingrédient (Cèdre)
        "quantite_ml": 10.0
      },
      {
        "ingredient": 11, // ID Ingrédient (Ambre brut)
        "quantite_ml": 5.0
      }
    ]
  }
  ```
- **Réponse - 201 Created** :
  ```json
  {
    "id": 3,
    "nom": "Mon Essence Boisée Secrète",
    "prix_par_ml_calcule": "620.00", // Calculé automatiquement
    "lignes": [
      {
        "id": 14,
        "ingredient": 8,
        "ingredient_detail": {
          "id": 8,
          "nom": "Cèdre Noir",
          "prix_par_ml": "600.00"
        },
        "quantite_ml": "10.00",
        "prix_ligne": "6000.00"
      }
    ],
    "date_creation": "2026-06-01T10:00:00Z"
  }
  ```
- **Détail / Modifier / Supprimer** : `GET`, `PUT`, `PATCH`, `DELETE` `/api/v1/lab/essences-perso/{id}/`

### 4.5 Parfums Personnalisés (DIY)
- **URL** : `/api/v1/lab/parfums-perso/`
- **Méthodes** : `GET`, `POST`
- **Description** : Gère les parfums personnalisés créés par le client connecté en assemblant des essences brutes ou personnalisées dans un flacon sélectionné.
- **Règle métier cruciale** : La quantité totale d'essences dans le parfum ne doit jamais dépasser **45%** de la contenance totale du flacon (le reste étant le solvant neutre).
- **Autorisation** : `IsAuthenticated`
- **Données attendues pour la Création (POST)** :
  ```json
  {
    "nom": "Mon Chef-d'Œuvre",
    "description": "Formule épicée d'hiver",
    "flacon": 2, // ID Flacon (ex: 100ml)
    "enregistre": true,
    "lignes": [
      {
        "essence": 1, // ID d'un LotEssence du catalogue (15ml)
        "quantite_ml": 15.0
      },
      {
        "essence_personnalisee": 3, // ID de sa propre essence sur mesure (10ml)
        "quantite_ml": 10.0
      }
    ]
  }
  ```
- **Réponse - 201 Created** :
  ```json
  {
    "id": 8,
    "nom": "Mon Chef-d'Œuvre",
    "flacon": 2,
    "flacon_detail": {
      "id": 2,
      "nom": "Flacon Cristal 100ml",
      "contenance_ml": 100,
      "prix_unitaire": "5000.00"
    },
    "description": "Formule épicée d'hiver",
    "prix_essences": "13500.00",
    "prix_flacon_snapshot": "5000.00",
    "prix_total": "18500.00",
    "statut": "brouillon",
    "enregistre": true,
    "lignes": [
      {
        "id": 22,
        "essence": 1,
        "essence_personnalisee": null,
        "essence_detail": {
          "nom": "Essence de Patchouli",
          "marque": "Exclusif",
          "prix_par_ml": "500.00"
        },
        "quantite_ml": "15.00",
        "prix_par_ml_snapshot": "500.00",
        "prix_ligne": "7500.00"
      }
    ],
    "date_creation": "2026-06-01T10:10:00Z"
  }
  ```
- **Détail / Modifier / Supprimer** : `GET`, `PUT`, `PATCH`, `DELETE` `/api/v1/lab/parfums-perso/{id}/`
- **Recalculer le prix** : `POST` `/api/v1/lab/parfums-perso/{id}/recalculer/`
  - *Description* : Permet de recalculer à la demande le prix d'une formule DIY selon les cours actuels des matières premières.

### 4.6 Autres vues labo / admin
- `/api/v1/lab/lots-essence/` (GET, POST, PUT, PATCH, DELETE) -> Lots d'essences en réserve (Admin/Laborantin).
- `/api/v1/lab/labo/essences/` (GET, POST, etc.) -> Suivi de l'inventaire en labo.

---

## 5. Workflow Prestataires / Partenariats

Ce workflow gère les prestataires externes (influenceurs, partenaires) qui font la promotion des produits avec un code promotionnel exclusif, gagnent des commissions sur les ventes, et effectuent des retraits via Mobile Money.

### 5.1 Postuler en tant que Prestataire
- **URL** : `/api/v1/auth/prestataire/apply/`
- **Méthode** : `POST`
- **Description** : Un utilisateur authentifié peut postuler au programme de partenariat. Crée un profil prestataire en statut `en_attente`.
- **Autorisation** : `IsAuthenticated`
- **Réponse - 201 Created** :
  ```json
  {
    "detail": "Demande envoyée avec succès."
  }
  ```

### 5.2 Valider une Demande Prestataire (Admin)
- **URL** : `/api/v1/auth/admin/prestataires/validate/{id}/`
- **Méthode** : `PATCH`
- **Description** : Permet à l'administrateur de valider un prestataire, de lui attribuer un taux de commission et un pourcentage de réduction client. Cette action génère automatiquement un code promotionnel exclusif unique (ex : `ACC-W83K9R1Z`) et envoie un e-mail HTML de félicitations au partenaire.
- **Autorisation** : `IsAdminUser`
- **Données attendues (Request Body)** :
  ```json
  {
    "taux_commission": 15.00,           // Pourcentage de commission sur les ventes
    "reduction_client_pourcentage": 5.00 // Réduction accordée aux clients utilisant son code
  }
  ```
- **Réponse - 200 OK** :
  ```json
  {
    "detail": "Prestataire validé avec succès.",
    "code_promo": "ACC-W83K9R1Z",
    "taux_commission": "15.00",
    "reduction_client_pourcentage": "5.00"
  }
  ```

### 5.3 Tableau de Bord Prestataire
- **URL** : `/api/v1/auth/prestataire/dashboard/`
- **Méthode** : `GET`
- **Description** : Résumé des gains, code promo, soldes actuels et retraits pour le prestataire connecté (ou pour l'admin via `?prestataire_id=ID`).
- **Autorisation** : `IsAuthenticated` (Doit être un prestataire actif)
- **Réponse - 200 OK** :
  ```json
  {
    "id": 3,
    "solde_commission": "245000.00",
    "taux_commission": "15.00",
    "reduction_client_pourcentage": "5.00",
    "code_promo": "ACC-W83K9R1Z",
    "statut": "actif",
    "total_gains": "320000.00",
    "total_retraits": "75000.00",
    "solde_bloque": "0.00",
    "payouts_recents": [
      {
        "id": 1,
        "montant": "75000.00",
        "telephone_destination": "237699999999",
        "reference_unique": "payout_847df83c92a",
        "statut": "succes",
        "date_creation": "2026-05-20T10:00:00Z"
      }
    ],
    "historique_recent": [
      {
        "id": 12,
        "type_operation": "credit",
        "montant": "12500.00",
        "reference_commande": "CMD-2026-9482",
        "date_operation": "2026-05-28T16:30:00Z",
        "description": "Commission sur la commande CMD-2026-9482"
      }
    ]
  }
  ```

### 5.4 Historique Financier Complet du Prestataire
- **URL** : `/api/v1/auth/prestataire/historique/`
- **Méthode** : `GET`
- **Description** : Journal complet des mouvements de commission (crédits par vente, débits par virement). Supporte le filtrage par type d'opération.
- **Filtres (Query Params)** : `type_operation` (`credit` | `retrait` | `debit_ajustement`), `page`, `page_size`.

### 5.5 Liste des Demandes de Payouts du Prestataire
- **URL** : `/api/v1/auth/prestataire/payouts/`
- **Méthode** : `GET`
- **Filtres (Query Params)** : `statut` (`en_cours` | `succes` | `echec`), `page`, `page_size`.

### 5.6 Demande de Virement Mobile Money par l'Admin (Payout)
- **URL** : `/api/v1/auth/admin/prestataires/{id}/payout/`
- **Méthode** : `POST`
- **Description** : L'administrateur valide et initie le versement des commissions cumulées vers le numéro de téléphone Mobile Money (MTN MoMo ou Orange Money Cameroun) du prestataire via l'API Monetbil. Le solde du prestataire est temporairement débité en base de données de manière atomique pour éviter les doubles retraits (race conditions). En cas d'erreur de communication ou de rejet instantané de Monetbil, le solde est recrédité.
- **Autorisation** : `IsAdminUser`
- **Données attendues (Request Body)** :
  ```json
  {
    "montant": 50000.00
  }
  ```
- **Réponse - 201 Created** :
  ```json
  {
    "id": 4,
    "prestataire": 3,
    "montant": "50000.00",
    "telephone_destination": "237699999999",
    "reference_unique": "payout_a9f87c6b54d3e2",
    "statut": "en_cours",
    "date_creation": "2026-06-01T10:45:00Z",
    "date_finalisation": null
  }
  ```

### 5.7 Webhook Monetbil Mobile Money (Public)
- **URL** : `/api/v1/auth/payout/webhook/`
- **Méthodes** : `POST`, `GET`
- **Description** : Appelé automatiquement par les serveurs de Monetbil en arrière-plan pour notifier le backend du succès ou de l'échec d'un virement.
- **Autorisation** : `AllowAny` (Sécurisé par jeton unique `reference_unique`/`processing_number` en BDD)
- **Données reçues (Payload Monetbil)** :
  ```json
  {
    "processing_number": "payout_a9f87c6b54d3e2",
    "status": "success", // ou "failed", "cancelled"
    "message": "Transfer successful"
  }
  ```
- **Réponse - 200 OK** :
  ```json
  {
    "detail": "Webhook traité avec succès"
  }
  ```

### 5.8 Administration des Prestataires
- **Lister les prestataires** : `GET` `/api/v1/auth/admin/prestataires/` (Filtre possible par statut : `?statut=actif` ou `?statut=en_attente`).
- **Mettre à jour un prestataire** : `PATCH` `/api/v1/auth/admin/prestataires/{id}/update/` -> Permet de modifier le taux de commission ou de suspendre le partenaire (`statut: suspendu`).
- **Suivi global des payouts** : `GET` `/api/v1/auth/admin/payouts/`
- **Statistiques Globales** : `GET` `/api/v1/auth/admin/stats/global/`
- **Lister les demandes en attente de validation** : `GET` `/api/v1/utilisateur/prestataire-requests/`
- **Détail d'une demande** : `GET` `/api/v1/utilisateur/prestataire-requests/{id}/`

---

## 6. Workflow Livreurs & Livraisons

Ce module gère le personnel de livraison, l'affectation des commandes et la validation des remises de colis.

### 6.1 Promouvoir un Client en tant que Livreur
- **URL** : `/api/v1/auth/admin/livreurs/promote/`
- **Méthode** : `POST`
- **Description** : Permet à l'administrateur de créer un profil Livreur à partir d'un client inscrit via son ID utilisateur.
- **Autorisation** : `IsAdminUser`
- **Données attendues (Request Body)** :
  ```json
  {
    "user_id": 14
  }
  ```
- **Réponse - 201 Created** :
  ```json
  {
    "id": 1,
    "photo": null,
    "statut": "disponible",
    "nombre_livraisons": 0,
    "date_embauche": "2026-06-01",
    "user_details": {
      "id": 14,
      "email": "livreur@example.com",
      "telephone": "237688888888",
      "first_name": "Paul",
      "last_name": "Nguene",
      "role": "livreur"
    }
  }
  ```

### 6.2 Assigner un Livreur à une Commande
- **URL** : `/api/v1/auth/admin/commandes/{id}/affecter-livreur/`
- **Méthode** : `POST`
- **Description** : Assigne la commande à un livreur actif pour la livraison à domicile.
- **Autorisation** : `IsAdminUser`
- **Données attendues (Request Body)** :
  ```json
  {
    "livreur_id": 1
  }
  ```
- **Réponse - 200 OK** :
  ```json
  {
    "detail": "Commande assignée avec succès au livreur Paul Nguene.",
    "statut_livraison": "assignée"
  }
  ```

### 6.3 Tableau de Bord Livreur Connected
- **URL** : `/api/v1/auth/livreur/dashboard/`
- **Méthode** : `GET`
- **Description** : Synthèse de ses livraisons actives assignées.
- **Autorisation** : `IsAuthenticated` (Doit être un livreur actif)
- **Réponse - 200 OK** :
  ```json
  {
    "id": 1,
    "statut": "disponible",
    "nombre_livraisons": 25,
    "livraisons_actives": [
      {
        "id": 98,
        "numero_commande": "CMD-2026-9812",
        "statut": "en_cours_de_livraison",
        "statut_livraison": "assignée",
        "livraison_nom_complet": "Alice Ebanda",
        "livraison_quartier": "Bastos",
        "livraison_ville": "Yaoundé",
        "livraison_telephone": "237671234567",
        "methode_paiement": "cash",
        "statut_paiement": "non_payé",
        "total_ttc": "43500.00",
        "note_client": "Appeler 10 minutes avant d'arriver."
      }
    ]
  }
  ```

### 6.4 Mettre à Jour le Statut d'une Livraison
- **URL** : `/api/v1/auth/livreur/livraisons/{id}/statut/`
- **Méthode** : `POST`
- **Description** : Permet au livreur connecté de marquer la commande comme "livrée" (ce qui passe le paiement cash en "payé" et incrémente son compteur de livraison) ou "échouée" en fournissant un motif obligatoire.
- **Autorisation** : `IsAuthenticated` (Livreur assigné uniquement)
- **Données attendues pour Valider (POST)** :
  ```json
  {
    "action": "livrer"
  }
  ```
  **Données attendues pour Échec (POST)** :
  ```json
  {
    "action": "echouer",
    "motif": "Client injoignable après 3 tentatives d'appel."
  }
  ```
- **Réponse - 200 OK** :
  ```json
  {
    "detail": "Livraison validée avec succès.",
    "statut_livraison": "livrée"
  }
  ```

### 6.5 Autres Endpoints de Livraison
- `/api/v1/auth/admin/livreurs/` (GET) -> Liste des livreurs (Filtre possible par statut : `?statut=disponible`).
- `/api/v1/auth/admin/livreurs/{id}/` (PATCH) -> Suspendre ou modifier un livreur (Admin).
- `/api/v1/auth/admin/livraisons/` (GET) -> Suivi global et carte de bord de toutes les livraisons (Admin).
- `/api/v1/auth/livreur/livraisons/` (GET) -> Liste historique de toutes ses livraisons.

---

## 7. Notifications & Suivi Administratif

Ces routes permettent le monitoring technique et fonctionnel de la plateforme par l'administrateur.

### 7.1 Notifications Administrateur
- **URL** : `/api/v1/utilisateur/notifications/`
- **Méthode** : `GET`
- **Description** : Liste toutes les notifications système destinées à l'administrateur connecté (alertes de stock faible en laboratoire ou boutique, retraits échoués, demandes de partenaires en attente).
- **Autorisation** : `IsAdminUser`
- **Réponse - 200 OK** :
  ```json
  [
    {
      "id": 104,
      "type": "alerte_stock",
      "title": "Alerte de Stock Faible",
      "message": "Le stock de l'essence de Patchouli (ID: 4) est de 8.5ml, ce qui est inférieur au seuil d'alerte de 10ml.",
      "url": "/api/v1/lab/essences/4/",
      "is_read": false,
      "metadata": {
        "essence_id": 4,
        "stock_restant": 8.5
      },
      "created_at": "2026-06-01T09:30:00Z"
    }
  ]
  ```

### 7.2 Administration Générale des Utilisateurs
- **Lister et rechercher les comptes** : `GET` `/api/v1/auth/admin/users/` (Recherche textuelle dans l'email, prénom, nom, téléphone. Pagination de 50 par page).
- **Bloquer / Activer un Utilisateur** : `PATCH` `/api/v1/auth/admin/users/{id}/toggle-status/`
  - *Description* : Permet de désactiver/bloquer un utilisateur malveillant en basculant son attribut `is_active`. Un super-utilisateur ne peut pas être bloqué par ce biais.
  - *Réponse - 200 OK* :
    ```json
    {
      "detail": "Utilisateur bloqué avec succès.",
      "is_active": false
    }
    ```

---

## 8. Pages HTML Rendu Direct Backend (Hors API client)

Ces deux routes importantes **ne sont pas des endpoints d'API JSON**. Ce sont des vues Django gérées et rendues directement par le serveur sous forme de pages HTML complètes interactives. L'application frontend (Web/Mobile) n'a pas besoin de recréer ces interfaces ; elle redirige simplement l'utilisateur vers ces URLs.

### 8.1 Confirmation Directe de l'Email
- **URL** : `/accounts/confirm-email/{key}/`
- **Méthode** : `GET`
- **Description** : Endpoint déclenché lors du clic sur le lien d'email d'inscription. 
- **Comportement et rendu HTML** :
  - **Cas 1 : Lien valide**
    - Confirme instantanément l'adresse e-mail en BDD et active le compte.
    - Retourne une page HTML contenant un grand icône animé vert de succès et un bouton "Retourner à l'application" pointant vers `settings.FRONTEND_URL`.
    - Code statut de réponse : `200 OK`.
  - **Cas 2 : Lien invalide ou expiré**
    - Retourne une page HTML contenant un icône d'alerte doré "Lien expiré ou invalide".
    - Contient un formulaire de secours asynchrone intégré en Vanilla JS. L'utilisateur peut saisir son email et cliquer sur "Renvoyer le lien de confirmation".
    - Le formulaire effectue une requête AJAX `POST` transparente vers `/api/v1/auth/registration/resend-email/` et affiche le résultat du renvoi sur la page sans recharger.
    - Code statut de réponse : `400 Bad Request`.

### 8.2 Page du Formulaire de Réinitialisation de Mot de Passe
- **URL** : `/accounts/password/reset/confirm/{uid}/{token}/`
- **Méthodes** : `GET`, `POST`
- **Description** : Endpoint appelé lors du clic sur le lien de réinitialisation de mot de passe envoyé par e-mail.
- **Comportement et rendu HTML** :
  - **GET** :
    - Valide le couple `uid`/`token`. Si invalide, affiche une page HTML d'erreur "Lien expiré".
    - Si valide, affiche un formulaire de changement de mot de passe (`SetPasswordForm`) en HTML, avec double saisie sécurisée du nouveau mot de passe.
  - **POST** :
    - Traite la soumission du formulaire, applique les règles de robustesse des mots de passe de Django, met à jour le mot de passe de l'utilisateur, et envoie un courriel de confirmation d'alerte de sécurité.
    - Affiche une page HTML de succès "Mot de passe modifié" avec redirection vers l'accueil.
