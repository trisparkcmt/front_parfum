'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2, Wifi, Zap, Tag, DollarSign, Boxes, Settings2 } from 'lucide-react';
import { InlineCell } from '@/components/admin/InlineCell';
import { TablePagination } from '@/components/admin/TablePagination';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useCatalogPermissions } from '@/hooks/useCatalogPermissions';
import CatalogAccessNotice from '@/components/catalog/CatalogAccessNotice';
import { extractCatalogList } from '@/lib/catalogUtils';
import { useAuthStore } from '@/store/useAuthStore';
import AppImage from '@/components/ui/AppImage';
import { SlideOver } from '@/components/ui/SlideOver';
import { useTranslation } from 'react-i18next';

/* ── Inline translations ─────────────────────────────────────────────────── */
const T = {
  fr: {
    title: 'Diffuseurs de Parfum',
    subtitle: "Gestion du catalogue des diffuseurs d'ambiance et technologies associées",
    new: 'Nouveau Diffuseur',
    kpi_total: 'Total Références',
    kpi_connected: 'Appareils Connectés',
    kpi_stock: 'Stock Global',
    kpi_units: 'unités',
    search_placeholder: 'Rechercher un diffuseur par nom...',
    col_diffuseur: 'Diffuseur',
    col_tech: 'Technologie',
    col_reservoir: 'Réservoir',
    col_prix_vente: 'Prix Vente',
    col_prix_achat: 'Prix Achat',
    col_marge: 'Marge / Unité',
    col_stock: 'Stock',
    col_actions: 'Actions',
    in_stock: 'en stock',
    out_of_stock: 'Rupture',
    no_results: 'Aucun diffuseur de parfum trouvé.',
    loading: 'Chargement des diffuseurs...',
    modal_title_new: 'Nouveau Diffuseur de Parfum',
    modal_title_edit: 'Modifier le Diffuseur',
    modal_desc: 'Gestion complète des spécifications techniques et tarifs du diffuseur.',
    section_general: 'Informations générales',
    section_pricing: 'Tarification',
    section_stock: 'Stock & spécifications',
    section_tech: 'Caractéristiques techniques',
    field_nom: 'Nom du diffuseur *',
    field_description: 'Description courte',
    field_prix_vente: 'Prix de vente (FCFA) *',
    field_prix_achat: "Prix d'achat (FCFA)",
    field_admin_badge: 'Admin',
    field_stock: 'Stock quantité',
    field_reservoir: 'Réservoir (ml)',
    field_tech: 'Technologie',
    field_tech_ultrasons: 'Ultrasons',
    field_tech_nebulisation: 'Nébulisation à froid',
    field_tech_chaleur: 'Chaleur douce',
    field_tech_connecte: 'Connecté',
    field_alimentation: 'Alimentation',
    field_ali_secteur: 'Secteur (prise)',
    field_ali_usb: 'USB',
    field_ali_batterie: 'Batterie',
    field_ali_solaire: 'Solaire',
    field_connected: 'Appareil connecté (Wi-Fi / BT)',
    field_led: 'Jeux de lumière LED',
    field_actif: 'Visible dans la boutique',
    margin_label: 'Marge estimée :',
    confirm_delete: 'Supprimer ce diffuseur de parfum ?',
    toast_load_error: 'Erreur lors du chargement des diffuseurs de parfum',
    toast_save_error: 'Erreur lors de la sauvegarde du diffuseur',
    toast_delete_ok: 'Diffuseur supprimé avec succès',
    toast_delete_error: 'Erreur lors de la suppression',
    toast_patch_error: 'Erreur lors de la mise à jour',
    toast_create_ok: 'Diffuseur de parfum créé avec succès',
    toast_update_ok: 'Diffuseur de parfum mis à jour',
    toast_required: 'Nom et Prix unitaire requis',
    // mobile card
    card_reservoir: 'Réservoir',
    card_prix_vente: 'Prix vente',
    card_prix_achat: 'Prix achat',
    card_marge: 'Marge / unité',
    connected_label: 'Connecté',
    led_label: 'LED',
  },
  en: {
    title: 'Fragrance Diffusers',
    subtitle: 'Manage the catalogue of ambient diffusers and their technologies',
    new: 'New Diffuser',
    kpi_total: 'Total References',
    kpi_connected: 'Connected Devices',
    kpi_stock: 'Global Stock',
    kpi_units: 'units',
    search_placeholder: 'Search diffuser by name...',
    col_diffuseur: 'Diffuser',
    col_tech: 'Technology',
    col_reservoir: 'Reservoir',
    col_prix_vente: 'Sale Price',
    col_prix_achat: 'Purchase Price',
    col_marge: 'Margin / Unit',
    col_stock: 'Stock',
    col_actions: 'Actions',
    in_stock: 'in stock',
    out_of_stock: 'Out of stock',
    no_results: 'No fragrance diffusers found.',
    loading: 'Loading diffusers...',
    modal_title_new: 'New Fragrance Diffuser',
    modal_title_edit: 'Edit Diffuser',
    modal_desc: 'Full management of technical specs and pricing.',
    section_general: 'General information',
    section_pricing: 'Pricing',
    section_stock: 'Stock & specifications',
    section_tech: 'Technical characteristics',
    field_nom: 'Diffuser name *',
    field_description: 'Short description',
    field_prix_vente: 'Sale price (FCFA) *',
    field_prix_achat: 'Purchase price (FCFA)',
    field_admin_badge: 'Admin',
    field_stock: 'Stock quantity',
    field_reservoir: 'Reservoir (ml)',
    field_tech: 'Technology',
    field_tech_ultrasons: 'Ultrasonic',
    field_tech_nebulisation: 'Cold nebulisation',
    field_tech_chaleur: 'Gentle heat',
    field_tech_connecte: 'Connected',
    field_alimentation: 'Power source',
    field_ali_secteur: 'Mains (plug)',
    field_ali_usb: 'USB',
    field_ali_batterie: 'Battery',
    field_ali_solaire: 'Solar',
    field_connected: 'Connected device (Wi-Fi / BT)',
    field_led: 'LED light display',
    field_actif: 'Visible in the shop',
    margin_label: 'Estimated margin:',
    confirm_delete: 'Delete this fragrance diffuser?',
    toast_load_error: 'Error loading diffusers',
    toast_save_error: 'Error saving diffuser',
    toast_delete_ok: 'Diffuser deleted successfully',
    toast_delete_error: 'Error deleting diffuser',
    toast_patch_error: 'Error updating diffuser',
    toast_create_ok: 'Fragrance diffuser created successfully',
    toast_update_ok: 'Fragrance diffuser updated',
    toast_required: 'Name and Sale price are required',
    card_reservoir: 'Reservoir',
    card_prix_vente: 'Sale price',
    card_prix_achat: 'Purchase price',
    card_marge: 'Margin / unit',
    connected_label: 'Connected',
    led_label: 'LED',
  },
} as const;
type TKey = keyof typeof T.fr;

// --- Shared Primitives ---
const cx = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

interface StatusChipProps {
  label: string;
  variant?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple';
  icon?: React.ReactNode;
}

function StatusChip({ label, variant = 'blue', icon }: StatusChipProps) {
  const styles = {
    emerald: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/10 ring-blue-500/20',
    amber: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',
    red: 'text-red-400 bg-red-500/10 ring-red-500/20',
    purple: 'text-purple-400 bg-purple-500/10 ring-purple-500/20',
  }[variant];

  const dotBg = {
    emerald: 'bg-emerald-400',
    blue: 'bg-blue-400',
    amber: 'bg-amber-400',
    red: 'bg-red-400',
    purple: 'bg-purple-400',
  }[variant];

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
        styles
      )}
    >
      {icon ? (
        icon
      ) : (
        <span className={cx('h-1.5 w-1.5 rounded-full', dotBg)} />
      )}
      {label}
    </span>
  );
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'red' | 'blue' | 'neutral';
  children: React.ReactNode;
}

function IconButton({ variant = 'neutral', children, className, ...props }: IconButtonProps) {
  const hoverStyles = {
    gold: 'hover:text-gold hover:bg-white/5',
    red: 'hover:text-red-400 hover:bg-red-500/10',
    blue: 'hover:text-blue-400 hover:bg-blue-500/10',
    neutral: 'hover:text-foreground hover:bg-white/5',
  }[variant];

  return (
    <button
      {...props}
      className={cx(
        'rounded-md p-1.5 text-foreground/45 transition-colors',
        hoverStyles,
        className
      )}
    >
      {children}
    </button>
  );
}

// --- Form primitives (same language as the other catalog forms) ---

function FormSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground/40">
        {icon}{title}
      </p>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-foreground/40">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-gold/50';

export default function DiffuseursAdminPage() {
  const permissions = useCatalogPermissions('accessoires');
  const { user } = useAuthStore();
  const isAdmin = Boolean(user?.is_staff || user?.role === 'superadmin' || user?.is_superuser);
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const t = (k: TKey) => isEn ? T.en[k] : T.fr[k];

  const [diffuseurs, setDiffuseurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToastStore();

  // ── Pagination & stock split ──────────────────────────────────────────────
  const ITEMS_PER_PAGE = 50;
  const [pageInStock, setPageInStock] = useState(1);
  const [pageOutOfStock, setPageOutOfStock] = useState(1);

  const [form, setForm] = useState({
    nom: '',
    description_courte: '',
    prix_unitaire: '',
    prix_achat: '',
    stock_quantite: '',
    type_technologie: 'ultrasons',
    capacite_reservoir_ml: '',
    type_alimentation: 'secteur',
    est_connecte: false,
    a_jeux_de_lumiere: false,
    actif: true,
  });

  const fetchItems = useCallback(async () => {
    if (!permissions.canRead) return;
    try {
      setLoading(true);
      const data = await adminService.getDiffuseurs(search ? { search } : undefined);
      setDiffuseurs(extractCatalogList(data));
    } catch {
      addToast(t('toast_load_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, permissions.canRead, search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchItems(), 300);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  const openAdd = () => {
    if (!permissions.canCreate) return;
    setEditing(null);
    setForm({
      nom: '',
      description_courte: '',
      prix_unitaire: '',
      prix_achat: '',
      stock_quantite: '',
      type_technologie: 'ultrasons',
      capacite_reservoir_ml: '',
      type_alimentation: 'secteur',
      est_connecte: false,
      a_jeux_de_lumiere: false,
      actif: true,
    });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    if (!permissions.canUpdate) return;
    setEditing(item);
    setForm({
      nom: item.nom || '',
      description_courte: item.description_courte || '',
      prix_unitaire: String(item.prix_unitaire || ''),
      prix_achat: item.prix_achat ? String(item.prix_achat) : '',
      stock_quantite: String(item.stock_quantite ?? ''),
      type_technologie: item.type_technologie || 'ultrasons',
      capacite_reservoir_ml: String(item.capacite_reservoir_ml || ''),
      type_alimentation: item.type_alimentation || 'secteur',
      est_connecte: Boolean(item.est_connecte),
      a_jeux_de_lumiere: Boolean(item.a_jeux_de_lumiere),
      actif: item.actif !== undefined ? Boolean(item.actif) : true,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!permissions.canCreate && !permissions.canUpdate) return;
    if (!form.nom || !form.prix_unitaire) {
      addToast(t('toast_required'), 'error');
      return;
    }
    try {
      setSaving(true);
      const payload: Record<string, any> = {
        nom: form.nom,
        description_courte: form.description_courte,
        prix_unitaire: form.prix_unitaire,
        type_technologie: form.type_technologie,
        type_alimentation: form.type_alimentation,
        est_connecte: form.est_connecte,
        a_jeux_de_lumiere: form.a_jeux_de_lumiere,
        actif: form.actif,
      };

      if (form.prix_achat) payload.prix_achat = form.prix_achat;
      if (form.stock_quantite) payload.stock_quantite = parseInt(form.stock_quantite, 10);
      if (form.capacite_reservoir_ml) payload.capacite_reservoir_ml = parseInt(form.capacite_reservoir_ml, 10);

      if (editing) {
        setDiffuseurs(prev => prev.map(d => d.id === editing.id ? { ...d, ...payload } : d));
        setShowModal(false);
        await adminService.updateDiffuseur(editing.id, payload);
        addToast(t('toast_update_ok'), 'success');
        fetchItems();
      } else {
        setShowModal(false);
        await adminService.createDiffuseur(payload);
        addToast(t('toast_create_ok'), 'success');
        fetchItems();
      }
    } catch {
      addToast(t('toast_save_error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const patchDiffuseur = async (id: number, field: string, value: string) => {
    if (!permissions.canUpdate) return;
    setDiffuseurs(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    try {
      await adminService.updateDiffuseur(id, { [field]: field === 'nom' ? value : Number(value) });
    } catch {
      addToast(t('toast_patch_error'), 'error');
      fetchItems();
    }
  };

  const handleDelete = async (id: number) => {
    if (!permissions.canDelete) return;
    if (!confirm(t('confirm_delete'))) return;
    const snapshot = diffuseurs.find(d => d.id === id);
    setDiffuseurs(prev => prev.filter(d => d.id !== id));
    try {
      await adminService.deleteDiffuseur(id);
      addToast(t('toast_delete_ok'), 'success');
    } catch {
      if (snapshot) setDiffuseurs(prev => [snapshot, ...prev]);
      addToast(t('toast_delete_error'), 'error');
    }
  };

  const stats = useMemo(() => {
    const total = diffuseurs.length;
    const connected = diffuseurs.filter((d) => d.est_connecte).length;
    const totalStock = diffuseurs.reduce((acc, d) => acc + (parseInt(d.stock_quantite, 10) || 0), 0);
    return { total, connected, totalStock };
  }, [diffuseurs]);

  const profitPreview = form.prix_unitaire && form.prix_achat
    ? (parseFloat(form.prix_unitaire) - parseFloat(form.prix_achat))
    : null;

  if (!permissions.canRead) {
    return (
      <CatalogAccessNotice permissions={permissions} resourceLabel="les diffuseurs" />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-sm text-foreground/40 mt-0.5">{t('subtitle')}</p>
        </div>
        {permissions.canCreate && (
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 bg-gold text-black px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-gold/90 transition-colors w-full sm:w-auto"
          >
            <Plus size={16} />{t('new')}
          </button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="shadow-black/30 shadow-sm shadow-black/30 shadow-sm rounded-xl border border-white/10 bg-white/[0.02] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('kpi_total')}</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-0.5">{stats.total}</p>
        </div>
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('kpi_connected')}</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-0.5">{stats.connected}</p>
        </div>
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('kpi_stock')}</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-0.5">{stats.totalStock} <span className="text-xs font-normal text-foreground/40">{t('kpi_units')}</span></p>
        </div>
      </div>

      {/* Toolbar / Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={15} />
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:border-gold/50 transition-colors"
          />
        </div>
      </div>

      {/* Table Section — desktop */}
      <div className="shadow-black/30 shadow-sm hidden md:block rounded-xl border border-white/10 overflow-hidden bg-white/[0.02] min-h-[250px]">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-foreground/40 gap-2">
            <Loader2 className="animate-spin text-gold" size={18} />
            <span className="text-xs">Chargement des diffuseurs...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('col_diffuseur')}</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('col_tech')}</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('col_reservoir')}</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('col_prix_vente')}</th>
                  {isAdmin && <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gold/80">{t('col_prix_achat')}</th>}
                  {isAdmin && <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/80">{t('col_marge')}</th>}
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('col_stock')}</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35 text-right">{t('col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {diffuseurs.filter(item => Number(item.stock_quantite ?? 0) > 0).slice((pageInStock - 1) * ITEMS_PER_PAGE, pageInStock * ITEMS_PER_PAGE).map((item) => {
                  const pVente = parseFloat(item.prix_unitaire || 0);
                  const pAchat = item.prix_achat ? parseFloat(item.prix_achat) : null;
                  const benefice = item.benefice_unitaire
                    ? parseFloat(item.benefice_unitaire)
                    : pAchat !== null
                    ? pVente - pAchat
                    : null;

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-sm text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 overflow-hidden relative flex-shrink-0">
                            {item.image_principale ? (
                              <AppImage src={item.image_principale} alt={item.nom} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-foreground/20">
                                <span className="text-[10px] uppercase font-bold text-foreground/30">Diff</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              <InlineCell value={item.nom} onSave={v => patchDiffuseur(item.id, 'nom', v)} disabled={!permissions.canUpdate} className="font-medium text-foreground" />
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              {item.est_connecte && (
                                <StatusChip
                                  variant="blue"
                                  label="Connecté"
                                  icon={<Wifi size={10} className="text-blue-400" />}
                                />
                              )}
                              {item.a_jeux_de_lumiere && (
                                <StatusChip
                                  variant="purple"
                                  label="LED"
                                  icon={<Zap size={10} className="text-purple-400" />}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground/60 capitalize">
                        {item.type_technologie || 'ultrasons'}
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground/60 tabular-nums">
                        <InlineCell value={String(item.capacite_reservoir_ml ?? '')} onSave={v => patchDiffuseur(item.id, 'capacite_reservoir_ml', v)} disabled={!permissions.canUpdate} inputType="number" display={item.capacite_reservoir_ml ? <>{item.capacite_reservoir_ml} ml</> : <>—</>} className="text-foreground/60 tabular-nums" />
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold tabular-nums text-foreground">
                        <InlineCell value={String(item.prix_unitaire ?? '')} onSave={v => patchDiffuseur(item.id, 'prix_unitaire', v)} disabled={!permissions.canUpdate} inputType="number" display={<>{pVente.toLocaleString()} FCFA</>} className="font-semibold text-foreground tabular-nums" />
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-xs tabular-nums text-gold/90">
                          {pAchat !== null ? `${pAchat.toLocaleString()} FCFA` : '—'}
                        </td>
                      )}
                      {isAdmin && (
                        <td className="px-4 py-3 text-xs tabular-nums font-semibold">
                          {benefice !== null ? (
                            <span className={benefice >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {benefice >= 0 ? '+' : ''}{benefice.toLocaleString()} FCFA
                            </span>
                          ) : '—'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-xs">
                        <InlineCell value={String(item.stock_quantite ?? 0)} onSave={v => patchDiffuseur(item.id, 'stock_quantite', v)} disabled={!permissions.canUpdate} inputType="number" display={item.stock_quantite > 0 ? <span className="text-emerald-400 tabular-nums">{item.stock_quantite} {t('in_stock')}</span> : <span className="text-red-400">{t('out_of_stock')}</span>} className="tabular-nums" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {permissions.canUpdate && (
                            <IconButton variant="gold" onClick={() => openEdit(item)} title="Modifier">
                              <Edit2 size={14} />
                            </IconButton>
                          )}
                          {permissions.canDelete && (
                            <IconButton variant="red" onClick={() => handleDelete(item.id)} title="Supprimer">
                              <Trash2 size={14} />
                            </IconButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {diffuseurs.filter(i => Number(i.stock_quantite ?? 0) > 0).length === 0 && diffuseurs.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 6} className="text-center py-12 text-xs italic text-foreground/30">{t('no_results')}</td>
                  </tr>
                )}
              </tbody>
            </table>
            <TablePagination
              currentPage={pageInStock}
              totalPages={Math.max(1, Math.ceil(diffuseurs.filter(i => Number(i.stock_quantite ?? 0) > 0).length / ITEMS_PER_PAGE))}
              totalItems={diffuseurs.filter(i => Number(i.stock_quantite ?? 0) > 0).length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setPageInStock}
              itemLabel={isEn ? 'in-stock diffusers' : 'diffuseurs en stock'}
            />
            {diffuseurs.filter(i => Number(i.stock_quantite ?? 0) === 0).length > 0 && (
              <div className="border-t-2 border-red-500/20">
                <div className="px-4 py-2.5 bg-red-500/5 border-b border-red-500/10 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400">
                    {isEn ? `Out of Stock (${diffuseurs.filter(i => Number(i.stock_quantite ?? 0) === 0).length})` : `En Rupture de Stock (${diffuseurs.filter(i => Number(i.stock_quantite ?? 0) === 0).length})`}
                  </p>
                </div>
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-white/5 opacity-70">
                    {diffuseurs.filter(i => Number(i.stock_quantite ?? 0) === 0).slice((pageOutOfStock - 1) * ITEMS_PER_PAGE, pageOutOfStock * ITEMS_PER_PAGE).map((item) => {
                      const pVente = parseFloat(item.prix_unitaire || 0);
                      const pAchat = item.prix_achat ? parseFloat(item.prix_achat) : null;
                      return (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-2.5 text-xs text-foreground/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 overflow-hidden relative flex-shrink-0">
                                {item.image_principale ? <AppImage src={item.image_principale} alt={item.nom || ''} fill className="object-cover opacity-50" /> : null}
                              </div>
                              <span>{item.nom || '—'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-foreground/35">{item.technologie || '—'}</td>
                          <td className="px-4 py-2.5 text-xs text-foreground/35">{item.capacite_reservoir_ml ? `${item.capacite_reservoir_ml} ml` : '—'}</td>
                          <td className="px-4 py-2.5 text-xs text-foreground/40">{pVente ? `${pVente.toLocaleString()} FCFA` : '—'}</td>
                          {isAdmin && <td className="px-4 py-2.5 text-xs text-foreground/35">{pAchat ? `${pAchat.toLocaleString()} FCFA` : '—'}</td>}
                          {isAdmin && <td className="px-4 py-2.5 text-xs text-foreground/35">—</td>}
                          <td className="px-4 py-2.5"><span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset bg-red-500/10 text-red-400 ring-red-500/20"><span className="h-1.5 w-1.5 rounded-full bg-red-400" />{isEn ? 'Out of stock' : 'Rupture'}</span></td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {permissions.canUpdate && <button onClick={() => openEdit(item)} className="rounded-md p-1.5 text-foreground/45 hover:text-gold hover:bg-gold/10 transition-colors" title="Modifier"><Edit2 size={13} /></button>}
                              {permissions.canDelete && <button onClick={() => handleDelete(item.id)} className="rounded-md p-1.5 text-foreground/45 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Supprimer"><Trash2 size={13} /></button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <TablePagination
                  currentPage={pageOutOfStock}
                  totalPages={Math.max(1, Math.ceil(diffuseurs.filter(i => Number(i.stock_quantite ?? 0) === 0).length / ITEMS_PER_PAGE))}
                  totalItems={diffuseurs.filter(i => Number(i.stock_quantite ?? 0) === 0).length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setPageOutOfStock}
                  itemLabel={isEn ? 'out-of-stock diffusers' : 'diffuseurs en rupture'}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="shadow-black/30 shadow-sm flex items-center justify-center py-20 text-foreground/40 gap-2 rounded-xl border border-white/10 bg-white/[0.02]">
            <Loader2 className="animate-spin text-gold" size={18} />
            <span className="text-xs">Chargement des diffuseurs...</span>
          </div>
        ) : diffuseurs.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] py-12 text-center text-xs italic text-foreground/30">
            Aucun diffuseur de parfum trouvé.
          </div>
        ) : (
          diffuseurs.map((item) => {
            const pVente = parseFloat(item.prix_unitaire || 0);
            const pAchat = item.prix_achat ? parseFloat(item.prix_achat) : null;
            const benefice = item.benefice_unitaire
              ? parseFloat(item.benefice_unitaire)
              : pAchat !== null
              ? pVente - pAchat
              : null;

            return (
              <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 overflow-hidden relative flex-shrink-0">
                      {item.image_principale ? (
                        <AppImage src={item.image_principale} alt={item.nom} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-foreground/20">
                          <span className="text-[10px] uppercase font-bold text-foreground/30">Diff</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.nom}</p>
                      <p className="text-xs text-foreground/50 capitalize">{item.type_technologie || 'ultrasons'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {permissions.canUpdate && (
                      <IconButton variant="gold" onClick={() => openEdit(item)} title="Modifier">
                        <Edit2 size={14} />
                      </IconButton>
                    )}
                    {permissions.canDelete && (
                      <IconButton variant="red" onClick={() => handleDelete(item.id)} title="Supprimer">
                        <Trash2 size={14} />
                      </IconButton>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {item.est_connecte && (
                    <StatusChip variant="blue" label="Connecté" icon={<Wifi size={10} className="text-blue-400" />} />
                  )}
                  {item.a_jeux_de_lumiere && (
                    <StatusChip variant="purple" label="LED" icon={<Zap size={10} className="text-purple-400" />} />
                  )}
                  {item.stock_quantite > 0 ? (
                    <StatusChip variant="emerald" label={`${item.stock_quantite} en stock`} />
                  ) : (
                    <StatusChip variant="red" label="Rupture" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2.5 text-xs">
                  <div>
                    <p className="text-foreground/40">{t('card_reservoir')}</p>
                    <p className="font-medium text-foreground/80 tabular-nums">{item.capacite_reservoir_ml ? `${item.capacite_reservoir_ml} ml` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-foreground/40">{t('card_prix_vente')}</p>
                    <p className="font-semibold text-foreground tabular-nums">{pVente.toLocaleString()} FCFA</p>
                  </div>
                  {isAdmin && (
                    <>
                      <div>
                        <p className="text-foreground/40">{t('card_prix_achat')}</p>
                        <p className="font-medium text-gold/90 tabular-nums">{pAchat !== null ? `${pAchat.toLocaleString()} FCFA` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-foreground/40">{t('card_marge')}</p>
                        <p className={cx('font-semibold tabular-nums', benefice !== null ? (benefice >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-foreground/40')}>
                          {benefice !== null ? `${benefice >= 0 ? '+' : ''}${benefice.toLocaleString()} FCFA` : '—'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SlideOver Form Modal */}
      <SlideOver
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? t('modal_title_edit') : t('modal_title_new')}
        description={t('modal_desc')}
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 border border-white/10 rounded-lg py-2 text-xs text-foreground/60 hover:bg-white/5 transition-colors"
            >
              {isEn ? 'Cancel' : 'Annuler'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gold text-black rounded-lg py-2 text-xs font-semibold hover:bg-gold/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              {saving ? (isEn ? 'Saving…' : 'Enregistrement…') : (isEn ? 'Save' : 'Enregistrer')}
            </button>
          </div>
        }
      >
        <div className="space-y-4">

          <FormSection title={t('section_general')} icon={<Tag size={11} />}>
            <Field label={t('field_nom')}>
              <input type="text" value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} placeholder={isEn ? 'e.g. Zen Ultrasonic Diffuser' : 'ex: Diffuseur Ultrasonique Zen'} className={inputCls} />
            </Field>
            <Field label={t('field_description')}>
              <input type="text" value={form.description_courte} onChange={(e) => setForm((p) => ({ ...p, description_courte: e.target.value }))} placeholder={isEn ? 'e.g. High-frequency 300ml with LED' : 'ex: Diffusion haute fréquence 300ml avec LED'} className={inputCls} />
            </Field>
          </FormSection>

          <FormSection title={t('section_pricing')} icon={<DollarSign size={11} />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('field_prix_vente')}>
                <input type="number" value={form.prix_unitaire} onChange={(e) => setForm((p) => ({ ...p, prix_unitaire: e.target.value }))} placeholder="25000" className={inputCls} />
              </Field>
              {isAdmin && (
                <Field label={<span className="flex items-center gap-1.5 text-amber-400/90">{t('field_prix_achat')}<span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">{t('field_admin_badge')}</span></span>}>
                  <input type="number" value={form.prix_achat} onChange={(e) => setForm((p) => ({ ...p, prix_achat: e.target.value }))} placeholder="12000" className={cx(inputCls, 'border-amber-500/20')} />
                </Field>
              )}
            </div>
            {isAdmin && profitPreview !== null && (
              <p className={cx('text-xs font-medium', profitPreview >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {t('margin_label')} {profitPreview >= 0 ? '+' : ''}{profitPreview.toLocaleString()} FCFA
              </p>
            )}
          </FormSection>

          <FormSection title={t('section_stock')} icon={<Boxes size={11} />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('field_stock')}>
                <input type="number" value={form.stock_quantite} onChange={(e) => setForm((p) => ({ ...p, stock_quantite: e.target.value }))} placeholder="15" className={inputCls} />
              </Field>
              <Field label={t('field_reservoir')}>
                <input type="number" value={form.capacite_reservoir_ml} onChange={(e) => setForm((p) => ({ ...p, capacite_reservoir_ml: e.target.value }))} placeholder="300" className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('field_tech')}>
                <select value={form.type_technologie} onChange={(e) => setForm((p) => ({ ...p, type_technologie: e.target.value }))} className={inputCls}>
                  <option value="ultrasons" className="bg-background">{t('field_tech_ultrasons')}</option>
                  <option value="nebulisation" className="bg-background">{t('field_tech_nebulisation')}</option>
                  <option value="chaleur" className="bg-background">{t('field_tech_chaleur')}</option>
                  <option value="ventilation" className="bg-background">{t('field_tech_connecte')}</option>
                </select>
              </Field>
              <Field label={t('field_alimentation')}>
                <select value={form.type_alimentation} onChange={(e) => setForm((p) => ({ ...p, type_alimentation: e.target.value }))} className={inputCls}>
                  <option value="secteur" className="bg-background">{t('field_ali_secteur')}</option>
                  <option value="usb" className="bg-background">{t('field_ali_usb')}</option>
                  <option value="batterie" className="bg-background">{t('field_ali_batterie')}</option>
                </select>
              </Field>
            </div>
          </FormSection>

          <FormSection title={isEn ? 'Features & status' : 'Fonctionnalités & statut'} icon={<Settings2 size={11} />}>
            <div className="space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.est_connecte} onChange={(e) => setForm((p) => ({ ...p, est_connecte: e.target.checked }))} className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold" />
                <span className="text-xs text-foreground/70">{t('field_connected')}</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.a_jeux_de_lumiere} onChange={(e) => setForm((p) => ({ ...p, a_jeux_de_lumiere: e.target.checked }))} className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold" />
                <span className="text-xs text-foreground/70">{t('field_led')}</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.actif} onChange={(e) => setForm((p) => ({ ...p, actif: e.target.checked }))} className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold" />
                <span className="text-xs text-foreground/70">{t('field_actif')}</span>
              </label>
            </div>
          </FormSection>
        </div>
      </SlideOver>
    </div>
  );
}