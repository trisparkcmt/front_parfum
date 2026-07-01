# Documentation API Frontend — Accessoire Exclusif

Guide d'intégration pour les applications **web**, **mobile** et **back-office** (admin / serveuse / POS).


| Ressource                  | URL                     |
| -------------------------- | ----------------------- |
| Base API                   | `{API_URL}/api/v1/`     |
| Swagger interactif         | `{API_URL}/api/docs/`   |
| Schéma OpenAPI             | `{API_URL}/api/schema/` |
| Health check               | `{API_URL}/health/`     |
| Doc détaillée (ce fichier) | `FRONTEND_API.md`       |


> **Légende des colonnes**  
> **Auth** : Public · Auth · Superadmin · Admin/Staff · Serveuse · Client · Prestataire · Livreur  
> **Req** = requis dans le body · **Opt** = optionnel · **Auto** = calculé / injecté par le backend · **—** = pas de body

---

## Intégration rapide

### Variables d'environnement

```env
VITE_API_URL=https://api.accessoire-exclusif.com
# ou NEXT_PUBLIC_API_URL, EXPO_PUBLIC_API_URL, etc.
```

Toutes les routes ci-dessous sont relatives à `{API_URL}/api/v1/` sauf `/health/` et `/api/docs/`.

### Web (SPA avec cookies HttpOnly)

```typescript
// axios — credentials obligatoires pour les cookies JWT
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Login web → tokens dans cookies access-token / refresh-token (pas dans le JSON)
await api.post('/auth/web/login/', { email, password });

// Profil enrichi
const { data: me } = await api.get('/auth/me/');

// Refresh (si 401) — envoyer le refresh depuis cookie ou stockage selon votre implémentation
await api.post('/auth/token/refresh/', { refresh: refreshToken });
```

### Mobile / API (Bearer JWT)

```typescript
const api = axios.create({
  baseURL: `${import.meta.env.EXPO_PUBLIC_API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Type': 'mobile', // requis pour /auth/mobile/login/
  },
});

const { data } = await api.post('/auth/mobile/login/', { telephone, password });
api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
// Stocker data.refresh pour POST /auth/token/refresh/
```

### Upload d'images (catalogue)

Utiliser `FormData` + `multipart/form-data` :

```typescript
const form = new FormData();
form.append('nom', 'Royal Oud');
form.append('prix_unitaire', '35000');
form.append('contenance_ml', '50');
form.append('image_principale', file);
await api.post('/shop/parfums/', form, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
```

### Panier invité

Le backend crée un panier par session. Conserver `panier.id` retourné par `GET /orders/panier/` et le renvoyer dans `panier_id` à chaque action panier / checkout.

### Deux formats de pagination


| Contexte            | Query                  | Clé des résultats                                                |
| ------------------- | ---------------------- | ---------------------------------------------------------------- |
| Shop / Lab          | `?page=1&limit=50`     | `resultats` (+ `pages`, `page_actuelle`, `suivant`, `precedent`) |
| Orders / Admin auth | `?page=1&page_size=20` | `results` (+ `next`, `previous`)                                 |


### Codes HTTP courants


| Code      | Action frontend                              |
| --------- | -------------------------------------------- |
| 400       | Afficher erreurs champ par champ ou `detail` |
| 401       | Rediriger login / refresh token              |
| 403       | Masquer l'action ou message « accès refusé » |
| 404       | Ressource supprimée ou URL incorrecte        |
| 201 / 200 | Succès — utiliser le body retourné           |


---

## Index exhaustif des endpoints

### Système


| Méthode | Endpoint       | Auth   | Body | Réponse               |
| ------- | -------------- | ------ | ---- | --------------------- |
| GET     | `/health/`     | Public | —    | `{ status, service }` |
| GET     | `/api/docs/`   | Public | —    | HTML Swagger          |
| GET     | `/api/schema/` | Public | —    | OpenAPI JSON/YAML     |


### Auth — connexion & tokens


| Méthode   | Endpoint               | Auth   | Body                                                  | Réponse                     |
| --------- | ---------------------- | ------ | ----------------------------------------------------- | --------------------------- |
| POST      | `/auth/login/`         | Public | email/tel + password                                  | 400 obsolète                |
| POST      | `/auth/web/login/`     | Public | email/tel + password                                  | user + cookies JWT          |
| POST      | `/auth/mobile/login/`  | Public | email/tel + password + header `X-Client-Type: mobile` | access, refresh, user       |
| POST      | `/auth/logout/`        | Auth   | `{}`                                                  | `{ detail }`                |
| POST      | `/auth/google/`        | Public | access_token | code | id_token                        | access, refresh, user       |
| POST      | `/auth/token/refresh/` | Public | `{ refresh }`                                         | `{ access }`                |
| POST      | `/auth/token/verify/`  | Public | `{ token }`                                           | `{}`                        |
| GET       | `/auth/user/`          | Auth   | —                                                     | user dj-rest-auth           |
| PUT/PATCH | `/auth/user/`          | Auth   | champs user                                           | user (préférer `/auth/me/`) |


### Auth — inscription & mot de passe


| Méthode | Endpoint                           | Auth   | Body                                                                   | Réponse          |
| ------- | ---------------------------------- | ------ | ---------------------------------------------------------------------- | ---------------- |
| POST    | `/auth/registration/`              | Public | email, password, password_confirm, first_name?, last_name?, telephone? | 201 `{ detail }` |
| POST    | `/auth/registration/verify-email/` | Public | `{ key }`                                                              | 200              |
| POST    | `/auth/registration/resend-email/` | Public | `{ email }`                                                            | 200              |
| POST    | `/auth/password/reset/`            | Public | `{ email }`                                                            | 200              |
| POST    | `/auth/password/reset/confirm/`    | Public | uid, token, new_password1/2                                            | 200              |
| POST    | `/auth/password/change/`           | Auth   | old_password, new_password, new_password_confirm                       | 200              |


### Auth — profil


| Méthode   | Endpoint                 | Auth | Body                                                 | Réponse                                     |
| --------- | ------------------------ | ---- | ---------------------------------------------------- | ------------------------------------------- |
| GET       | `/auth/me/`              | Auth | —                                                    | profil complet + client, favoris, commandes |
| PUT/PATCH | `/auth/me/`              | Auth | first_name, last_name, telephone?, current_password? | champs modifiés                             |
| POST      | `/auth/me/change-email/` | Auth | email, current_password?                             | `{ detail, email }`                         |


### Auth — prestataire


| Méthode | Endpoint                        | Auth | Body                     | Réponse                          |
| ------- | ------------------------------- | ---- | ------------------------ | -------------------------------- |
| POST    | `/auth/prestataire/apply/`      | Auth | `{}`                     | 201 `{ detail }`                 |
| GET     | `/auth/prestataire/dashboard/`  | Auth | ?prestataire_id=         | dashboard + payouts + historique |
| GET     | `/auth/prestataire/historique/` | Auth | ?type_operation=, ?page= | paginé CommissionLog             |
| GET     | `/auth/prestataire/payouts/`    | Auth | ?statut=, ?page=         | paginé PayoutTransaction         |


### Auth — livreur


| Méthode | Endpoint                                | Auth    | Body                                   | Réponse                        |
| ------- | --------------------------------------- | ------- | -------------------------------------- | ------------------------------ |
| GET     | `/auth/livreur/dashboard/`              | Livreur | —                                      | stats + livraisons actives     |
| GET     | `/auth/livreur/livraisons/`             | Livreur | ?statut_livraison=, ?page=             | paginé commandes               |
| POST    | `/auth/livreur/livraisons/{pk}/statut/` | Livreur | `{ action: livrer | echouer, motif? }` | `{ detail, statut_livraison }` |


### Auth — admin


| Méthode  | Endpoint                                       | Auth                | Body                                          | Réponse                        |
| -------- | ---------------------------------------------- | ------------------- | --------------------------------------------- | ------------------------------ |
| GET      | `/auth/admin/users/`                           | Superadmin/Serveuse | ?search=, ?page=                              | paginé users                   |
| PATCH    | `/auth/admin/users/{pk}/toggle-status/`        | Superadmin          | `{}`                                          | `{ detail, is_active }`        |
| GET      | `/auth/admin/prestataires/`                    | Superadmin/Serveuse | ?statut=                                      | array Prestataire              |
| PATCH    | `/auth/admin/prestataires/validate/{pk}/`      | Superadmin          | taux_commission, reduction_client_pourcentage | code_promo généré              |
| PATCH    | `/auth/admin/prestataires/{pk}/update/`        | Superadmin          | taux, reduction, statut                       | Prestataire                    |
| POST     | `/auth/admin/prestataires/{pk}/payout/`        | Superadmin/Serveuse | `{ montant }`                                 | PayoutTransaction 201          |
| GET      | `/auth/admin/payouts/`                         | Superadmin/Serveuse | ?statut=, ?prestataire=                       | paginé                         |
| GET      | `/auth/admin/stats/global/`                    | Superadmin          | —                                             | stats globales                 |
| GET      | `/auth/admin/livreurs/`                        | Superadmin/Serveuse | ?statut=                                      | paginé Livreur                 |
| POST     | `/auth/admin/livreurs/promote/`                | Superadmin          | user_id ou création user                      | Livreur 201                    |
| PATCH    | `/auth/admin/livreurs/{pk}/`                   | Superadmin          | `{ statut }`                                  | Livreur                        |
| DELETE   | `/auth/admin/livreurs/{pk}/delete/`            | Superadmin          | —                                             | 204                            |
| POST     | `/auth/admin/commandes/{pk}/affecter-livreur/` | Superadmin/Serveuse | `{ livreur_id }`                              | `{ detail, statut_livraison }` |
| GET      | `/auth/admin/livraisons/`                      | Superadmin/Serveuse | ?statut_livraison=, ?livreur_id=              | paginé                         |
| GET      | `/auth/admin/serveuses/`                       | Superadmin          | ?statut=                                      | paginé Serveuse                |
| POST     | `/auth/admin/serveuses/promote/`               | Superadmin          | user_id ou création                           | Serveuse 201                   |
| PATCH    | `/auth/admin/serveuses/{pk}/`                  | Superadmin          | `{ actif }`                                   | Serveuse                       |
| DELETE   | `/auth/admin/serveuses/{pk}/delete/`           | Superadmin          | —                                             | 204                            |
| POST/GET | `/auth/payout/webhook/`                        | Public (Monetbil)   | processing_number, status                     | `{ detail }`                   |


### Utilisateur


| Méthode   | Endpoint                                     | Auth                | Body                                 | Réponse                        |
| --------- | -------------------------------------------- | ------------------- | ------------------------------------ | ------------------------------ |
| GET       | `/utilisateur/notifications/`                | Auth                | —                                    | array Notification             |
| GET       | `/utilisateur/admin/meilleurs-clients/`      | Superadmin/Serveuse | ?filter_by=spent|orders, ?limit=     | array Client                   |
| GET       | `/utilisateur/admin/meilleurs-prestataires/` | Superadmin/Serveuse | ?filter_by=gains|orders, ?limit=     | array Prestataire              |
| GET       | `/utilisateur/prestataire-requests/`         | Superadmin/Serveuse | —                                    | array en_attente               |
| GET       | `/utilisateur/prestataire-requests/{pk}/`    | Superadmin/Serveuse | —                                    | Prestataire                    |
| POST      | `/utilisateur/devices/register/`             | Auth                | registration_token, platform         | `{ detail, platform, active }` |
| POST      | `/utilisateur/devices/unregister/`           | Auth                | `{ registration_token }`             | `{ detail }`                   |
| GET       | `/utilisateur/depenses/`                     | Serveuse/Superadmin | ?date_depense=, ?search=, ?ordering= | paginé Depense                 |
| POST      | `/utilisateur/depenses/`                     | Serveuse            | titre, description?, montant         | Depense 201 (cree_par Auto)    |
| GET       | `/utilisateur/depenses/{id}/`                | Serveuse/Superadmin | —                                    | Depense                        |
| PUT/PATCH | `/utilisateur/depenses/{id}/`                | Serveuse (auteur)   | titre?, description?, montant?       | Depense                        |
| DELETE    | `/utilisateur/depenses/{id}/`                | Superadmin          | —                                    | 204                            |


### Shop — parfums `/shop/parfums/` (lookup `slug`)


| Méthode               | Auth           | Body création (Req)               | Notes                                                                                                              |
| --------------------- | -------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| GET list              | Public         | —                                 | Filtres : search, ordering, tags, marque, genre, intensite, prix_min/max, est_nouveau, est_bestseller, page, limit |
| POST                  | Admin/Serveuse | nom, contenance_ml, prix_unitaire | slug, prix_actuel, en_promotion Auto                                                                               |
| GET `{slug}/`         | Public         | —                                 | + produits_similaires                                                                                              |
| PUT/PATCH `{slug}/`   | Admin/Serveuse | partiel ou complet                | 200 objet admin                                                                                                    |
| DELETE `{slug}/`      | Admin/Serveuse | —                                 | 204                                                                                                                |
| GET `bestsellers/`    | Public         | —                                 | array max 20                                                                                                       |
| GET `hotsellers/`     | Public         | —                                 | array max 10                                                                                                       |
| POST `{slug}/favori/` | Auth client    | `{}`                              | toggle `{ status, is_favori }`                                                                                     |


### Shop — accessoires `/shop/accessoires/` (lookup `slug`)

CRUD identique parfums. **POST Req** : `nom`, `type_accessoire`, `prix_unitaire`. Actions `bestsellers/`, `hotsellers/`, `{slug}/favori/`.

### Shop — flacons `/shop/flacons/` (lookup `slug`)

**POST Req** : `nom`, `type_flacon`, `contenance_ml`, `prix_unitaire`. CRUD standard.

### Shop — taxonomie


| Ressource             | Lookup | POST Req                                                | CRUD                                              |
| --------------------- | ------ | ------------------------------------------------------- | ------------------------------------------------- |
| `/categories-parfum/` | id     | nom                                                     | GET Public · POST/PUT/PATCH/DELETE Admin/Serveuse |
| `/types-accessoire/`  | id     | nom                                                     | idem                                              |
| `/types-flacon/`      | id     | nom                                                     | idem                                              |
| `/tags/`              | slug   | nom, type                                               | idem                                              |
| `/tags-parfum/`       | slug   | nom, type (famille_olfactive, humeur, saison, occasion) | idem                                              |
| `/tags-essence/`      | slug   | nom, type                                               | idem                                              |


### Shop — autres


| Méthode    | Endpoint                                      | Auth                                              | Body                                                | Réponse                                       |
| ---------- | --------------------------------------------- | ------------------------------------------------- | --------------------------------------------------- | --------------------------------------------- |
| GET/POST/… | `/shop/produits-essence/`                     | GET Public (actif+stock>0) · write Admin/Serveuse | POST Req: essence, taille_ml, prix                  | ProduitFiniEssence                            |
| GET        | `/shop/promotions/`                           | Public                                            | —                                                   | paginé promos actives                         |
| GET        | `/shop/favoris/`                              | Auth client                                       | —                                                   | liste favoris (lecture seule)                 |
| GET/PATCH  | `/shop/notifications/`                        | Admin/Serveuse                                    | PATCH `{ est_lu }`                                  | alertes stock                                 |
| PATCH      | `/shop/notifications/marquer_tous_comme_lus/` | Admin/Serveuse                                    | `{}`                                                | `{ updated, message }`                        |
| GET        | `/shop/notifications/non_lues/`               | Admin/Serveuse                                    | —                                                   | paginé                                        |
| GET        | `/shop/notifications/stats/`                  | Admin/Serveuse                                    | —                                                   | `{ total, non_lues, lues, par_type_produit }` |
| GET        | `/shop/mouvements-stock/`                     | Admin/Serveuse                                    | ?type_produit=, ?utilisateur=, ?search=, ?ordering= | paginé MouvementStock (lecture seule)         |
| GET        | `/shop/mouvements-stock/{id}/`                | Admin/Serveuse                                    | —                                                   | MouvementStock                                |


### Lab


| Méthode | Endpoint                              | Auth                            | Body Req (POST)                          | Notes                                                        |
| ------- | ------------------------------------- | ------------------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| CRUD    | `/lab/essences/`                      | write Admin/Serveuse            | marque, nom, code_reference, prix_par_ml | + initial_lot?, produits_finis? à la création                |
| CRUD    | `/lab/lots-essence/`                  | write Admin/Serveuse            | essence, stock_ml                        |                                                              |
| CRUD    | `/lab/ingredients/`                   | write Admin/Serveuse            | nom, prix_par_ml                         |                                                              |
| CRUD    | `/lab/tags-essence/`                  | write Admin/Serveuse            | nom, type                                |                                                              |
| GET     | `/lab/labo/essences/disponible/`      | Public                          | —                                        | essences en stock                                            |
| GET     | `/lab/labo/essences/{slug}/detail/`   | Public                          | —                                        | détail + stock_total_ml                                      |
| CRUD    | `/lab/parfums-perso/`                 | Auth (client créateur ou staff) | flacon, lignes[]                         | prix Auto, max 45% flacon                                    |
| POST    | `/lab/parfums-perso/{id}/recalculer/` | Auth                            | `{}`                                     | recalcule prix                                               |
| CRUD    | `/lab/essences-perso/`                | Auth client                     | nom, lignes[{ingredient, quantite_ml}]   | prix_par_ml_calcule Auto                                     |
| POST    | `/lab/ia-recommandation/`             | Public                          | `{ prompt }`                             | suggestions IA (parfums, essences, ingrédients, accessoires) |


### Orders — panier


| Méthode | Endpoint                                        | Auth                        | Body                                                           | Réponse          |
| ------- | ----------------------------------------------- | --------------------------- | -------------------------------------------------------------- | ---------------- |
| GET     | `/orders/panier/`                               | Public                      | ?panier_id=                                                    | PanierSerializer |
| POST    | `/orders/panier/ajouter/parfum/`                | Public                      | parfum_id, quantite, panier_id?                                | panier           |
| POST    | `/orders/panier/ajouter/accessoire/`            | Public                      | accessoire_id, quantite, panier_id?                            | panier           |
| POST    | `/orders/panier/ajouter/produit-fini-essence/`  | Public                      | produit_fini_essence_id, quantite, panier_id?                  | panier           |
| POST    | `/orders/panier/ajouter/essence-personnalisee/` | Auth                        | essence_personnalisee_id, quantite, panier_id?                 | panier           |
| POST    | `/orders/panier/ajouter/composition-directe/`   | Public                      | flacon_id, lignes[], quantite?, nom?, note_client?, panier_id? | panier           |
| PATCH   | `/orders/panier/ligne/{type}/{ligne_id}/`       | Public                      | quantite, panier_id?                                           | panier           |
| DELETE  | `/orders/panier/ligne/{type}/{ligne_id}/`       | Public                      | panier_id                                                      | panier           |
| POST    | `/orders/panier/appliquer-promo/`               | Public / Auth si code admin | code_promo, panier_id?                                         | panier           |
| POST    | `/orders/panier/retirer-promo/`                 | Public                      | panier_id?                                                     | panier           |


**type ligne panier** : `parfum` | `accessoire` | `produit-fini-essence` | `parfum-personnalise` | `essence-personnalisee`

### Orders — commandes & factures


| Méthode                   | Endpoint                                            | Auth                          | Body                                                     | Réponse            |
| ------------------------- | --------------------------------------------------- | ----------------------------- | -------------------------------------------------------- | ------------------ |
| POST                      | `/orders/commandes/passer/`                         | Public                        | panier_id?, livraison_*, note_client?, client_telephone? | Commande 201       |
| GET                       | `/orders/commandes/`                                | Auth (filtré rôle)            | ?statut=, ?search=, ?page=                               | paginé             |
| GET                       | `/orders/commandes/{numero}/`                       | Auth                          | —                                                        | CommandeSerializer |
| PATCH                     | `/orders/commandes/{numero}/`                       | Auth (admin/serveuse/livreur) | statuts / action livrer                                  | Commande           |
| GET                       | `/orders/commandes/{numero}/facture/`               | Auth                          | —                                                        | PDF binaire        |
| GET                       | `/orders/admin/factures/`                           | Superadmin/Serveuse           | ?page=                                                   | paginé factures    |
| POST                      | `/orders/admin/factures/{numero_facture}/renvoyer/` | Superadmin/Serveuse           | `{}`                                                     | `{ detail }`       |
| GET/POST/PUT/PATCH/DELETE | `/orders/admin/codes-promo/`                        | Superadmin                    | code, reduction_pourcentage, clients_autorises[]         | CodePromoAdmin     |


### POS — `/pos/` (Superadmin ou Serveuse active)


| Méthode | Endpoint                   | Body                                                                 | Réponse                                |
| ------- | -------------------------- | -------------------------------------------------------------------- | -------------------------------------- |
| GET     | `/pos/produits/recherche/` | ?q=, ?type=parfum|accessoire|essence                                 | array produits actifs, stock>0, prix>0 |
| POST    | `/pos/commandes/creer/`    | lignes[] Req ; client_*, livraison_*, code_promo?, note_interne? Opt | Commande 201 payée                     |


---

## Détail complet par section

Les sections suivantes décrivent **chaque endpoint** avec exemples JSON, champs requis/optionnels/auto et réponses d'erreur.

## Authentification


| Mécanisme      | Usage                                                                 |
| -------------- | --------------------------------------------------------------------- |
| Header JWT     | `Authorization: Bearer <access_token>`                                |
| Cookies (Web)  | `access-token` + `refresh-token` (HttpOnly, après `/auth/web/login/`) |
| Refresh token  | `POST /api/v1/auth/token/refresh/` avec `{ "refresh": "..." }`        |
| Vérifier token | `POST /api/v1/auth/token/verify/` avec `{ "token": "..." }`           |


### Rôles


| Rôle            | Condition                                        |
| --------------- | ------------------------------------------------ |
| **Public**      | Pas de token                                     |
| **Auth**        | Utilisateur connecté                             |
| **Superadmin**  | `is_superuser`                                   |
| **Admin/Staff** | `is_staff`                                       |
| **Serveuse**    | `client.serveuse.actif == true`                  |
| **Prestataire** | `client.prestataire.statut == 'actif'`           |
| **Livreur**     | `client.livreur.statut` ≠ `inactif` / `suspendu` |
| **Client**      | Profil `client` + compte actif                   |


### Permission catalogue (shop/lab)


| Action                      | Public | Admin (`is_staff`) | Serveuse active |
| --------------------------- | ------ | ------------------ | --------------- |
| GET                         | ✅      | ✅                  | ✅               |
| POST / PUT / PATCH / DELETE | ❌      | ✅                  | ✅               |


**Images** : envoyer en `multipart/form-data` ou JSON sans fichiers (`application/json`).

### Pagination catalogue (shop/lab)

Query : `?page=1&limit=50` (max 100)

```json
{
  "count": 120,
  "pages": 3,
  "page_actuelle": 1,
  "suivant": "http://.../parfums/?page=2",
  "precedent": null,
  "resultats": []
}
```

### Pagination commandes / admin

Format DRF :

```json
{
  "count": 50,
  "next": "...",
  "previous": null,
  "results": []
}
```

### Erreurs validation (400)

```json
{
  "nom": ["Ce champ est requis."],
  "detail": "Message d'erreur global"
}
```

---

## Racine & pages utilitaires


| Méthode | URL                                               | Auth   | Réponse                                                      |
| ------- | ------------------------------------------------- | ------ | ------------------------------------------------------------ |
| GET     | `/health/`                                        | Public | `{ "status": "ok", "service": "Accessoires Exclusifs API" }` |
| GET     | `/api/docs/`                                      | Public | Swagger UI (HTML)                                            |
| GET     | `/api/schema/`                                    | Public | Schéma OpenAPI                                               |
| GET     | `/accounts/confirm-email/<key>/`                  | Public | Page HTML confirmation email                                 |
| GET     | `/accounts/password/reset/confirm/<uid>/<token>/` | Public | Page HTML reset mot de passe                                 |


---

# AUTH — `/api/v1/auth/`

## Connexion

### POST `/auth/login/` — OBSOLÈTE

**Auth** : Public  
**Réponse 400** :

```json
{
  "detail": "L'endpoint '/api/v1/auth/login/' est obsolète... Utilisez '/api/v1/auth/web/login/' ou '/api/v1/auth/mobile/login/'."
}
```

### POST `/auth/web/login/` — Login Web

**Auth** : Public (throttled)

**Payload** :

```json
{
  "email": "user@mail.com",
  "password": "secret"
}
```

Ou avec téléphone :

```json
{
  "telephone": "+237612345678",
  "password": "secret"
}
```

**Réponse 200** :

```json
{
  "user": {
    "id": 1,
    "email": "user@mail.com",
    "telephone": "+237612345678",
    "first_name": "Jean",
    "last_name": "Dupont",
    "roles": ["client"]
  },
  "roles": ["client"]
}
```

- cookies HttpOnly `access-token` et `refresh-token` (pas de tokens dans le JSON).

**Erreurs** : 400 identifiants invalides, email non vérifié (`email_non_verifie: true`).

### POST `/auth/mobile/login/` — Login Mobile / API

**Auth** : Public (bloque les navigateurs sans header `X-Client-Type: mobile`)

**Payload** : identique à web login.

**Réponse 200** :

```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": { "id": 1, "email": "...", "telephone": "...", "first_name": "...", "last_name": "...", "roles": ["client"] },
  "roles": ["client"]
}
```

### POST `/auth/logout/`

**Auth** : Auth ou cookie JWT

**Payload** : `{}`

**Réponse 200** :

```json
{ "detail": "Successfully logged out." }
```

### POST `/auth/google/` — OAuth Google

**Auth** : Public

**Payload** (un des champs) :

```json
{ "access_token": "ya29..." }
```

```json
{ "code": "4/0A..." }
```

```json
{ "id_token": "..." }
```

**Réponse 200** :

```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": { "id": 1, "email": "...", "roles": ["client"] },
  "roles": ["client"]
}
```

## Inscription & mot de passe

### POST `/auth/registration/`

**Auth** : Public (throttled)

**Payload** :

```json
{
  "email": "new@mail.com",
  "password": "StrongPass123!",
  "password_confirm": "StrongPass123!",
  "first_name": "Jean",
  "last_name": "Dupont",
  "telephone": "+237612345678"
}
```


| Champ                            | Requis    |
| -------------------------------- | --------- |
| email                            | ✅         |
| password                         | ✅         |
| password_confirm                 | ✅         |
| first_name, last_name, telephone | optionnel |


**Réponse 201** : `{ "detail": "Verification e-mail sent." }`  
**Auto** : `username` depuis email, profil `Client` créé par signal.

### POST `/auth/registration/verify-email/`

```json
{ "key": "confirmation-key-from-email" }
```

### POST `/auth/registration/resend-email/`

```json
{ "email": "new@mail.com" }
```

### POST `/auth/password/reset/`

```json
{ "email": "user@mail.com" }
```

**Réponse 200** :

```json
{ "detail": "Password reset e-mail has been sent." }
```

### POST `/auth/password/reset/confirm/`

```json
{
  "uid": "MQ",
  "token": "abc123",
  "new_password1": "NewPass123!",
  "new_password2": "NewPass123!"
}
```

### POST `/auth/password/change/` — Auth requis

```json
{
  "old_password": "ancien",
  "new_password": "nouveau",
  "new_password_confirm": "nouveau"
}
```

**Réponse 200** :

```json
{ "detail": "New password has been saved." }
```

### POST `/auth/token/refresh/`

```json
{ "refresh": "eyJ..." }
```

**Réponse 200** :

```json
{ "access": "eyJ..." }
```

### POST `/auth/token/verify/`

```json
{ "token": "eyJ..." }
```

**Réponse 200** : `{}`

### GET/PUT/PATCH `/auth/user/` — dj-rest-auth générique

Préférer `/auth/me/` pour le profil enrichi.

## Profil — `/auth/me/`

### GET — Auth

**Réponse 200** :

```json
{
  "id": 1,
  "email": "user@mail.com",
  "telephone": "+237612345678",
  "first_name": "Jean",
  "last_name": "Dupont",
  "roles": ["client"],
  "client": {
    "id": 4,
    "date_naissance": null,
    "genre": "",
    "points_fidelite": 0,
    "date_creation": "2026-01-01T00:00:00Z"
  },
  "preferences": {
    "familles_olfactives": ["Boisé"],
    "humeurs": ["Romantique"],
    "saisons": [],
    "occasions": [],
    "signes_astrologiques": [],
    "moments_journee": [],
    "genres": ["mixte"]
  },
  "favoris": [
    {
      "type_produit": "parfum",
      "produit_id": 1,
      "nom_produit": "Royal Oud",
      "prix_produit": "35000.00",
      "image_produit": "https://..."
    }
  ],
  "parfums_personnalises": [],
  "commandes": []
}
```

**Auto** : `preferences` dérivées des favoris.

### PUT / PATCH — Auth

```json
{
  "first_name": "Jean",
  "last_name": "Dupont",
  "telephone": "+237699999999",
  "current_password": "secret"
}
```


| Champ     | Notes                                                              |
| --------- | ------------------------------------------------------------------ |
| telephone | `current_password` requis si changement (compte avec mot de passe) |
| email     | ❌ interdit — utiliser `/me/change-email/`                          |


**Réponse 200** :

```json
{
  "telephone": "+237699999999",
  "first_name": "Jean",
  "last_name": "Dupont"
}
```

### POST `/auth/me/change-email/` — Auth (throttled)

```json
{
  "email": "nouveau@mail.com",
  "current_password": "secret"
}
```

**Réponse 200** :

```json
{
  "detail": "Un email de confirmation a été envoyé à la nouvelle adresse.",
  "email": "nouveau@mail.com"
}
```

## Prestataire

### POST `/auth/prestataire/apply/` — Auth

**Payload** : `{}`

**Réponse 201** :

```json
{ "detail": "Demande envoyée avec succès." }
```

**Auto** : crée `Prestataire` avec `statut='en_attente'`, email de confirmation.

### GET `/auth/prestataire/dashboard/` — Auth

Query admin : `?prestataire_id=2`

**Réponse 200** :

```json
{
  "id": 2,
  "solde_commission": "45000.00",
  "taux_commission": "10.00",
  "reduction_client_pourcentage": "5.00",
  "code_promo": "ACC-X7K2",
  "statut": "actif",
  "total_gains": "120000.00",
  "total_retraits": "75000.00",
  "solde_bloque": "5000.00",
  "payouts_recents": [
    {
      "id": 1,
      "prestataire": 2,
      "montant": "5000.00",
      "telephone_destination": "237612345678",
      "reference_unique": "payout_abc",
      "statut": "en_cours",
      "motif_echec": null,
      "date_creation": "2026-06-01T10:00:00Z",
      "date_finalisation": null
    }
  ],
  "historique_recent": [
    {
      "id": 1,
      "type_operation": "commission",
      "montant": "3500.00",
      "reference_commande": "CMD-AB12",
      "date_operation": "2026-06-01T09:00:00Z",
      "description": "Commission commande CMD-AB12"
    }
  ]
}
```

### GET `/auth/prestataire/historique/` — Auth, paginé

**Description** : Récupère l'historique financier complet (crédits de commissions sur ventes et débits de retraits) du prestataire connecté. L'administrateur peut spécifier `?prestataire_id=` pour consulter l'historique d'un autre prestataire.

Query : `?type_operation=`, `?prestataire_id=`, `?page=`

**Réponse 200** :
```json
{
  "count": 45,
  "next": "https://api.domain.com/api/v1/auth/prestataire/historique/?page=2",
  "previous": null,
  "results": [
    {
      "id": 125,
      "type_operation": "vente",
      "montant": "3500.00",
      "reference_commande": "CMD-AB12",
      "date_operation": "2026-06-29T14:15:00Z",
      "description": "Commission sur la vente de la commande CMD-AB12"
    },
    {
      "id": 124,
      "type_operation": "retrait",
      "montant": "-25000.00",
      "reference_commande": null,
      "date_operation": "2026-06-28T10:00:00Z",
      "description": "Retrait de commission Mobile Money réussi vers 237612345678 (Ref: payout_a1b2c3)."
    }
  ]
}
```

### GET `/auth/prestataire/payouts/` — Auth, paginé

**Description** : Liste toutes les demandes de virement mobile money (payouts) initiées pour le prestataire connecté (ou pour l'admin via `?prestataire_id=`).

Query : `?statut=en_cours|succes|echec`, `?prestataire_id=`, `?page=`

**Réponse 200** :
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 5,
      "prestataire": 2,
      "montant": "25000.00",
      "telephone_destination": "237612345678",
      "reference_unique": "payout_a1b2c3",
      "statut": "succes",
      "motif_echec": null,
      "date_creation": "2026-06-28T09:55:00Z",
      "date_finalisation": "2026-06-28T10:00:00Z"
    }
  ]
}
```

## Livreur

### GET `/auth/livreur/dashboard/` — Livreur actif

**Réponse 200** :

```json
{
  "id": 1,
  "statut": "disponible",
  "nombre_livraisons": 42,
  "livraisons_actives": [
    {
      "id": 55,
      "numero_commande": "CMD-XY12",
      "statut": "validé",
      "statut_livraison": "assignée",
      "livraison_nom_complet": "Jean Dupont",
      "livraison_quartier": "Bastos",
      "livraison_ville": "Yaoundé",
      "livraison_telephone": "+237612345678",
      "statut_paiement": "en_attente",
      "total_ttc": "45000.00",
      "date_creation": "2026-06-01T10:00:00Z",
      "date_livraison_reelle": null,
      "note_client": "",
      "motif_echec_livraison": null,
      "client_nom": "Jean Dupont"
    }
  ]
}
```

### GET `/auth/livreur/livraisons/` — Livreur actif, paginé

**Description** : Récupère la liste des commandes de livraison attribuées au livreur connecté.

Query : `?statut_livraison=`, `?page=`

**Réponse 200** :
```json
{
  "count": 15,
  "next": "https://api.domain.com/api/v1/auth/livreur/livraisons/?page=2",
  "previous": null,
  "results": [
    {
      "id": 55,
      "numero_commande": "CMD-XY12",
      "statut": "validé",
      "statut_livraison": "assignée",
      "livraison_nom_complet": "Jean Dupont",
      "livraison_quartier": "Bastos",
      "livraison_ville": "Yaoundé",
      "livraison_telephone": "+237612345678",
      "statut_paiement": "en_attente",
      "total_ttc": "45000.00",
      "date_creation": "2026-06-29T10:00:00Z",
      "date_livraison_reelle": null,
      "note_client": "Livrer après 16h s'il vous plaît",
      "motif_echec_livraison": null,
      "client_nom": "Jean Dupont"
    }
  ]
}
```

### PATCH `/auth/livreur/livraisons/{pk}/statut/` — Livreur actif

**Description** : Permet au livreur connecté de mettre à jour le statut d'une livraison (l'enregistrer comme livrée ou échouée avec un motif).

**Payload (livrer)** :
```json
{ "action": "livrer" }
```

**Payload (echouer)** :
```json
{
  "action": "echouer",
  "motif": "Client absent"
}
```

**Réponse 200 (livrer)** :
```json
{
  "detail": "Livraison validée avec succès.",
  "statut_livraison": "livrée"
}
```

**Réponse 200 (echouer)** :
```json
{
  "detail": "Échec de livraison enregistré.",
  "statut_livraison": "échouée"
}
```

**Auto si livrer** : `statut_paiement='payé'`, `statut='livrée'`, `date_livraison_reelle`, incrémente `nombre_livraisons`.

## Admin — Utilisateurs & Prestataires

### GET `/auth/admin/users/` — Superadmin ou Serveuse (lecture)

Query : `?search=`, `?page=`, `?page_size=`

**Réponse 200** :

```json
{
  "count": 150,
  "next": "...",
  "previous": null,
  "results": [
    {
      "id": 1,
      "email": "user@mail.com",
      "telephone": "+237612345678",
      "first_name": "Jean",
      "last_name": "Dupont",
      "role": "client",
      "is_active": true,
      "is_staff": false,
      "date_joined": "2026-01-01T00:00:00Z",
      "is_prestataire": false,
      "prestataire_statut": null
    }
  ]
}
```

### PATCH `/auth/admin/users/{pk}/toggle-status/` — Superadmin

**Payload** : `{}`

**Réponse 200** :

```json
{
  "detail": "Utilisateur bloqué avec succès.",
  "is_active": false
}
```

### GET `/auth/admin/prestataires/` — Superadmin ou Serveuse (lecture)

**Description** : Permet à l'administrateur ou à la serveuse de lister tous les prestataires, avec un filtre optionnel sur le statut.

Query : `?statut=en_attente|actif|suspendu|inactif`

**Réponse 200** :
```json
[
  {
    "id": 2,
    "client": 4,
    "user_details": {
      "id": 10,
      "email": "partenaire@mail.com",
      "telephone": "+237612345678",
      "first_name": "Jean",
      "last_name": "Dupont",
      "roles": ["client", "prestataire"]
    },
    "code_promo": "ACC-X7K2",
    "taux_commission": "10.00",
    "reduction_client_pourcentage": "5.00",
    "solde_commission": "45000.00",
    "statut": "actif",
    "date_creation": "2026-06-01T10:00:00Z",
    "date_modification": "2026-06-01T10:05:00Z"
  }
]
```

### PATCH `/auth/admin/prestataires/validate/{pk}/` — Superadmin

```json
{
  "taux_commission": "10.00",
  "reduction_client_pourcentage": "5.00"
}
```

**Réponse 200** :

```json
{
  "detail": "Prestataire validé avec succès.",
  "code_promo": "ACC-X7K2",
  "taux_commission": "10.00",
  "reduction_client_pourcentage": "5.00"
}
```

**Auto** : génère `code_promo`, `statut='actif'`, email HTML.

### PATCH `/auth/admin/prestataires/{pk}/update/` — Superadmin

```json
{
  "taux_commission": "12.00",
  "reduction_client_pourcentage": "7.00",
  "statut": "actif"
}
```

### POST `/auth/admin/prestataires/{pk}/payout/` — Superadmin ou Serveuse

```json
{ "montant": "25000.00" }
```

**Réponse 201** :

```json
{
  "id": 5,
  "prestataire": 2,
  "montant": "25000.00",
  "telephone_destination": "237612345678",
  "reference_unique": "payout_a1b2c3",
  "statut": "en_cours",
  "motif_echec": null,
  "date_creation": "2026-06-01T10:00:00Z",
  "date_finalisation": null
}
```

### GET `/auth/admin/payouts/` — Superadmin ou Serveuse

**Description** : Liste tous les retraits (payouts) initiés dans le système pour l'ensemble des prestataires.

Query : `?statut=en_cours|succes|echec`, `?prestataire=`, `?page=`

**Réponse 200** :
```json
{
  "count": 120,
  "next": "https://api.domain.com/api/v1/auth/admin/payouts/?page=2",
  "previous": null,
  "results": [
    {
      "id": 5,
      "prestataire": 2,
      "montant": "25000.00",
      "telephone_destination": "237612345678",
      "reference_unique": "payout_a1b2c3",
      "statut": "succes",
      "motif_echec": null,
      "date_creation": "2026-06-28T09:55:00Z",
      "date_finalisation": "2026-06-28T10:00:00Z"
    }
  ]
}
```

### GET `/auth/admin/stats/global/` — Superadmin

**Réponse 200** :

```json
{
  "total_users": 1250,
  "total_prestataires_actifs": 45,
  "solde_total_commission_dus": "890000.00"
}
```

## Admin — Livreurs & Livraisons

### GET `/auth/admin/livreurs/` — Superadmin ou Serveuse (lecture)

Query : `?statut=`, paginé.

**Réponse** :

```json
{
  "results": [
    {
      "id": 1,
      "user_details": {
        "id": 10,
        "email": "livreur@mail.com",
        "telephone": "+237612345678",
        "first_name": "Paul",
        "last_name": "Martin",
        "roles": ["client", "livreur"]
      },
      "photo": "",
      "statut": "disponible",
      "nombre_livraisons": 42,
      "date_embauche": "2026-01-01",
      "date_creation": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### POST `/auth/admin/livreurs/promote/` — Superadmin

**Description** : Promeut un client existant en tant que livreur ou crée un nouvel utilisateur et l'enregistre directement comme livreur.

Option A — client existant :
```json
{
  "user_id": 10,
  "photo": "https://domain/media/livreurs/paul.jpg",
  "date_embauche": "2026-06-01"
}
```

Option B — création :
```json
{
  "email": "paul.livreur@mail.com",
  "telephone": "+237699887766",
  "password": "StrongPassword123!",
  "first_name": "Paul",
  "last_name": "Martin",
  "genre": "homme",
  "photo": "https://domain/media/livreurs/paul.jpg",
  "date_embauche": "2026-06-01"
}
```

**Réponse 201** :
```json
{
  "id": 1,
  "user_details": {
    "id": 10,
    "email": "paul.livreur@mail.com",
    "telephone": "+237699887766",
    "first_name": "Paul",
    "last_name": "Martin",
    "roles": ["client", "livreur"]
  },
  "photo": "https://domain/media/livreurs/paul.jpg",
  "statut": "disponible",
  "note_moyenne": "0.00",
  "nombre_livraisons": 0,
  "date_embauche": "2026-06-01",
  "date_creation": "2026-06-29T14:15:00Z"
}
```

**Auto** : `statut='disponible'`.

### PATCH `/auth/admin/livreurs/{pk}/` — Superadmin

```json
{ "statut": "disponible" }
```

**statut** : `disponible` | `en_livraison` | `inactif` | `suspendu`

### DELETE `/auth/admin/livreurs/{pk}/delete/` — Superadmin

**Réponse 204** :

```json
{ "detail": "Livreur Paul Martin supprimé avec succès." }
```

### POST `/auth/admin/commandes/{pk}/affecter-livreur/` — Superadmin ou Serveuse

```json
{ "livreur_id": 1 }
```

**Réponse 200** :

```json
{
  "detail": "Commande assignée avec succès au livreur Martin Paul.",
  "statut_livraison": "assignée"
}
```

### GET `/auth/admin/livraisons/` — Superadmin ou Serveuse

**Description** : Permet de suivre l'état de toutes les livraisons assignées dans le système.

Query : `?statut_livraison=`, `?livreur_id=`, `?page=`

**Réponse 200** :
```json
{
  "count": 35,
  "next": "https://api.domain.com/api/v1/auth/admin/livraisons/?page=2",
  "previous": null,
  "results": [
    {
      "id": 55,
      "numero_commande": "CMD-XY12",
      "statut": "validé",
      "statut_livraison": "assignée",
      "livraison_nom_complet": "Jean Dupont",
      "livraison_quartier": "Bastos",
      "livraison_ville": "Yaoundé",
      "livraison_telephone": "+237612345678",
      "statut_paiement": "en_attente",
      "total_ttc": "45000.00",
      "date_creation": "2026-06-29T10:00:00Z",
      "date_livraison_reelle": null,
      "note_client": "Livrer après 16h s'il vous plaît",
      "motif_echec_livraison": null,
      "client_nom": "Jean Dupont"
    }
  ]
}
```

## Admin — Serveuses

### GET `/auth/admin/serveuses/` — Superadmin

Query : `?statut=`, paginé.

**Réponse** :

```json
{
  "results": [
    {
      "id": 1,
      "user_details": { "id": 5, "email": "...", "roles": ["client", "serveuse"] },
      "actif": true,
      "nombre_services": 0,
      "note_moyenne": "0.00",
      "date_embauche": "2026-01-01",
      "date_creation": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### POST `/auth/admin/serveuses/promote/` — Superadmin

Même structure que livreur promote (sans `photo`).

### PATCH `/auth/admin/serveuses/{pk}/` — Superadmin

```json
{ "actif": false }
```

### DELETE `/auth/admin/serveuses/{pk}/delete/` — Superadmin

**Réponse 204**.

## Webhook Monetbil

### POST / GET `/auth/payout/webhook/` — Public (Monetbil)

**Payload** (body POST ou query GET) :

```
processing_number=payout_abc123&status=success&message=OK
```

**status** : `success` | `failed` | `cancelled`

**Réponse 200** :

```json
{ "detail": "Webhook traité avec succès" }
```

---

# UTILISATEUR — `/api/v1/utilisateur/`

### GET/POST/PATCH `/notifications/` — Auth

**Description** : 
- **GET** : Récupère la liste des notifications destinées à l'utilisateur connecté (les administrateurs et serveuses reçoivent également les notifications globales d'administration).
- **POST / PATCH** : Marque toutes les notifications personnelles de l'utilisateur connecté (`recipient=user`) comme lues. Cette opération est strictement personnelle et n'affecte pas les notifications des autres utilisateurs.

**Réponse 200 (GET)** :
```json
[
  {
    "id": 1,
    "type": "code_promo_admin",
    "title": "Code promo exclusif !",
    "message": "Profitez de 15% de réduction...",
    "url": "/api/v1/orders/panier/",
    "is_read": false,
    "metadata": { "code_promo": "VIP2026" },
    "created_at": "2026-06-01T10:00:00Z"
  }
]
```

**Réponse 200 (POST/PATCH)** :
```json
{
  "detail": "Toutes vos notifications ont été marquées comme lues.",
  "updated": 1
}
```

### GET `/admin/meilleurs-clients/` — Superadmin ou Serveuse

Query : `?filter_by=spent|orders` (défaut `spent`), `?limit=10`

**Réponse 200** :

```json
[
  {
    "id": 4,
    "user_details": {
      "id": 10,
      "email": "client@mail.com",
      "telephone": "+237612345678",
      "first_name": "Jean",
      "last_name": "Dupont",
      "roles": ["client"]
    },
    "date_naissance": null,
    "genre": "",
    "points_fidelite": 0
  }
]
```

### GET `/admin/meilleurs-prestataires/` — Superadmin ou Serveuse

**Description** : Retourne le classement des prestataires les plus performants, triés par montant total des commissions générées (`gains`) ou par nombre de commandes associées (`orders`).

Query : `?filter_by=gains|orders` (défaut `gains`), `?limit=`

**Réponse 200** :
```json
[
  {
    "id": 2,
    "client": 4,
    "user_details": {
      "id": 10,
      "email": "partenaire@mail.com",
      "telephone": "+237612345678",
      "first_name": "Jean",
      "last_name": "Dupont",
      "roles": ["client", "prestataire"]
    },
    "code_promo": "ACC-X7K2",
    "taux_commission": "10.00",
    "reduction_client_pourcentage": "5.00",
    "solde_commission": "45000.00",
    "statut": "actif",
    "date_creation": "2026-06-01T10:00:00Z",
    "date_modification": "2026-06-01T10:05:00Z",
    "total_paid_orders": 12,
    "total_gains": "120000.00"
  }
]
```

### GET `/prestataire-requests/` — Superadmin ou Serveuse (lecture)

**Description** : Liste toutes les demandes d'inscription de prestataires qui sont en attente de validation.

**Réponse 200** :
```json
[
  {
    "id": 3,
    "client": 5,
    "user_details": {
      "id": 11,
      "email": "candidat@mail.com",
      "telephone": "+237677777777",
      "first_name": "Pierre",
      "last_name": "Mendy",
      "roles": ["client"]
    },
    "code_promo": null,
    "taux_commission": "0.00",
    "reduction_client_pourcentage": "0.00",
    "solde_commission": "0.00",
    "statut": "en_attente",
    "date_creation": "2026-06-29T12:00:00Z",
    "date_modification": "2026-06-29T12:00:00Z"
  }
]
```

### GET `/prestataire-requests/{pk}/` — Superadmin ou Serveuse (lecture)

**Description** : Récupère les détails d'une demande de prestataire spécifique en attente de validation.

**Réponse 200** :
```json
{
  "id": 3,
  "client": 5,
  "user_details": {
    "id": 11,
    "email": "candidat@mail.com",
    "telephone": "+237677777777",
    "first_name": "Pierre",
    "last_name": "Mendy",
    "roles": ["client"]
  },
  "code_promo": null,
  "taux_commission": "0.00",
  "reduction_client_pourcentage": "0.00",
  "solde_commission": "0.00",
  "statut": "en_attente",
  "date_creation": "2026-06-29T12:00:00Z",
  "date_modification": "2026-06-29T12:00:00Z"
}
```

### POST `/devices/register/` — Auth

```json
{
  "registration_token": "fcm-token-...",
  "platform": "web"
}
```

**platform** : `web` | `android` | `ios`

**Réponse 200** :

```json
{
  "detail": "Token FCM enregistré avec succès.",
  "platform": "web",
  "active": true
}
```

### POST `/devices/unregister/` — Auth

```json
{ "registration_token": "fcm-token-..." }
```

**Réponse 200** :

```json
{ "detail": "Token FCM désactivé avec succès." }
```

---

# SHOP — `/api/v1/shop/`

Permission écriture : **Admin ou Serveuse active**.

## Parfums — `/parfums/`

Lookup detail : `slug`

### GET `/parfums/` — Liste

**Auth** : Public (admin voit aussi inactifs)

**Query** : `?search=`, `?ordering=`, filtres (`categorie`, `genre_cible`, `prix_min`, `prix_max`, `en_stock`, tags…), `?page=`, `?limit=`

**Réponse 200 (public, dans `resultats`)** :

```json
{
  "id": 1,
  "marque": "Maison X",
  "nom": "Royal Oud",
  "slug": "royal-oud-48291",
  "contenance_ml": 50,
  "prix_unitaire": "35000.00",
  "prix_actuel": "31500.00",
  "prix_promotionnel": "31500.00",
  "date_debut": "2026-01-01T00:00:00Z",
  "date_fin": "2026-03-01T00:00:00Z",
  "en_promotion": true,
  "genre_cible": "mixte",
  "intensite": "forte",
  "est_nouveau": false,
  "est_bestseller": true,
  "image_principale": "https://domain/media/parfums/...jpg",
  "date_creation": "2026-01-15T10:00:00Z",
  "is_favori": false,
  "categorie": 2
}
```

**Réponse admin** : + `reference_sku`, `stock_quantite`, `taux_reduction`, `description_courte`, notes, tags, images supp.

### POST `/parfums/` — Créer (Admin/Serveuse)

**Payload minimal** :

```json
{
  "nom": "Royal Oud",
  "contenance_ml": 50,
  "prix_unitaire": "35000.00"
}
```

**Payload complet** :

```json
{
  "nom": "Royal Oud",
  "marque": "Maison X",
  "reference_sku": "PARF-001",
  "description_courte": "Oud boisé intense",
  "contenance_ml": 50,
  "prix_unitaire": "35000.00",
  "prix_promotionnel": "31500.00",
  "date_debut": "2026-06-01T00:00:00Z",
  "date_fin": "2026-08-31T23:59:59Z",
  "stock_quantite": 100,
  "seuil_alerte_stock": 5,
  "genre_cible": "mixte",
  "intensite": "forte",
  "notes_tete": "Bergamote, Cardamome",
  "notes_coeur": "Oud, Rose",
  "notes_fond": "Ambre, Musc",
  "tags": [1, 5, 12],
  "categorie": 2,
  "est_nouveau": true,
  "est_bestseller": false
}
```

**Multipart** : `image_principale`, `image_supp_1` … `image_supp_4` (fichiers).

| Champ | Requis | Auto backend |
|-------|--------|--------------|
| nom | ✅ | |
| contenance_ml | ✅ | |
| prix_unitaire | ✅ | |
| stock_quantite | | défaut `0` |
| seuil_alerte_stock | | défaut `5` — déclenche une alerte lorsque le stock atteint ce seuil |
| slug | | généré si vide |
| prix_actuel, en_promotion, taux_reduction | | calculés |
| famille_olfactive, humeurs… | | dérivés des tags |
| date_creation | | auto |

**Notification automatique** : une alerte est envoyée à l'admin et la serveuse si `stock_quantite <= seuil_alerte_stock` au moment de la création ou d'une modification de stock.

**Réponse 201** : objet parfum admin complet.

### GET `/parfums/{slug}/` — Détail

**Description** : Récupère les informations détaillées d'un parfum à partir de son slug unique.

**Réponse 200** :
```json
{
  "id": 1,
  "marque": "Accessoire Exclusif",
  "nom": "Royal Oud",
  "slug": "royal-oud-48291",
  "reference_sku": "PRF-ROY-OUD-100",
  "description_courte": "Un oud royal, boisé et mystérieux.",
  "description_longue": "L'expression ultime du luxe avec des notes boisées et d'épices chaudes.",
  "contenance_ml": 100,
  "prix_unitaire": "35000.00",
  "prix_actuel": "35000.00",
  "prix_promotionnel": null,
  "date_debut": null,
  "date_fin": null,
  "taux_reduction": null,
  "en_promotion": false,
  "genre_cible": "mixte",
  "intensite": "forte",
  "notes_tete": "Safran, Cannelle",
  "notes_coeur": "Bois de oud, Rose",
  "notes_fond": "Ambre, Patchouli, Musc",
  "tags": [
    {
      "id": 1,
      "nom": "Boisé",
      "slug": "boise-olfactive-12345",
      "type": "famille_olfactive"
    }
  ],
  "famille_olfactive": ["Boisé"],
  "humeurs_compatibles": ["Savant", "Chaleureux"],
  "occasions": ["Soirée", "Cérémonie"],
  "saisons_compatibles": ["Hiver", "Automne"],
  "est_nouveau": false,
  "est_bestseller": true,
  "image_principale": "https://api.domain.com/media/parfums/royal-oud-48291/main.jpg",
  "image_supp_1": "https://api.domain.com/media/parfums/royal-oud-48291/gal1.jpg",
  "image_supp_2": null,
  "image_supp_3": null,
  "image_supp_4": null,
  "stock_quantite": 15,
  "date_creation": "2026-01-01T00:00:00Z",
  "produits_similaires": [
    {
      "id": 2,
      "nom": "Imperial Musk",
      "slug": "imperial-musk-19401",
      "prix_actuel": "32000.00",
      "image_principale": "https://api.domain.com/media/parfums/imperial-musk-19401/main.jpg"
    }
  ],
  "is_favori": false,
  "categorie": 1
}
```

### PUT / PATCH `/parfums/{slug}/` — Modifier (Admin/Serveuse)

Mêmes champs que POST (PATCH = partiel).

**Réponse 200** : objet mis à jour.

### DELETE `/parfums/{slug}/` — Supprimer (Admin/Serveuse)

**Réponse 204** : corps vide.

### GET `/parfums/bestsellers/` — Public

**Réponse 200** : array max 20 (non paginé).

```json
[
  {
    "id": 1,
    "nom": "Royal Oud",
    "slug": "royal-oud-48291",
    "prix_actuel": "35000.00",
    "image_principale": "https://..."
  }
]
```

### GET `/parfums/hotsellers/` — Public

**Réponse 200** : array max 10 (mois courant), même format.

### POST `/parfums/{slug}/favori/` — Auth client

**Payload** : `{}`

**Réponse 200** :

```json
{ "status": "ajouté", "is_favori": true }
```

```json
{ "status": "retiré", "is_favori": false }
```

## Accessoires — `/accessoires/`

Lookup : `slug`. CRUD identique aux parfums.

### GET `/accessoires/{slug}/` — Détail

**Description** : Récupère les détails d'un accessoire via son slug.

**Réponse 200** :
```json
{
  "id": 3,
  "marque": "Accessoire Exclusif",
  "nom": "Pochette velours Noir",
  "slug": "pochette-velours-noir-84920",
  "reference_sku": "ACC-POC-VEL-NOI",
  "type_accessoire": {
    "id": 1,
    "nom": "Pochettes",
    "slug": "pochettes-10482",
    "description": "Pochettes de rangement exclusives"
  },
  "description_courte": "Pochette de rangement douce en velours noir.",
  "description_longue": "Protégez vos flacons de parfum précieux dans cette pochette élégante.",
  "matiere": "Velours",
  "couleur": "Noir",
  "taille": "Standard",
  "prix_unitaire": "5000.00",
  "prix_promotionnel": null,
  "prix_actuel": "5000.00",
  "date_debut": null,
  "date_fin": null,
  "taux_reduction": null,
  "en_promotion": false,
  "stock_quantite": 50,
  "seuil_alerte_stock": 3,
  "poids_grammes": "50.00",
  "image_principale": "https://api.domain.com/media/accessoires/pochette-velours-noir/main.jpg",
  "image_supp_1": null,
  "image_supp_2": null,
  "image_supp_3": null,
  "image_supp_4": null,
  "actif": true,
  "est_bestseller": false,
  "est_hotseller": false,
  "date_creation": "2026-06-01T10:00:00Z",
  "date_modification": "2026-06-01T10:00:00Z",
  "produits_similaires": [
    {
      "id": 4,
      "nom": "Pochette velours Rouge",
      "slug": "pochette-velours-rouge-84921",
      "prix_actuel": "5000.00",
      "image_principale": "https://api.domain.com/media/accessoires/pochette-velours-rouge/main.jpg"
    }
  ],
  "is_favori": false
}
```

### POST `/accessoires/` — Créer (Admin/Serveuse)

**Payload minimal** :

```json
{
  "nom": "Écrin velours noir",
  "type_accessoire": 1,
  "prix_unitaire": "8500.00"
}
```

**Payload complet** :

```json
{
  "nom": "Écrin velours noir",
  "marque": "AE",
  "reference_sku": "ACC-001",
  "type_accessoire": 1,
  "description_courte": "Écrin premium",
  "description_longue": "Description complète...",
  "matiere": "Velours",
  "couleur": "Noir",
  "taille": "M",
  "prix_unitaire": "8500.00",
  "prix_promotionnel": "7500.00",
  "date_debut": null,
  "date_fin": null,
  "stock_quantite": 50,
  "seuil_alerte_stock": 3,
  "poids_grammes": "120.00",
  "actif": true,
  "est_bestseller": false,
  "est_hotseller": false
}
```

**Réponse 201** : objet accessoire admin (type_accessoire nested en lecture).

### GET `/accessoires/bestsellers/` / `/hotsellers/` — Public

Même format que parfums bestsellers.

### POST `/accessoires/{slug}/favori/` — Auth

Même format que parfums favori.

## Flacons — `/flacons/`

Lookup : `slug`

### POST `/flacons/` — Créer (Admin/Serveuse)

**Payload minimal** :

```json
{
  "nom": "Flacon spray 50ml",
  "type_flacon": 1,
  "contenance_ml": 50,
  "prix_unitaire": "2500.00"
}
```

**Payload complet** :

```json
{
  "nom": "Flacon spray 50ml",
  "reference_sku": "FLC-50-SPR",
  "type_flacon": 1,
  "contenance_ml": 50,
  "matiere": "Verre",
  "couleur": "Transparent",
  "hauteur_cm": "12.50",
  "largeur_cm": "4.00",
  "poids_grammes": "85.00",
  "prix_unitaire": "2500.00",
  "stock_quantite": 200,
  "seuil_alerte_stock": 5,
  "actif": true
}
```

**Réponse 201** :

```json
{
  "id": 3,
  "nom": "Flacon spray 50ml",
  "slug": "flacon-spray-50ml-12345",
  "reference_sku": "FLC-50-SPR",
  "type_flacon": {
    "id": 1,
    "nom": "Spray",
    "slug": "spray-12345",
    "description": "",
    "image": "https://...",
    "actif": true,
    "taux_reduction": "0.00",
    "date_creation": "2026-01-01T00:00:00Z"
  },
  "contenance_ml": 50,
  "matiere": "Verre",
  "couleur": "Transparent",
  "hauteur_cm": "12.50",
  "largeur_cm": "4.00",
  "poids_grammes": "85.00",
  "prix_unitaire": "2500.00",
  "stock_quantite": 200,
  "seuil_alerte_stock": 5,
  "stock_suffisant": true,
  "image_principale": "https://...",
  "image_supp_1": null,
  "image_supp_2": null,
  "image_supp_3": null,
  "image_supp_4": null,
  "actif": true,
  "date_creation": "2026-01-01T00:00:00Z",
  "date_modification": "2026-01-01T00:00:00Z"
}
```

## Catégories parfum — `/categories-parfum/`

Lookup : `id`

### POST — Créer (Admin/Serveuse)

```json
{
  "nom": "Premium",
  "description": "Collection haut de gamme",
  "ordre_affichage": 1,
  "actif": true,
  "taux_reduction": "10.00",
  "date_debut": "2026-01-01T00:00:00Z",
  "date_fin": null,
  "message_promotion": "-10% sur toute la catégorie"
}
```

- `image` (multipart)

**Réponse 201** :

```json
{
  "id": 1,
  "nom": "Premium",
  "slug": "premium-12345",
  "description": "Collection haut de gamme",
  "image": "https://...",
  "ordre_affichage": 1,
  "actif": true,
  "taux_reduction": "10.00",
  "date_debut": "2026-01-01T00:00:00Z",
  "date_fin": null,
  "message_promotion": "-10% sur toute la catégorie",
  "date_creation": "2026-01-01T00:00:00Z"
}
```

## Types accessoire — `/types-accessoire/`

### POST — Créer (Admin/Serveuse)

```json
{
  "nom": "Écrins",
  "description": "Boîtes et écrins",
  "actif": true,
  "taux_reduction": "5.00",
  "date_debut": null,
  "date_fin": null,
  "message_promotion": ""
}
```

- `icone` (multipart)

## Types flacon — `/types-flacon/`

### POST — Créer (Admin/Serveuse)

```json
{
  "nom": "Spray",
  "description": "Vaporisateur",
  "actif": true,
  "taux_reduction": "0.00"
}
```

- `image` (multipart)

## Tags — `/tags/`

Lookup : `slug`

### POST — Créer (Admin/Serveuse)

```json
{
  "nom": "Boisé",
  "type": "famille_olfactive"
}
```

**Types** : `famille_olfactive` | `signe_astrologique` | `humeur` | `saison` | `moment_journee` | `occasion`

**Réponse 201** :

```json
{
  "id": 1,
  "nom": "Boisé",
  "slug": "boise-famille_olfactive-12345",
  "type": "famille_olfactive"
}
```

## Tags parfum — `/tags-parfum/`

CRUD identique. Types filtrés : `famille_olfactive`, `humeur`, `saison`, `occasion`.  
Réponse inclut `libelle` (= nom).

## Tags essence (shop) — `/tags-essence/`

CRUD tags actifs (tous types).

## Produits essence — `/produits-essence/`

Lookup : `id`

### POST — Créer (Admin/Serveuse)

```json
{
  "essence": 5,
  "taille_ml": 30,
  "prix": "15000.00",
  "prix_promotionnel": "13500.00",
  "stock_disponible": 25,
  "actif": true
}
```

**Réponse 201** :

```json
{
  "id": 10,
  "essence": 5,
  "essence_details": { "id": 5, "marque": "...", "nom": "...", "code_reference": "ESS-001", ... },
  "taille_ml": 30,
  "prix": "15000.00",
  "prix_promotionnel": "13500.00",
  "prix_actuel": "13500.00",
  "prix_par_ml": "450.00",
  "stock_disponible": 25,
  "stock_precedent": 0,
  "actif": true,
  "image_principale": "https://...",
  "image_supp_1": null,
  "image_supp_2": null,
  "image_supp_3": null,
  "image_supp_4": null
}
```

**Auto** : si couple `(essence, taille_ml)` existe → update ; prélèvement stock lots FIFO si stock augmente.

**GET list public** : `actif=true` ET `stock_disponible > 0`.

## Promotions — `/promotions/`

### GET list only — Public

**Réponse 200** (paginé) :

```json
{
  "type_article": "parfum",
  "id": 1,
  "slug": "royal-oud-48291",
  "nom": "Royal Oud",
  "marque": "Maison X",
  "image_principale": "https://...",
  "prix_original": "35000.00",
  "prix_promotionnel": "31500.00",
  "taux_reduction": 10.0,
  "message_promotion": "",
  "date_debut": "2026-01-01T00:00:00Z",
  "date_fin": "2026-03-01T00:00:00Z"
}
```

## Favoris — `/favoris/`

### GET list / GET detail — Auth client (lecture seule)

**Réponse 200** :

```json
{
  "id": 1,
  "date_ajout": "2026-06-01T12:00:00Z",
  "nom_produit": "Royal Oud",
  "prix_produit": "35000.00",
  "image_produit": "https://...",
  "type_produit": "parfum",
  "slug_produit": "royal-oud-48291",
  "id_produit": 1
}
```

## Notifications stock — `/notifications/`

**Auth** : Admin/Serveuse uniquement.

### GET list

Query : `?type_produit=essence|accessoire|flacon|lot_essence|ingredient`, `?est_lu=true|false`, `?search=`

**Réponse 200** :

```json
{
  "id": 1,
  "type_produit": "parfum",
  "product_id": 5,
  "product_name": "Royal Oud",
  "message": "Stock faible : 3 unités restantes",
  "stock_actuel": "3.00",
  "seuil_alerte": "5.00",
  "est_lu": false,
  "est_encore_en_alerte": true,
  "metadata": {},
  "created_at": "2026-06-01T10:00:00Z",
  "updated_at": "2026-06-01T10:00:00Z"
}
```

### PATCH `/notifications/{id}/`

```json
{ "est_lu": true }
```

### PATCH `/notifications/marquer_tous_comme_lus/`

**Payload** : `{}`

**Réponse 200** :

```json
{
  "updated": 12,
  "message": "12 notifications marquées comme lues"
}
```

### GET `/notifications/non_lues/` — Paginé

### GET `/notifications/stats/`

**Réponse 200** :

```json
{
  "total": 50,
  "non_lues": 8,
  "lues": 42,
  "par_type_produit": [
    { "type_produit": "accessoire", "count": 3 }
  ]
}
```

---

# LAB — `/api/v1/lab/`

Permission écriture catalogue lab : **Admin ou Serveuse active**.

## Essences — `/essences/`

Lookup : `slug`

### POST — Créer (Admin/Serveuse)

**Description** : Permet de créer une essence dans le catalogue, avec possibilité d'ajouter un lot initial (stock laboratoire) et des formats commercialisés (produits finis).

Utilise `EssenceCreateFullSerializer` à la création.

**Payload minimal** :
```json
{
  "marque": "Grasse Premium",
  "nom": "Oud Royal",
  "code_reference": "ESS-001",
  "prix_par_ml": "850.00"
}
```

**Payload complet** :
```json
{
  "marque": "Grasse Premium",
  "nom": "Oud Royal",
  "code_reference": "ESS-001",
  "categorie": "premium",
  "description": "Essence boisée",
  "description_ia": "",
  "fournisseur": "Fournisseur X",
  "origine_pays": "France",
  "concentration_max": "45.00",
  "couleur": "Ambre",
  "duree": "8h",
  "intensite": "forte",
  "genre_cible": "mixte",
  "notes_tete": "Bergamote",
  "notes_coeur": "Oud",
  "notes_fond": "Ambre",
  "prix_par_ml": "850.00",
  "actif": true,
  "tag_ids": [1, 3, 7],
  "initial_lot": {
    "stock_ml": "5000.00",
    "seuil_alerte_ml": "500.00",
    "reference_fournisseur": "LOT-2026-01"
  },
  "produits_finis": [
    {
      "taille_ml": 30,
      "prix": "15000.00",
      "prix_promotionnel": null,
      "stock_disponible": 10
    },
    {
      "taille_ml": 50,
      "prix": "22000.00",
      "stock_disponible": 5
    }
  ]
}
```

**Enums** :

- `categorie` : `super_premium` | `premium` | `high`
- `intensite` : `légère` | `moyenne` | `forte` | `très forte`
- `genre_cible` : `homme` | `femme` | `mixte`

**Réponse 201** :
```json
{
  "id": 15,
  "marque": "Grasse Premium",
  "nom": "Oud Royal",
  "slug": "oud-royal-10492",
  "categorie": "premium",
  "code_reference": "ESS-001",
  "description": "Essence boisée",
  "description_ia": "",
  "fournisseur": "Fournisseur X",
  "origine_pays": "France",
  "concentration_max": "45.00",
  "couleur": "Ambre",
  "duree": "8h",
  "intensite": "forte",
  "genre_cible": "mixte",
  "notes_tete": "Bergamote",
  "notes_coeur": "Oud",
  "notes_fond": "Ambre",
  "tags": [
    {
      "id": 1,
      "nom": "Boisé",
      "slug": "boise-olfactive-12345",
      "type": "famille_olfactive"
    }
  ],
  "famille_olfactive": ["Boisé"],
  "humeurs_compatibles": ["Savant"],
  "occasions": ["Soirée"],
  "saisons_compatibles": ["Hiver"],
  "signes_astrologiques_compatibles": ["Scorpion"],
  "moments_journee": ["Nuit"],
  "prix_par_ml": "850.00",
  "actif": true,
  "date_creation": "2026-06-29T14:15:00Z",
  "date_modification": "2026-06-29T14:15:00Z"
}
```

### PUT / PATCH / DELETE — Admin/Serveuse

Update utilise `EssenceSerializer` (sans `initial_lot` / `produits_finis`).

## Lots essence — `/lots-essence/`

Lookup : `id`

### POST — Créer (Admin/Serveuse)

```json
{
  "essence": 5,
  "stock_ml": "2000.00",
  "seuil_alerte_ml": "200.00",
  "reference_fournisseur": "LOT-002",
  "actif": true
}
```

**Réponse 201** :

```json
{
  "id": 3,
  "essence": 5,
  "essence_details": {
    "id": 5,
    "marque": "Grasse Premium",
    "nom": "Oud Royal",
    "categorie": "premium",
    "stock_total_ml": "7000.00",
    "prix_par_ml": "850.00"
  },
  "stock_ml": "2000.00",
  "stock_precedent_ml": "5000.00",
  "seuil_alerte_ml": "200.00",
  "actif": true,
  "date_reception": "2026-06-26T10:00:00Z",
  "reference_fournisseur": "LOT-002"
}
```

## Ingrédients — `/ingredients/`

Lookup : `slug`

### POST — Créer (Admin/Serveuse)

```json
{
  "nom": "Vanille bourbon",
  "description": "Extrait naturel",
  "prix_par_ml": "1200.00",
  "stock_ml": "3000.000",
  "seuil_alerte_ml": "300.000",
  "actif": true
}
```

**Réponse 201** :

```json
{
  "id": 1,
  "nom": "Vanille bourbon",
  "slug": "vanille-bourbon-12345",
  "description": "Extrait naturel",
  "prix_par_ml": "1200.00",
  "stock_ml": "3000.000",
  "seuil_alerte_ml": "300.000",
  "actif": true,
  "date_creation": "2026-01-01T00:00:00Z"
}
```

## Tags essence (lab) — `/tags-essence/`

CRUD identique aux tags shop.

## Labo essences (consultation) — `/labo/essences/`

### GET `/disponible/` — Public

**Réponse 200** :

```json
[
  {
    "id": 5,
    "marque": "Grasse Premium",
    "nom": "Oud Royal",
    "categorie": "premium",
    "stock_total_ml": "7000.00",
    "prix_par_ml": "850.00"
  }
]
```

### GET `/{slug}/detail/` — Public

**Réponse 200** : essence complète + `stock_total_ml`.

## Parfums personnalisés — `/parfums-perso/`

**Auth** : connecté. Écriture = créateur ou staff.

### POST — Créer

```json
{
  "flacon": 3,
  "nom": "Mon parfum d'été",
  "description": "Notes fraîches",
  "lignes": [
    { "essence": 12, "quantite_ml": "10.000" },
    { "essence_personnalisee": 2, "quantite_ml": "5.000" }
  ]
}
```

Chaque ligne : **soit** `essence` (ID lot) **soit** `essence_personnalisee`, pas les deux.

**Réponse 201** :

```json
{
  "id": 8,
  "client": 4,
  "flacon": 3,
  "flacon_detail": {
    "id": 3,
    "nom": "Flacon 50ml",
    "contenance_ml": 50,
    "prix_unitaire": "2500.00",
    "image_principale": "https://..."
  },
  "nom": "Mon parfum d'été",
  "description": "Notes fraîches",
  "prix_essences": "12500.00",
  "prix_flacon_snapshot": "2500.00",
  "prix_total": "15000.00",
  "statut": "brouillon",
  "note_laboratoire": "",
  "lignes": [
    {
      "id": 1,
      "essence": 12,
      "essence_personnalisee": null,
      "essence_detail": {
        "nom": "Oud",
        "marque": "Grasse Premium",
        "categorie": "premium",
        "prix_par_ml": "850.00"
      },
      "quantite_ml": "10.000",
      "prix_par_ml_snapshot": "850.00",
      "prix_ligne": "8500.00"
    }
  ],
  "enregistre": false,
  "date_creation": "2026-06-01T10:00:00Z"
}
```

**Auto** : `client`, prix, validation max 45% du flacon.

### POST `/parfums-perso/{id}/recalculer/`

**Payload** : `{}`

**Réponse 200** : objet parfum-perso recalculé.

## Essences personnalisées — `/essences-perso/`

### POST — Créer

```json
{
  "nom": "Base vanille custom",
  "lignes": [
    { "ingredient": 3, "quantite_ml": "8.000" },
    { "ingredient": 7, "quantite_ml": "2.000" }
  ]
}
```

**Réponse 201** :

```json
{
  "id": 2,
  "nom": "Base vanille custom",
  "prix_par_ml_calcule": "980.00",
  "lignes": [
    {
      "id": 1,
      "ingredient": 3,
      "ingredient_detail": {
        "id": 3,
        "nom": "Vanille bourbon",
        "description": "",
        "prix_par_ml": "1200.00",
        "stock_ml": "3000.000",
        "seuil_alerte_ml": "300.000"
      },
      "quantite_ml": "8.000",
      "prix_ligne": "9600.00"
    }
  ],
  "date_creation": "2026-06-01T10:00:00Z"
}
```

## IA Recommandation — POST `/ia-recommandation/`

**Auth** : Public

**Payload** :

```json
{
  "prompt": "Je cherche un parfum floral pour une soirée romantique en hiver"
}
```

**Réponse 200** :

```json
{
  "message": "Voici mes suggestions...",
  "quantite_demandee_ml": 50,
  "flacon": {
    "id": 3,
    "nom": "Flacon 50ml",
    "prix_unitaire": "2500.00"
  },
  "parfums_existants": [
    {
      "id": 1,
      "nom": "Royal Oud",
      "prix_unitaire": "35000.00",
      "image_principale": "https://..."
    }
  ],
  "essences_pre_faites": [
    {
      "id": 5,
      "lot_essence_id": 12,
      "nom": "Rose",
      "code_reference": "ESS-002",
      "prix_par_ml": "650.00",
      "quantite_ml": 15.0,
      "prix_total_quantite": "9750.00"
    }
  ],
  "ingredients_sur_mesure": [
    {
      "id": 3,
      "nom": "Vanille bourbon",
      "prix_par_ml": "1200.00",
      "quantite_ml": 5.0,
      "prix_total_quantite": "6000.00"
    }
  ],
  "accessoires": [
    {
      "id": 2,
      "nom": "Écrin velours",
      "prix_unitaire": "8500.00",
      "image_principale": "https://..."
    }
  ]
}
```

**Erreur 400** : `{ "error": "Veuillez fournir un 'prompt'." }`  
**Erreur 500** : erreur Gemini.

---

# ORDERS — `/api/v1/orders/`

## Panier — Public (invité ou connecté)

### GET `/panier/`

Query : `?panier_id=42`

**Réponse 200** :

```json
{
  "id": 42,
  "client": null,
  "code_promo_applique": "ACC-X7K2",
  "remise_montant": "2250.00",
  "remise_pourcentage": "5.00",
  "sous_total": "45000.00",
  "frais_livraison": "0.00",
  "total": "42750.00",
  "statut": "actif",
  "lignes_parfums": [
    {
      "id": 1,
      "parfum": 1,
      "nom": "Royal Oud",
      "image": "https://...",
      "contenance_ml": 50,
      "quantite": 1,
      "prix_unitaire_snapshot": "35000.00",
      "sous_total": "35000.00"
    }
  ],
  "lignes_accessoires": [],
  "lignes_produit_fini_essence": [],
  "lignes_parfums_perso": [],
  "lignes_essence_personnalisee": [],
  "date_creation": "2026-06-01T10:00:00Z",
  "date_modification": "2026-06-01T10:05:00Z"
}
```

### POST `/panier/ajouter/parfum/`

```json
{
  "parfum_id": 1,
  "quantite": 2,
  "panier_id": 42
}
```

**Réponse 200** : panier mis à jour.

### POST `/panier/ajouter/accessoire/`

```json
{
  "accessoire_id": 3,
  "quantite": 1,
  "panier_id": 42
}
```

### POST `/panier/ajouter/produit-fini-essence/`

```json
{
  "produit_fini_essence_id": 10,
  "quantite": 1,
  "panier_id": 42
}
```

### POST `/panier/ajouter/essence-personnalisee/` — Auth requis

```json
{
  "essence_personnalisee_id": 2,
  "quantite": 1,
  "panier_id": 42
}
```

### POST `/panier/ajouter/composition-directe/`

```json
{
  "flacon_id": 3,
  "lignes": [
    { "lot_essence_id": 12, "quantite_ml": "15.0" }
  ],
  "quantite": 1,
  "nom": "Compo LIA",
  "note_client": "Sans alcool fort",
  "panier_id": 42
}
```

**Auto** : crée `ParfumPersonnalise` + ajoute au panier.

### PATCH `/panier/ligne/{type}/{ligne_id}/`

**type** : `parfum` | `accessoire` | `produit-fini-essence` | `parfum-personnalise` | `essence-personnalisee`

```json
{
  "quantite": 3,
  "panier_id": 42
}
```

### DELETE `/panier/ligne/{type}/{ligne_id}/`

Query ou body : `panier_id`

### POST `/panier/appliquer-promo/`

```json
{
  "code_promo": "ACC-X7K2",
  "panier_id": 42
}
```

Code admin : Auth requis + client autorisé + usage unique.

### POST `/panier/retirer-promo/`

```json
{ "panier_id": 42 }
```

## Commandes

### POST `/commandes/passer/` — Public

**Description** : Valide le panier en cours de l'utilisateur connecté et crée une commande. **Tous les champs du payload sont optionnels** — le backend récupère automatiquement les informations du profil connecté ou du panier actif en session.

**Payload (tout optionnel)** :
```json
{
  "panier_id": 42,
  "livraison_nom_complet": "Jean Dupont",
  "livraison_quartier": "Bastos",
  "livraison_ville": "Yaoundé",
  "livraison_telephone": "+237612345678",
  "note_client": "Appeler avant livraison",
  "client_telephone": "+237612345678"
}
```

| Champ | Requis | Règle backend |
|-------|--------|----------------|
| panier_id | optionnel | Si absent, le backend utilise le panier actif en session de l’utilisateur |
| livraison_nom_complet | optionnel | Auto depuis `first_name + last_name` du profil connecté |
| livraison_telephone | optionnel | Auto depuis `telephone` du profil connecté |
| livraison_quartier | optionnel | Laisser vide si livraison sans précision |
| livraison_ville | optionnel | Laisser vide si livraison sans précision |
| note_client | optionnel | Instructions de livraison libres |
| client_telephone | optionnel | Invité : permet de lier la commande à un client existant via son numéro |

**Réponse 201** — `CommandeSerializer` :
```json
{
  "id": 55,
  "numero_commande": "CMD-AB12CD",
  "client": 4,
  "client_email": "jean@mail.com",
  "prestataire": 2,
  "prestataire_code": "ACC-X7K2",
  "livreur": null,
  "livreur_nom": null,
  "statut": "en_attente",
  "statut_livraison": "en_attente_affectation",
  "statut_paiement": "en_attente",
  "sous_total": "45000.00",
  "remise_code_promo": "2250.00",
  "code_promo_utilise": "ACC-X7K2",
  "frais_livraison": "0.00",
  "total_ttc": "42750.00",
  "commission_montant": "4500.00",
  "commission_statut": "non_versée",
  "livraison_nom_complet": "Jean Dupont",
  "livraison_quartier": "Bastos",
  "livraison_ville": "Yaoundé",
  "livraison_telephone": "+237612345678",
  "date_livraison_estimee": null,
  "date_livraison_reelle": null,
  "note_client": "Appeler avant livraison",
  "note_interne": "",
  "motif_echec_livraison": null,
  "date_creation": "2026-06-01T10:00:00Z",
  "date_modification": "2026-06-01T10:00:00Z",
  "lignes_parfums": [
    {
      "id": 1,
      "parfum": 1,
      "nom_snapshot": "Royal Oud",
      "quantite": 1,
      "prix_unitaire_snapshot": "35000.00",
      "remise_ligne": "0.00",
      "sous_total": "35000.00"
    }
  ],
  "lignes_accessoires": [
    {
      "id": 2,
      "accessoire": 3,
      "nom_snapshot": "Pochette velours Noir",
      "quantite": 2,
      "prix_unitaire_snapshot": "5000.00",
      "remise_ligne": "0.00",
      "sous_total": "10000.00"
    }
  ],
  "lignes_produit_fini_essence": [
    {
      "id": 3,
      "produit_fini_essence": 5,
      "nom_snapshot": "Essence de Vanille Bourbon - 10ml",
      "quantite": 1,
      "prix_unitaire_snapshot": "8000.00",
      "remise_ligne": "0.00",
      "sous_total": "8000.00"
    }
  ],
  "lignes_parfums_perso": [
    {
      "id": 4,
      "parfum_personnalise": 10,
      "nom_snapshot": "Mon Parfum DIY Floral",
      "quantite": 1,
      "prix_unitaire_snapshot": "12000.00",
      "remise_ligne": "0.00",
      "sous_total": "12000.00"
    }
  ],
  "lignes_essence_personnalisee": [
    {
      "id": 5,
      "essence_personnalisee": 8,
      "nom_snapshot": "Mélange Vanille-Oud",
      "quantite": 1,
      "prix_unitaire_snapshot": "9500.00",
      "remise_ligne": "0.00",
      "sous_total": "9500.00"
    }
  ],
  "facture": "https://api.domain.com/media/factures/FAC-CMD-AB12CD.pdf"
}
```

**Enums statut** :

| Champ | Valeurs |
|-------|---------|
| statut | `en_attente`, `validé`, `annulée`, `remboursée` |
| statut_livraison | `en_attente_affectation`, `assignée`, `livrée`, `échouée` |
| statut_paiement | `en_attente`, `payé`, `échoué` |
| commission_statut | `non_versée`, `versée`, `annulée` |

### GET `/commandes/` — Auth (filtré par rôle)

**Description** : Récupère la liste des commandes.

Query : `?statut=`, `?statut_paiement=`, `?statut_livraison=`, `?nom=`, `?search=`, `?page=`

- Superadmin/Serveuse → toutes
- Livreur → commandes assignées
- Client → ses commandes

**Réponse 200** :
```json
[
  {
    "id": 55,
    "numero_commande": "CMD-AB12CD",
    "client": 4,
    "client_email": "jean@mail.com",
    "prestataire": 2,
    "prestataire_code": "ACC-X7K2",
    "livreur": null,
    "livreur_nom": null,
    "statut": "en_attente",
    "statut_livraison": "en_attente_affectation",
    "statut_paiement": "en_attente",
    "sous_total": "45000.00",
    "remise_code_promo": "2250.00",
    "code_promo_utilise": "ACC-X7K2",
    "frais_livraison": "0.00",
    "total_ttc": "42750.00",
    "commission_montant": "4500.00",
    "commission_statut": "non_versée",
    "livraison_nom_complet": "Jean Dupont",
    "livraison_quartier": "Bastos",
    "livraison_ville": "Yaoundé",
    "livraison_telephone": "+237612345678",
    "date_livraison_estimee": null,
    "date_livraison_reelle": null,
    "note_client": "Appeler avant livraison",
    "note_interne": "",
    "motif_echec_livraison": null,
    "date_creation": "2026-06-01T10:00:00Z",
    "date_modification": "2026-06-01T10:00:00Z"
  }
]
```

### GET `/commandes/{numero}/` — Auth

**Description** : Récupère le détail complet d'une commande via son numéro unique.

**Réponse 200** :
```json
{
  "id": 55,
  "numero_commande": "CMD-AB12CD",
  "client": 4,
  "client_email": "jean@mail.com",
  "prestataire": 2,
  "prestataire_code": "ACC-X7K2",
  "livreur": null,
  "livreur_nom": null,
  "statut": "en_attente",
  "statut_livraison": "en_attente_affectation",
  "statut_paiement": "en_attente",
  "sous_total": "45000.00",
  "remise_code_promo": "2250.00",
  "code_promo_utilise": "ACC-X7K2",
  "frais_livraison": "0.00",
  "total_ttc": "42750.00",
  "commission_montant": "4500.00",
  "commission_statut": "non_versée",
  "livraison_nom_complet": "Jean Dupont",
  "livraison_quartier": "Bastos",
  "livraison_ville": "Yaoundé",
  "livraison_telephone": "+237612345678",
  "date_livraison_estimee": null,
  "date_livraison_reelle": null,
  "note_client": "Appeler avant livraison",
  "note_interne": "",
  "motif_echec_livraison": null,
  "date_creation": "2026-06-01T10:00:00Z",
  "date_modification": "2026-06-01T10:00:00Z",
  "lignes_parfums": [
    {
      "id": 1,
      "parfum": 1,
      "nom_snapshot": "Royal Oud",
      "quantite": 1,
      "prix_unitaire_snapshot": "35000.00",
      "remise_ligne": "0.00",
      "sous_total": "35000.00"
    }
  ],
  "lignes_accessoires": [
    {
      "id": 2,
      "accessoire": 3,
      "nom_snapshot": "Pochette velours Noir",
      "quantite": 2,
      "prix_unitaire_snapshot": "5000.00",
      "remise_ligne": "0.00",
      "sous_total": "10000.00"
    }
  ],
  "lignes_produit_fini_essence": [
    {
      "id": 3,
      "produit_fini_essence": 5,
      "nom_snapshot": "Essence de Vanille Bourbon - 10ml",
      "quantite": 1,
      "prix_unitaire_snapshot": "8000.00",
      "remise_ligne": "0.00",
      "sous_total": "8000.00"
    }
  ],
  "lignes_parfums_perso": [
    {
      "id": 4,
      "parfum_personnalise": 10,
      "nom_snapshot": "Mon Parfum DIY Floral",
      "quantite": 1,
      "prix_unitaire_snapshot": "12000.00",
      "remise_ligne": "0.00",
      "sous_total": "12000.00"
    }
  ],
  "lignes_essence_personnalisee": [
    {
      "id": 5,
      "essence_personnalisee": 8,
      "nom_snapshot": "Mélange Vanille-Oud",
      "quantite": 1,
      "prix_unitaire_snapshot": "9500.00",
      "remise_ligne": "0.00",
      "sous_total": "9500.00"
    }
  ],
  "facture": "https://api.domain.com/media/factures/FAC-CMD-AB12CD.pdf"
}
```

### PATCH `/commandes/{numero}/` — Auth

**Admin/Serveuse** :

```json
{
  "statut": "validé",
  "statut_livraison": "assignée",
  "livreur": 1,
  "statut_paiement": "payé",
  "frais_livraison": "1500.00",
  "date_livraison_estimee": "2026-06-28",
  "note_interne": "Client VIP",
  "motif_echec_livraison": null
}
```

**Livreur** :

```json
{ "action": "livrer" }
```

```json
{
  "action": "echouer",
  "motif": "Client absent"
}
```

Ou :

```json
{
  "statut_paiement": "payé",
  "statut_livraison": "livrée"
}
```

## Factures

### GET `/commandes/{numero}/facture/` — Auth (owner / admin / serveuse)

**Réponse 200** : fichier PDF (`Content-Type: application/pdf`)

**Erreur 404** :

```json
{ "detail": "Aucune facture disponible pour cette commande..." }
```

### GET `/admin/factures/` — Admin/Serveuse

Query : `?search=`, paginé.

**Réponse** :

```json
{
  "results": [
    {
      "numero_facture": "FAC-2026-001",
      "date_emission": "2026-06-01T10:00:00Z",
      "envoye_par_email": true,
      "fichier_pdf": "/media/factures/FAC-2026-001.pdf"
    }
  ]
}
```

### POST `/admin/factures/{numero_facture}/renvoyer/` — Admin/Serveuse

**Payload** : `{}`

**Réponse 200** :

```json
{
  "detail": "Facture FAC-2026-001 renvoyée avec succès à client@mail.com."
}
```

## Codes promo admin — `/admin/codes-promo/`

**Auth** : Superadmin uniquement.

### GET list

**Réponse 200** :

```json
[
  {
    "id": 1,
    "code": "VIP2026",
    "reduction_pourcentage": "15.00",
    "est_actif": true,
    "clients_autorises": [4, 7, 12],
    "date_creation": "2026-06-01T00:00:00Z",
    "date_modification": "2026-06-01T00:00:00Z"
  }
]
```

### POST — Créer

```json
{
  "code": "VIP2026",
  "reduction_pourcentage": "15.00",
  "est_actif": true,
  "clients_autorises": [4, 7, 12]
}
```

**Auto** : notifications FCM + emails aux clients autorisés.

### PUT / PATCH / DELETE — CRUD standard

---

# POS — `/api/v1/pos/`

**Auth** : Superadmin ou Serveuse active.

### GET `/produits/recherche/`

Query : `?q=oud`, `?type=parfum|accessoire|essence`

Ne retourne que les produits **actifs**, avec **stock > 0** et **prix > 0**.

**Réponse 200** :

```json
[
  {
    "id": 1,
    "type": "parfum",
    "nom": "Royal Oud",
    "marque": "Maison X",
    "reference_sku": "PARF-001",
    "prix": 35000.0,
    "stock_disponible": 100,
    "image_url": "https://..."
  }
]
```

### POST `/commandes/creer/` — Point de Vente (POS)

**Description** : Crée une commande instantanément au comptoir (POS).

**Payload** :
```json
{
  "client_email": "client@mail.com",
  "client_telephone": "+237612345678",
  "client_nom_complet": "Jean Dupont",
  "livraison_nom_complet": "Jean Dupont",
  "livraison_telephone": "+237612345678",
  "code_promo": "ACC-X7K2",
  "note_interne": "Paiement espèces",
  "lignes": [
    { "type": "parfum", "id": 1, "quantite": 1 },
    { "type": "accessoire", "id": 3, "quantite": 2 },
    { "type": "essence", "id": 10, "quantite": 1 }
  ]
}
```

| Champ | Requis | Notes |
|-------|--------|-------|
| lignes | ✅ | non vide |
| livraison_nom_complet, livraison_telephone | optionnel | auto depuis le client connecté ou le profil client résolu |
| client_email, client_telephone, client_nom_complet | optionnel | |
| code_promo, note_interne | optionnel | |

**Auto** : résolution/création client, `statut='validé'`, `statut_paiement='payé'`, facture PDF, déstockage.

**Réponse 201** :
```json
{
  "id": 56,
  "numero_commande": "CMD-POS-Z9Y8X7",
  "client": 4,
  "client_email": "client@mail.com",
  "prestataire": 2,
  "prestataire_code": "ACC-X7K2",
  "livreur": null,
  "livreur_nom": null,
  "statut": "validé",
  "statut_livraison": "livrée",
  "statut_paiement": "payé",
  "sous_total": "45000.00",
  "remise_code_promo": "2250.00",
  "code_promo_utilise": "ACC-X7K2",
  "frais_livraison": "0.00",
  "total_ttc": "42750.00",
  "commission_montant": "4500.00",
  "commission_statut": "non_versée",
  "livraison_nom_complet": "Jean Dupont",
  "livraison_quartier": "Bastos",
  "livraison_ville": "Yaoundé",
  "livraison_telephone": "+237612345678",
  "date_livraison_estimee": null,
  "date_livraison_reelle": "2026-06-29T14:15:00Z",
  "note_client": "",
  "note_interne": "Paiement espèces",
  "motif_echec_livraison": null,
  "date_creation": "2026-06-29T14:15:00Z",
  "date_modification": "2026-06-29T14:15:00Z",
  "lignes_parfums": [
    {
      "id": 6,
      "parfum": 1,
      "nom_snapshot": "Royal Oud",
      "quantite": 1,
      "prix_unitaire_snapshot": "35000.00",
      "remise_ligne": "0.00",
      "sous_total": "35000.00"
    }
  ],
  "lignes_accessoires": [
    {
      "id": 7,
      "accessoire": 3,
      "nom_snapshot": "Pochette velours Noir",
      "quantite": 2,
      "prix_unitaire_snapshot": "5000.00",
      "remise_ligne": "0.00",
      "sous_total": "10000.00"
    }
  ],
  "lignes_produit_fini_essence": [
    {
      "id": 8,
      "produit_fini_essence": 5,
      "nom_snapshot": "Essence de Vanille Bourbon - 10ml",
      "quantite": 1,
      "prix_unitaire_snapshot": "8000.00",
      "remise_ligne": "0.00",
      "sous_total": "8000.00"
    }
  ],
  "lignes_parfums_perso": [],
  "lignes_essence_personnalisee": [],
  "facture": "https://api.domain.com/media/factures/FAC-POS-Z9Y8X7.pdf"
}
```

---

# Dépenses — `/api/v1/utilisateur/depenses/`


| Méthode               | Auth                          | Règle                                              |
| --------------------- | ----------------------------- | -------------------------------------------------- |
| GET list / GET detail | Serveuse active ou Superadmin | Serveuse : ses dépenses seulement ; Admin : toutes |
| POST                  | Serveuse active               | `cree_par` = utilisateur connecté                  |
| PUT / PATCH           | Serveuse active               | Uniquement si `cree_par` = utilisateur connecté    |
| DELETE                | Superadmin                    | Admin ne peut pas créer ni modifier                |


### GET list — Serveuse / Superadmin

**Query** : `?date_depense=2026-06-26`, `?search=`, `?ordering=-montant|date_depense|date_creation`, `?page=`, `?page_size=`

**Pagination** : format DRF (`count`, `next`, `previous`, `results`).

**Réponse 200** (`results[]`) :

```json
{
  "id": 1,
  "titre": "Achat fournitures",
  "description": "Papier et encres",
  "montant": "15000.00",
  "cree_par": 5,
  "cree_par_details": {
    "id": 5,
    "email": "serveuse@mail.com",
    "telephone": "+237612345678",
    "first_name": "Marie",
    "last_name": "K.",
    "roles": ["client", "serveuse"]
  },
  "date_depense": "2026-06-26",
  "date_creation": "2026-06-26T09:00:00Z",
  "date_modification": "2026-06-26T09:00:00Z"
}
```


| Champ POST                       | Requis | Notes                 |
| -------------------------------- | ------ | --------------------- |
| titre                            | ✅      |                       |
| montant                          | ✅      | Decimal string        |
| description                      | Opt    |                       |
| date_depense                     | Opt    | défaut = date du jour |
| cree_par                         | Auto   | utilisateur connecté  |
| date_creation, date_modification | Auto   |                       |


### GET `{id}/` — Détail

Même objet qu'un élément de la liste.

### POST — Créer (Serveuse active)

```json
{
  "titre": "Achat fournitures",
  "description": "Papier et encres",
  "montant": "15000.00"
}
```

**Réponse 201** :

```json
{
  "id": 1,
  "titre": "Achat fournitures",
  "description": "Papier et encres",
  "montant": "15000.00",
  "cree_par": 5,
  "cree_par_details": { "id": 5, "email": "...", "roles": ["serveuse"] },
  "date_depense": "2026-06-26",
  "date_creation": "...",
  "date_modification": "..."
}
```

### PATCH — Modifier (Serveuse, sa dépense uniquement)

```json
{
  "titre": "Achat fournitures boutique",
  "montant": "18000.00"
}
```

---

# Mouvements stock — `/api/v1/shop/mouvements-stock/`

**Auth** : Admin ou Serveuse active — **lecture seule** (GET list, GET detail). Pas de POST/PUT/PATCH/DELETE.

**Query list** :


| Param               | Description                                                                         |
| ------------------- | ----------------------------------------------------------------------------------- |
| `type_produit`      | `parfum` | `accessoire` | `flacon` | `essence` | `lot_essence` | `ingredient`       |
| `utilisateur`       | ID de l'utilisateur HTTP ayant déclenché le changement                              |
| `search`            | Recherche sur `nom_produit`                                                         |
| `ordering`          | `date_ajout`, `-date_ajout`, `quantite_avant`, `quantite_apres`, `quantite_ajoutee` |
| `page`, `page_size` | Pagination DRF                                                                      |


**Champ `utilisateur`** : ID de l'utilisateur authentifié lors de la requête HTTP qui a modifié le stock (middleware). `null` si le changement provient d'un signal hors requête (admin Django, script, webhook).

### GET list / GET `{id}/` — Réponse 200

```json
{
  "id": 1,
  "utilisateur": 5,
  "utilisateur_details": { "id": 5, "email": "...", "roles": ["serveuse"] },
  "type_produit": "parfum",
  "produit_id": 12,
  "nom_produit": "Royal Oud",
  "quantite_avant": 50,
  "quantite_apres": 48,
  "quantite_ajoutee": -2,
  "date_ajout": "2026-06-26T10:00:00Z"
}
```

Les mouvements sont créés automatiquement par les signaux Django lors des changements de stock.

---

# Récapitulatif Admin/Serveuse — création catalogue


| Ressource        | POST URL                   | Champs requis minimum                                  |
| ---------------- | -------------------------- | ------------------------------------------------------ |
| Parfum           | `/shop/parfums/`           | `nom`, `contenance_ml`, `prix_unitaire`                |
| Accessoire       | `/shop/accessoires/`       | `nom`, `type_accessoire`, `prix_unitaire`              |
| Flacon           | `/shop/flacons/`           | `nom`, `type_flacon`, `contenance_ml`, `prix_unitaire` |
| Catégorie parfum | `/shop/categories-parfum/` | `nom`                                                  |
| Type accessoire  | `/shop/types-accessoire/`  | `nom`                                                  |
| Type flacon      | `/shop/types-flacon/`      | `nom`                                                  |
| Tag              | `/shop/tags/`              | `nom`, `type`                                          |
| Produit essence  | `/shop/produits-essence/`  | `essence`, `taille_ml`, `prix`                         |
| Essence labo     | `/lab/essences/`           | `marque`, `nom`, `code_reference`, `prix_par_ml`       |
| Lot essence      | `/lab/lots-essence/`       | `essence`, `stock_ml`                                  |
| Ingrédient       | `/lab/ingredients/`        | `nom`, `prix_par_ml`                                   |


Tous retournent **201** + objet créé, ou **400** avec erreurs de validation. **403** si pas admin/serveuse.

---

# Endpoints backend (référence)


| Endpoint         | URL                              |
| ---------------- | -------------------------------- |
| Dépenses         | `/api/v1/utilisateur/depenses/`  |
| Mouvements stock | `/api/v1/shop/mouvements-stock/` |


---

# Comportements backend automatiques


| Domaine         | Géré automatiquement                                                   |
| --------------- | ---------------------------------------------------------------------- |
| Panier          | ID session, rattachement à la connexion, snapshots prix, totaux, promo |
| Commande        | `numero_commande`, copie lignes, commission, stocks, facture PDF       |
| Prestataire     | Code promo à validation, logs commission, solde                        |
| Payout Monetbil | Débit solde, API, webhook, restitution si échec                        |
| Labo DIY        | Prix lignes, règle 45% du flacon, nom par défaut                       |
| Catalogue       | `prix_actuel`, promos, alertes stock (signals)                         |
| Auth            | Profil Client, rôles, cookies JWT web, `username`                      |
| POS             | Création client invité, paiement immédiat, facture                     |


---

# Codes d'erreur courants


| Code | Signification                                         |
| ---- | ----------------------------------------------------- |
| 400  | Validation payload / stock insuffisant / règle métier |
| 401  | Non authentifié                                       |
| 403  | Rôle insuffisant                                      |
| 404  | Ressource introuvable                                 |
| 502  | Erreur API Monetbil                                   |
| 500  | Erreur IA / email / interne                           |


