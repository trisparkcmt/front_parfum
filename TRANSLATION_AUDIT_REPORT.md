# Translation Audit Report - Hardcoded Text Without Translation

**Date:** September 7, 2026  
**Project:** Front Parfum  
**Translation System:** react-i18next (lib/i18n.ts, lib/dashboardI18n.ts)  
**Supported Languages:** French (default), English

---

## Executive Summary

This audit identified **extensive hardcoded text** across the application that bypasses the centralized translation system. The project uses **three different translation approaches**:

1. ✅ **Centralized i18n** (`lib/i18n.ts` with `t()` function) - GOOD
2. ⚠️ **Inline dictionaries** (local `T` objects in components) - NEEDS MIGRATION
3. ❌ **Inline ternaries** (`isEn ? 'English' : 'French'`) - NEEDS REFACTORING

### Impact
- **50+ files** have hardcoded text that should use the translation system
- **1000+ strings** are not centrally managed
- Adding a third language would require editing all these files
- No translation management tooling can be used

---

## 🔴 CATEGORY 1: Dashboard Admin Pages with Inline Dictionaries

These pages define their own `T = { fr: {...}, en: {...} }` objects instead of using the centralized `lib/i18n.ts`. All translations should be moved to the central system.

### 📄 app/dashboard/admin/categories/page.tsx
**Pattern:** Uses inline `T` object (lines 19-127)

**Hardcoded Text Examples:**
```typescript
const T = {
  fr: {
    title: 'Classifications & catégories',
    subtitle: 'Gérez les catégories de produits',
    tabs_categories: 'Catégories produits',
    tabs_accessories: 'Types d\'accessoires',
    btn_add: 'Ajouter',
    btn_edit: 'Modifier',
    btn_delete: 'Supprimer',
    // ... 100+ more strings
  },
  en: {
    title: 'Classifications & Categories',
    subtitle: 'Manage product categories',
    // ... matching translations
  }
}
```

**Recommendation:** Move all strings to `lib/i18n.ts` under `dashboard.categories.*` namespace

---

### 📄 app/dashboard/admin/perfume/page.tsx
**Pattern:** Large inline `T` object with 100+ translation pairs

**Hardcoded Text Examples:**
```typescript
const T = {
  fr: {
    page_title: 'Parfums',
    page_subtitle: 'Catalogue des parfums',
    btn_add_perfume: 'Ajouter un parfum',
    table_image: 'Image',
    table_name: 'Nom',
    table_category: 'Catégorie',
    table_price: 'Prix',
    table_stock: 'Stock',
    table_actions: 'Actions',
    filter_all: 'Tous',
    filter_men: 'Homme',
    filter_women: 'Femme',
    filter_unisex: 'Mixte',
    // ... 80+ more strings
  },
  en: { /* matching translations */ }
}
```

**Impact:** All perfume management UI text is isolated in this component

**Recommendation:** Migrate to `lib/i18n.ts` under `dashboard.perfume.*`

---

### 📄 app/dashboard/admin/flacons/page.tsx
**Pattern:** Inline `T` object for bottle management

**Hardcoded Text Examples:**
```typescript
const T = {
  fr: {
    title: 'Flacons',
    subtitle: 'Gestion des flacons',
    btn_add: 'Ajouter un flacon',
    table_image: 'Image',
    table_capacity: 'Capacité (ml)',
    table_price: 'Prix',
    undefined: 'Non défini',
    delete_confirm: 'Supprimer ce flacon ?',
    // ... more strings
  },
  en: { /* matching translations */ }
}
```

**Recommendation:** Migrate to `lib/i18n.ts` under `dashboard.flacons.*`

---

### 📄 app/dashboard/admin/dashboard/page.tsx
**Pattern:** Inline `T` object for main dashboard

**Hardcoded Text Examples:**
```typescript
const T = {
  fr: {
    title: 'Vue d\'ensemble',
    users: 'Utilisateurs',
    providers: 'Prestataires',
    deliverers: 'Livreurs',
    orders: 'Commandes',
    revenue: 'Revenus',
    pending_orders: 'En attente',
    completed_orders: 'Complétées',
    // ... more strings
  },
  en: { /* matching translations */ }
}
```

**Recommendation:** Migrate to `lib/i18n.ts` under `dashboard.overview.*`

---

### 📄 app/dashboard/admin/revenue/page.tsx
**Pattern:** Inline `T` dictionary for analytics page

**Hardcoded Text Examples:**
```typescript
const T = {
  fr: {
    title: 'Revenus & Analyses',
    subtitle: 'Analyse des Bénéfices',
    tab_analytics: 'Google Analytics 4',
    tab_revenue: 'Revenus',
    total_revenue: 'Revenu total',
    profit_margin: 'Marge bénéficiaire',
    // ... more strings
  },
  en: { /* matching translations */ }
}
```

**Recommendation:** Migrate to `lib/i18n.ts` under `dashboard.revenue.*`

---

### 📄 app/dashboard/admin/essences/page.tsx
**Pattern:** Inline `T` object for essence management

**Hardcoded Text:** Lines 60-250+ contain full UI dictionary
- Form labels, table headers, modal titles
- Examples: "Intensité", "Sélectionner l'intensité...", "Activer le format boutique"

**Recommendation:** Migrate to `lib/i18n.ts` under `dashboard.essences.*`

---

### 📄 app/dashboard/admin/accessories/page.tsx
**Pattern:** Inline translations for accessories management

**Recommendation:** Audit and migrate to centralized system

---

### 📄 app/dashboard/admin/diffuseurs/page.tsx
**Pattern:** Inline translations for diffuser management

**Recommendation:** Audit and migrate to centralized system

---

### 📄 app/dashboard/admin/order/page.tsx
**Pattern:** Inline translations for order management

**Recommendation:** Audit and migrate to centralized system

---

### 📄 app/dashboard/admin/promo-codes/page.tsx
**Hardcoded Text Examples:**
```typescript
// Line 401-403
{ key: 'recents', label: '🆕 Nouveaux clients', title: 'Les 50 inscrits les plus récents' }
{ key: 'active', label: '✅ Comptes actifs', title: 'Tous les comptes actifs' }
{ key: 'all', label: '👥 Tous', title: 'Sélectionner tous les clients (max 200)' }

// Line 422
<X size={9} /> Tout désélectionner
```

**Recommendation:** Move to centralized translation

---

### 📄 app/dashboard/admin/serveuses/page.tsx
**Hardcoded Text Examples:**
```typescript
// Line 169-171
<h1>Gestion des Serveuses</h1>
<p>Promouvoir, désactiver et gérer les serveuses de la boutique</p>

// Line 287
<span>{isActive ? 'Désactiver' : 'Activer'}</span>
```

**Recommendation:** Move to centralized translation

---

### 📄 app/dashboard/admin/produits-essence/page.tsx
**Pattern:** Inline translations for finished essence products

**Recommendation:** Audit and migrate to centralized system

---

## 🟡 CATEGORY 2: Dashboard Client Pages with Inline Dictionaries

### 📄 app/dashboard/client/orders/page.tsx
**Pattern:** Uses `LOCAL_STRINGS` object with FR/EN keys (lines 60-400+)

**Hardcoded Text Examples:**
```typescript
const LOCAL_STRINGS = {
  fr: {
    title: 'Commandes',
    status_pending: 'En attente',
    status_validated: 'Validée',
    status_in_delivery: 'En cours de livraison',
    status_delivered: 'Livrée',
    status_cancelled: 'Annulée',
    field_choose_driver: 'Choisir un livreur',
    field_estimated_delivery_date: 'Date estimée de livraison',
    confirm_validation: 'Confirmer la validation',
    label_address: 'Adresse',
    // ... 200+ more strings
  },
  en: { /* matching translations */ }
}
```

**Impact:** Entire client order management UI isolated from central system

**Recommendation:** Migrate to `lib/i18n.ts` under `dashboard.client.orders.*`

---

## 🔵 CATEGORY 3: Public Pages Components

### 📄 app/PromoCarousel.tsx
**Pattern:** Inline `textDict` object (lines 32-44)

**Hardcoded Text Examples:**
```typescript
const textDict = {
  fr: {
    create: 'Créez votre parfum',
    discover: 'Découvrir',
    exclusive: 'Exclusif',
    upTo: 'Jusqu\'à',
    off: 'de réduction',
  },
  en: {
    create: 'Create your perfume',
    discover: 'Discover',
    exclusive: 'Exclusive',
    upTo: 'Up to',
    off: 'off',
  }
}
```

**Recommendation:** Move to `lib/i18n.ts` under `promo.*`

---

### 📄 components/shared/Footer.tsx
**Hardcoded Text Examples:**
```typescript
// Lines 48-50
{isEn 
  ? 'Luxury perfumes and diffusers, crafted in Cameroon'
  : 'Parfums et diffuseurs de luxe, fabriqués au Cameroun'
}

// Line 91
{isEn ? 'All rights reserved' : 'Tous droits réservés'}

// Line 93
{isEn ? 'Made with' : 'Fait avec'} ❤️ {isEn ? 'in Cameroon' : 'au Cameroun'}
```

**Recommendation:** Move to `lib/i18n.ts` under `footer.*`

---

### 📄 components/shared/BottomNav.tsx
**Pattern:** Uses `t()` correctly but has hardcoded fallbacks

**Hardcoded Text Examples:**
```typescript
// Fallback text when translation keys missing:
"Accueil", "Accessoires", "Parfum"
```

**Recommendation:** Ensure all keys exist in translation file, remove fallbacks

---

### 📄 components/shared/Navbar.tsx
**Status:** Needs audit for hardcoded navigation labels

---

### 📄 app/HomeFAQ.tsx
**Hardcoded Text Examples:**
```typescript
// Line 30-31
{
  q: "Comment fonctionne l'assistant IA ?",
  a: "Notre assistant IA analyse vos préférences olfactives, votre humeur et l'occasion pour vous recommander des parfums et compositions adaptés. Il est disponible 24h/24 et vous guide pas à pas.",
}
```

**Impact:** Entire FAQ section in French only, no English version

**Recommendation:** Create dual-language FAQ structure with translations

---

### 📄 app/privacy/page.tsx
**Hardcoded Text Examples:**
```typescript
// Line 38
<h2>2. {isEn ? 'How we use your information' : 'Utilisation de vos informations'}</h2>

// Multiple paragraphs with inline ternaries
{isEn 
  ? 'We use this information to manage your account, process and deliver orders...'
  : 'Nous utilisons ces informations pour gérer votre compte, traiter et livrer vos commandes...'
}
```

**Recommendation:** Move entire privacy policy to translation files

---

### 📄 app/cart/page.tsx
**Hardcoded Text Examples:**
```typescript
// Line 229-231
t('choose_network', {
  defaultValue: isEn 
    ? 'Please select a mobile money provider' 
    : 'Veuillez choisir un réseau mobile',
})
```

**Pattern:** Using defaultValue with inline ternaries defeats purpose of i18n

**Recommendation:** Define 'choose_network' key properly in translation file

---

### 📄 app/numba/atelier/page.tsx
**Hardcoded Text Examples:**
```typescript
// Line 602-603
i18n.language === 'en' 
  ? 'Please select at least one essence/ingredient.' 
  : 'Veuillez sélectionner au moins une essence.'

// Line 641-642
i18n.language === 'en' 
  ? 'Please select a valid bottle size.' 
  : 'Veuillez sélectionner un format de flacon valide.'

// Line 1283
"Choisir un Flacon..."

// Line 1405
{i18n.language === 'en' ? 'Order Directly' : 'Commander directement'}

// Line 1468
{i18n.language === 'en' ? 'Order Your Composition' : 'Commander votre Composition'}

// Line 1693
<h3>Sélectionner un Flacon</h3>

// Line 1695
<p>Choisissez le flacon pour votre création</p>

// Line 1795
<p>Sélectionner</p>
```

**Impact:** Critical user flow (perfume creation) has scattered translations

**Recommendation:** Consolidate all Numba Atelier strings to `lib/i18n.ts` under `atelier.*`

---

## 🟣 CATEGORY 4: UI Component Library with Inline Ternaries

These reusable components use inline ternaries instead of centralized translations.

### 📄 components/ui/SearchInput.tsx
**Hardcoded Text Examples:**
```typescript
// Line 48
const defaultPlaceholder = isEn ? 'Search...' : 'Rechercher...';

// Line 129
aria-label={isEn ? 'Clear search' : 'Effacer la recherche'}
```

**Recommendation:** Use `t('search.placeholder')` and `t('search.clear')`

---

### 📄 components/ui/TableBulkActions.tsx
**Hardcoded Text Examples:**
```typescript
// Lines 85-90
{selectedIds.length === 1
  ? isEn ? `1 item selected` : `1 élément sélectionné`
  : isEn 
    ? `${selectedIds.length} items selected`
    : `${selectedIds.length} éléments sélectionnés`
}

// Line 93
{isEn ? '(All)' : '(Tous)'}

// Line 117
aria-label={isEn ? 'Clear selection' : 'Effacer la sélection'}
```

**Recommendation:** Use `t('table.items_selected', { count })` with pluralization

---

### 📄 components/ui/Pagination.tsx
**Hardcoded Text Examples:**
```typescript
// Lines 67-74
{isEn ? (
  <>
    Showing <span>{startItem}</span> to <span>{endItem}</span> of <span>{totalItems}</span> results
  </>
) : (
  <>
    Affichage de <span>{startItem}</span> à <span>{endItem}</span> sur <span>{totalItems}</span> résultats
  </>
)}

// Line 118
aria-label={isEn ? 'Page number' : 'Numéro de page'}

// Line 119
{isEn ? 'of' : 'sur'} {totalPages}
```

**Recommendation:** Use `t('pagination.showing')` with interpolation

---

### 📄 components/ui/FilterChips.tsx
**Hardcoded Text Examples:**
```typescript
// Lines 76-78
{isEn ? 'Clear all filters' : 'Effacer tous les filtres'}

// Line 97
aria-label={isEn ? `Remove ${chip.label} filter` : `Supprimer le filtre ${chip.label}`}

// Line 169
<option value="">{isEn ? 'Select field...' : 'Sélectionner un champ...'}</option>
```

**Recommendation:** Use `t('filters.*')` keys

---

### 📄 components/ui/EmptyState.tsx
**Hardcoded Text Examples:**
```typescript
// Line 229
{isEn ? 'No data available' : 'Aucune donnée disponible'}
```

**Recommendation:** Use `t('common.no_data')`

---

### 📄 components/ui/FormModal.tsx
**Hardcoded Text Examples:**
```typescript
// Line 141
aria-label={isEn ? 'Close dialog' : 'Fermer la boîte de dialogue'}
```

**Recommendation:** Use `t('common.close_dialog')`

---

### 📄 components/ui/FormError.tsx
**Hardcoded Text Examples:**
```typescript
// Line 106
{isEn ? 'Error' : 'Erreur'}
{isEn ? 'Warning' : 'Avertissement'}

// Line 123
aria-label={isEn ? 'Dismiss error' : 'Fermer l\'erreur'}
```

**Recommendation:** Use `t('common.error')`, `t('common.warning')`

---

### 📄 components/ui/PasswordStrength.tsx
**Hardcoded Text Examples:**
```typescript
// Lines 78-186 (multiple inline ternaries)
{isEn ? 'Password Strength' : 'Force du mot de passe'}
{isEn ? 'Requirements:' : 'Exigences :'}
{isEn ? 'At least 8 characters' : 'Au moins 8 caractères'}
{isEn ? 'Contains uppercase' : 'Contient une majuscule'}
{isEn ? 'Contains lowercase' : 'Contient une minuscule'}
{isEn ? 'Contains number' : 'Contient un chiffre'}
{isEn ? 'Contains special character' : 'Contient un caractère spécial'}
```

**Recommendation:** Use `t('password.*')` keys with array mapping

---

### 📄 components/ui/NetworkError.tsx
**Hardcoded Text Examples:**
```typescript
// Lines 52-76
{isEn ? 'Connection Error' : 'Erreur de connexion'}
{isEn ? 'Unable to connect to the server' : 'Impossible de se connecter au serveur'}
{isEn ? 'Retry' : 'Réessayer'}
{isEn ? 'Go Home' : 'Retour à l\'accueil'}
```

**Recommendation:** Use `t('error.network.*')` keys

---

### 📄 components/ui/ColorPicker.tsx
**Hardcoded Text Examples:**
```typescript
// Line 80
{isEn ? 'Please select a color' : 'Veuillez choisir une couleur'}

// Line 93
{isEn ? 'Choose...' : 'Choisir...'}
```

**Recommendation:** Use `t('color_picker.*')` keys

---

### 📄 components/ui/CustomSelect.tsx
**Hardcoded Text Examples:**
```typescript
// Line 31
placeholder = 'Sélectionner…',
```

**Recommendation:** Use `t('common.select')` as default placeholder

---

### 📄 components/ui/ColorDisplay.tsx
**Hardcoded Text Examples:**
```typescript
// Line 123
"Fermer"
```

**Recommendation:** Use `t('common.close')`

---

### 📄 components/ui/EssenceSizePickerModal.tsx
**Hardcoded Text Examples:**
```typescript
// Line 145
Stock laboratoire: {product.stock_total_ml.toLocaleString('fr-FR')} ml

// Line 165
"Rupture de stock"

// Line 221
"Plus que {x} restants"

// Line 223
"En stock ({x} flacons)"

// Line 296
"{x} flacon(s)"

// Line 308
"Total"

// Line 326
"Ajouter au panier"
```

**Impact:** Product selection modal completely in French

**Recommendation:** Move all strings to `lib/i18n.ts` under `product.essence_picker.*`

---

### 📄 components/ui/EssenceQuantityModal.tsx
**Hardcoded Text Examples:**
```typescript
// Line 148-149
"Stock épuisé — cette essence n'est plus disponible."
"Stock disponible : {ml} ml total"

// Line 237
"= {ml} ml prélevés sur le stock"

// Line 250
"Volume demandé ({ml} ml) supérieur au stock disponible ({ml} ml)."

// Line 265
"Total estimé"

// Line 267
"{x} flacon(s) × {price}"

// Line 278
"Ajouter au panier"
```

**Recommendation:** Move all strings to `lib/i18n.ts` under `product.quantity_modal.*`

---

### 📄 components/ui/DiffuseurCard.tsx
**Hardcoded Text Examples:**
```typescript
// Line 118
"Le partage n'est pas disponible sur ce navigateur"

// Line 211
"Aucune description disponible"
```

**Recommendation:** Use `t('product.share_unavailable')`, `t('product.no_description')`

---

### 📄 components/ui/ProductCard.tsx
**Hardcoded Text Examples:**
```typescript
// Line 108
"Le partage n'est pas disponible sur ce navigateur"

// Line 203
aria-label="Partager ce produit"
```

**Recommendation:** Use `t('product.*')` keys

---

## 🟢 CATEGORY 5: Specialized Components

### 📄 components/perfume/GeminiChat.tsx
**Pattern:** Inline dictionary for AI sommelier chat

**Hardcoded Text Examples:**
```typescript
const dict = {
  fr: {
    title: 'Sommelier IA',
    placeholder: 'Ex: Un parfum boisé pour le printemps...',
    budgetLabel: 'Budget',
    added: 'Ajouté ✓',
    add: 'Ajouter',
    aiFormula: 'Formule IA',
    addComposition: 'Ajouter la composition',
    addAllToCart: 'Tout ajouter au panier',
    nameModalTitle: 'Nommez votre création',
    nameModalDesc: 'Donnez un nom à votre parfum avant de l\'ajouter au panier.',
    nameModalConfirm: 'Ajouter au panier',
    nameModalCancel: 'Annuler',
    // ... 30+ more strings
  },
  en: { /* matching translations */ }
}
```

**Impact:** Entire AI chat interface isolated from central system

**Recommendation:** Move to `lib/i18n.ts` under `ai_sommelier.*`

---

### 📄 components/perfume/MixerTool.tsx
**Hardcoded Text Examples:**
```typescript
const dict = {
  fr: {
    full: 'Flacon plein — Prêt à créer !',
    addEssences: 'Ajoutez des essences pour remplir votre flacon',
  },
  // ...
}
```

**Recommendation:** Move to `lib/i18n.ts` under `mixer.*`

---

### 📄 components/pwa/PWAInstallGuide.tsx
**Hardcoded Text Examples:**
```typescript
// Line 62
title: isEn ? 'Tap "Add"' : 'Appuyez sur « Ajouter »'

// Line 88
'L'option peut aussi s'appeler « Ajouter à l'écran d'accueil ».'

// Line 277
{isEn ? 'Cancel' : 'Annuler'}

// Line 353
label: isEn ? 'Add to Reading List' : 'Ajouter à la liste de lecture'

// Line 362
label: isEn ? 'Add Bookmark' : 'Ajouter un signet'

// Line 374
confirmLabel: isEn ? 'Add' : 'Ajouter'

// Line 554
'Pas de proposition automatique ? Utilisez le bouton de partage ou le menu du navigateur pour ajouter le site manuellement.'
```

**Impact:** Critical PWA installation instructions scattered

**Recommendation:** Move to `lib/i18n.ts` under `pwa.install.*`

---

### 📄 components/pwa/FCMProvider.tsx
**Hardcoded Text Examples:**
```typescript
// Line 45
"⚠️ Action requise: Pour recevoir des notifications sur iPhone, vous devez installer l'application sur l'écran d'accueil (Partager > Sur l'écran d'accueil) et l'ouvrir depuis l'icône installée."
```

**Recommendation:** Use `t('pwa.fcm_ios_warning')`

---

### 📄 components/pos/SearchBar.tsx
**Hardcoded Text Examples:**
```typescript
// Line 18
placeholder = 'Rechercher un produit...',
```

**Recommendation:** Use `t('pos.search_placeholder')`

---

### 📄 components/pos/ProductPreviewPOS.tsx
**Hardcoded Text Examples:**
```typescript
// Line 122
{product.inStock ? 'Ajouter au panier' : 'Indisponible'}
```

**Recommendation:** Use `t('pos.add_to_cart')`, `t('pos.unavailable')`

---

### 📄 components/pos/ProductPreview.tsx
**Hardcoded Text Examples:**
```typescript
// Line 137
"Ajouter au panier"
```

**Recommendation:** Use `t('common.add_to_cart')`

---

### 📄 components/pos/CartSummary.tsx
**Hardcoded Text Examples:**
```typescript
// Line 50
title="Supprimer"

// Line 118
<span>Valider la commande</span>
```

**Recommendation:** Use `t('pos.delete')`, `t('pos.confirm_order')`

---

### 📄 components/MultiImageUpload.tsx
**Hardcoded Text Examples:**
```typescript
// Line 239
"Cliquer pour ajouter l'image principale"

// Line 241
"ou glisser-déposer une image"

// Line 269
"Cliquer pour ajouter plusieurs images"

// Line 271
"ou glisser-déposer jusqu'à 4 images à la fois"
```

**Recommendation:** Use `t('upload.*')` keys

---

### 📄 components/CreateCategoryModal.tsx
**Hardcoded Text Examples:**
```typescript
// Line 105
"Annuler"

// Line 118
'Créer'
```

**Recommendation:** Use `t('common.cancel')`, `t('common.create')`

---

### 📄 components/notifications/NotificationCenter.tsx
**Hardcoded Text Examples:**
```typescript
// Line 100
if (!confirm('Êtes-vous sûr de vouloir supprimer toutes les notifications ?'))

// Line 145
title="Supprimer tout"
```

**Recommendation:** Use `t('notifications.delete_all_confirm')`

---

### 📄 components/shared/ToastProvider.tsx
**Hardcoded Text Examples:**
```typescript
// Line 74
aria-label="Fermer la notification"
```

**Recommendation:** Use `t('common.close_notification')`

---

### 📄 components/shared/ProfileEditModal.tsx
**Hardcoded Text Examples:**
```typescript
// Line 221
{loading ? t('loading') : t('save_changes', 'Enregistrer')}
```

**Pattern:** Using defaultValue defeats purpose

**Recommendation:** Define 'save_changes' key properly in translation file

---

### 📄 components/shared/ThemeToggle.tsx
**Hardcoded Text Examples:**
```typescript
// Line 42
aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
```

**Recommendation:** Use `t('theme.toggle_light')`, `t('theme.toggle_dark')`

---

### 📄 components/admin/dashboard/GA4AnalyticsDashboard.tsx
**Status:** Needs audit for analytics dashboard labels

---

## 🟠 CATEGORY 6: Utility Functions and Constants

### 📄 lib/utils.ts
**Hardcoded Text Examples:**
```typescript
// Lines 271-273
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });
}

// Lines 282-284
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}
```

**Issue:** Hardcoded 'fr-FR' locale

**Recommendation:** Accept locale parameter from i18n context

---

### 📄 lib/promotionUtils.ts
**Hardcoded Text Examples:**
```typescript
// Line 21-24
const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

if (dateDebut && dateFin) return `${fmt(dateDebut)} → ${fmt(dateFin)}`;
if (dateDebut) return `À partir du ${fmt(dateDebut)}`;
```

**Issue:** Hardcoded 'fr-FR' locale and French text

**Recommendation:** Accept locale and use `t('promo.from_date')`

---

### 📄 lib/constants.ts
**Hardcoded Text Examples:**
```typescript
// Line 178-179
export const CURRENCY = 'FCFA';
export const CURRENCY_LOCALE = 'fr-CM';
```

**Issue:** Hardcoded locale

**Recommendation:** Make locale dynamic based on i18n context

---

### 📄 services/fcmService.ts
**Hardcoded Text Examples:**
```typescript
// Line 270
useToastStore.getState().addToast(
  "Notifications obtenues localement mais échec de la synchronisation avec le serveur.", 
  'info'
);
```

**Recommendation:** Use `t('fcm.sync_failed')`

---

## 📊 Summary Statistics

| Category | Files Affected | Estimated Strings | Priority |
|----------|----------------|-------------------|----------|
| Dashboard Admin Inline Dictionaries | 15+ files | 500+ strings | 🔴 CRITICAL |
| Dashboard Client Inline Dictionaries | 1 file | 200+ strings | 🔴 CRITICAL |
| Public Pages Components | 10+ files | 150+ strings | 🟠 HIGH |
| UI Component Library | 20+ files | 200+ strings | 🟡 MEDIUM |
| Specialized Components | 15+ files | 150+ strings | 🟡 MEDIUM |
| Utility Functions | 5+ files | 20+ strings | 🟢 LOW |
| **TOTAL** | **65+ files** | **1200+ strings** | - |

---

## 🎯 Recommended Action Plan

### Phase 1: Stop the Bleeding (Immediate)
1. **Create migration guidelines** for developers
2. **Block new inline dictionaries** via code review or linting
3. **Document the pattern** to use `t()` function consistently

### Phase 2: Consolidate Dashboard (High Priority)
1. Migrate all `app/dashboard/admin/**` inline dictionaries to `lib/dashboardI18n.ts`
2. Migrate `app/dashboard/client/**` inline dictionaries
3. Create namespace structure: `dashboard.{section}.{key}`

### Phase 3: Refactor UI Components (Medium Priority)
1. Migrate all UI component ternaries to `lib/i18n.ts`
2. Create `common.*`, `form.*`, `table.*` namespaces
3. Add pluralization support where needed

### Phase 4: Public Pages (Medium Priority)
1. Migrate public page components (`PromoCarousel`, `Footer`, etc.)
2. Migrate specialized components (`GeminiChat`, `PWAInstallGuide`)
3. Migrate POS components

### Phase 5: Utilities (Low Priority)
1. Make locale-dependent utils accept i18n context
2. Update constants to be locale-aware

### Phase 6: Validation
1. Remove all inline dictionaries and ternaries
2. Verify no translation keys are missing
3. Test language switching across entire app
4. Add i18n linting rules

---

## 🛠️ Technical Recommendations

### 1. Namespace Structure
```typescript
// lib/i18n.ts
const resources = {
  fr: {
    translation: {
      // Common/Shared
      common: { /* ... */ },
      
      // Dashboard
      dashboard: {
        overview: { /* ... */ },
        perfume: { /* ... */ },
        categories: { /* ... */ },
        flacons: { /* ... */ },
        // ...
      },
      
      // Public Pages
      promo: { /* ... */ },
      footer: { /* ... */ },
      atelier: { /* ... */ },
      
      // UI Components
      table: { /* ... */ },
      form: { /* ... */ },
      product: { /* ... */ },
      
      // Specialized
      ai_sommelier: { /* ... */ },
      pwa: { /* ... */ },
      pos: { /* ... */ },
    }
  },
  en: { /* matching structure */ }
}
```

### 2. Usage Pattern
```typescript
// ❌ BAD - Inline dictionary
const T = {
  fr: { title: 'Mon titre' },
  en: { title: 'My title' }
};
<h1>{isEn ? T.en.title : T.fr.title}</h1>

// ❌ BAD - Inline ternary
<h1>{isEn ? 'My title' : 'Mon titre'}</h1>

// ✅ GOOD - Centralized translation
const { t } = useTranslation();
<h1>{t('dashboard.overview.title')}</h1>
```

### 3. Pluralization
```typescript
// Add to i18n.ts
{
  items_selected: '{{count}} élément sélectionné',
  items_selected_plural: '{{count}} éléments sélectionnés',
}

// Usage
<span>{t('table.items_selected', { count: selectedIds.length })}</span>
```

### 4. Interpolation
```typescript
// Add to i18n.ts
{
  stock_available: 'Stock disponible : {{ml}} ml total'
}

// Usage
<p>{t('product.stock_available', { ml: product.stock_total_ml })}</p>
```

---

## 🚨 Critical Files Requiring Immediate Attention

1. **app/dashboard/admin/perfume/page.tsx** - 100+ hardcoded strings
2. **app/dashboard/client/orders/page.tsx** - 200+ hardcoded strings
3. **app/numba/atelier/page.tsx** - Critical user flow
4. **components/perfume/GeminiChat.tsx** - AI sommelier interface
5. **components/ui/EssenceSizePickerModal.tsx** - Product selection
6. **components/ui/EssenceQuantityModal.tsx** - Quantity selection

---

## 📝 Notes

- Some components correctly use `t()` function but provide `defaultValue` with inline translations, which defeats the purpose of centralized management
- Date formatting utilities hardcode 'fr-FR' locale and need to be made dynamic
- The project has both `lib/i18n.ts` and `lib/dashboardI18n.ts` - consider consolidating or clearly documenting the split
- Many aria-labels and accessibility strings are hardcoded
- Toast messages and error messages are frequently hardcoded inline

---

**End of Report**
