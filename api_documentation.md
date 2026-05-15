# Documentation API - Accessoire Exclusif

URL de base de l'API : `http://127.0.0.1:8000/api/v1/`

---

## 1. Structure générale

L'API est organisée autour de quatre zones principales :

- `api/v1/auth/` : authentification, gestion du profil, prestataire, administration user/prestataire
- `api/v1/shop/` : catalogue des parfums, accessoires, flacons et favoris
- `api/v1/lab/` : création de parfums personnalisés, essences personnalisées et recommandation IA
- `api/schema/`, `api/docs/`, `api/redoc/` : documentation OpenAPI générée

> Remarque : la route `api/v1/lab/essences/` est implémentée dans le code `catalogue` mais n'est pas exposée dans le routeur actuel du projet.

---

## 2. Authentification et profil

### 2.1. Inscription

- **Méthode** : `POST`
- **URL** : `/api/v1/auth/registration/`
- **Payload** :
  ```json
  {
    "email": "user@example.com",
    "telephone": "+2250102030405",
    "password1": "motdepasse123",
    "password2": "motdepasse123",
    "first_name": "John",
    "last_name": "Doe"
  }
  ```
- **Réponse** : objet utilisateur ou message de création selon `dj-rest-auth`

### 2.2. Connexion

- **Méthode** : `POST`
- **URL** : `/api/v1/auth/login/`
- **Payload** :
  ```json
  {
    "email": "user@example.com",
    "password": "motdepasse123"
  }
  ```
- **Réponse** : jetons JWT
  ```json
  {
    "access": "eyJ...",
    "refresh": "eyJ..."
  }
  ```

### 2.3. Rafraîchir le token

- **Méthode** : `POST`
- **URL** : `/api/v1/auth/token/refresh/`
- **Payload** :
  ```json
  { "refresh": "eyJ..." }
  ```

### 2.4. Authentification Google

- **Méthode** : `POST`
- **URL** : `/api/v1/auth/google/`
- **Payload** : jeton Google OAuth
- **Réponse** : jetons `access` / `refresh`

### 2.5. Profil connecté

#### Voir son profil

- **Méthode** : `GET`
- **URL** : `/api/v1/auth/me/`
- **Auth** : Bearer Token
- **Réponse** : données utilisateur + profil client + favoris + parfums personnalisés + commandes

#### Modifier son profil

- **Méthode** : `PUT` / `PATCH`
- **URL** : `/api/v1/auth/me/`
- **Auth** : Bearer Token
- **Payload** : champs du profil utilisateur (`email`, `telephone`, `first_name`, `last_name`)

---

## 3. Prestataire

### 3.1. Postuler

- **Méthode** : `POST`
- **URL** : `/api/v1/auth/prestataire/apply/`
- **Auth** : Bearer Token
- **Payload** : aucun champ obligatoire
- **Description** : envoie une demande de prestataire à l'admin

### 3.2. Dashboard prestataire

- **Méthode** : `GET`
- **URL** : `/api/v1/auth/prestataire/dashboard/`
- **Auth** : Bearer Token
- **Réponse** : solde, taux de commission, code promo, historique des gains

### 3.3. Administration prestataire (admin uniquement)

- **Lister les demandes de prestataires**
  - **Méthode** : `GET`
  - **URL** : `/api/v1/auth/admin/prestataires/`

- **Valider un prestataire**
  - **Méthode** : `PATCH`
  - **URL** : `/api/v1/auth/admin/prestataires/validate/<pk>/`
  - **Payload** :
    ```json
    { "taux_commission": 15.0 }
    ```

- **Mettre à jour un prestataire**
  - **Méthode** : `PATCH`
  - **URL** : `/api/v1/auth/admin/prestataires/<pk>/update/`

- **Statistiques globales admin**
  - **Méthode** : `GET`
  - **URL** : `/api/v1/auth/admin/stats/global/`

---

## 4. Catalogue - Shop

### 4.1. Parfums

#### Liste des parfums

- **Méthode** : `GET`
- **URL** : `/api/v1/shop/parfums/`
- **Filtres** :
  - `famille_olfactive`, `humeur`, `saison`, `occasion`
  - `genre`, `intensite`, `contenance_ml`
  - `prix_min`, `prix_max`
  - `est_nouveau`, `est_bestseller`
  - `tags`, `search`, `ordering`, `page`, `limit`

#### Détail d'un parfum

- **Méthode** : `GET`
- **URL** : `/api/v1/shop/parfums/<slug>/`

#### Actions supplémentaires

- **Bestsellers**
  - **Méthode** : `GET`
  - **URL** : `/api/v1/shop/parfums/bestsellers/`

- **Hotsellers**
  - **Méthode** : `GET`
  - **URL** : `/api/v1/shop/parfums/hotsellers/`

- **Ajouter / supprimer aux favoris**
  - **Méthode** : `POST`
  - **URL** : `/api/v1/shop/parfums/<slug>/favori/`
  - **Auth** : Bearer Token

##### Parfum - champs importants

- `id`, `nom`, `slug`, `reference_sku`
- `description_courte`, `contenance_ml`
- `prix_unitaire`, `prix_actuel`
- `taux_reduction`, `en_promotion`
- `genre_cible`, `intensite`
- `notes_tete`, `notes_coeur`, `notes_fond`
- `tags`, `famille_olfactive`, `humeurs_compatibles`, `occasions`, `saisons_compatibles`
- `est_nouveau`, `est_bestseller`
- `image_principale`, `images_supplementaires`, `stock_quantite`
- `produits_similaires`, `is_favori`

---

### 4.2. Accessoires

#### Liste des accessoires

- **Méthode** : `GET`
- **URL** : `/api/v1/shop/accessoires/`
- **Filtres** :
  - `type_accessoire`, `type_nom`
  - `prix_min`, `prix_max`
  - `couleur`, `matiere`, `taille`
  - `en_stock`, `search`, `ordering`

#### Détail d'un accessoire

- **Méthode** : `GET`
- **URL** : `/api/v1/shop/accessoires/<slug>/`

#### Actions supplémentaires

- **Bestsellers accessoires**
  - **Méthode** : `GET`
  - **URL** : `/api/v1/shop/accessoires/bestsellers/`

- **Hotsellers accessoires**
  - **Méthode** : `GET`
  - **URL** : `/api/v1/shop/accessoires/hotsellers/`

- **Ajouter / supprimer aux favoris**
  - **Méthode** : `POST`
  - **URL** : `/api/v1/shop/accessoires/<slug>/favori/`
  - **Auth** : Bearer Token

##### Accessoire - champs importants

- `id`, `nom`, `slug`, `reference_sku`
- `type_accessoire`, `description_courte`
- `matiere`, `couleur`, `taille`
- `prix_unitaire`, `prix_actuel`
- `taux_reduction`, `en_promotion`
- `stock_quantite`, `poids_grammes`
- `image_principale`, `images_supplementaires`
- `produits_similaires`, `is_favori`

---

### 4.3. Flacons

#### Liste des flacons

- **Méthode** : `GET`
- **URL** : `/api/v1/shop/flacons/`
- **Filtres** :
  - `type_flacon`, `type_nom`
  - `contenance_ml`, `contenance_min`, `contenance_max`
  - `stock_min`, `stock_max`, `en_stock`
  - `matiere`, `couleur`, `search`, `ordering`

#### Détail d'un flacon

- **Méthode** : `GET`
- **URL** : `/api/v1/shop/flacons/<id>/`

##### Flacon - champs importants

- `id`, `nom`, `reference_sku`
- `type_flacon`
- `contenance_ml`, `matiere`, `couleur`
- `hauteur_cm`, `largeur_cm`, `poids_grammes`
- `prix_unitaire`, `stock_quantite`, `seuil_alerte_stock`
- `stock_suffisant`
- `image_principale`, `images_supplementaires`

---

## 5. Laboratoire

### 5.1. Parfums personnalisés

#### Liste des parfums personnalisés

- **Méthode** : `GET`
- **URL** : `/api/v1/lab/parfums-perso/`
- **Auth** : Bearer Token

#### Créer un parfum personnalisé

- **Méthode** : `POST`
- **URL** : `/api/v1/lab/parfums-perso/`
- **Auth** : Bearer Token
- **Payload** :
  ```json
  {
    "nom": "Mon Parfum Personnalisé",
    "description": "Mélange floral et boisé",
    "contenance_ml": 50,
    "flacon": 1,
    "lignes": [
      {
        "essence_catalogue": 3,
        "quantite_ml": 4.5
      },
      {
        "essence_personnalisee": 2,
        "quantite_ml": 3.0
      }
    ]
  }
  ```

- **Règle métier** : le volume total des lignes d'essence doit être inférieur ou égal à 45% de la contenance du flacon.

#### Détail / modification / suppression

- **Méthode** : `GET`
- **URL** : `/api/v1/lab/parfums-perso/<id>/`
- **Méthode** : `PUT` / `PATCH`
- **URL** : `/api/v1/lab/parfums-perso/<id>/`
- **Méthode** : `DELETE`
- **URL** : `/api/v1/lab/parfums-perso/<id>/`

#### Recalculer le prix

- **Méthode** : `POST`
- **URL** : `/api/v1/lab/parfums-perso/<id>/recalculer/`
- **Auth** : Bearer Token
- **Réponse** :
  ```json
  {
    "status": "prix recalculé",
    "prix_essences": "3250.00",
    "prix_total": "15250.00"
  }
  ```

##### Parfum personnalisé - champs importants

- `id`, `nom`, `description`, `flacon`, `flacon_detail`
- `contenance_ml`, `prix_essences`, `prix_flacon_snapshot`, `prix_total`
- `statut`, `note_laboratoire`, `date_creation`, `date_modification`
- `lignes` :
  - `essence_catalogue`, `essence_personnalisee`
  - `quantite_ml`, `prix_par_ml_snapshot`, `prix_ligne`

---

### 5.2. Essences personnalisées

#### Liste des essences personnalisées

- **Méthode** : `GET`
- **URL** : `/api/v1/lab/essences-perso/`
- **Auth** : Bearer Token

#### Créer une essence personnalisée

- **Méthode** : `POST`
- **URL** : `/api/v1/lab/essences-perso/`
- **Auth** : Bearer Token
- **Payload** :
  ```json
  {
    "nom": "Essence Bois Epicé",
    "lignes": [
      { "ingredient": 2, "quantite_ml": 3.5 },
      { "ingredient": 4, "quantite_ml": 1.5 }
    ]
  }
  ```

#### Détail / modification / suppression

- **Méthode** : `GET`
- **URL** : `/api/v1/lab/essences-perso/<id>/`
- **Méthode** : `PUT` / `PATCH`
- **URL** : `/api/v1/lab/essences-perso/<id>/`
- **Méthode** : `DELETE`
- **URL** : `/api/v1/lab/essences-perso/<id>/`

##### Essence personnalisée - champs importants

- `id`, `nom`, `prix_par_ml_calcule`, `date_creation`
- `lignes` :
  - `ingredient`, `ingredient_detail`
  - `quantite_ml`, `prix_ligne`

---

### 5.3. Recommandation IA

- **Méthode** : `POST`
- **URL** : `/api/v1/lab/ia-recommandation/`
- **Payload** :
  ```json
  { "prompt": "Je veux un parfum sucré et chaleureux pour une soirée" }
  ```
- **Réponse** :
  ```json
  {
    "message": "...",
    "quantite_demandee_ml": 50,
    "flacon": {
      "id": 1,
      "nom": "Spray 50ml",
      "contenance_ml": 50,
      "prix_unitaire": "12000.00"
    },
    "parfums_existants": [...],
    "essences_pre_faites": [...],
    "ingredients_sur_mesure": [...],
    "accessoires": [...]
  }
  ```

---

## 6. Routes d'administration et avancées

### 6.1. Utilisateurs

- **Lister tous les utilisateurs**
  - `GET /api/v1/auth/admin/users/`
  - Admin seulement

- **Bloquer/débloquer un utilisateur**
  - `PATCH /api/v1/auth/admin/users/<pk>/toggle-status/`

### 6.2. Prestataires

- **Lister tous les prestataires**
  - `GET /api/v1/auth/admin/prestataires/`

- **Valider une demande**
  - `PATCH /api/v1/auth/admin/prestataires/validate/<pk>/`

- **Mettre à jour un prestataire**
  - `PATCH /api/v1/auth/admin/prestataires/<pk>/update/`

- **Statistiques globales**
  - `GET /api/v1/auth/admin/stats/global/`

---

## 7. Documentation automatique

- **OpenAPI JSON/YAML** : `/api/schema/`
- **Swagger UI** : `/api/docs/`
- **Redoc** : `/api/redoc/`

---

## 8. Remarques importantes

- L'API principale est `api/v1/`.
- Les routes `auth/admin/...` sont réservées aux administrateurs.
- Les endpoints `lab` exigent que l'utilisateur soit connecté.
- La création d'un parfum personnalisé utilise les prix par ml des essences et stocke des snapshots de prix pour garantir que le prix reste fixe après création.
- La règle métier du laboratoire : le total des `quantite_ml` de toutes les lignes de parfum ne peut pas dépasser `45%` de la contenance du flacon.
