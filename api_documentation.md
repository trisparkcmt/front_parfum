# Documentation API - Accessoire Exclusif

URL de base de l'API : `http://127.0.0.1:8000/api/v1/`

---

## 1. Authentification

### 1.1. Authentification Classique (Email / Mot de passe)

#### Inscription
*   **Méthode** : `POST`
*   **URL** : `/auth/registration/`
*   **Payload (JSON)** :
    ```json
    {
        "email": "user@example.com",
        "telephone": "+2250102030405",
        "password": "motdepasse123",
        "first_name": "John",
        "last_name": "Doe"
    }
    ```
*   **Réponse** : Confirmation d'inscription

#### Connexion (Login)
*   **Méthode** : `POST`
*   **URL** : `/auth/login/`
*   **Payload (JSON)** :
    ```json
    {
        "email": "user@example.com",
        "password": "motdepasse123"
    }
    ```
*   **Réponse** :
    ```json
    {
        "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    }
    ```

#### Rafraîchir le token
*   **Méthode** : `POST`
*   **URL** : `/auth/token/refresh/`
*   **Payload (JSON)** :
    ```json
    {
        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    }
    ```

### 1.2. Authentification Google
*   **Méthode** : `POST`
*   **URL** : `/auth/google/`
*   **Payload (JSON)** : Token Google OAuth
*   **Réponse** : Jetons access/refresh

---

## 2. Profil Utilisateur

### Voir son profil
*   **Méthode** : `GET`
*   **URL** : `/auth/me/`
*   **Auth** : Bearer Token
*   **Réponse** : Données du profil utilisateur

### Modifier son profil
*   **Méthode** : `PATCH`
*   **URL** : `/auth/me/`
*   **Auth** : Bearer Token
*   **Payload (JSON)** : Champs à modifier

---

## 3. Espace Prestataire

### Postuler (Devenir Prestataire)
*   **Méthode** : `POST`
*   **URL** : `/auth/prestataire/apply/`
*   **Auth** : Bearer Token
*   **Description** : Envoie une demande en attente à l'admin

### Dashboard Prestataire
*   **Méthode** : `GET`
*   **URL** : `/auth/prestataire/dashboard/`
*   **Auth** : Bearer Token (Rôle Prestataire Actif uniquement)
*   **Réponse** :
    ```json
    {
        "solde_commission": "150.00",
        "taux_commission": "15.00",
        "code_promo": "ACC-XXXXXX",
        "statut": "actif",
        "historique": [
            {
                "type_operation": "vente",
                "montant": "10.00",
                "description": "Vente parfum X",
                "date_operation": "2026-05-03T10:00:00Z"
            }
        ]
    }
    ```

---

## 4. Boutique (Catalogue)

### Catégories de parfums
*   **Méthode** : `GET`
*   **URL** : `/shop/categories/`
*   **Statut** : Non implémenté

### Parfums
*   **Méthode** : `GET`
*   **URL** : `/shop/parfums/`
*   **Paramètres** : `?page=1`, `?search=nom`, `?categorie=slug`
*   **Statut** : Non implémenté

*   **Méthode** : `GET`
*   **URL** : `/shop/parfums/<slug>/`
*   **Statut** : Non implémenté

### Essences
*   **Méthode** : `GET`
*   **URL** : `/shop/essences/`
*   **Statut** : Non implémenté

### Accessoires
*   **Méthode** : `GET`
*   **URL** : `/shop/accessoires/`
*   **Paramètres** : `?page=1`, `?search=nom`, `?type=slug`
*   **Statut** : Non implémenté

*   **Méthode** : `GET`
*   **URL** : `/shop/accessoires/<slug>/`
*   **Statut** : Non implémenté

### Flacons
*   **Méthode** : `GET`
*   **URL** : `/shop/flacons/`
*   **Statut** : Non implémenté

### Tags
*   **Méthode** : `GET`
*   **URL** : `/shop/tags/`
*   **Statut** : Non implémenté

---

## 5. Laboratoire (DIY Parfums & IA)

### Liste et création de parfums personnalisés
*   **Méthode** : `GET`
*   **URL** : `/lab/parfums-perso/`
*   **Auth** : Bearer Token
*   **Description** : Liste les parfums personnalisés du client connecté

*   **Méthode** : `POST`
*   **URL** : `/lab/parfums-perso/`
*   **Auth** : Bearer Token
*   **Payload (JSON)** :
    ```json
    {
        "nom": "Mon Parfum Personnalisé",
        "description": "Un mélange unique",
        "flacon": 1,
        "lignes": [
            {
                "essence": 1,
                "quantite_ml": 5
            }
        ]
    }
    ```

### Détail, modification, suppression d'un parfum personnalisé
*   **Méthode** : `GET`
*   **URL** : `/lab/parfums-perso/<id>/`
*   **Auth** : Bearer Token

*   **Méthode** : `PUT/PATCH`
*   **URL** : `/lab/parfums-perso/<id>/`
*   **Auth** : Bearer Token

*   **Méthode** : `DELETE`
*   **URL** : `/lab/parfums-perso/<id>/`
*   **Auth** : Bearer Token

### Recalculer le prix d'un parfum personnalisé
*   **Méthode** : `POST`
*   **URL** : `/lab/parfums-perso/<id>/recalculer/`
*   **Auth** : Bearer Token
*   **Réponse** :
    ```json
    {
        "status": "prix recalculé",
        "prix_essences": "3250.00",
        "prix_total": "15250.00"
    }
    ```

### Recommandation IA
*   **Méthode** : `POST`
*   **URL** : `/lab/ia-recommandation/`
*   **Auth** : Optionnel (Bearer Token recommandé)
*   **Payload (JSON)** :
    ```json
    {
        "prompt": "Je cherche un parfum frais pour l'été"
    }
    ```
*   **Réponse** :
    ```json
    {
        "message": "Voici quelques recommandations...",
        "parfums": [
            {
                "id": 1,
                "nom": "Brise de Matin",
                "prix_unitaire": "36000.00",
                "image_principale": "https://..."
            }
        ],
        "essences": [
            {
                "id": 3,
                "nom": "Bergamote Verte",
                "code_reference": "ESS-BER-01",
                "prix_par_10ml": "5200.00"
            }
        ],
        "accessoires": []
    }
    ```

---

## 6. Commandes & Paniers

### Panier
*   **Méthode** : `GET`
*   **URL** : `/orders/panier/`
*   **Auth** : Bearer Token
*   **Statut** : Non implémenté

*   **Méthode** : `POST`
*   **URL** : `/orders/panier/ajouter/`
*   **Auth** : Bearer Token
*   **Statut** : Non implémenté

*   **Méthode** : `DELETE`
*   **URL** : `/orders/panier/supprimer/<id>/`
*   **Auth** : Bearer Token
*   **Statut** : Non implémenté

### Commandes
*   **Méthode** : `GET`
*   **URL** : `/orders/commandes/`
*   **Auth** : Bearer Token
*   **Statut** : Non implémenté

*   **Méthode** : `GET`
*   **URL** : `/orders/commandes/<numero>/`
*   **Auth** : Bearer Token
*   **Statut** : Non implémenté

*   **Méthode** : `POST`
*   **URL** : `/orders/commandes/passer/`
*   **Auth** : Bearer Token
*   **Statut** : Non implémenté

### Livraisons (Prestataires)
*   **Méthode** : `GET`
*   **URL** : `/orders/livraisons/`
*   **Auth** : Bearer Token (Prestataire uniquement)
*   **Statut** : Non implémenté

*   **Méthode** : `PATCH`
*   **URL** : `/orders/livraisons/<id>/statut/`
*   **Auth** : Bearer Token (Prestataire uniquement)
*   **Statut** : Non implémenté

---

## 7. Administration (Réservé aux Admin)

### Liste des utilisateurs
*   **Méthode** : `GET`
*   **URL** : `/auth/admin/users/`
*   **Auth** : Bearer Token (Admin uniquement)
*   **Paramètres** : `?page=1` (50 par page), `?search=nom_ou_email`

### Bloquer / Débloquer un compte
*   **Méthode** : `PATCH`
*   **URL** : `/auth/admin/users/<id>/toggle-status/`
*   **Auth** : Bearer Token (Admin uniquement)
*   **Description** : Alterne l'accès au site (`is_active`)

### Liste des prestataires
*   **Méthode** : `GET`
*   **URL** : `/auth/admin/prestataires/`
*   **Auth** : Bearer Token (Admin uniquement)
*   **Paramètres** : `?statut=actif` (optionnel)

### Valider un nouveau prestataire
*   **Méthode** : `PATCH`
*   **URL** : `/auth/admin/prestataires/validate/<id>/`
*   **Auth** : Bearer Token (Admin uniquement)
*   **Payload (JSON)** :
    ```json
    {
        "taux_commission": 15.0
    }
    ```
*   **Action** : Active le compte, génère le code promo et envoie l'email HTML

### Modifier un prestataire existant
*   **Méthode** : `PATCH`
*   **URL** : `/auth/admin/prestataires/<id>/update/`
*   **Auth** : Bearer Token (Admin uniquement)
*   **Payload (JSON)** : `taux_commission`, `statut`

### Statistiques Globales
*   **Méthode** : `GET`
*   **URL** : `/auth/admin/stats/global/`
*   **Auth** : Bearer Token (Admin uniquement)
*   **Réponse** :
    ```json
    {
        "total_users": 150,
        "total_prestataires_actifs": 12,
        "solde_total_commission_dus": 2450.50
    }
    ```

---

## 8. Documentation API

### Swagger UI
*   **URL** : `/api/schema/swagger-ui/`
*   **Description** : Interface interactive pour tester l'API

### Redoc
*   **URL** : `/api/schema/redoc/`
*   **Description** : Documentation alternative de l'API

---

## Notes importantes

- **Authentification** : Tous les endpoints nécessitant une authentification utilisent des Bearer Tokens JWT
- **Pagination** : Les listes utilisent la pagination Django REST Framework (page, limit)
- **Statuts d'implémentation** :
  - ✅ Implémenté et fonctionnel
  - ❌ Non implémenté (URLs commentées)
- **Erreurs** : Les erreurs suivent le format standard DRF avec codes HTTP appropriés
- **CORS** : Configuré pour permettre les requêtes depuis le frontend
    {
        "total_users": 150,
        "total_prestataires_actifs": 12,
        "solde_total_commission_dus": 2450.50
    }
    ```
