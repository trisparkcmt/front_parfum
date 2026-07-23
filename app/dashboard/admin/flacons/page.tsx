'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Edit2, Trash2, Plus, Search } from 'lucide-react';
import { shopService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useCatalogPermissions } from '@/hooks/useCatalogPermissions';
import CatalogAccessNotice from '@/components/catalog/CatalogAccessNotice';
import { extractCatalogList } from '@/lib/catalogUtils';
import { useAuthStore } from '@/store/useAuthStore';
import { SlideOver } from '@/components/ui/SlideOver';

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
    actif: true
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
        shopService.getBottleTypes()
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
    setForm(prev => ({ ...prev, [field]: value }));
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
      actif: true
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
      actif: bot.actif !== undefined ? bot.actif : true
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
    } catch (error) {
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  if (!permissions.canRead) {
    return (
      <div className="space-y-6">
        <CatalogAccessNotice permissions={permissions} resourceLabel="les flacons" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Flacons</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Gestion des flacons et formats de contenance</p>
        </div>
        {permissions.canCreate && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/80 transition-all"
          >
            <Plus size={16} /> Ajouter un flacon
          </button>
        )}
      </div>

      <CatalogAccessNotice permissions={permissions} resourceLabel="les flacons" />

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 flex-1 min-w-[200px]">
          <Search size={15} className="text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un flacon…"
            className="text-sm bg-transparent outline-none flex-1 text-foreground"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-foreground outline-none focus:border-gold"
        >
          <option value="">Tous les types</option>
          {bottleTypes.map(t => (
            <option key={t.id} value={t.id}>{t.nom}</option>
          ))}
        </select>
        <select
          value={enStockFilter}
          onChange={e => setEnStockFilter(e.target.value)}
          className="text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-foreground outline-none focus:border-gold"
        >
          <option value="">Stock (tous)</option>
          <option value="true">En stock</option>
          <option value="false">Stock faible</option>
        </select>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement des flacons...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Contenance</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Matière / Couleur</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Prix Vente</th>
                  {isAdmin && (
                    <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Bénéfice Unitaire</th>
                  )}
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bottles.map(b => {
                  const prixVenteNum = parseFloat(String(b.prix_unitaire || 0));
                  const prixAchatNum = parseFloat(String(b.prix_achat || 0));
                  const beneficeCalc = b.benefice_unitaire !== undefined 
                    ? parseFloat(String(b.benefice_unitaire))
                    : (b.prix_unitaire && b.prix_achat ? prixVenteNum - prixAchatNum : null);

                  return (
                    <tr key={b.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-medium text-foreground">{b.nom}</td>
                      <td className="px-6 py-4 text-sm text-foreground/60">{b.contenance_ml} ml</td>
                      <td className="px-6 py-4 text-sm text-foreground/60">{b.matiere} · {b.couleur}</td>
                      <td className="px-6 py-4 text-sm text-gold font-bold">{b.prix_unitaire} FCFA</td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-sm font-medium">
                          {beneficeCalc !== null ? (
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${beneficeCalc >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              +{beneficeCalc.toLocaleString()} FCFA
                            </span>
                          ) : (
                            <span className="text-foreground/30 text-xs italic">Non défini</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {permissions.canUpdate && (
                            <button onClick={() => handleOpenEdit(b)} className="p-2 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors">
                              <Edit2 size={16} />
                            </button>
                          )}
                          {permissions.canDelete && (
                            <button onClick={() => handleDelete(b.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {bottles.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="text-center py-20 text-foreground/40 italic">Aucun flacon trouvé.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SlideOver
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBottle ? 'Modifier le flacon' : 'Ajouter un flacon'}
        description="Formulaire complet, sans popup ni défilement gênant."
        size="lg"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">Annuler</button>
            <button onClick={handleSave} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors">Enregistrer</button>
          </div>
        }
      >
        <div className="p-6 lg:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Nom *</label>
                  <input placeholder="Nom du flacon" value={form.nom} onChange={e => updateForm('nom', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Type de Flacon *</label>
                  <select value={form.type_flacon} onChange={e => updateForm('type_flacon', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold">
                    <option value="" disabled className="text-black bg-white">Type Flacon</option>
                    {bottleTypes.map(t => <option key={t.id} value={t.id} className="text-black bg-white">{t.nom}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Contenance (ml)</label>
                    <input type="number" value={form.contenance_ml} onChange={e => updateForm('contenance_ml', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Poids (g)</label>
                    <input type="number" value={form.poids_grammes} onChange={e => updateForm('poids_grammes', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Matière</label>
                    <input value={form.matiere} onChange={e => updateForm('matiere', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Couleur</label>
                    <input value={form.couleur} onChange={e => updateForm('couleur', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Hauteur (cm)</label>
                    <input value={form.hauteur_cm} onChange={e => updateForm('hauteur_cm', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Largeur (cm)</label>
                    <input value={form.largeur_cm} onChange={e => updateForm('largeur_cm', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Prix Unitaire (FCFA)</label>
                  <input value={form.prix_unitaire} onChange={e => updateForm('prix_unitaire', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold" />
                </div>
                {isAdmin && (
                  <div>
                    <label className="text-[10px] font-bold text-amber-400/80 uppercase block mb-1 flex items-center gap-1">
                      Prix d'achat (FCFA) <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1 rounded">(Admin)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="ex: 2500"
                      value={form.prix_achat}
                      onChange={e => updateForm('prix_achat', e.target.value)}
                      className="w-full bg-white/5 border border-amber-500/20 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                    />
                    {form.prix_unitaire && form.prix_achat && (
                      <p className="text-xs text-emerald-400 mt-1">
                        Bénéfice estimé : +{(parseFloat(String(form.prix_unitaire)) - parseFloat(String(form.prix_achat))).toLocaleString()} FCFA
                      </p>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Stock Initial</label>
                    <input type="number" value={form.stock_quantite} onChange={e => updateForm('stock_quantite', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Seuil Alerte</label>
                    <input type="number" value={form.seuil_alerte_stock} onChange={e => updateForm('seuil_alerte_stock', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold" />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={form.actif}
                      onChange={e => updateForm('actif', e.target.checked)}
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
