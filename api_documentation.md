# Documentation API - Accessoire Exclusif (Module Utilisateur & Administration)

URL de base de l'API : `http://127.0.0.1:8000/api/v1/`

---

## 1. Authentification Classique (Email / Mot de passe)

### 1.1. Inscription
*   **Méthode** : `POST`
*   **URL** : `/auth/registration/`
*   **Payload (JSON)** : `email`, `telephone`, `password`, `first_name`, `last_name`.

### 1.2. Connexion (Login)
*   **Méthode** : `POST`
*   **URL** : `/auth/login/`
*   **Payload (JSON)** : `email`, `password`.
*   **Réponse** : Jetons `access` et `refresh`.

---

## 2. Profil Utilisateur (Custom)

### 2.1. Voir son profil
*   **Méthode** : `GET`
*   **URL** : `/auth/me/`
*   **Auth** : Bearer Token

### 2.2. Modifier son profil
*   **Méthode** : `PATCH`
*   **URL** : `/auth/me/`
*   **Auth** : Bearer Token

---

## 3. Espace Prestataire (Côté Utilisateur)

### 3.1. Postuler (Devenir Prestataire)
*   **Méthode** : `POST`
*   **URL** : `/auth/prestataire/apply/`
*   **Description** : Envoie une demande en attente à l'admin.

### 3.2. Dashboard Prestataire
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
                "date_operation": "2026-05-03..."
            }
        ]
    }
    ```

---

## 4. Administration (Réservé aux Admin)

### 4.1. Liste des utilisateurs (Paginée)
*   **Méthode** : `GET`
*   **URL** : `/auth/admin/users/`
*   **Paramètres** : `?page=1` (50 par page), `?search=nom_ou_email`.
*   **Description** : Liste tous les comptes avec leur statut prestataire.

### 4.2. Bloquer / Débloquer un compte
*   **Méthode** : `PATCH`
*   **URL** : `/auth/admin/users/<id>/toggle-status/`
*   **Description** : Alterne l'accès au site (`is_active`).

### 4.3. Liste des prestataires
*   **Méthode** : `GET`
*   **URL** : `/auth/admin/prestataires/`
*   **Paramètres** : `?statut=actif` (optionnel).

### 4.4. Valider un nouveau prestataire
*   **Méthode** : `PATCH`
*   **URL** : `/auth/admin/prestataires/validate/<id>/`
*   **Payload** : `{"taux_commission": 15.0}`.
*   **Action** : Active le compte, génère le code promo et envoie l'email HTML.

### 4.5. Modifier un prestataire existant
*   **Méthode** : `PATCH`
*   **URL** : `/auth/admin/prestataires/<id>/update/`
*   **Payload** : `taux_commission`, `statut`.

### 4.6. Statistiques Globales
*   **Méthode** : `GET`
*   **URL** : `/auth/admin/stats/global/`
*   **Réponse** :
    ```json
    {
        "total_users": 150,
        "total_prestataires_actifs": 12,
        "solde_total_commission_dus": 2450.50
    }
    ```
