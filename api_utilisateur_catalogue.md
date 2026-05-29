# Documentation API - Utilisateur et Catalogue

Base locale indicative : `http://127.0.0.1:8000`

Documentation interactive :
- Swagger : `GET /api/docs/`
- Redoc : `GET /api/redoc/`
- Schema OpenAPI : `GET /api/schema/`

Authentification :
- Les endpoints publics se lisent sans token.
- Les endpoints marques "auth requise" demandent `Authorization: Bearer <access_token>`.
- Les endpoints marques "admin seulement" demandent un utilisateur `is_staff`.
- Les endpoints `dj_rest_auth` peuvent aussi exposer `Token` ou cookies selon la configuration globale du projet.

Format de pagination courant :

```json
{
  "count": 42,
  "next": "http://127.0.0.1:8000/api/v1/shop/parfums/?page=2",
  "previous": null,
  "resultats": []
}
```

Selon certains endpoints DRF/dj-rest-auth, la pagination peut aussi utiliser `results`.

---

## 1. Utilisateur / Auth

Base : `/api/v1/auth/`

### 1.1 Connexion

`POST /api/v1/auth/login/`

Donnees attendues avec email :

```json
{
  "email": "client@example.com",
  "password": "MotDePasse123"
}
```

Donnees attendues avec telephone :

```json
{
  "telephone": "+237690000000",
  "password": "MotDePasse123"
}
```

Reponse type :

```json
{
  "access": "jwt-access-token",
  "refresh": "jwt-refresh-token",
  "user": {
    "pk": 1,
    "email": "client@example.com",
    "first_name": "Jean",
    "last_name": "Dupont"
  }
}
```

Erreurs possibles :

```json
{
  "non_field_errors": ["Identifiants invalides."]
}
```

### 1.2 Deconnexion

`POST /api/v1/auth/logout/`

Auth requise.

Reponse type :

```json
{
  "detail": "Successfully logged out."
}
```

### 1.3 Inscription

`POST /api/v1/auth/registration/`

Donnees attendues :

```json
{
  "email": "client@example.com",
  "telephone": "+237690000000",
  "password1": "MotDePasse123",
  "password2": "MotDePasse123",
  "first_name": "Jean",
  "last_name": "Dupont"
}
```

Reponse type :

```json
{
  "access": "jwt-access-token",
  "refresh": "jwt-refresh-token",
  "user": {
    "pk": 1,
    "email": "client@example.com"
  }
}
```

Notes :
- `email` est unique.
- `telephone` est unique, optionnel dans le modele mais souvent requis par la config d'inscription.
- Un profil `Client` est cree automatiquement a la creation du `User`.

### 1.4 Mot de passe

`POST /api/v1/auth/password/reset/`

Donnees attendues :

```json
{
  "email": "client@example.com"
}
```

`POST /api/v1/auth/password/reset/confirm/`

Donnees attendues :

```json
{
  "uid": "uid",
  "token": "token",
  "new_password1": "NouveauMotDePasse123",
  "new_password2": "NouveauMotDePasse123"
}
```

`POST /api/v1/auth/password/change/`

Auth requise.

Donnees attendues :

```json
{
  "old_password": "AncienMotDePasse123",
  "new_password1": "NouveauMotDePasse123",
  "new_password2": "NouveauMotDePasse123"
}
```

### 1.5 Profil auth basique

Endpoints fournis par `dj_rest_auth` :

- `GET /api/v1/auth/user/`
- `PUT /api/v1/auth/user/`
- `PATCH /api/v1/auth/user/`

Auth requise.

Reponse type :

```json
{
  "pk": 1,
  "email": "client@example.com",
  "first_name": "Jean",
  "last_name": "Dupont"
}
```

### 1.6 Google login

`POST /api/v1/auth/google/`

Donnees attendues :

```json
{
  "access_token": "google-access-token"
}
```

Reponse type :

```json
{
  "access": "jwt-access-token",
  "refresh": "jwt-refresh-token",
  "user": {
    "pk": 1,
    "email": "client@gmail.com"
  }
}
```

### 1.7 Profil complet connecte

`GET /api/v1/auth/me/`

Auth requise.

Reponse type :

```json
{
  "user": {
    "id": 1,
    "email": "client@example.com",
    "telephone": "+237690000000",
    "first_name": "Jean",
    "last_name": "Dupont",
    "role": "client"
  },
  "client": {
    "id": 1,
    "date_naissance": null,
    "genre": "",
    "points_fidelite": 0,
    "date_creation": "2026-05-15T10:00:00Z"
  },
  "preferences": {
    "familles_olfactives": ["Floral"],
    "humeurs": [],
    "saisons": [],
    "occasions": [],
    "signes_astrologiques": [],
    "moments_journee": [],
    "genres": ["femme"]
  },
  "favoris": [],
  "parfums_personnalises": [],
  "commandes": []
}
```

`PUT /api/v1/auth/me/`

`PATCH /api/v1/auth/me/`

Auth requise.

Donnees attendues :

```json
{
  "email": "nouveau@example.com",
  "telephone": "+237690000001",
  "first_name": "Jeanne",
  "last_name": "Dupont"
}
```

Si l'email change, le mot de passe actuel est requis pour les comptes avec mot de passe utilisable :

```json
{
  "email": "nouveau@example.com",
  "current_password": "MotDePasse123"
}
```

Reponse type :

```json
{
  "id": 1,
  "email": "nouveau@example.com",
  "telephone": "+237690000001",
  "first_name": "Jeanne",
  "last_name": "Dupont",
  "role": "client"
}
```

### 1.8 Demande prestataire

`POST /api/v1/auth/prestataire/apply/`

Auth requise.

Donnees attendues : aucun champ obligatoire actuellement.

```json
{}
```

Reponse succes :

```json
{
  "detail": "Demande envoyée avec succès."
}
```

Erreur si une demande existe deja :

```json
{
  "detail": "Vous avez déjà une demande en cours ou êtes déjà prestataire."
}
```

### 1.9 Dashboard prestataire

`GET /api/v1/auth/prestataire/dashboard/`

Auth requise, prestataire actif uniquement.

Reponse type :

```json
{
  "solde_commission": "15000.00",
  "taux_commission": "15.00",
  "code_promo": "ACC-AB12CD34",
  "statut": "actif",
  "historique": [
    {
      "id": 1,
      "type_operation": "vente",
      "montant": "1500.00",
      "reference_commande": "CMD-20260515-001",
      "date_operation": "2026-05-15T10:00:00Z",
      "description": "Commission sur commande"
    }
  ]
}
```

Erreur si non prestataire :

```json
{
  "detail": "Accès réservé aux prestataires."
}
```

### 1.10 Admin - utilisateurs

`GET /api/v1/auth/admin/users/`

Admin seulement.

Query params :
- `search` : recherche email, prenom, nom, telephone.
- `page` : numero de page.
- `page_size` : taille de page, max `100`.

Exemple :

`GET /api/v1/auth/admin/users/?search=jean&page=1&page_size=50`

Reponse type :

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "email": "client@example.com",
      "telephone": "+237690000000",
      "first_name": "Jean",
      "last_name": "Dupont",
      "role": "client",
      "is_active": true,
      "is_staff": false,
      "date_joined": "2026-05-15T10:00:00Z",
      "is_prestataire": false,
      "prestataire_statut": null
    }
  ]
}
```

`PATCH /api/v1/auth/admin/users/{id}/toggle-status/`

Admin seulement. Alterne `is_active`.

Reponse type :

```json
{
  "detail": "Utilisateur bloqué avec succès.",
  "is_active": false
}
```

### 1.11 Admin - prestataires

`GET /api/v1/auth/admin/prestataires/`

Admin seulement.

Query params :
- `statut` : `en_attente`, `actif`, `suspendu`, `inactif`.

Reponse type :

```json
[
  {
    "id": 1,
    "user_details": {
      "id": 2,
      "email": "prestataire@example.com",
      "telephone": "+237690000002",
      "first_name": "Paul",
      "last_name": "Client",
      "role": "prestataire"
    },
    "client": 2,
    "code_promo": "ACC-AB12CD34",
    "taux_commission": "15.00",
    "solde_commission": "0.00",
    "statut": "actif",
    "date_creation": "2026-05-15T10:00:00Z",
    "date_modification": "2026-05-15T10:00:00Z"
  }
]
```

`PATCH /api/v1/auth/admin/prestataires/validate/{id}/`

Admin seulement.

Donnees attendues :

```json
{
  "taux_commission": "15.00"
}
```

Reponse type :

```json
{
  "detail": "Prestataire validé avec succès.",
  "code_promo": "ACC-AB12CD34",
  "taux_commission": "15.00"
}
```

`PATCH /api/v1/auth/admin/prestataires/{id}/update/`

Admin seulement.

Donnees attendues :

```json
{
  "taux_commission": "20.00",
  "statut": "suspendu"
}
```

Reponse type :

```json
{
  "taux_commission": "20.00",
  "statut": "suspendu"
}
```

### 1.12 Admin - statistiques globales

`GET /api/v1/auth/admin/stats/global/`

Admin seulement.

Reponse type :

```json
{
  "total_users": 150,
  "total_prestataires_actifs": 12,
  "solde_total_commission_dus": "245000.00"
}
```

---

## 2. Catalogue - Shop

Base : `/api/v1/shop/`

Permissions :
- Lecture publique.
- Ecriture admin seulement.
- Favoris : utilisateur connecte.

### 2.1 Parfums

Lookup : `slug`.

Endpoints :

- `GET /api/v1/shop/parfums/`
- `POST /api/v1/shop/parfums/` admin seulement
- `GET /api/v1/shop/parfums/{slug}/`
- `PUT /api/v1/shop/parfums/{slug}/` admin seulement
- `PATCH /api/v1/shop/parfums/{slug}/` admin seulement
- `DELETE /api/v1/shop/parfums/{slug}/` admin seulement
- `GET /api/v1/shop/parfums/bestsellers/`
- `GET /api/v1/shop/parfums/hotsellers/`
- `POST /api/v1/shop/parfums/{slug}/favori/` auth requise

Filtres :
- `famille_olfactive`
- `humeur`
- `saison`
- `occasion`
- `genre` : `homme`, `femme`, `mixte`
- `intensite` : `légère`, `moyenne`, `forte`, `très forte`
- `contenance_ml`
- `prix_min`
- `prix_max`
- `est_nouveau`
- `est_bestseller`
- `tags` : ids separes par virgule, exemple `1,3,5`
- `search`
- `ordering` : `prix_unitaire`, `date_creation`, `nom`, `contenance_ml`
- `page`, `limit`

Exemple :

`GET /api/v1/shop/parfums/?famille_olfactive=Floral&genre=femme&prix_max=25000&ordering=prix_unitaire`

Donnees attendues en creation/modification API :

```json
{
  "nom": "Royal Oud",
  "slug": "royal-oud",
  "reference_sku": "PARF-001",
  "description_courte": "Parfum boisé et intense.",
  "contenance_ml": 50,
  "prix_unitaire": "25000.00",
  "genre_cible": "mixte",
  "intensite": "forte",
  "notes_tete": "Bergamote, Safran",
  "notes_coeur": "Rose, Oud",
  "notes_fond": "Ambre, Musc",
  "est_nouveau": true,
  "est_bestseller": false,
  "images_supplementaires": [],
  "stock_quantite": 20
}
```

Champs de reponse :

```json
{
  "id": 1,
  "nom": "Royal Oud",
  "slug": "royal-oud",
  "reference_sku": "PARF-001",
  "description_courte": "Parfum boisé et intense.",
  "contenance_ml": 50,
  "prix_unitaire": "25000.00",
  "prix_actuel": "20000.00",
  "taux_reduction": 20.0,
  "en_promotion": true,
  "genre_cible": "mixte",
  "intensite": "forte",
  "notes_tete": "Bergamote, Safran",
  "notes_coeur": "Rose, Oud",
  "notes_fond": "Ambre, Musc",
  "tags": [
    {
      "id": 1,
      "nom": "Floral",
      "type": "famille_olfactive"
    }
  ],
  "famille_olfactive": ["Floral"],
  "humeurs_compatibles": [],
  "occasions": [],
  "saisons_compatibles": [],
  "est_nouveau": true,
  "est_bestseller": false,
  "image_principale": "http://127.0.0.1:8000/media/parfums/royal-oud/photo.jpg",
  "images_supplementaires": [],
  "stock_quantite": 20,
  "date_creation": "2026-05-15T10:00:00Z",
  "produits_similaires": [],
  "is_favori": false
}
```

Note : dans le serializer actuel, certains champs du modele ne sont pas exposes en ecriture via cet endpoint, par exemple `categorie`, `marque`, `description_longue`, `prix_promotionnel`, `seuil_alerte_stock`, `actif`, `image_principale`.

Action favori :

`POST /api/v1/shop/parfums/{slug}/favori/`

Reponse ajout :

```json
{
  "status": "ajouté",
  "is_favori": true
}
```

Reponse retrait :

```json
{
  "status": "retiré",
  "is_favori": false
}
```

### 2.2 Accessoires

Lookup : `slug`.

Endpoints :

- `GET /api/v1/shop/accessoires/`
- `POST /api/v1/shop/accessoires/` admin seulement
- `GET /api/v1/shop/accessoires/{slug}/`
- `PUT /api/v1/shop/accessoires/{slug}/` admin seulement
- `PATCH /api/v1/shop/accessoires/{slug}/` admin seulement
- `DELETE /api/v1/shop/accessoires/{slug}/` admin seulement
- `GET /api/v1/shop/accessoires/bestsellers/`
- `GET /api/v1/shop/accessoires/hotsellers/`
- `POST /api/v1/shop/accessoires/{slug}/favori/` auth requise

Filtres :
- `type_accessoire`
- `type_nom`
- `prix_min`
- `prix_max`
- `couleur`
- `matiere`
- `taille`
- `en_stock` : `true` ou `false`
- `search`
- `ordering` : `prix_unitaire`, `date_creation`, `nom`, `poids_grammes`

Donnees attendues en creation/modification API :

```json
{
  "nom": "Bracelet Doré",
  "slug": "bracelet-dore",
  "reference_sku": "ACC-001",
  "description_courte": "Bracelet élégant.",
  "matiere": "Acier inoxydable",
  "couleur": "Or",
  "taille": "M",
  "prix_unitaire": "8000.00",
  "stock_quantite": 30,
  "poids_grammes": "50.00",
  "images_supplementaires": []
}
```

Champs de reponse :

```json
{
  "id": 1,
  "nom": "Bracelet Doré",
  "slug": "bracelet-dore",
  "reference_sku": "ACC-001",
  "type_accessoire": {
    "id": 1,
    "nom": "Bracelet",
    "slug": "bracelet",
    "description": "Bracelets",
    "icone": null
  },
  "description_courte": "Bracelet élégant.",
  "matiere": "Acier inoxydable",
  "couleur": "Or",
  "taille": "M",
  "prix_unitaire": "8000.00",
  "prix_actuel": "6500.00",
  "taux_reduction": 18.8,
  "en_promotion": true,
  "stock_quantite": 30,
  "poids_grammes": "50.00",
  "image_principale": null,
  "images_supplementaires": [],
  "date_creation": "2026-05-15T10:00:00Z",
  "produits_similaires": [],
  "is_favori": false
}
```

Note : `type_accessoire`, `image_principale`, `prix_promotionnel`, `seuil_alerte_stock`, `actif`, `marque`, `description_longue` ne sont pas exposes en ecriture par le serializer actuel.

### 2.3 Flacons

Lookup : `id`.

Endpoints :

- `GET /api/v1/shop/flacons/`
- `POST /api/v1/shop/flacons/` admin seulement
- `GET /api/v1/shop/flacons/{id}/`
- `PUT /api/v1/shop/flacons/{id}/` admin seulement
- `PATCH /api/v1/shop/flacons/{id}/` admin seulement
- `DELETE /api/v1/shop/flacons/{id}/` admin seulement

Filtres :
- `type_flacon`
- `type_nom`
- `contenance_ml`
- `contenance_min`
- `contenance_max`
- `stock_min`
- `stock_max`
- `en_stock` : `true` ou `false`
- `matiere`
- `couleur`
- `search`
- `ordering` : `prix_unitaire`, `date_creation`, `nom`, `contenance_ml`, `stock_quantite`

Donnees attendues en creation/modification API :

```json
{
  "nom": "Flacon Spray 50ml",
  "reference_sku": "FLA-050",
  "contenance_ml": 50,
  "matiere": "Verre",
  "couleur": "Transparent",
  "hauteur_cm": "10.50",
  "largeur_cm": "3.00",
  "poids_grammes": "80.00",
  "prix_unitaire": "1500.00",
  "stock_quantite": 30,
  "seuil_alerte_stock": 5,
  "images_supplementaires": []
}
```

Champs de reponse :

```json
{
  "id": 1,
  "nom": "Flacon Spray 50ml",
  "reference_sku": "FLA-050",
  "type_flacon": {
    "id": 1,
    "nom": "Spray",
    "description": "Flacon spray",
    "image": null
  },
  "contenance_ml": 50,
  "matiere": "Verre",
  "couleur": "Transparent",
  "hauteur_cm": "10.50",
  "largeur_cm": "3.00",
  "poids_grammes": "80.00",
  "prix_unitaire": "1500.00",
  "stock_quantite": 30,
  "seuil_alerte_stock": 5,
  "stock_suffisant": true,
  "image_principale": null,
  "images_supplementaires": [],
  "date_creation": "2026-05-15T10:00:00Z"
}
```

Note : `type_flacon`, `image_principale` et `actif` ne sont pas exposes en ecriture par le serializer actuel.

### 2.4 Favoris catalogue

Endpoints :

- `GET /api/v1/shop/favoris/` auth requise
- `GET /api/v1/shop/favoris/{id}/` auth requise

Reponse type :

```json
[
  {
    "id": 1,
    "date_ajout": "2026-05-15T10:00:00Z",
    "nom_produit": "Royal Oud",
    "prix_produit": "25000.00",
    "image_produit": "http://127.0.0.1:8000/media/parfums/royal-oud/photo.jpg",
    "type_produit": "parfum"
  }
]
```

Creation/suppression :
- `POST /api/v1/shop/parfums/{slug}/favori/`
- `POST /api/v1/shop/accessoires/{slug}/favori/`

---

## 3. Catalogue - Lab

Base : `/api/v1/lab/`

### 3.1 Essences

Lookup : `id`.

Endpoints :

- `GET /api/v1/lab/essences/`
- `POST /api/v1/lab/essences/` admin seulement
- `GET /api/v1/lab/essences/{id}/`
- `PUT /api/v1/lab/essences/{id}/` admin seulement
- `PATCH /api/v1/lab/essences/{id}/` admin seulement
- `DELETE /api/v1/lab/essences/{id}/` admin seulement

Filtres :
- `famille_olfactive`
- `humeur`
- `saison`
- `occasion`
- `signe_astrologique`
- `moment_journee`
- `genre` : `homme`, `femme`, `mixte`
- `intensite` : `légère`, `moyenne`, `forte`, `très forte`
- `prix_min`
- `prix_max`
- `stock_min`
- `tags`
- `search`
- `ordering` : `prix_par_ml`, `date_creation`, `nom`, `stock_ml_total_reel`, `prix_unitaire_fini`

Donnees attendues :

```json
{
  "nom": "Oud Royal",
  "code_reference": "ESS-001",
  "marque": "Fournisseur X",
  "description": "Essence boisée premium.",
  "description_ia": "Description narrative IA.",
  "fournisseur": "Nom fournisseur",
  "origine_pays": "France",
  "stock_flacon": 5,
  "contenance_ml": 10,
  "stock_ouvert_ml": "2.50",
  "seuil_alerte_stock": "10.000",
  "prix_unitaire_fini": "5000.00",
  "intensite": "forte",
  "genre_cible": "mixte",
  "categorie": "premium",
  "notes_tete": "Safran",
  "notes_coeur": "Oud",
  "notes_fond": "Ambre",
  "actif": true,
  "vendu_comme_produit_fini": true
}
```

Champs calcules :
- `prix_par_ml` = `prix_unitaire_fini / contenance_ml`.
- `stock_ml_total_reel` = `stock_flacon * contenance_ml + stock_ouvert_ml`.

Reponse type :

```json
{
  "id": 1,
  "nom": "Oud Royal",
  "code_reference": "ESS-001",
  "marque": "Fournisseur X",
  "description": "Essence boisée premium.",
  "description_ia": "Description narrative IA.",
  "fournisseur": "Nom fournisseur",
  "origine_pays": "France",
  "stock_flacon": 5,
  "contenance_ml": 10,
  "stock_ouvert_ml": "2.50",
  "stock_ml_total_reel": "52.50",
  "seuil_alerte_stock": "10.000",
  "prix_unitaire_fini": "5000.00",
  "prix_par_ml": "500.00",
  "intensite": "forte",
  "genre_cible": "mixte",
  "categorie": "premium",
  "notes_tete": "Safran",
  "notes_coeur": "Oud",
  "notes_fond": "Ambre",
  "tags": [],
  "famille_olfactive": [],
  "humeurs_compatibles": [],
  "occasions": [],
  "saisons_compatibles": [],
  "signes_astrologiques_compatibles": [],
  "moments_journee": [],
  "actif": true,
  "vendu_comme_produit_fini": true,
  "date_creation": "2026-05-15T10:00:00Z",
  "date_modification": "2026-05-15T10:00:00Z"
}
```

Note : `tags` est en lecture seule dans le serializer actuel. L'association des tags se fait plutot via admin ou logique dediee.

### 3.2 Ingredients

Lookup : `id`.

Endpoints :

- `GET /api/v1/lab/ingredients/`
- `POST /api/v1/lab/ingredients/` admin seulement
- `GET /api/v1/lab/ingredients/{id}/`
- `PUT /api/v1/lab/ingredients/{id}/` admin seulement
- `PATCH /api/v1/lab/ingredients/{id}/` admin seulement
- `DELETE /api/v1/lab/ingredients/{id}/` admin seulement

Filtres documentes :
- `note_olfactive` : `tête`, `coeur`, `fond`
- `prix_min`
- `prix_max`
- `stock_min`
- `search`
- `ordering` : `prix_par_ml`, `date_creation`, `nom`, `stock_ml`

Donnees attendues :

```json
{
  "nom": "Bergamote",
  "description": "Note fraîche, lumineuse et citronnée.",
  "note_olfactive": "tête",
  "prix_par_ml": "250.00",
  "stock_ml": "100.000",
  "actif": true
}
```

Reponse type :

```json
{
  "id": 1,
  "nom": "Bergamote",
  "description": "Note fraîche, lumineuse et citronnée.",
  "note_olfactive": "tête",
  "prix_par_ml": "250.00",
  "stock_ml": "100.000",
  "actif": true,
  "date_creation": "2026-05-15T10:00:00Z"
}
```

Exemples :

`GET /api/v1/lab/ingredients/?search=bergamote`

`GET /api/v1/lab/ingredients/?ordering=-stock_ml`

`PATCH /api/v1/lab/ingredients/1/`

```json
{
  "stock_ml": "80.000",
  "prix_par_ml": "275.00"
}
```

---

## 4. Admin Django

Base admin : `/admin/`

Utilisateur :
- `/admin/utilisateur/user/`
- `/admin/utilisateur/client/`
- `/admin/utilisateur/prestataire/`
- `/admin/utilisateur/livreur/`

Catalogue :
- `/admin/catalogue/tag/`
- `/admin/catalogue/categorieparfum/`
- `/admin/catalogue/parfum/`
- `/admin/catalogue/essence/`
- `/admin/catalogue/typeaccessoire/`
- `/admin/catalogue/accessoire/`
- `/admin/catalogue/typeflacon/`
- `/admin/catalogue/flacon/`

---

## 5. Codes d'erreur courants

Non authentifie :

```json
{
  "detail": "Authentication credentials were not provided."
}
```

Permission refusee :

```json
{
  "detail": "You do not have permission to perform this action."
}
```

Objet introuvable :

```json
{
  "detail": "Not found."
}
```

Validation :

```json
{
  "nom": ["This field is required."]
}
```
