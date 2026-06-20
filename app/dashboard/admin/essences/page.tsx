'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, Plus, Edit2, Trash2, Droplets, Loader2, 
  ShoppingBag, RefreshCw, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { labService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useCatalogPermissions } from '@/hooks/useCatalogPermissions';
import CatalogAccessNotice from '@/components/catalog/CatalogAccessNotice';

const STATIC_CATEGORIES = ['super_premium', 'premium', 'high'];

export default function EssencesPage() {
  const permissions = useCatalogPermissions('essences');
  const [essences, setEssences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEssence, setEditingEssence] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToastStore();

  // Pagination locale (Max 20 éléments par page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Form State (Lab / Raw Essence)
  const [nom, setNom] = useState('');
  const [marque, setMarque] = useState('Exclusif');
  const [codeReference, setCodeReference] = useState('');
  const [categorie, setCategorie] = useState('premium');
  const [description, setDescription] = useState('');
  const [intensite, setIntensite] = useState('moyenne');
  const [genreCible, setGenreCible] = useState('mixte');
  const [prixParMl, setPrixParMl] = useState('0.00');
  const [lotStockMl, setLotStockMl] = useState('500');
  const [lotSeuilAlerteMl, setLotSeuilAlerteMl] = useState('50');
  const [lotReferenceFournisseur, setLotReferenceFournisseur] = useState('');
  const [includeProduitsFinis, setIncludeProduitsFinis] = useState(false);
  const [produitFini, setProduitFini] = useState({
    taille_ml: '50',
    prix: '',
    prix_promotionnel: '',
    stock_disponible: '0',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Suppression de l'appel à shopService pour éviter l'erreur de définition
      const essencesData = await labService.getEssences();
      const essList = Array.isArray(essencesData) ? essencesData : (essencesData as any)?.results || (essencesData as any)?.resultats || [];
      setEssences(essList);
    } catch {
      addToast('Erreur lors du chargement des essences', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Réinitialiser la page quand la recherche change
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const openAdd = () => {
    if (!permissions.canCreate) return;
    setEditingEssence(null);
    setNom('');
    setMarque('Exclusif');
    setCodeReference('');
    setCategorie('premium');
    setDescription('');
    setIntensite('moyenne');
    setGenreCible('mixte');
    setPrixParMl('0.00');
    setLotStockMl('500');
    setLotSeuilAlerteMl('50');
    setLotReferenceFournisseur('');
    setIncludeProduitsFinis(false);
    setProduitFini({ taille_ml: '50', prix: '', prix_promotionnel: '', stock_disponible: '0' });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    if (!permissions.canUpdate) return;
    setEditingEssence(item);
    setNom(item.nom || '');
    setMarque(item.marque || 'Exclusif');
    setCodeReference(item.code_reference || '');
    setCategorie(item.categorie || 'premium');
    setDescription(item.description || '');
    setIntensite(item.intensite || 'moyenne');
    setGenreCible(item.genre_cible || 'mixte');
    setPrixParMl(String(item.prix_par_ml || '0.00'));
    setIncludeProduitsFinis(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!permissions.canCreate && !permissions.canUpdate) return;
    if (!nom || !codeReference) {
      addToast('Le nom et le code de référence sont requis', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload: Record<string, unknown> = {
        nom,
        marque,
        code_reference: codeReference,
        categorie,
        description: description || undefined,
        intensite,
        genre_cible: genreCible,
        prix_par_ml: prixParMl,
      };

      if (!editingEssence && lotStockMl) {
        payload.initial_lot = {
          stock_ml: lotStockMl,
          seuil_alerte_ml: lotSeuilAlerteMl || undefined,
          reference_fournisseur: lotReferenceFournisseur || undefined,
        };
      }

      if (!editingEssence && includeProduitsFinis && produitFini.taille_ml && produitFini.prix) {
        payload.produits_finis = [{
          taille_ml: Number(produitFini.taille_ml),
          prix: produitFini.prix,
          prix_promotionnel: produitFini.prix_promotionnel || undefined,
          stock_disponible: Number(produitFini.stock_disponible || 0),
        }];
      }

      if (editingEssence) {
        await labService.updateEssence(editingEssence.id, payload);
        addToast('Essence mise à jour avec succès', 'success');
      } else {
        await labService.createEssence(payload);
        addToast('Essence créée avec succès', 'success');
      }

      setShowModal(false);
      fetchData();
    } catch (e: any) {
      addToast(e.response?.data?.detail || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!permissions.canDelete) return;
    if (!confirm('Supprimer cette essence ? Cela affectera l\'inventaire et les lots associés.')) return;
    try {
      await labService.deleteEssence(id);
      addToast('Essence supprimée', 'success');
      fetchData();
    } catch {
      addToast('Erreur lors du suppression', 'error');
    }
  };

  const filtered = essences.filter(e =>
    (e.nom || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.code_reference || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.marque || '').toLowerCase().includes(search.toLowerCase())
  );

  // Logique de pagination synchrone (Max 20 items par page)
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (!permissions.canRead) {
    return (
      <div className="space-y-6">
        <CatalogAccessNotice permissions={permissions} resourceLabel="les essences" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Essences de Base</h1>
                  <p className="text-sm text-foreground/40 mt-0.5">
                    Catalogue des essences de parfums brutes pour le laboratoire et la boutique
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={fetchData} 
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-foreground/60 hover:text-foreground transition-all"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  </button>
                  {permissions.canCreate && (
                    <button
                      onClick={openAdd}
                      className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gold/80 transition-all shadow-lg shadow-gold/10"
                    >
                      <Plus size={16} /> Ajouter une essence
                    </button>
                  )}
                </div>
              </div>

              <CatalogAccessNotice permissions={permissions} resourceLabel="les essences" />

              {/* Recherche */}
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 max-w-sm">
                <Search size={15} className="text-foreground/40" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher par nom, code, marque..."
                  className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
                />
              </div>

              {/* Tableau des Essences */}
              <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden min-h-[200px]">
                {loading ? (
                  <div className="flex items-center justify-center py-16 text-gold gap-2">
                    <Loader2 className="animate-spin" size={24} />
                    <span className="text-sm">Chargement du catalogue...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          {['Détails Essence', 'Code Réf.', 'Catégorie', 'Caractéristiques', 'Prix / ml', 'Canal', 'Actions'].map(h => (
                            <th key={h} className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {currentItems.map(essence => (
                          <tr key={essence.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-gold/10 text-gold hidden sm:block">
                                  <Droplets size={16} />
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground text-sm">{essence.nom}</p>
                                  <p className="text-[11px] text-foreground/40 mt-0.5">{essence.marque || 'Maison'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-xs text-foreground/60">{essence.code_reference}</td>
                            <td className="px-5 py-3.5">
                              <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-white/5 border border-white/10 text-foreground/70 capitalize">
                                {essence.categorie?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex flex-col gap-0.5 text-xs text-foreground/60">
                                <span>Intensité : <b className="text-foreground/80 capitalize">{essence.intensite}</b></span>
                                <span>Cible : <b className="text-foreground/80 capitalize">{essence.genre_cible}</b></span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-gold text-sm">
                              {Number(essence.prix_par_ml || 0).toLocaleString()} FCFA
                            </td>
                            <td className="px-5 py-3.5">
                              {essence.vendu_comme_produit_fini ? (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase border border-emerald-500/10">
                                  <ShoppingBag size={10} /> + Boutique
                                </span>
                              ) : (
                                <span className="text-[10px] bg-white/5 text-foreground/40 px-2 py-0.5 rounded font-bold uppercase">
                                  Labo Seul
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex gap-1">
                                {permissions.canUpdate && (
                                  <button 
                                    onClick={() => openEdit(essence)} 
                                    className="p-1.5 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                )}
                                {permissions.canDelete && (
                                  <button 
                                    onClick={() => handleDelete(essence.id)} 
                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {currentItems.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-16 text-foreground/40 italic text-sm">
                              Aucune essence enregistrée dans le catalogue.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pagination (Max 20 items par page) */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-foreground/40">Page {currentPage} sur {totalPages}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      disabled={currentPage === 1} 
                      onClick={() => setCurrentPage(p => p - 1)} 
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-20 transition-opacity"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button 
                      disabled={currentPage === totalPages} 
                      onClick={() => setCurrentPage(p => p + 1)} 
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-20 transition-opacity"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Modale d'Ajout / Modification */}
              {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-background rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-white/10 overflow-y-auto max-h-[90vh]">
                    <h3 className="font-bold text-foreground text-lg mb-4">
                      {editingEssence ? 'Modifier l\'essence' : 'Ajouter une nouvelle essence'}
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Nom de l'essence *</label>
                          <input
                            value={nom}
                            onChange={e => setNom(e.target.value)}
                            placeholder="Ex: Royal Oud"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Code Référence *</label>
                          <input
                            value={codeReference}
                            onChange={e => setCodeReference(e.target.value)}
                            placeholder="Ex: ESS-OUD-01"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-gold font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Marque / Fournisseur</label>
                          <input
                            value={marque}
                            onChange={e => setMarque(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Catégorie</label>
                          <select
                            value={categorie}
                            onChange={e => setCategorie(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-gold bg-neutral-900 capitalize"
                          >
                            {STATIC_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Intensité</label>
                          <select
                            value={intensite}
                            onChange={e => setIntensite(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-gold bg-neutral-900"
                          >
                            <option value="légère">Légère</option>
                            <option value="moyenne">Moyenne</option>
                            <option value="forte">Forte</option>
                            <option value="très forte">Très forte</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Genre Cible</label>
                          <select
                            value={genreCible}
                            onChange={e => setGenreCible(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-gold bg-neutral-900"
                          >
                            <option value="mixte">Mixte</option>
                            <option value="homme">Homme</option>
                            <option value="femme">Femme</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Prix de base / ml</label>
                          <input
                            type="number"
                            value={prixParMl}
                            onChange={e => setPrixParMl(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gold font-bold outline-none focus:border-gold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Description / Notes Olfactives</label>
                        <textarea
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          placeholder="Notes de tête, cœur, fond..."
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-gold resize-none"
                        />
                      </div>

                      {!editingEssence && (
                        <>
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                            <p className="text-sm font-semibold text-foreground mb-3">Lot Initial (Stock Laboratoire)</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Stock ML</label>
                                <input
                                  type="number"
                                  value={lotStockMl}
                                  onChange={e => setLotStockMl(e.target.value)}
                                  placeholder="500"
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Seuil d'alerte ML</label>
                                <input
                                  type="number"
                                  value={lotSeuilAlerteMl}
                                  onChange={e => setLotSeuilAlerteMl(e.target.value)}
                                  placeholder="50"
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Référence Fournisseur (optionnel)</label>
                                <input
                                  value={lotReferenceFournisseur}
                                  onChange={e => setLotReferenceFournisseur(e.target.value)}
                                  placeholder="Ref du fournisseur"
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={includeProduitsFinis}
                                onChange={e => setIncludeProduitsFinis(e.target.checked)}
                                className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                              />
                              <div>
                                <p className="font-semibold text-foreground">Créer un format boutique (produit fini)</p>
                                <p className="text-foreground/40 text-sm">Flacon prêt à la vente dans le shop</p>
                              </div>
                            </label>
                            {includeProduitsFinis && (
                              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                                <div>
                                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Taille</label>
                                  <select value={produitFini.taille_ml} onChange={e => setProduitFini(p => ({ ...p, taille_ml: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-gold bg-neutral-900">
                                    <option value="10">10 ml</option>
                                    <option value="30">30 ml</option>
                                    <option value="50">50 ml</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Prix</label>
                                  <input type="number" value={produitFini.prix} onChange={e => setProduitFini(p => ({ ...p, prix: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gold outline-none focus:border-gold font-bold" />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Prix Promo</label>
                                  <input type="number" value={produitFini.prix_promotionnel} onChange={e => setProduitFini(p => ({ ...p, prix_promotionnel: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gold outline-none focus:border-gold font-bold" />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Stock</label>
                                  <input type="number" value={produitFini.stock_disponible} onChange={e => setProduitFini(p => ({ ...p, stock_disponible: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button 
                          onClick={() => setShowModal(false)} 
                          className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-foreground font-bold text-sm hover:bg-white/10 transition-all border border-white/10"
                        >
                          Annuler
                        </button>
                        <button 
                          onClick={handleSave} 
                          disabled={saving || !nom || !codeReference}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-gold text-black font-bold text-sm hover:bg-gold/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {saving && <Loader2 size={14} className="animate-spin" />}
                          {editingEssence ? 'Mettre à jour' : 'Enregistrer l\'essence'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
    </div>
  );
}