# Documentation API — Système de Tags Dynamiques

> **Base URL :** `https://ton-api.com/api/shop/`
>
> **Auth :** Lecture libre — Écriture requiert admin/serveuse (`IsAdminOrServeuseOrReadOnly`)

---

## Concept

Le système de tags est en **deux couches** :

| Couche | Table | Rôle |
|--------|-------|------|
| **Type de tag** | `Tag` | Créé par l'admin — définit la catégorie (ex: "Sillage", "Tenue") |
| **Valeur** | `TagParfum` / `TagEssence` / `TagAccessoire` | La valeur spécifique pour un produit (ex: "Élevée", "8h+") |

---

## 1. Gestion des Types de Tags `/api/shop/tags/`

> CRUD complet sur les types de tags (créés par l'admin).

### `GET /api/shop/tags/` — Liste tous les types de tags

**Paramètres query :**

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Recherche dans le nom |
| `ordering` | string | `nom`, `-nom`, `date_creation` |

**Réponse `200 OK` :**
```json
[
  { "id": 1, "nom": "Sillage",           "slug": "sillage-48291" },
  { "id": 2, "nom": "Tenue",             "slug": "tenue-73401" },
  { "id": 3, "nom": "Famille olfactive", "slug": "famille-olfactive-19284" },
  { "id": 4, "nom": "Matériau",          "slug": "materiau-56712" }
]
```

---

### `POST /api/shop/tags/` — Créer un type de tag *(admin requis)*

**Payload :**
```json
{
  "nom": "Occasion"
}
```

> Le `slug` est généré automatiquement.

**Réponse `201 Created` :**
```json
{
  "id": 5,
  "nom": "Occasion",
  "slug": "occasion-84712"
}
```

**Erreur `400` — nom déjà existant :**
```json
{
  "nom": ["tag avec ce nom existe déjà."]
}
```

---

### `GET /api/shop/tags/{slug}/` — Détail d'un type de tag

**Réponse `200 OK` :**
```json
{
  "id": 1,
  "nom": "Sillage",
  "slug": "sillage-48291"
}
```

---

### `PUT /api/shop/tags/{slug}/` — Modifier (full) *(admin requis)*

**Payload :**
```json
{
  "nom": "Intensité du sillage"
}
```

**Réponse `200 OK` :**
```json
{
  "id": 1,
  "nom": "Intensité du sillage",
  "slug": "sillage-48291"
}
```

---

### `PATCH /api/shop/tags/{slug}/` — Modifier (partial) *(admin requis)*

**Payload :**
```json
{
  "nom": "Projection"
}
```

**Réponse `200 OK` :**
```json
{
  "id": 1,
  "nom": "Projection",
  "slug": "sillage-48291"
}
```

---

### `DELETE /api/shop/tags/{slug}/` — Supprimer un type *(admin requis)*

**Réponse `204 No Content`**

> [!WARNING]
> Supprime en cascade tous les `TagParfum`, `TagEssence`, `TagAccessoire` liés à ce type.

---

## 2. Listes de Tags pour sélection (Select)

> Ces endpoints retournent uniquement les tags **actifs** — pour alimenter des dropdowns/formulaires côté frontend.

### `GET /api/shop/tags-parfum/` — Tags pour les parfums
### `GET /api/shop/tags-essence/` — Tags pour les essences
### `GET /api/shop/tags-accessoire/` — Tags pour les accessoires
### `GET /api/lab/tags-essence/` — Tags (contexte laboratoire)

**Paramètres query :**

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Recherche dans le nom |
| `ordering` | string | `nom`, `-nom` |

**Réponse `200 OK` (identique pour les 4 routes) :**
```json
[
  { "id": 1, "libelle": "Sillage",           "nom": "Sillage",           "slug": "sillage-48291" },
  { "id": 2, "libelle": "Tenue",             "nom": "Tenue",             "slug": "tenue-73401" },
  { "id": 3, "libelle": "Famille olfactive", "nom": "Famille olfactive", "slug": "famille-olfactive-19284" }
]
```

> [!NOTE]
> `libelle` est un alias de `nom` — utile pour les composants UI qui attendent un champ `libelle`.

---

## 3. Tags d'un Parfum

Les tags d'un parfum sont gérés **via le champ `tags`** lors de la création/modification.

### `GET /api/shop/parfums/{slug}/` — Lire les tags d'un parfum

La clé `tags` retourne les associations avec leurs valeurs :

```json
{
  "id": 12,
  "nom": "Black Aoud",
  "slug": "black-aoud-39201",
  "tags": [
    { "id": 1, "tag": 1, "tag_nom": "Sillage",           "valeur": "Monstrueuse" },
    { "id": 2, "tag": 2, "tag_nom": "Tenue",             "valeur": "12h+" },
    { "id": 3, "tag": 3, "tag_nom": "Famille olfactive", "valeur": "Boisé Oriental" }
  ],
  "prix_actuel": "75000.00"
}
```

---

### `POST /api/shop/parfums/` — Créer un parfum avec tags *(admin)*

**Payload `application/json` :**
```json
{
  "nom": "Black Aoud",
  "marque": "Montale",
  "contenance_ml": 100,
  "prix_unitaire": "75000.00",
  "genre_cible": "mixte",
  "tags": [
    { "tag": 1, "valeur": "Monstrueuse" },
    { "tag": 2, "valeur": "12h+" },
    { "tag": 3, "valeur": "Boisé Oriental" }
  ]
}
```

> `tag` = ID du type de tag (depuis `/api/shop/tags/`)
> `valeur` = valeur libre saisie par l'admin pour ce parfum

**Réponse `201 Created` :**
```json
{
  "id": 12,
  "nom": "Black Aoud",
  "slug": "black-aoud-39201",
  "tags": [
    { "id": 1, "tag": 1, "tag_nom": "Sillage",           "valeur": "Monstrueuse" },
    { "id": 2, "tag": 2, "tag_nom": "Tenue",             "valeur": "12h+" },
    { "id": 3, "tag": 3, "tag_nom": "Famille olfactive", "valeur": "Boisé Oriental" }
  ],
  "prix_actuel": "75000.00"
}
```

---

### `PATCH /api/shop/parfums/{slug}/` — Modifier les tags *(admin)*

> [!IMPORTANT]
> Envoyer `tags` **remplace entièrement** tous les tags existants (full replace).

**Payload :**
```json
{
  "tags": [
    { "tag": 1, "valeur": "Très élevée" },
    { "tag": 4, "valeur": "Soirée" }
  ]
}
```

**Réponse `200 OK` :**
```json
{
  "id": 12,
  "nom": "Black Aoud",
  "tags": [
    { "id": 5, "tag": 1, "tag_nom": "Sillage",  "valeur": "Très élevée" },
    { "id": 6, "tag": 4, "tag_nom": "Occasion", "valeur": "Soirée" }
  ]
}
```

**Supprimer tous les tags :**
```json
{ "tags": [] }
```

---

## 4. Tags d'une Essence

Même principe — via le champ `tags`.

### `GET /api/lab/essences/{slug}/` — Lire les tags

```json
{
  "id": 7,
  "nom": "Rose Damascena",
  "marque": "Firmenich",
  "tags": [
    { "id": 10, "tag": 3, "tag_nom": "Famille olfactive", "valeur": "Floral" },
    { "id": 11, "tag": 1, "tag_nom": "Sillage",           "valeur": "Modérée" }
  ]
}
```

---

### `POST /api/lab/essences/` — Créer une essence avec tags *(admin)*

**Payload `application/json` :**
```json
{
  "marque": "Firmenich",
  "nom": "Rose Damascena",
  "code_reference": "FIR-ROSE-D01",
  "categorie": "premium",
  "prix_par_ml": "1500.00",
  "tags": [
    { "tag": 3, "valeur": "Floral" },
    { "tag": 1, "valeur": "Modérée" },
    { "tag": 2, "valeur": "6h+" }
  ]
}
```

**Réponse `201 Created` :**
```json
{
  "id": 7,
  "nom": "Rose Damascena",
  "tags": [
    { "id": 10, "tag": 3, "tag_nom": "Famille olfactive", "valeur": "Floral" },
    { "id": 11, "tag": 1, "tag_nom": "Sillage",           "valeur": "Modérée" },
    { "id": 12, "tag": 2, "tag_nom": "Tenue",             "valeur": "6h+" }
  ]
}
```

---

### `PATCH /api/lab/essences/{slug}/` — Modifier les tags *(admin)*

```json
{
  "tags": [
    { "tag": 3, "valeur": "Floral Poudré" }
  ]
}
```

---

## 5. Tags d'un Accessoire

### `GET /api/shop/accessoires/{slug}/` — Lire les tags

```json
{
  "id": 3,
  "nom": "Atomiseur de voyage 10ml",
  "tags": [
    { "id": 20, "tag": 4, "tag_nom": "Matériau", "valeur": "Aluminium brossé" },
    { "id": 21, "tag": 5, "tag_nom": "Couleur",  "valeur": "Argent" }
  ]
}
```

---

### `POST /api/shop/accessoires/` — Créer un accessoire avec tags *(admin)*

**Payload :**
```json
{
  "nom": "Atomiseur de voyage 10ml",
  "type_accessoire": 2,
  "prix_unitaire": "8500.00",
  "stock_quantite": 50,
  "tags": [
    { "tag": 4, "valeur": "Aluminium brossé" },
    { "tag": 5, "valeur": "Argent" }
  ]
}
```

**Réponse `201 Created` :**
```json
{
  "id": 3,
  "nom": "Atomiseur de voyage 10ml",
  "tags": [
    { "id": 20, "tag": 4, "tag_nom": "Matériau", "valeur": "Aluminium brossé" },
    { "id": 21, "tag": 5, "tag_nom": "Couleur",  "valeur": "Argent" }
  ]
}
```

---

### `PATCH /api/shop/accessoires/{slug}/` — Modifier les tags *(admin)*

```json
{
  "tags": [
    { "tag": 4, "valeur": "Verre soufflé" },
    { "tag": 5, "valeur": "Transparent" }
  ]
}
```

---

## 6. Filtrer des produits par tag

> Tous les endpoints de listing supportent le filtre `?tags=`

```
GET /api/shop/parfums/?tags=1          → Parfums avec le tag ID 1
GET /api/shop/parfums/?tags=1,3        → Parfums ayant les tags 1 ET 3
GET /api/lab/essences/?tags=2,5        → Essences avec les tags 2 ET 5
GET /api/shop/accessoires/?tags=4      → Accessoires avec le tag 4
```

---

## 7. Tableau récapitulatif des routes

| Méthode | URL | Action | Auth |
|---------|-----|--------|------|
| `GET` | `/api/shop/tags/` | Lister les types de tags | Public |
| `POST` | `/api/shop/tags/` | Créer un type de tag | Admin |
| `GET` | `/api/shop/tags/{slug}/` | Détail d'un type | Public |
| `PUT` | `/api/shop/tags/{slug}/` | Modifier un type (full) | Admin |
| `PATCH` | `/api/shop/tags/{slug}/` | Modifier un type (partial) | Admin |
| `DELETE` | `/api/shop/tags/{slug}/` | Supprimer un type | Admin |
| `GET` | `/api/shop/tags-parfum/` | Tags actifs pour parfums (select) | Public |
| `GET` | `/api/shop/tags-essence/` | Tags actifs pour essences (select) | Public |
| `GET` | `/api/shop/tags-accessoire/` | Tags actifs pour accessoires (select) | Public |
| `GET` | `/api/lab/tags-essence/` | Tags actifs (contexte labo) | Public |
| `GET/POST` | `/api/shop/parfums/` via champ `tags` | Lire/écrire les tags d'un parfum | Public/Admin |
| `GET/POST` | `/api/lab/essences/` via champ `tags` | Lire/écrire les tags d'une essence | Public/Admin |
| `GET/POST` | `/api/shop/accessoires/` via champ `tags` | Lire/écrire les tags d'un accessoire | Public/Admin |

---

## 8. Structure du champ `tags` en écriture (résumé)

```json
"tags": [
  {
    "tag": 1,       // ID du type de tag (obligatoire)
    "valeur": "..." // Valeur libre pour ce produit (peut être vide "")
  }
]
```

| Cas | Comportement |
|-----|-------------|
| `"tags": [...]` avec valeurs | Remplace entièrement tous les tags |
| `"tags": []` | Supprime tous les tags du produit |
| Champ `tags` absent (PATCH) | Tags existants non touchés |
