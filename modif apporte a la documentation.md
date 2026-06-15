# Walkthrough — Mise à jour de la documentation de l'API

Les modifications suivantes ont été apportées au fichier de spécification technique de l'API [api_payloads_specification.md](file:///home/greg/Documents/Accessoire_exclusif/backend/api_payloads_specification.md) :

## Modifications apportées

### 1. Module Livreurs & Livraisons
*   **Ajout de la section 4.9** : `DELETE /api/v1/auth/admin/livreurs/{id}/delete/` pour la suppression d'un livreur par un administrateur.

### 2. Module Serveuses (Nouvelle Section 4.B)
*   **Ajout de la section 4.B.1** : `GET /api/v1/auth/admin/serveuses/` (Liste paginée).
*   **Ajout de la section 4.B.2** : `POST /api/v1/auth/admin/serveuses/promote/` (Promotion ou création de zéro).
*   **Ajout de la section 4.B.3** : `PATCH /api/v1/auth/admin/serveuses/{id}/` (Activation/Désactivation).
*   **Ajout de la section 4.B.4** : `DELETE /api/v1/auth/admin/serveuses/{id}/delete/` (Suppression).

### 3. Module Catalogue (Accessoires)
*   **Ajout d'endpoints personnalisés dans la section 5.2** :
    *   `GET /api/v1/shop/accessoires/bestsellers/` (Bestsellers historiques).
    *   `GET /api/v1/shop/accessoires/hotsellers/` (Hotsellers du mois).

### 4. Module Laboratoire (Section 6.7)
*   **Correction de la section 6.7 (Suivi de l'Inventaire Labo)** : Remplacement de l'ancien CRUD par les deux seuls endpoints réellement exposés par `EssenceLaboViewSet` :
    *   `GET /api/v1/lab/labo/essences/disponible/`
    *   `GET /api/v1/lab/labo/essences/{slug}/detail/`

---

## Validation des modifications

Toutes les modifications ont été vérifiées et alignées avec les sérialiseurs et vues du backend :
- `utilisateur/views.py` (classes et méthodes de serveuses et livreur delete)
- `catalogue/views.py` (actions de bestsellers/hotsellers d'accessoires et structure de `EssenceLaboViewSet`)
- `utilisateur/serializers.py` et `catalogue/serializers.py` (champs sérialisés)
