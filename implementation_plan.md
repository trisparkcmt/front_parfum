# Plan d'Implémentation : Option 2 (Séparation Catalogue/Labo)

## Réponses aux questions de l'utilisateur

1. **À quoi sert `api/v1/serializers.py` et où est-il utilisé ?**
   Ce fichier est le "traducteur" de ton API. Il convertit tes modèles de base de données (Python) en format JSON compréhensible par ton frontend (React/Next.js), et inversement. 
   Il a été créé spécifiquement pour le module **Laboratoire** et est activement utilisé dans `laboratoire/views.py` (notamment pour la création et l'affichage des parfums personnalisés).

---

## 1. Modifications des Modèles de Base de Données

### A. Dans `catalogue/models.py`
1. **Nouveau Modèle `Ingredient`** :
   - `nom`, `description`, `prix_par_ml`, `stock_ml`
   - `note_olfactive` (Choix: Tête, Coeur, Fond)
2. **Modification de `Essence`** (qui représente les huiles/essences créées par l'Admin) :
   - Ajout de `categorie` (Choix: Super Premium, Premium, High).
   - *Optionnel* : Ajout de `prix_vente_unitaire` et `contenance_vente_ml` pour permettre la vente directe de ces essences en tant qu'Huile de Parfum sur la boutique (sans passer par le laboratoire).

### B. Dans `laboratoire/models.py`
1. **Nouveau Modèle `EssencePersonnalisee`** :
   - `client` (ForeignKey)
   - `nom` (ex: "Mon Essence Secrète")
   - `prix_par_ml_calcule` (calculé dynamiquement selon les ingrédients)
2. **Nouveau Modèle `EssencePersonnaliseeLigne`** :
   - `essence_personnalisee` (ForeignKey)
   - `ingredient` (ForeignKey vers `catalogue.Ingredient`)
   - `quantite_ml`
3. **Modification de `ParfumPersonnaliseLigne`** :
   - On remplace l'ancien champ `essence` par deux champs optionnels (un seul devra être rempli à la fois) :
     - `essence_catalogue` (ForeignKey vers `catalogue.Essence`, null=True)
     - `essence_personnalisee` (ForeignKey vers `laboratoire.EssencePersonnalisee`, null=True)

---

## 2. Modifications Logiques et Règles Métier

### A. Règle des 45% Maximum
Dans le fichier `api/v1/serializers.py` (`ParfumPersonnaliseSerializer`), nous allons modifier les méthodes `create()` et `update()` pour inclure cette vérification stricte :
```python
volume_total_essences = somme des quantite_ml de toutes les lignes
volume_max_autorise = flacon.contenance_ml * 0.45

Si volume_total_essences > volume_max_autorise:
    Générer une Erreur 400 : "La quantité totale d'essences ne peut pas dépasser 45% du flacon."
```

### B. Modification Complète d'un Parfum Personnalisé
Je vais écrire la méthode `update()` dans le `ParfumPersonnaliseSerializer` pour permettre au frontend d'envoyer des modifications complètes (ex: ajouter une essence, modifier la quantité d'une essence existante, supprimer une essence) pour les parfums qui sont encore en statut "Brouillon".

---

## 3. Plan de Vérification
- Appliquer les migrations de base de données (`makemigrations` et `migrate`).
- Créer un Ingrédient et une Essence via le shell ou l'admin.
- Tenter de créer un parfum dépassant 45% d'essence pour vérifier que le backend bloque la requête.
- Tenter de modifier les lignes d'un parfum existant.

> [!IMPORTANT]
> **Action Requise :**
> Si ce plan technique te convient, valide-le et je lance l'exécution des modifications sur tes fichiers !
