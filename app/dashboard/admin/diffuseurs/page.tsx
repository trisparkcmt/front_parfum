'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2, Sparkles, Wifi, Zap } from 'lucide-react';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useCatalogPermissions } from '@/hooks/useCatalogPermissions';
import CatalogAccessNotice from '@/components/catalog/CatalogAccessNotice';
import { extractCatalogList } from '@/lib/catalogUtils';
import { useAuthStore } from '@/store/useAuthStore';
import AppImage from '@/components/ui/AppImage';
import { SlideOver } from '@/components/ui/SlideOver';

export default function DiffuseursAdminPage() {
  const permissions = useCatalogPermissions('accessoires');
  const { user } = useAuthStore();
  const isAdmin = Boolean(user?.is_staff || user?.is_superuser || user?.role === 'superadmin');

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
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="text-gold" size={24} />
            Diffuseurs de Parfum
          </h1>
          <p className="text-sm text-foreground/40 mt-0.5">
            Gestion du catalogue des diffuseurs d'ambiance et technologies associées
          </p>
        </div>
        {permissions.canCreate && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gold/80 transition-all shadow-lg self-start sm:self-auto"
          >
            <Plus size={16} />
            Nouveau Diffuseur
          </button>
        )}
      </div>

      {/* Filter / Search */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:border-gold"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-sm min-h-[250px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement des diffuseurs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase">Diffuseur</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase">Technologie</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase">Réservoir</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase">Prix Vente</th>
                  {isAdmin && <th className="px-5 py-3.5 text-xs font-semibold text-gold uppercase">Prix Achat</th>}
                  {isAdmin && <th className="px-5 py-3.5 text-xs font-semibold text-emerald-400 uppercase">Marge / Unité</th>}
                  <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase">Stock</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase">Actions</th>
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
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4 font-bold text-foreground text-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden relative flex-shrink-0">
                          {item.image_principale ? (
                            <AppImage src={item.image_principale} alt={item.nom} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-foreground/20">
                              <Sparkles size={18} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{item.nom}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.est_connecte && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">
                                <Wifi size={10} /> Connecté
                              </span>
                            )}
                            {item.a_jeux_de_lumiere && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                                <Zap size={10} /> Lumière LED
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-foreground/60 capitalize">
                        {item.type_technologie || 'ultrasons'}
                      </td>
                      <td className="px-5 py-4 text-xs text-foreground/60">
                        {item.capacite_reservoir_ml ? `${item.capacite_reservoir_ml} ml` : '—'}
                      </td>
                      <td className="px-5 py-4 text-xs font-mono font-bold text-foreground">
                        {pVente.toLocaleString()} FCFA
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-4 text-xs font-mono text-gold">
                          {pAchat !== null ? `${pAchat.toLocaleString()} FCFA` : '—'}
                        </td>
                      )}
                      {isAdmin && (
                        <td className="px-5 py-4 text-xs font-mono font-bold">
                          {benefice !== null ? (
                            <span className={benefice >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {benefice >= 0 ? '+' : ''}{benefice.toLocaleString()} FCFA
                            </span>
                          ) : '—'}
                        </td>
                      )}
                      <td className="px-5 py-4 text-xs">
                        <span className={`font-semibold ${item.stock_quantite > 0 ? 'text-foreground' : 'text-red-400'}`}>
                          {item.stock_quantite ?? 0} unités
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          {permissions.canUpdate && (
                            <button
                              onClick={() => openEdit(item)}
                              className="p-1.5 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {permissions.canDelete && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {diffuseurs.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 6} className="text-center py-16 text-foreground/40 italic text-sm">
                      Aucun diffuseur de parfum trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
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
              className="flex-1 border border-white/10 rounded-xl py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gold text-black rounded-xl py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Enregistrer
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Nom du diffuseur *</label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
              placeholder="ex: Diffuseur Ultrasonique Zen"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Description courte</label>
            <input
              type="text"
              value={form.description_courte}
              onChange={(e) => setForm((p) => ({ ...p, description_courte: e.target.value }))}
              placeholder="ex: Diffusion haute fréquence 300ml avec LED"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Prix de Vente (FCFA) *</label>
              <input
                type="number"
                value={form.prix_unitaire}
                onChange={(e) => setForm((p) => ({ ...p, prix_unitaire: e.target.value }))}
                placeholder="25000"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
              />
            </div>
            {isAdmin && (
              <div>
                <label className="text-[10px] font-bold text-gold uppercase block mb-1">Prix d'Achat (FCFA)</label>
                <input
                  type="number"
                  value={form.prix_achat}
                  onChange={(e) => setForm((p) => ({ ...p, prix_achat: e.target.value }))}
                  placeholder="12000"
                  className="w-full bg-white/5 border border-gold/30 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Stock Quantité</label>
              <input
                type="number"
                value={form.stock_quantite}
                onChange={(e) => setForm((p) => ({ ...p, stock_quantite: e.target.value }))}
                placeholder="15"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Réservoir (ml)</label>
              <input
                type="number"
                value={form.capacite_reservoir_ml}
                onChange={(e) => setForm((p) => ({ ...p, capacite_reservoir_ml: e.target.value }))}
                placeholder="300"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Technologie</label>
              <select
                value={form.type_technologie}
                onChange={(e) => setForm((p) => ({ ...p, type_technologie: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
              >
                <option value="ultrasons" className="bg-neutral-900">Ultrasons</option>
                <option value="nebulisation" className="bg-neutral-900 font-sans">Nébulisation</option>
                <option value="chaleur" className="bg-neutral-900">Chaleur douce</option>
                <option value="ventilation" className="bg-neutral-900">Ventilation</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Alimentation</label>
              <select
                value={form.type_alimentation}
                onChange={(e) => setForm((p) => ({ ...p, type_alimentation: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
              >
                <option value="secteur" className="bg-neutral-900">Secteur 220V</option>
                <option value="usb" className="bg-neutral-900">USB-C</option>
                <option value="batterie" className="bg-neutral-900">Batterie rechargeable</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.est_connecte}
                onChange={(e) => setForm((p) => ({ ...p, est_connecte: e.target.checked }))}
                className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
              />
              <span className="text-xs text-foreground/70">Appareil connecté (Wi-Fi / Bluetooth)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.a_jeux_de_lumiere}
                onChange={(e) => setForm((p) => ({ ...p, a_jeux_de_lumiere: e.target.checked }))}
                className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
              />
              <span className="text-xs text-foreground/70">Jeux d'éclairage LED ambiants</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.actif}
                onChange={(e) => setForm((p) => ({ ...p, actif: e.target.checked }))}
                className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
              />
              <span className="text-xs text-foreground/70">Produit actif (visible en boutique)</span>
            </label>
          </div>
        </div>
      </SlideOver>
    </div>
  );
}
