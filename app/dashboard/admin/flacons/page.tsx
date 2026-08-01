'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Edit2, Trash2, Plus, Search, Filter, X } from 'lucide-react';
import { shopService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useCatalogPermissions } from '@/hooks/useCatalogPermissions';
import CatalogAccessNotice from '@/components/catalog/CatalogAccessNotice';
import { extractCatalogList } from '@/lib/catalogUtils';
import { useAuthStore } from '@/store/useAuthStore';
import { SlideOver } from '@/components/ui/SlideOver';

// --- Helper Functions & Primitives ---

function cx(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

type StatusType = 'emerald' | 'blue' | 'amber' | 'red' | 'purple';

function StatusChip({
  status,
  label,
}: {
  status: StatusType;
  label: string;
}) {
  const styles: Record<StatusType, { text: string; bg: string; ring: string; dot: string }> = {
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      ring: 'ring-emerald-500/20',
      dot: 'bg-emerald-400',
    },
    blue: {
      text: 'text-blue-400',
      bg: 'bg-blue-500/10',
      ring: 'ring-blue-500/20',
      dot: 'bg-blue-400',
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      ring: 'ring-amber-500/20',
      dot: 'bg-amber-400',
    },
    red: {
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      ring: 'ring-red-500/20',
      dot: 'bg-red-400',
    },
    purple: {
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
      ring: 'ring-purple-500/20',
      dot: 'bg-purple-400',
    },
  };

  const current = styles[status] || styles.blue;

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
        current.text,
        current.bg,
        current.ring
      )}
    >
      <span className={cx('h-1.5 w-1.5 rounded-full shrink-0', current.dot)} />
      {label}
    </span>
  );
}

function IconButton({
  icon: Icon,
  onClick,
  title,
  tint = 'neutral',
  disabled = false,
}: {
  icon: any;
  onClick?: () => void;
  title?: string;
  tint?: 'gold' | 'red' | 'blue' | 'emerald' | 'neutral';
  disabled?: boolean;
}) {
  const tintStyles = {
    gold: 'hover:text-gold hover:bg-gold/10',
    red: 'hover:text-red-400 hover:bg-red-500/10',
    blue: 'hover:text-blue-400 hover:bg-blue-500/10',
    emerald: 'hover:text-emerald-400 hover:bg-emerald-500/10',
    neutral: 'hover:text-foreground hover:bg-white/10',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'rounded-md p-1.5 text-foreground/45 transition-colors disabled:opacity-40 inline-flex items-center justify-center',
        tintStyles[tint]
      )}
      title={title}
    >
      <Icon size={14} />
    </button>
  );
}

// --- Main Page Component ---

export default function FlaconsAdminPage() {
  const permissions = useCatalogPermissions('flacons');
  const { user } = useAuthStore();
  const isAdmin = Boolean(user?.is_staff || user?.is_superuser || user?.role === 'superadmin');
  const [bottles, setBottles] = useState<any[]>([]);
  const [bottleTypes, setBottleTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [enStockFilter, setEnStockFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBottle, setEditingBottle] = useState<any | null>(null);

  const [form, setForm] = useState({
    nom: '',
    type_flacon: '',
    contenance_ml: 100,
    matiere: 'Verre',
    couleur: 'Transparent',
    hauteur_cm: '15.00',
    largeur_cm: '6.00',
    poids_grammes: 200,
    prix_unitaire: '5000.00',
    prix_achat: '',
    stock_quantite: 100,
    seuil_alerte_stock: 10,
    actif: true,
  });

  const { addToast } = useToastStore();

  const fetchBottlesAndTypes = useCallback(async () => {
    if (!permissions.canRead) return;
    try {
      setLoading(true);
      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      if (typeFilter) params.type_flacon = Number(typeFilter);
      if (enStockFilter === 'true') params.en_stock = true;
      if (enStockFilter === 'false') params.en_stock = false;
      const [bottlesData, typesData] = await Promise.all([
        shopService.getBottles(params),
        shopService.getBottleTypes(),
      ]);
      setBottles(extractCatalogList(bottlesData));
      setBottleTypes(extractCatalogList(typesData));
    } catch {
      addToast('Erreur lors du chargement des flacons', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, permissions.canRead, search, typeFilter, enStockFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchBottlesAndTypes, 300);
    return () => clearTimeout(timer);
  }, [fetchBottlesAndTypes]);

  const updateForm = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenAdd = () => {
    if (!permissions.canCreate) return;
    setEditingBottle(null);
    setForm({
      nom: '',
      type_flacon: bottleTypes[0]?.id ? String(bottleTypes[0].id) : '',
      contenance_ml: 100,
      matiere: 'Verre',
      couleur: 'Transparent',
      hauteur_cm: '15.00',
      largeur_cm: '6.00',
      poids_grammes: 200,
      prix_unitaire: '5000.00',
      prix_achat: '',
      stock_quantite: 100,
      seuil_alerte_stock: 10,
      actif: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (bot: any) => {
    if (!permissions.canUpdate) return;
    setEditingBottle(bot);
    setForm({
      nom: bot.nom || '',
      type_flacon: bot.type_flacon?.id ? String(bot.type_flacon.id) : String(bot.type_flacon || ''),
      contenance_ml: bot.contenance_ml || 100,
      matiere: bot.matiere || 'Verre',
      couleur: bot.couleur || 'Transparent',
      hauteur_cm: bot.hauteur_cm || '15.00',
      largeur_cm: bot.largeur_cm || '6.00',
      poids_grammes: bot.poids_grammes || 200,
      prix_unitaire: bot.prix_unitaire || '5000.00',
      prix_achat: bot.prix_achat ? String(bot.prix_achat) : '',
      stock_quantite: bot.stock_quantite || 100,
      seuil_alerte_stock: bot.seuil_alerte_stock || 10,
      actif: bot.actif !== undefined ? bot.actif : true,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!permissions.canCreate && !permissions.canUpdate) return;
    if (!form.nom || !form.type_flacon) {
      addToast('Champs requis : Nom, Type Flacon', 'error');
      return;
    }
    try {
      const payload = {
        nom: form.nom,
        type_flacon: Number(form.type_flacon),
        contenance_ml: Number(form.contenance_ml),
        matiere: form.matiere,
        couleur: form.couleur,
        hauteur_cm: form.hauteur_cm,
        largeur_cm: form.largeur_cm,
        poids_grammes: Number(form.poids_grammes),
        prix_unitaire: form.prix_unitaire,
        stock_quantite: Number(form.stock_quantite),
        seuil_alerte_stock: Number(form.seuil_alerte_stock),
        actif: form.actif,
      };
      if (editingBottle) {
        await shopService.updateBottle(editingBottle.id, payload);
        addToast('Flacon mis à jour', 'success');
      } else {
        await shopService.createBottle(payload);
        addToast('Flacon créé', 'success');
      }
      setShowModal(false);
      fetchBottlesAndTypes();
    } catch (error: any) {
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : 'Erreur lors de la sauvegarde';
      addToast(msg, 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!permissions.canDelete) return;
    if (!confirm('Supprimer ce flacon ?')) return;
    try {
      await shopService.deleteBottle(id);
      addToast('Flacon supprimé', 'success');
      fetchBottlesAndTypes();
    } catch {
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (typeFilter) count++;
    if (enStockFilter) count++;
    return count;
  }, [typeFilter, enStockFilter]);

  if (!permissions.canRead) {
    return (
      <div className="space-y-6">
        <CatalogAccessNotice permissions={permissions} resourceLabel="les flacons" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Flacons</h1>
          <p className="text-sm text-foreground/40 mt-0.5">
            Gestion des flacons et formats de contenance
          </p>
        </div>
        {permissions.canCreate && (
          <button
            onClick={handleOpenAdd}
            className="bg-gold text-black rounded-lg px-3.5 py-2 text-xs font-semibold hover:bg-gold/80 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus size={14} />
            <span>Ajouter un flacon</span>
          </button>
        )}
      </div>

      <CatalogAccessNotice permissions={permissions} resourceLabel="les flacons" />

      {/* Toolbar & Expanded Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un flacon..."
              className="w-full bg-white/[0.02] border border-white/10 rounded-lg pl-9 pr-8 py-1.5 text-xs text-foreground placeholder:text-foreground/40 outline-none focus:border-white/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cx(
              'flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium transition-colors',
              showFilters || activeFiltersCount > 0
                ? 'bg-white/10 text-foreground'
                : 'text-foreground/60 hover:bg-white/5'
            )}
          >
            <Filter size={13} />
            <span>Filtres</span>
            {activeFiltersCount > 0 && (
              <span className="ml-0.5 rounded-full bg-gold px-1.5 py-0.2 text-[10px] font-bold text-black">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground/50">Type :</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-foreground outline-none focus:border-white/20"
              >
                <option value="" className="bg-background text-foreground">Tous les types</option>
                {bottleTypes.map((t) => (
                  <option key={t.id} value={t.id} className="bg-background text-foreground">
                    {t.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground/50">Stock :</span>
              <select
                value={enStockFilter}
                onChange={(e) => setEnStockFilter(e.target.value)}
                className="text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-foreground outline-none focus:border-white/20"
              >
                <option value="" className="bg-background text-foreground">Stock (tous)</option>
                <option value="true" className="bg-background text-foreground">En stock</option>
                <option value="false" className="bg-background text-foreground">Stock faible</option>
              </select>
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setTypeFilter('');
                  setEnStockFilter('');
                }}
                className="text-[11px] text-foreground/40 hover:text-foreground underline ml-auto"
              >
                Réinitialiser
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-foreground/40 gap-2 text-xs">
            <Loader2 className="animate-spin text-gold" size={16} />
            <span>Chargement des flacons...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                  <th className="pl-4 py-3">Nom</th>
                  <th className="px-3 py-3">Contenance</th>
                  <th className="px-3 py-3">Matière / Couleur</th>
                  <th className="px-3 py-3">Prix Vente</th>
                  {isAdmin && <th className="px-3 py-3">Bénéfice Unitaire</th>}
                  <th className="pr-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {bottles.map((b) => {
                  const prixVenteNum = parseFloat(String(b.prix_unitaire || 0));
                  const prixAchatNum = parseFloat(String(b.prix_achat || 0));
                  const beneficeCalc =
                    b.benefice_unitaire !== undefined
                      ? parseFloat(String(b.benefice_unitaire))
                      : b.prix_unitaire && b.prix_achat
                      ? prixVenteNum - prixAchatNum
                      : null;

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="pl-4 py-3 font-medium text-foreground">
                        {b.nom}
                      </td>
                      <td className="px-3 py-3 text-foreground/60 tabular-nums">
                        {b.contenance_ml} ml
                      </td>
                      <td className="px-3 py-3 text-foreground/60">
                        {b.matiere} · {b.couleur}
                      </td>
                      <td className="px-3 py-3 font-semibold text-gold tabular-nums">
                        {b.prix_unitaire} FCFA
                      </td>
                      {isAdmin && (
                        <td className="px-3 py-3">
                          {beneficeCalc !== null ? (
                            <StatusChip
                              status={beneficeCalc >= 0 ? 'emerald' : 'red'}
                              label={`+${beneficeCalc.toLocaleString()} FCFA`}
                            />
                          ) : (
                            <span className="text-foreground/30 text-xs italic">
                              Non défini
                            </span>
                          )}
                        </td>
                      )}
                      <td className="pr-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          {permissions.canUpdate && (
                            <IconButton
                              icon={Edit2}
                              onClick={() => handleOpenEdit(b)}
                              title="Modifier"
                              tint="gold"
                            />
                          )}
                          {permissions.canDelete && (
                            <IconButton
                              icon={Trash2}
                              onClick={() => handleDelete(b.id)}
                              title="Supprimer"
                              tint="red"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {bottles.length === 0 && (
                  <tr>
                    <td
                      colSpan={isAdmin ? 6 : 5}
                      className="py-16 text-center text-sm italic text-foreground/30"
                    >
                      Aucun flacon trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SlideOver Drawer (Untouched Form Content) */}
      <SlideOver
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBottle ? 'Modifier le flacon' : 'Ajouter un flacon'}
        description="Formulaire complet, sans popup ni défilement gênant."
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors"
            >
              Enregistrer
            </button>
          </div>
        }
      >
        <div className="p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                  Nom *
                </label>
                <input
                  placeholder="Nom du flacon"
                  value={form.nom}
                  onChange={(e) => updateForm('nom', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                  Type de Flacon *
                </label>
                <select
                  value={form.type_flacon}
                  onChange={(e) => updateForm('type_flacon', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                >
                  <option value="" disabled className="text-black bg-white">
                    Type Flacon
                  </option>
                  {bottleTypes.map((t) => (
                    <option key={t.id} value={t.id} className="text-black bg-white">
                      {t.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                    Contenance (ml)
                  </label>
                  <input
                    type="number"
                    value={form.contenance_ml}
                    onChange={(e) => updateForm('contenance_ml', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                    Poids (g)
                  </label>
                  <input
                    type="number"
                    value={form.poids_grammes}
                    onChange={(e) => updateForm('poids_grammes', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                    Matière
                  </label>
                  <input
                    value={form.matiere}
                    onChange={(e) => updateForm('matiere', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                    Couleur
                  </label>
                  <input
                    value={form.couleur}
                    onChange={(e) => updateForm('couleur', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                    Hauteur (cm)
                  </label>
                  <input
                    value={form.hauteur_cm}
                    onChange={(e) => updateForm('hauteur_cm', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                    Largeur (cm)
                  </label>
                  <input
                    value={form.largeur_cm}
                    onChange={(e) => updateForm('largeur_cm', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                  Prix Unitaire (FCFA)
                </label>
                <input
                  value={form.prix_unitaire}
                  onChange={(e) => updateForm('prix_unitaire', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                />
              </div>
              {isAdmin && (
                <div>
                  <label className="text-[10px] font-bold text-amber-400/80 uppercase block mb-1 flex items-center gap-1">
                    Prix d'achat (FCFA){' '}
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1 rounded">
                      (Admin)
                    </span>
                  </label>
                  <input
                    type="number"
                    placeholder="ex: 2500"
                    value={form.prix_achat}
                    onChange={(e) => updateForm('prix_achat', e.target.value)}
                    className="w-full bg-white/5 border border-amber-500/20 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                  />
                  {form.prix_unitaire && form.prix_achat && (
                    <p className="text-xs text-emerald-400 mt-1">
                      Bénéfice estimé : +
                      {(
                        parseFloat(String(form.prix_unitaire)) -
                        parseFloat(String(form.prix_achat))
                      ).toLocaleString()}{' '}
                      FCFA
                    </p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                    Stock Initial
                  </label>
                  <input
                    type="number"
                    value={form.stock_quantite}
                    onChange={(e) => updateForm('stock_quantite', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                    Seuil Alerte
                  </label>
                  <input
                    type="number"
                    value={form.seuil_alerte_stock}
                    onChange={(e) => updateForm('seuil_alerte_stock', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={form.actif}
                    onChange={(e) => updateForm('actif', e.target.checked)}
                    className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                  />
                  <span className="text-xs text-foreground/60 font-medium">Actif</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </SlideOver>
    </div>
  );
}