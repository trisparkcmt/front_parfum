/**
 * @file lib/dashboardI18n.ts
 *
 * Shared inline FR/EN translation utility for dashboard pages.
 *
 * Usage in any dashboard page:
 *   import { useTranslation } from 'react-i18next';
 *   import { useDashboardLang, dc } from '@/lib/dashboardI18n';
 *
 *   // Inside component:
 *   const isEn = useDashboardLang();
 *   // Common strings:
 *   dc(isEn, 'save')   → "Save" | "Enregistrer"
 *   // Page-specific inline dict:
 *   const T = { fr: { title: 'Commandes' }, en: { title: 'Orders' } };
 *   const t = (k: keyof typeof T.fr) => isEn ? T.en[k] : T.fr[k];
 */

import { useTranslation } from 'react-i18next';

/** Returns true when the current app language is English. */
export function useDashboardLang(): boolean {
  const { i18n } = useTranslation();
  return i18n.language?.startsWith('en') ?? false;
}

/** Common dashboard strings shared across all pages. */
const COMMON = {
  fr: {
    // Actions
    save: 'Enregistrer',
    saving: 'Enregistrement…',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    create: 'Créer',
    close: 'Fermer',
    confirm: 'Confirmer',
    send: 'Envoyer',
    search: 'Rechercher',
    filter: 'Filtres',
    reset: 'Réinitialiser',
    refresh: 'Actualiser',
    download: 'Télécharger',
    export: 'Exporter',
    print: 'Imprimer',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    loading: 'Chargement…',
    // Status
    active: 'Actif',
    inactive: 'Inactif',
    enabled: 'Activé',
    disabled: 'Désactivé',
    yes: 'Oui',
    no: 'Non',
    // Common labels
    name: 'Nom',
    description: 'Description',
    price: 'Prix',
    stock: 'Stock',
    status: 'Statut',
    date: 'Date',
    actions: 'Actions',
    total: 'Total',
    type: 'Type',
    category: 'Catégorie',
    image: 'Image',
    ref: 'Référence',
    quantity: 'Quantité',
    unit: 'Unité',
    percent: '%',
    // Table
    no_results: 'Aucun résultat',
    no_data: 'Aucune donnée disponible',
    // Pagination
    page: 'Page',
    of: 'sur',
    items_per_page: 'Éléments par page',
    // Confirmations
    confirm_delete: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
    confirm_action: 'Êtes-vous sûr ?',
    // Errors
    error_load: 'Erreur lors du chargement',
    error_save: 'Erreur lors de la sauvegarde',
    error_delete: 'Erreur lors de la suppression',
    error_generic: 'Une erreur est survenue',
    // Success
    saved: 'Enregistré avec succès',
    deleted: 'Supprimé avec succès',
    created: 'Créé avec succès',
    updated: 'Mis à jour avec succès',
    // Misc
    required_fields: 'Champs requis',
    optional: 'Optionnel',
    all: 'Tous',
    none: 'Aucun',
    other: 'Autre',
  },
  en: {
    // Actions
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    create: 'Create',
    close: 'Close',
    confirm: 'Confirm',
    send: 'Send',
    search: 'Search',
    filter: 'Filters',
    reset: 'Reset',
    refresh: 'Refresh',
    download: 'Download',
    export: 'Export',
    print: 'Print',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    loading: 'Loading…',
    // Status
    active: 'Active',
    inactive: 'Inactive',
    enabled: 'Enabled',
    disabled: 'Disabled',
    yes: 'Yes',
    no: 'No',
    // Common labels
    name: 'Name',
    description: 'Description',
    price: 'Price',
    stock: 'Stock',
    status: 'Status',
    date: 'Date',
    actions: 'Actions',
    total: 'Total',
    type: 'Type',
    category: 'Category',
    image: 'Image',
    ref: 'Reference',
    quantity: 'Quantity',
    unit: 'Unit',
    percent: '%',
    // Table
    no_results: 'No results found',
    no_data: 'No data available',
    // Pagination
    page: 'Page',
    of: 'of',
    items_per_page: 'Items per page',
    // Confirmations
    confirm_delete: 'Are you sure you want to delete this item?',
    confirm_action: 'Are you sure?',
    // Errors
    error_load: 'Error loading data',
    error_save: 'Error saving',
    error_delete: 'Error deleting',
    error_generic: 'An error occurred',
    // Success
    saved: 'Saved successfully',
    deleted: 'Deleted successfully',
    created: 'Created successfully',
    updated: 'Updated successfully',
    // Misc
    required_fields: 'Required fields',
    optional: 'Optional',
    all: 'All',
    none: 'None',
    other: 'Other',
  },
} as const;

export type CommonKey = keyof typeof COMMON.fr;

/**
 * dc — Dashboard Common string lookup.
 * dc(isEn, 'save') → "Save" | "Enregistrer"
 */
export function dc(isEn: boolean, key: CommonKey): string {
  return isEn ? COMMON.en[key] : COMMON.fr[key];
}
