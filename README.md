
```markdown
# 💎 Accessories Exclusif - Frontend (Next.js)

Bienvenue sur le dépôt Frontend de **Accessories Exclusif**. Cette application est une plateforme e-commerce de luxe intégrant une boutique d'accessoires, de parfumerie de marque, et un atelier de création olfactive assisté par IA nommé **Numba**.

## 👑 Vision du Projet
L'objectif est d'offrir une expérience haut de gamme où le client peut non seulement acheter, mais aussi créer ses propres parfums via un "Sommelier IA" (Gemini) ou manuellement.

---

## 🛠 Stack Technique

* **Framework :** Next.js 15 (App Router)
* **Gestion d'État :** Zustand (Panier, Sessions, Créations de parfum)
* **Authentification :** JWT (Stocké en HTTP-only cookies ou local storage)
* **Styling :** Tailwind CSS + Framer Motion (Animations)
* **IA :** Google Gemini SDK (Atelier Numba)
* **Validation :** Zod + React Hook Form
* **Communication API :** Axios

---

## 📂 Architecture des Fichiers

```text
/app
  ├── (auth)/              # Login, Register (JWT logic)
  ├── (dashboards)/        # Groupement des espaces privés
  │   ├── admin/           # Gestion commandes, stocks, livreurs
  │   ├── delivery/        # Liste des tâches et statuts (Livré)
  │   ├── partner/         # Stats code promo et gains
  │   └── client/          # Favoris et compositions sauvegardées
  ├── shop/                # Boutique (Accessoires, Marques, Dupes)
  │   ├── [id]/            # Détails produits
  ├── numba/               # L'Atelier (IA Sommelier & Manuel)
  ├── cart/                # Panier & Redirection WhatsApp
  └── api/                 # Proxy sécurisé pour Gemini
/components
  ├── ui/                  # Design System (Buttons, Modals, Inputs)
  ├── shared/              # Navbar, Footer (Layouts dynamiques)
  ├── perfume/             # Mixer, ScentCards, AI-Chat
  └── dashboard/           # Widgets, Tables de données
/store                     # Zustand Stores (useCartStore, useAuthStore)
/hooks                     # useDjango, useGemini, useRole
/services                  # Instance Axios (api.ts)
/lib                       # Utils, constants, perfume-logic
```


## 1. Le dossier `/app` (Le Cœur du Routage)
C'est ici que se trouvent les pages et la logique de navigation.

### `(auth)/` (Groupe de routes)
* **Rôle :** Gère la connexion et l'inscription. Les parenthèses `()` signifient que ce dossier n'apparaît pas dans l'URL (on aura `/login` et non `/(auth)/login`).
* **Fichiers :** `login/page.tsx`, `register/page.tsx`, `layout.tsx` (pour un design spécifique sans navbar).
* **Utilité :** Gérer l'authentification **JWT**. C'est ici que vous appellerez Django pour recevoir le cookie **HttpOnly**.

### `(dashboards)/` (Espaces Privés)
* **admin/** : `page.tsx`, `orders/page.tsx`, `inventory/page.tsx`. C'est le centre de contrôle pour valider les commandes et assigner les livreurs.
* **delivery/** : `page.tsx`. Une interface mobile-first pour que le livreur voie sa liste et clique sur "Livré".
* **partner/** : `page.tsx`. Affiche le compteur de ventes liées à son code promo et ses gains calculés.
* **client/** : `profile/page.tsx`, `favorites/page.tsx`. Où le client retrouve ses créations Numba sauvegardées.

### `shop/` (Catalogue)
* **Rôle :** Présentation des produits (Accessoires, Dupes, Marques).
* **Fichiers :** `page.tsx` (la grille de produits), `[id]/page.tsx` (la fiche détaillée d'un produit spécifique via son ID).
* **Utilité :** C'est la vitrine principale qui consomme les données de Django.

### `numba/` (Atelier de Création)
* **Rôle :** L'expérience interactive de création de parfum.
* **Fichiers :** `page.tsx` (l'interface de mixage), `ai-consultant/page.tsx` (le chat avec Gemini).
* **Utilité :** C'est la partie la plus complexe où l'utilisateur manipule les essences.

### `cart/` (Panier)
* **Fichiers :** `page.tsx`.
* **Utilité :** Récapitule les achats et contient le bouton final qui génère le lien **WhatsApp** avec le récapitulatif de la commande.

### `api/` (Routes Serveur Next.js)
* **Fichiers :** `perfume/ai-advisor/route.ts`.
* **Utilité :** Sert de "pont" sécurisé. Votre clé API Gemini est utilisée ici côté serveur, jamais exposée au client.

---

## 2. Le dossier `/components` (L'Interface Graphique)

* **ui/** : `Button.tsx`, `Input.tsx`, `Modal.tsx`. Ce sont vos briques de base. Si vous changez le style du bouton "Or" ici, il change sur tout le site.
* **shared/** : `Navbar.tsx`, `Footer.tsx`, `Sidebar.tsx`. La Navbar est ici car elle est partagée, mais elle doit être dynamique (elle change si on est Admin ou Client).
* **perfume/** : `ScentCard.tsx`, `MixerTool.tsx`, `GeminiChat.tsx`. Tous les composants spécifiques à l'atelier Numba.
* **dashboard/** : `StatCard.tsx`, `OrderTable.tsx`, `LivreurSelector.tsx`. Les éléments complexes pour les tableaux de bord.

---

## 3. Les dossiers de Logique (`/store`, `/hooks`, `/services`, `/lib`)

### `/store` (Zustand)
* **Fichiers :** `useCartStore.ts`, `useAuthStore.ts`.
* **Rôle :** État global. Le panier doit être accessible partout (boutique, atelier, navbar). L'état d'authentification (user info) y est aussi stocké.

### `/hooks` (Fonctions React)
* **useDjango.ts** : Pour simplifier les `fetch` vers votre API Python.
* **useGemini.ts** : Pour gérer l'envoi du prompt et la réception du JSON de l'IA.
* **useRole.ts** : Un hook pour vérifier rapidement si l'utilisateur est `ADMIN`, `DELIVERY` ou `PARTNER`.

### `/services` (Configuration API)
* **api.ts** : L'instance **Axios** configurée avec `baseURL` et `withCredentials: true` pour que les cookies HttpOnly fonctionnent.

### `/lib` (Utilitaires & Métier)
* **perfume-logic.ts** : L'algorithme qui calcule si deux essences vont ensemble (avant même d'appeler l'IA).
* **constants.ts** : La liste fixe des familles olfactives (Citrus, Woody, etc.) et les couleurs de votre thème.
* **utils.ts** : Fonctions pour formater les prix en FCFA ou nettoyer les chaînes de caractères.

---


---

## 🧭 Programme de Travail (Roadmap)

### Phase 1 : Système de Design & Auth (Priorité Haute)
* **Initialisation :** Setup Next.js, Tailwind config (Couleurs : Gold `#C5A059`, Deep Black `#050505`).
* **Auth :** Formulaires de connexion/inscription et gestion du Token JWT.
* **Layout :** Navbar adaptative (affiche des liens différents si Admin, Livreur ou Client).

### Phase 2 : Catalogue & Panier Zustand
* **Affichage :** Grilles de produits pour les Accessoires, Parfums et Dupes.
* **Panier :** Logique Zustand pour ajouter des produits physiques ET des compositions sur mesure.
* **WhatsApp :** Fonction de génération de message automatique pour la confirmation de commande.

### Phase 3 : L'Atelier Numba (Le Cœur du Projet)
* **IA Sommelier :** Intégration de l'API Gemini avec un "System Prompt" spécialisé en parfumerie.
* **Atelier Manuel :** Interface de sélection d'essences avec calcul de prix dynamique.
* **Sauvegarde :** Envoi des compositions au backend pour les retrouver dans le profil client.

### Phase 4 : Gestion & Logistique (Dashboards)
* **Admin :** Interface pour passer les commandes de `Pending` à `Validated`. Assignation des livreurs via un dropdown.
* **Livreur :** Vue mobile-first pour valider les livraisons d'un clic.
* **Prestataire :** Calcul automatique des commissions basé sur les commandes livrées avec leur code promo.

---

## 🤝 Guide de Collaboration

1.  **Typage strict :** Aucun usage de `any`. Toujours définir une `interface` ou un `type` dans `@/types`.
2.  **Branches Git :** * `main` : Production (Stable).
    * `develop` : Fusion des fonctionnalités.
    * `feat/nom-feature` : Travail en cours.
3.  **Composants :** Avant de créer un bouton, vérifie s'il n'existe pas déjà dans `components/ui`.

---

## 📝 Scripts utiles
* `npm run dev` : Lancer le serveur local.
* `npm run lint` : Vérifier la propreté du code (obligatoire avant chaque push).
* `npm run build` : Tester la compilation avant déploiement.
```

---

### Mes conseils pour bien démarrer à deux :

1.  **Répartissez-vous les domaines :** L'un de vous peut s'occuper de la **logique e-commerce et auth** (le socle), tandis que l'autre se concentre sur **l'Atelier Numba et l'IA** (la partie complexe).
2.  **Zustand est votre ami :** Créez un store séparé pour le panier (`useCartStore.ts`) et un pour l'utilisateur (`useAuthStore.ts`). Cela évitera de vous emmêler les pinceaux.
3.  **WhatsApp Link :** Utilisez la fonction `encodeURIComponent` pour générer le lien WhatsApp. Le message doit contenir le détail des IDs produits et le prix total pour que l'admin sache quoi valider.

Vous êtes prêts à coder **Accessories Exclusif** ! Quel est le premier fichier que vous allez attaquer ?