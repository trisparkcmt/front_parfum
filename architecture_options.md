# Propositions d'Architecture : Essences, Ingrédients et Parfums Personnalisés

Voici une analyse des différentes façons d'implémenter tes nouvelles règles métier concernant le laboratoire et le catalogue.

## Les défis à résoudre
1. **La règle des 45%** : La somme des essences d'un parfum doit représenter exactement 45% du flacon.
2. **Dualité des Essences** : Une essence peut être une matière première (vendue au ml) ET un produit fini (Huile de parfum vendue à l'unité).
3. **Essences personnalisées** : Le client peut créer sa propre essence à partir d'ingrédients (Tête, Coeur, Fond).
4. **Indépendance de l'Admin** : L'admin peut créer des essences sans avoir à justifier de leurs ingrédients.
5. **Catégorisation** : Super Premium, Premium, High.

---

## Option 1 : Le Modèle "Unifié" (Tout dans le Catalogue)

Dans cette approche, on modifie ta table `Essence` actuelle pour qu'elle sache tout faire.

### Structure de la Base de Données
- **`catalogue.Ingredient`** (Nouveau) : Les matières de base (nom, note olfactive, prix au ml).
- **`catalogue.Essence`** (Modifié) :
  - Ajout de `categorie` (Super Premium, Premium, High).
  - Ajout de `client` (null pour l'Admin, rempli si c'est une création client).
  - Ajout d'une table de liaison `EssenceIngredient` pour lister les ingrédients choisis (si c'est une création).
  - Ajout de `prix_unitaire` et `contenance_vente_ml` : Si ces champs sont remplis, l'essence apparaît dans la boutique comme une "Huile de parfum" achetable directement.

### Fonctionnement
- **Création Client** : Le client choisit des ingrédients. Le backend crée une `Essence` liée à ce client, calcule son prix au ml selon les ingrédients, et l'utilise pour le parfum.
- **Règle des 45%** : Lors de la sauvegarde du parfum, on additionne les quantités et on renvoie une erreur si ce n'est pas 45%.

> [!WARNING]
> **Inconvénient** : Ta table `catalogue_essence` va se remplir de milliers de créations de clients, ce qui va polluer les données de ta boutique. De plus, gérer un prix au ml ET un prix unitaire sur la même ligne peut causer des bugs de calcul.

---

## Option 2 : La Séparation Stricte (Recommandée ⭐)

On sépare clairement ce qui appartient à la **Boutique** (Catalogue) et ce qui appartient aux **Clients** (Laboratoire). C'est la méthode la plus professionnelle.

### Structure de la Base de Données

**Application CATALOGUE (Boutique & Admin)** :
- **`Ingredient`** (Nouveau) : Les matières premières pour les clients (nom, note, prix_ml).
- **`HuileParfum`** (Nouveau ou modification de Essence) : Les essences/huiles créées par l'admin. Elles ont un `prix_unitaire`, une `contenance_ml`, et une `categorie` (Super Premium...). L'admin gère ça comme un produit classique.

**Application LABORATOIRE (Créations Clients)** :
- **`EssencePersonnalisee`** (Nouveau) : Liée au Client. Contient les lignes d'ingrédients choisis. Son prix au ml est calculé dynamiquement.
- **`ParfumPersonnaliseLigne`** (Modifié) : Au lieu de pointer vers une simple Essence, la ligne de parfum pointera :
  - SOIT vers une `catalogue.HuileParfum` (le client utilise une essence de l'admin).
  - SOIT vers une `laboratoire.EssencePersonnalisee` (le client utilise sa propre création).

### Fonctionnement
- **Règle des 45%** : On bloque la création dans le `Serializer` si `volume_essences != volume_flacon * 0.45`.
- **Gestion des prix** : Pas de confusion. Une `HuileParfum` a un prix fixe. Un `Ingredient` a un prix au ml.

> [!TIP]
> **Avantage** : Ta base de données reste très propre. Si tu veux faire l'inventaire de ta boutique, tu regardes `HuileParfum`. Si tu veux voir les créations des clients, tu regardes `EssencePersonnalisee`.

---

## Questions pour toi (Validation requise)

1. **Laquelle de ces deux options préfères-tu ?** Je te conseille fortement l'Option 2 pour éviter les prises de tête plus tard.
2. Pour la création d'une essence personnalisée, est-ce que le client doit aussi respecter un pourcentage (ex: 20% notes de tête, 50% coeur, 30% fond) ou c'est totalement libre ?
3. Es-tu d'accord pour que l'on mette en place la validation stricte des 45% dans le backend (le frontend recevra une erreur s'il envoie 44% ou 46%) ?
