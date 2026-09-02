# Documentation API : Endpoints Essences et Gestion Contextuelle (Boutique vs Laboratoire)

Cette documentation détaille le fonctionnement, les en-têtes HTTP, les paramètres, les payloads et les réponses JSON des endpoints de gestion des essences suite au filtrage contextuel.

---

## 1. Principe Général et En-têtes HTTP (Headers)

L'API adapte automatiquement son comportement (filtrage du queryset et sérialiseur de sortie) selon le contexte de l'application cliente (**Boutique**, **Laboratoire** ou **Dashboard Admin**).

### En-têtes Requis / Recommandés

| En-tête (Header) | Valeurs Acceptées | Description |
| :--- | :--- | :--- |
| `X-Context` | `boutique` \| `shop` | Contexte e-commerce boutique (produits pré-conditionnés) |
| `X-Context` | `labo` \| `laboratoire` \| `lab` | Contexte laboratoire / DIY (création sur-mesure) |
| `X-Context` | `dashboard` \| `admin` | Contexte d'administration (vue globale complète) |
| `X-Dashboard-Context` | `true` | Alternative pour le Dashboard Admin |
| `Authorization` | `Bearer <access_token>` | Requis pour le Dashboard et la création/modification d'essences |

> **Fallback d'URL** : Si l'en-tête `X-Context` n'est pas transmis, le backend déduit automatiquement le contexte d'après l'URL d'appel (`/api/v1/shop/` → Boutique, `/api/v1/lab/` → Laboratoire).

---

## 2. Synthèse des Règles de Filtrage et des Réponses

| Contexte | Filtrage des Essences | Produits Finis (`produits_finis`) | Stock Requis | Sérialiseur Utilisé |
| :--- | :--- | :--- | :--- | :--- |
| **Boutique** | `actif=True`<br>`prix_par_ml > 0` | Au moins 1 `ProduitFiniEssence` actif | `stock_total_ml >= min(taille_ml)` | `EssencePublicSerializer` |
| **Laboratoire** | `actif=True`<br>`prix_par_ml > 0` | Non requis (exclus de la réponse) | `stock_total_ml > 0` | `EssenceLaboListSerializer` (liste)<br>`EssenceLaboDetailSerializer` (détail) |
| **Dashboard Admin** | Toutes les essences | Inclus (accès complet) | Tous les niveaux | `EssenceSerializer` |

---

## 3. Endpoints et Exemples Concrets

### A. Obtenir la Liste des Essences en Boutique

- **URL** : `GET /api/v1/shop/essences/` (ou `/api/v1/lab/essences/`)
- **Headers** :
  ```http
  X-Context: boutique
  Accept: application/json
  ```
- **Réponse HTTP 200 OK** :
  ```json
  {
    "count": 1,
    "pages": 1,
    "page_actuelle": 1,
    "suivant": null,
    "precedent": null,
    "resultats": [
      {
        "id": 12,
        "marque": "Maison Exclusive",
        "nom": "Rose de Mai",
        "slug": "rose-de-mai-84920",
        "categorie": "premium",
        "code_reference": "ESS-ROSE-001",
        "description": "Une essence de rose fraîche récoltée au petit matin.",
        "origine_pays": "France",
        "concentration_max": "20.00",
        "couleur": "Rose clair",
        "duree": "12h",
        "intensite": "moyenne",
        "genre_cible": "femme",
        "notes_tete": "Bergamote",
        "notes_coeur": "Rose de Mai, Jasmin",
        "notes_fond": "Musc blanc",
        "famille_olfactive": ["Floral"],
        "humeurs_compatibles": ["Romantique"],
        "occasions": ["Soirée", "Quotidien"],
        "saisons_compatibles": ["Printemps", "Été"],
        "moments_journee": ["Matin", "Après-midi"],
        "prix_par_ml": "450.00",
        "actif": true,
        "stock_total_ml": 500.0,
        "produits_finis": [
          {
            "id": 3,
            "taille_ml": 15,
            "prix": "8500.00",
            "prix_promotionnel": null,
            "prix_actuel": "8500.00",
            "stock_disponible": 33,
            "actif": true
          },
          {
            "id": 4,
            "taille_ml": 30,
            "prix": "15000.00",
            "prix_promotionnel": "13500.00",
            "prix_actuel": "13500.00",
            "stock_disponible": 16,
            "actif": true
          }
        ]
      }
    ]
  }
  ```

---

### B. Obtenir la Liste des Essences au Laboratoire (Création Sur-Mesure / DIY)

- **URL** : `GET /api/v1/lab/essences/`
- **Headers** :
  ```http
  X-Context: labo
  Accept: application/json
  ```
- **Réponse HTTP 200 OK** (Format épuré axé sur la matière première en ml) :
  ```json
  {
    "count": 2,
    "pages": 1,
    "page_actuelle": 1,
    "suivant": null,
    "precedent": null,
    "resultats": [
      {
        "id": 12,
        "marque": "Maison Exclusive",
        "nom": "Rose de Mai",
        "categorie": "premium",
        "stock_total_ml": 500.0,
        "prix_par_ml": "450.00"
      },
      {
        "id": 15,
        "marque": "Maison Lab",
        "nom": "Jasmin Brut",
        "categorie": "super_premium",
        "stock_total_ml": 200.0,
        "prix_par_ml": "600.00"
      }
    ]
  }
  ```
  *(Remarque : L'essence "Jasmin Brut" apparaît au Labo car elle a du stock en ml, même si elle n'a aucun produit fini pré-conditionné).*

---

### C. Obtenir le Détail d'une Essence au Laboratoire

- **URL** : `GET /api/v1/lab/essences/jasmin-brut-19402/`
- **Headers** :
  ```http
  X-Context: labo
  Accept: application/json
  ```
- **Réponse HTTP 200 OK** :
  ```json
  {
    "id": 15,
    "marque": "Maison Lab",
    "nom": "Jasmin Brut",
    "slug": "jasmin-brut-19402",
    "categorie": "super_premium",
    "code_reference": "ESS-JAS-001",
    "description": "Essence pure de jasmin sambac.",
    "description_ia": "Jasmin intense et envoûtant",
    "fournisseur": "Laboratoire Grasse",
    "origine_pays": "Inde",
    "concentration_max": "15.00",
    "couleur": "Ambrée",
    "duree": "24h",
    "intensite": "très forte",
    "genre_cible": "mixte",
    "notes_tete": "Fleurs blanches",
    "notes_coeur": "Jasmin Sambac",
    "notes_fond": "Santal",
    "tags": [],
    "famille_olfactive": ["Floral"],
    "humeurs_compatibles": ["Énergique"],
    "occasions": ["Soirée"],
    "saisons_compatibles": ["Été"],
    "signes_astrologiques_compatibles": ["Scorpion"],
    "moments_journee": ["Soir"],
    "prix_par_ml": "600.00",
    "seuil_alerte_ml": "50.00",
    "actif": true,
    "date_creation": "2026-09-02T12:00:00Z",
    "date_modification": "2026-09-02T12:00:00Z",
    "stock_total_ml": 200.0
  }
  ```

---

### D. Création d'une Essence Brute (Optionnel : Sans Lot Initial ni Produits Finis)

Un administrateur peut créer une essence "à vide" (définition de la référence seule) sans ajouter immédiatement de lot de stock ni de flacons de produits finis.

- **URL** : `POST /api/v1/lab/essences/` (ou `/api/v1/shop/essences/`)
- **Headers** :
  ```http
  X-Context: dashboard
  Authorization: Bearer <token_admin>
  Content-Type: application/json
  ```

#### Payload Exemple 1 : Essence seule (sans lot ni produits finis)
```json
{
  "marque": "Maison Exclusive",
  "nom": "Vanille Bourbon",
  "categorie": "premium",
  "code_reference": "ESS-VAN-001",
  "description": "Essence naturelle de vanille de Madagascar.",
  "intensite": "forte",
  "genre_cible": "mixte",
  "prix_par_ml": 550.00,
  "actif": true
}
```

#### Payload Exemple 2 : Essence avec lot initial et produits finis (création tout-en-un)
```json
{
  "marque": "Maison Exclusive",
  "nom": "Ambre Noir",
  "categorie": "super_premium",
  "code_reference": "ESS-AMB-001",
  "description": "Ambre intense aux notes orientales.",
  "intensite": "très forte",
  "genre_cible": "mixte",
  "prix_par_ml": 800.00,
  "actif": true,
  "initial_lot": {
    "stock_ml": 1000.00,
    "prix_achat_par_ml": 350.00,
    "reference_fournisseur": "LOT-2026-AMB"
  },
  "produits_finis": [
    {
      "taille_ml": 30,
      "prix": 25000.00,
      "prix_promotionnel": null,
      "actif": true
    },
    {
      "taille_ml": 50,
      "prix": 38000.00,
      "prix_promotionnel": 34000.00,
      "actif": true
    }
  ]
}
```

- **Réponse HTTP 201 Created** :
  ```json
  {
    "id": 16,
    "marque": "Maison Exclusive",
    "nom": "Ambre Noir",
    "slug": "ambre-noir-59201",
    "categorie": "super_premium",
    "code_reference": "ESS-AMB-001",
    "description": "Ambre intense aux notes orientales.",
    "prix_par_ml": "800.00",
    "actif": true,
    "date_creation": "2026-09-02T12:45:00Z",
    "stock_total_ml": 1000.0,
    "produits_finis": [
      {
        "id": 8,
        "taille_ml": 30,
        "prix": "25000.00",
        "prix_promotionnel": null,
        "prix_actuel": "25000.00",
        "stock_disponible": 33,
        "actif": true
      },
      {
        "id": 9,
        "taille_ml": 50,
        "prix": "38000.00",
        "prix_promotionnel": "34000.00",
        "prix_actuel": "34000.00",
        "stock_disponible": 20,
        "actif": true
      }
    ]
  }
  ```

---

## 4. Remarques Importantes pour les Développeurs Frontend

1. **Intégration Frontend Boutique** :
   - Ajoutez systématiquement l'en-tête `X-Context: boutique` lors de l'appel au catalogue public d'essences/flacons.
   - Les essences renvoyées contiendront le tableau `produits_finis` et vous êtes garanti qu'il y a du stock physique en ml pour au moins un flacon.

2. **Intégration Frontend Laboratoire / Studio DIY** :
   - Ajoutez l'en-tête `X-Context: labo` lors de l'appel pour la sélection de composants de créations sur-mesure.
   - Vous recevrez le stock réel disponible en millilitres (`stock_total_ml`) et le tarif au ml (`prix_par_ml`), indépendamment de l'existence de flacons pré-conditionnés.

3. **Intégration Frontend Dashboard Admin** :
   - Transmettez `X-Context: dashboard` ou `X-Dashboard-Context: true` avec le jeton Bearer de l'utilisateur staff.
   - Cela vous permet de visualiser et gérer toutes les essences, y compris celles créées "à vide" ou temporairement hors stock.














# Documentation Technique : Ajout d'un Lot d'Essence et d'un Produit Fini

Cette documentation détaille la procédure, les en-têtes HTTP, l'explication de chaque attribut, ainsi que les exemples de payloads et de réponses JSON pour :
1. **L'ajout d'un Lot d'Essence (`LotEssence`)** - Gestion du stock brut liquide en ml au laboratoire.
2. **L'ajout d'un Produit Fini (`ProduitFiniEssence`)** - Définition d'un flacon pré-conditionné vendu en boutique (ex: 15ml, 30ml, 50ml).
3. **L'ajout combiné (Tout-en-un)** lors de la création d'une essence.

---

## 1. Ajout d'un Lot d'Essence (`LotEssence`)

Un **Lot d'Essence** représente une livraison physique de matière première brute en millilitres (ml) reçue par le laboratoire.

### Endpoint & Headers
* **URL** : `POST /api/v1/lab/lots-essence/`
* **Méthode** : `POST`
* **Headers** :
  ```http
  Authorization: Bearer <token_admin>
  Content-Type: application/json
  X-Context: dashboard
  ```

---

### Explication de Tous les Attributs (Champs)

#### Champs du Payload Request (Entrée)

| Attribut | Type | Requis | Description & Rôle |
| :--- | :--- | :--- | :--- |
| `essence` | `Integer` | **Oui** | L'identifiant (ID) de l'essence parente à laquelle ce lot est rattaché. |
| `stock_ml` | `Decimal` | **Oui** | La quantité en ml d'essence livrée/disponible (ex: `500.00`). |
| `quantite_initiale_ml` | `Decimal` | *Optionnel* | La quantité initiale reçue à la livraison. Si non fournie, prend automatiquement la même valeur que `stock_ml`. Utilisé pour calculer le taux de consommation et les bénéfices. |
| `prix_achat_par_ml` | `Decimal` | *Optionnel* | Le prix d'achat en FCFA payé au fournisseur par ml (ex: `2.50`). Sert au calcul du coût d'achat et des marges nettes. |
| `reference_fournisseur` | `String` | *Optionnel* | Référence / Numéro de bon de commande ou lot chez le fournisseur (ex: `LOT-FOURN-2026-09`). |
| `actif` | `Boolean` | *Optionnel* | `true` par défaut. Détermine si le lot est utilisable pour la confection ou si le lot est archivé. |

#### Champs Supplémentaires dans la Réponse (Sortie / Calculés)

| Attribut | Type | Description |
| :--- | :--- | :--- |
| `id` | `Integer` | Identifiant unique du lot créé. |
| `stock_precedent_ml` | `Decimal` | **Généré automatiquement par le backend**. Indique le stock total cumulé de l'essence juste *avant* la sauvegarde de ce nouveau lot. |
| `cout_achat_total` | `String` | **Calculé** (`quantite_initiale_ml * prix_achat_par_ml`). Montant total investi pour acheter ce lot. |
| `chiffre_affaires_genere` | `String` | **Calculé**. Cumul des ventes/confections réalisées à partir de ce lot. |
| `benefice_lot` | `String` | **Calculé** (`CA généré - coût d'achat consommé`). Marge nette réalisée sur ce lot. |
| `est_termine` | `Boolean` | **Calculé**. Devient `true` automatiquement quand `stock_ml <= 0`. |
| `date_reception` | `DateTime` | Date et heure d'enregistrement du lot en base de données. |

---

### Exemples de Payload Request et Réponse JSON

#### Request Payload
```json
{
  "essence": 12,
  "stock_ml": 500.00,
  "quantite_initiale_ml": 500.00,
  "prix_achat_par_ml": 250.00,
  "reference_fournisseur": "FOURN-2026-ROSE-01",
  "actif": true
}
```

#### Response (HTTP 201 Created)
```json
{
  "id": 8,
  "essence": 12,
  "essence_details": {
    "id": 12,
    "nom": "Rose de Mai",
    "marque": "Maison Exclusive",
    "prix_par_ml": "450.00"
  },
  "stock_ml": "500.00",
  "stock_precedent_ml": "150.00",
  "quantite_initiale_ml": "500.00",
  "prix_achat_par_ml": "250.00",
  "cout_achat_total": "125000.00",
  "chiffre_affaires_genere": "0.00",
  "benefice_lot": "0.00",
  "est_termine": false,
  "actif": true,
  "date_reception": "2026-09-02T15:20:00Z",
  "reference_fournisseur": "FOURN-2026-ROSE-01"
}
```

---

## 2. Ajout d'un Produit Fini (`ProduitFiniEssence`)

Un **Produit Fini** définit un format/contenance de flacon pré-conditionné vendu dans la **Boutique** pour une essence donnée (ex: Flacon de 30 ml à 15 000 FCFA).

> **Note sur le stock virtuel** : Le modèle `ProduitFiniEssence` n'a plus de champ `stock_quantite` fixe en base de données. Son stock est **virtuel** et calculé automatiquement d'après le stock brut en ml disponible au laboratoire (`stock_disponible = stock_total_ml // taille_ml`).

### Endpoint & Headers
* **URL** : `POST /api/v1/shop/produits-essence/`
* **Méthode** : `POST`
* **Headers** :
  ```http
  Authorization: Bearer <token_admin>
  Content-Type: application/json
  X-Context: dashboard
  ```

---

### Explication de Tous les Attributs (Champs)

#### Champs du Payload Request (Entrée)

| Attribut | Type | Requis | Description & Rôle |
| :--- | :--- | :--- | :--- |
| `essence` | `Integer` | **Oui** | L'identifiant (ID) de l'essence parente. |
| `taille_ml` | `Integer` | **Oui** | La contenance du flacon en millilitres (ex: `15`, `30`, `50`, `100`). La combinaison `(essence, taille_ml)` est unique en base. |
| `prix` | `Decimal` | **Oui** | Le prix de vente normal/unitaire en FCFA pour ce format (ex: `15000.00`). |
| `prix_promotionnel` | `Decimal` | *Optionnel* | Prix réduit en FCFA si le flacon est en promotion (ex: `13500.00`). S'il est `null`, le prix normal s'applique. |
| `actif` | `Boolean` | *Optionnel* | `true` par défaut. Permet d'activer ou désactiver la vente de cette taille en boutique. |

#### Champs Calculés dans la Réponse (Sortie)

| Attribut | Type | Description |
| :--- | :--- | :--- |
| `id` | `Integer` | Identifiant unique du produit fini créé. |
| `prix_actuel` | `String` | **Calculé**. Renvoie `prix_promotionnel` si présent, sinon renvoie `prix`. C'est le prix réellement facturé au client. |
| `prix_par_ml` | `String` | **Calculé**. Indique le coût équivalent au ml (`prix_actuel / taille_ml`). |
| `stock_disponible` | `Integer` | **Calculé dynamiquement**. Nombre de flacons de cette taille qu'il est physiquement possible de préparer d'après le stock liquide total au labo. |

---

### Exemples de Payload Request et Réponse JSON

#### Request Payload
```json
{
  "essence": 12,
  "taille_ml": 30,
  "prix": 15000.00,
  "prix_promotionnel": 13500.00,
  "actif": true
}
```

#### Response (HTTP 201 Created)
```json
{
  "id": 14,
  "essence": 12,
  "essence_details": {
    "id": 12,
    "nom": "Rose de Mai",
    "marque": "Maison Exclusive",
    "prix_par_ml": "450.00"
  },
  "taille_ml": 30,
  "prix": "15000.00",
  "prix_promotionnel": "13500.00",
  "prix_actuel": "13500.00",
  "prix_par_ml": "450.00",
  "stock_disponible": 21,
  "actif": true
}
```

---

## 3. Ajout Tout-en-un lors de la Création de l'Essence

Pour gagner du temps, le backend permet de créer **l'essence**, **son lot initial de stock** et **ses formats de produits finis** en une seule requête HTTP.

### Endpoint & Headers
* **URL** : `POST /api/v1/lab/essences/`
* **Headers** :
  ```http
  Authorization: Bearer <token_admin>
  Content-Type: application/json
  X-Context: dashboard
  ```

### Request Payload (Exemple Tout-en-un)
```json
{
  "marque": "Maison Exclusive",
  "nom": "Oud Impérial",
  "categorie": "super_premium",
  "code_reference": "ESS-OUD-009",
  "description": "Un oud d'exception aux facettes boisées et cuivrées.",
  "prix_par_ml": 750.00,
  "intensite": "très forte",
  "genre_cible": "mixte",
  "actif": true,
  "initial_lot": {
    "stock_ml": 800.00,
    "prix_achat_par_ml": 300.00,
    "reference_fournisseur": "LOT-OUD-2026"
  },
  "produits_finis": [
    {
      "taille_ml": 15,
      "prix": 12000.00,
      "actif": true
    },
    {
      "taille_ml": 50,
      "prix": 35000.00,
      "prix_promotionnel": 30000.00,
      "actif": true
    }
  ]
}
```

### Response (HTTP 201 Created)
```json
{
  "id": 19,
  "marque": "Maison Exclusive",
  "nom": "Oud Impérial",
  "slug": "oud-imperial-49201",
  "categorie": "super_premium",
  "code_reference": "ESS-OUD-009",
  "description": "Un oud d'exception aux facettes boisées et cuivrées.",
  "prix_par_ml": "750.00",
  "actif": true,
  "stock_total_ml": 800.0,
  "produits_finis": [
    {
      "id": 22,
      "taille_ml": 15,
      "prix": "12000.00",
      "prix_promotionnel": null,
      "prix_actuel": "12000.00",
      "stock_disponible": 53,
      "actif": true
    },
    {
      "id": 23,
      "taille_ml": 50,
      "prix": "35000.00",
      "prix_promotionnel": "30000.00",
      "prix_actuel": "30000.00",
      "stock_disponible": 16,
      "actif": true
    }
  ]
}
```
