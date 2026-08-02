'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2, Wifi, Zap, Tag, DollarSign, Boxes, Settings2 } from 'lucide-react';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useCatalogPermissions } from '@/hooks/useCatalogPermissions';
import CatalogAccessNotice from '@/components/catalog/CatalogAccessNotice';
import { extractCatalogList } from '@/lib/catalogUtils';
import { useAuthStore } from '@/store/useAuthStore';
import AppImage from '@/components/ui/AppImage';
import { SlideOver } from '@/components/ui/SlideOver';

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

  const [diffuseurs, setDiffuseurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToastStore();

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
      addToast('Erreur lors du chargement des diffuseurs de parfum', 'error');
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
      addToast('Nom et Prix unitaire requis', 'error');
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
        await adminService.updateDiffuseur(editing.id, payload);
        addToast('Diffuseur de parfum mis à jour', 'success');
      } else {
        await adminService.createDiffuseur(payload);
        addToast('Diffuseur de parfum créé avec succès', 'success');
      }
      setShowModal(false);
      fetchItems();
    } catch {
      addToast('Erreur lors de la sauvegarde du diffuseur', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!permissions.canDelete) return;
    if (!confirm('Supprimer ce diffuseur de parfum ?')) return;
    try {
      await adminService.deleteDiffuseur(id);
      addToast('Diffuseur supprimé avec succès', 'success');
      fetchItems();
    } catch {
      addToast('Erreur lors de la suppression', 'error');
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
          <h1 className="text-xl font-semibold text-foreground">
            Diffuseurs de Parfum
          </h1>
          <p className="text-sm text-foreground/40 mt-0.5">
            Gestion du catalogue des diffuseurs d'ambiance et technologies associées
          </p>
        </div>
        {permissions.canCreate && (
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 bg-gold text-black px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-gold/90 transition-colors w-full sm:w-auto"
          >
            <Plus size={16} />
            Nouveau Diffuseur
          </button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Total Références</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-0.5">{stats.total}</p>
        </div>
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Appareils Connectés</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-0.5">{stats.connected}</p>
        </div>
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Stock Global</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-0.5">{stats.totalStock} <span className="text-xs font-normal text-foreground/40">unités</span></p>
        </div>
      </div>

      {/* Toolbar / Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={15} />
          <input
            type="text"
            placeholder="Rechercher un diffuseur par nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:border-gold/50 transition-colors"
          />
        </div>
      </div>

      {/* Table Section — desktop */}
      <div className="hidden md:block rounded-xl border border-white/10 overflow-hidden bg-white/[0.02] min-h-[250px]">
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
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Diffuseur</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Technologie</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Réservoir</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Prix Vente</th>
                  {isAdmin && <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gold/80">Prix Achat</th>}
                  {isAdmin && <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/80">Marge / Unité</th>}
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Stock</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {diffuseurs.map((item) => {
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
                            <p className="font-medium text-foreground">{item.nom}</p>
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
                        {item.capacite_reservoir_ml ? `${item.capacite_reservoir_ml} ml` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold tabular-nums text-foreground">
                        {pVente.toLocaleString()} FCFA
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
                        {item.stock_quantite > 0 ? (
                          <StatusChip variant="emerald" label={`${item.stock_quantite} en stock`} />
                        ) : (
                          <StatusChip variant="red" label="Rupture" />
                        )}
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
                {diffuseurs.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 6} className="text-center py-12 text-xs italic text-foreground/30">
                      Aucun diffuseur de parfum trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-foreground/40 gap-2 rounded-xl border border-white/10 bg-white/[0.02]">
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
                    <p className="text-foreground/40">Réservoir</p>
                    <p className="font-medium text-foreground/80 tabular-nums">{item.capacite_reservoir_ml ? `${item.capacite_reservoir_ml} ml` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-foreground/40">Prix vente</p>
                    <p className="font-semibold text-foreground tabular-nums">{pVente.toLocaleString()} FCFA</p>
                  </div>
                  {isAdmin && (
                    <>
                      <div>
                        <p className="text-foreground/40">Prix achat</p>
                        <p className="font-medium text-gold/90 tabular-nums">{pAchat !== null ? `${pAchat.toLocaleString()} FCFA` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-foreground/40">Marge / unité</p>
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
        title={editing ? 'Modifier le Diffuseur' : 'Nouveau Diffuseur de Parfum'}
        description="Gestion complète des spécifications techniques et tarifs du diffuseur."
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 border border-white/10 rounded-lg py-2 text-xs text-foreground/60 hover:bg-white/5 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gold text-black rounded-lg py-2 text-xs font-semibold hover:bg-gold/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              Enregistrer
            </button>
          </div>
        }
      >
        <div className="space-y-4">

          <FormSection title="Informations générales" icon={<Tag size={11} />}>
            <Field label="Nom du diffuseur *">
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                placeholder="ex: Diffuseur Ultrasonique Zen"
                className={inputCls}
              />
            </Field>
            <Field label="Description courte">
              <input
                type="text"
                value={form.description_courte}
                onChange={(e) => setForm((p) => ({ ...p, description_courte: e.target.value }))}
                placeholder="ex: Diffusion haute fréquence 300ml avec LED"
                className={inputCls}
              />
            </Field>
          </FormSection>

          <FormSection title="Tarification" icon={<DollarSign size={11} />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Prix de vente (FCFA) *">
                <input
                  type="number"
                  value={form.prix_unitaire}
                  onChange={(e) => setForm((p) => ({ ...p, prix_unitaire: e.target.value }))}
                  placeholder="25000"
                  className={inputCls}
                />
              </Field>
              {isAdmin && (
                <Field label={<span className="flex items-center gap-1.5 text-amber-400/90">Prix d'achat (FCFA)<span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">Admin</span></span>}>
                  <input
                    type="number"
                    value={form.prix_achat}
                    onChange={(e) => setForm((p) => ({ ...p, prix_achat: e.target.value }))}
                    placeholder="12000"
                    className={cx(inputCls, 'border-amber-500/20')}
                  />
                </Field>
              )}
            </div>
            {isAdmin && profitPreview !== null && (
              <p className={cx('text-xs font-medium', profitPreview >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                Marge estimée : {profitPreview >= 0 ? '+' : ''}{profitPreview.toLocaleString()} FCFA
              </p>
            )}
          </FormSection>

          <FormSection title="Stock & spécifications" icon={<Boxes size={11} />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Stock quantité">
                <input
                  type="number"
                  value={form.stock_quantite}
                  onChange={(e) => setForm((p) => ({ ...p, stock_quantite: e.target.value }))}
                  placeholder="15"
                  className={inputCls}
                />
              </Field>
              <Field label="Réservoir (ml)">
                <input
                  type="number"
                  value={form.capacite_reservoir_ml}
                  onChange={(e) => setForm((p) => ({ ...p, capacite_reservoir_ml: e.target.value }))}
                  placeholder="300"
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Technologie">
                <select
                  value={form.type_technologie}
                  onChange={(e) => setForm((p) => ({ ...p, type_technologie: e.target.value }))}
                  className={inputCls}
                >
                  <option value="ultrasons" className="bg-background">Ultrasons</option>
                  <option value="nebulisation" className="bg-background">Nébulisation</option>
                  <option value="chaleur" className="bg-background">Chaleur douce</option>
                  <option value="ventilation" className="bg-background">Ventilation</option>
                </select>
              </Field>
              <Field label="Alimentation">
                <select
                  value={form.type_alimentation}
                  onChange={(e) => setForm((p) => ({ ...p, type_alimentation: e.target.value }))}
                  className={inputCls}
                >
                  <option value="secteur" className="bg-background">Secteur 220V</option>
                  <option value="usb" className="bg-background">USB-C</option>
                  <option value="batterie" className="bg-background">Batterie rechargeable</option>
                </select>
              </Field>
            </div>
          </FormSection>

          <FormSection title="Fonctionnalités & statut" icon={<Settings2 size={11} />}>
            <div className="space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.est_connecte}
                  onChange={(e) => setForm((p) => ({ ...p, est_connecte: e.target.checked }))}
                  className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                />
                <span className="text-xs text-foreground/70">Appareil connecté (Wi-Fi / Bluetooth)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.a_jeux_de_lumiere}
                  onChange={(e) => setForm((p) => ({ ...p, a_jeux_de_lumiere: e.target.checked }))}
                  className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                />
                <span className="text-xs text-foreground/70">Jeux d'éclairage LED ambiants</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.actif}
                  onChange={(e) => setForm((p) => ({ ...p, actif: e.target.checked }))}
                  className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                />
                <span className="text-xs text-foreground/70">Produit actif (visible en boutique)</span>
              </label>
            </div>
          </FormSection>
        </div>
      </SlideOver>
    </div>
  );
}