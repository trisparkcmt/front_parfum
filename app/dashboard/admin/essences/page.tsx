'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Droplets, Loader2, Info, ShoppingBag } from 'lucide-react';
import { shopService, labService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { formatPrice } from '@/lib/utils';

export default function EssencesPage() {
  const [essences, setEssences] = useState<any[]>([]);
  const [finishedProducts, setFinishedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEssence, setEditingEssence] = useState<any | null>(null);

  // Form State (Lab / Raw Essence)
  const [nom, setNom] = useState('');
  const [marque, setMarque] = useState('Exclusif');
  const [codeReference, setCodeReference] = useState('');
  const [categorie, setCategorie] = useState('');
  const [description, setDescription] = useState('');
  const [intensite, setIntensite] = useState('moyenne');
  const [genreCible, setGenreCible] = useState('mixte');
  const [venduFini, setVenduFini] = useState(false);

  // New Form Fields matching the complete payload spec
  const [slug, setSlug] = useState('');
  const [descriptionIa, setDescriptionIa] = useState('');
  const [fournisseur, setFournisseur] = useState('');
  const [originePays, setOriginePays] = useState('');
  const [concentrationMax, setConcentrationMax] = useState('15.00');
  const [couleur, setCouleur] = useState('');
  const [duree, setDuree] = useState('moyenne');
  const [notesTete, setNotesTete] = useState('');
  const [notesCoeur, setNotesCoeur] = useState('');
  const [notesFond, setNotesFond] = useState('');

  // Form State (Shop / Finished Product)
  const [shopPrice, setShopPrice] = useState('');
  const [shopSize, setShopSize] = useState('30');
  const [shopStock, setShopStock] = useState('50');

  const [categories, setCategories] = useState<any[]>([]);
  const { addToast } = useToastStore();

  const fetchEssences = useCallback(async () => {
    try {
      setLoading(true);
      const [essencesData, shopProductsData, categoriesData] = await Promise.all([
        labService.getEssences(),
        shopService.getFinishedEssences(),
        shopService.getPerfumeCategories()
      ]);
      const essencesDataAny = essencesData as any;
      const essencesList = essencesDataAny?.results || essencesDataAny?.resultats || (Array.isArray(essencesData) ? essencesData : []);
      const shopProductsList = shopProductsData?.results || shopProductsData?.resultats || (Array.isArray(shopProductsData) ? shopProductsData : []);
      const categoriesList = categoriesData?.results || categoriesData?.resultats || (Array.isArray(categoriesData) ? categoriesData : []);
      setEssences(essencesList);
      setFinishedProducts(shopProductsList);
      setCategories(categoriesList);
    } catch (error) {
      addToast('Erreur lors du chargement des essences', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchEssences();
  }, [fetchEssences]);

  useEffect(() => {
    if (editingEssence) {
      setNom(editingEssence.nom || '');
      setMarque(editingEssence.marque || 'Exclusif');
      setCodeReference(editingEssence.code_reference || '');
      setCategorie(editingEssence.categorie?.toString() || '1');
      setDescription(editingEssence.description || '');
      setIntensite(editingEssence.intensite || 'moyenne');
      setGenreCible(editingEssence.genre_cible || 'mixte');
      
      setSlug(editingEssence.slug || '');
      setDescriptionIa(editingEssence.description_ia || '');
      setFournisseur(editingEssence.fournisseur || '');
      setOriginePays(editingEssence.origine_pays || '');
      setConcentrationMax(editingEssence.concentration_max || '15.00');
      setCouleur(editingEssence.couleur || '');
      setDuree(editingEssence.duree || 'moyenne');
      setNotesTete(editingEssence.notes_tete || '');
      setNotesCoeur(editingEssence.notes_coeur || '');
      setNotesFond(editingEssence.notes_fond || '');

      const hasFinished = !!editingEssence.vendu_comme_produit_fini;
      setVenduFini(hasFinished);

      const relatedProduct = finishedProducts.find(p => p.essence === editingEssence.id);
      if (relatedProduct) {
        setShopPrice(relatedProduct.prix || '');
        setShopSize(relatedProduct.taille_ml?.toString() || '30');
        setShopStock(relatedProduct.stock_disponible?.toString() || '50');
      } else {
        setShopPrice('');
        setShopSize('30');
        setShopStock('50');
      }
    } else {
      setNom('');
      setMarque('Exclusif');
      setCodeReference('');
      setCategorie(categories[0]?.id ? String(categories[0].id) : '');
      setDescription('');
      setIntensite('moyenne');
      setGenreCible('mixte');
      setVenduFini(false);
      setShopPrice('');
      setShopSize('30');
      setShopStock('50');
      
      setSlug('');
      setDescriptionIa('');
      setFournisseur('');
      setOriginePays('');
      setConcentrationMax('15.00');
      setCouleur('');
      setDuree('moyenne');
      setNotesTete('');
      setNotesCoeur('');
      setNotesFond('');
    }
  }, [editingEssence, finishedProducts, categories]);

  const resetForm = () => {
    setEditingEssence(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette essence ?')) return;
    try {
      await labService.deleteEssence(id);
      addToast('Essence supprimée avec succès', 'success');
      fetchEssences();
    } catch (error: any) {
      addToast(error.message || 'Erreur lors de la suppression', 'error');
    }
  };

  const handleSave = async () => {
    if (!nom || !codeReference) {
      addToast('Veuillez remplir les champs obligatoires', 'error');
      return;
    }

    const labPayload = {
      nom,
      marque,
      code_reference: codeReference,
      categorie: parseInt(categorie),
      description,
      intensite,
      genre_cible: genreCible,
      vendu_comme_produit_fini: venduFini,
      actif: true,
      
      slug,
      description_ia: descriptionIa,
      fournisseur,
      origine_pays: originePays,
      concentration_max: concentrationMax,
      couleur,
      duree,
      notes_tete: notesTete,
      notes_coeur: notesCoeur,
      notes_fond: notesFond
    };

    try {
      let rawEssence;
      if (editingEssence) {
        rawEssence = await labService.updateEssence(editingEssence.id, labPayload);
        addToast('Essence mise à jour', 'success');
      } else {
        rawEssence = await labService.createEssence(labPayload);
        addToast('Essence créée dans le laboratoire', 'success');
      }

      const essenceId = editingEssence ? editingEssence.id : rawEssence?.id;

      if (essenceId) {
        const relatedProduct = finishedProducts.find(p => p.essence === essenceId);
        
        if (venduFini) {
          const shopPayload = {
            essence: essenceId,
            taille_ml: parseInt(shopSize),
            prix: shopPrice,
            stock_disponible: parseInt(shopStock),
            actif: true
          };

          if (relatedProduct) {
            await shopService.updateFinishedEssence(relatedProduct.id, shopPayload);
            addToast('Produit boutique mis à jour', 'success');
          } else {
            await shopService.createFinishedEssence(shopPayload);
            addToast('Produit ajouté à la boutique', 'success');
          }
        } else if (relatedProduct) {
          await shopService.deleteFinishedEssence(relatedProduct.id);
          addToast('Produit retiré de la boutique', 'success');
        }
      }

      setShowModal(false);
      resetForm();
      fetchEssences();
    } catch (error: any) {
      const apiErr = error.response?.data;
      let msg = error.message || "Erreur lors de l'enregistrement";
      if (apiErr) {
        if (typeof apiErr === 'object') {
          msg = Object.entries(apiErr)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : JSON.stringify(v)}`)
            .join(' | ');
        } else {
          msg = String(apiErr);
        }
      }
      addToast(msg, 'error');
    }
  };

  const filtered = (Array.isArray(essences) ? essences : []).filter(e => 
    (e?.nom || '').toLowerCase().includes(search.toLowerCase()) || 
    (e?.code_reference || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 text-gold">
      <Loader2 className="animate-spin mb-4" size={40} />
      <p className="animate-pulse">Chargement de l'inventaire des essences...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
          <input 
            type="text"
            placeholder="Rechercher une essence..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-gold"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="w-full md:w-auto bg-gold text-black px-6 py-2 rounded-xl flex items-center justify-center gap-2 font-bold hover:scale-105 transition-transform"
        >
          <Plus size={18} /> Ajouter une Essence
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(essence => (
          <div key={essence.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors group relative overflow-hidden">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gold/10 p-3 rounded-xl text-gold">
                <Droplets size={24} />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingEssence(essence); setShowModal(true); }} className="p-2 bg-white/10 rounded-lg hover:text-gold"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(essence.id)} className="p-2 bg-white/10 rounded-lg hover:text-red-400"><Trash2 size={16} /></button>
              </div>
            </div>
            <h3 className="font-bold text-lg mb-1">{essence.nom}</h3>
            <p className="text-xs text-foreground/40 font-mono mb-4">{essence.code_reference} • {essence.marque}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-[10px] uppercase font-bold px-2 py-1 bg-white/5 rounded-md text-foreground/60">{essence.genre_cible}</span>
              <span className="text-[10px] uppercase font-bold px-2 py-1 bg-white/5 rounded-md text-foreground/60">{essence.intensite}</span>
              {essence.vendu_comme_produit_fini && (
                <span className="text-[10px] uppercase font-bold px-2 py-1 bg-gold/20 rounded-md text-gold flex items-center gap-1">
                  <ShoppingBag size={10} /> Boutique
                </span>
              )}
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-foreground/40">Statut</span>
              <span className={`text-[10px] font-bold uppercase ${essence.actif ? 'text-green-400' : 'text-red-400'}`}>
                {essence.actif ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-background border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Droplets className="text-gold" /> 
                {editingEssence ? 'Modifier l\'essence' : 'Nouvelle Essence Brute'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Standard Lab Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Nom de l'essence *</label>
                    <input 
                      value={nom} 
                      onChange={e => setNom(e.target.value)}
                      placeholder="Ex: Essence de Patchouli"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Slug</label>
                    <input 
                      value={slug} 
                      onChange={e => setSlug(e.target.value)}
                      placeholder="essence-patchouli"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Code Référence *</label>
                      <input 
                        value={codeReference} 
                        onChange={e => setCodeReference(e.target.value)}
                        placeholder="ESS-PAT-001"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                      />
                    </div>
                     <div>
                       <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Catégorie *</label>
                       <select 
                         value={categorie} 
                         onChange={e => setCategorie(e.target.value)}
                         className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                       >
                         <option value="" className="text-black bg-white">Choisir une catégorie</option>
                         {categories.map((c: any) => (
                           <option key={c.id} value={c.id} className="text-black bg-white">{c.nom}</option>
                         ))}
                       </select>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Intensité</label>
                      <select value={intensite} onChange={e => setIntensite(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold">
                        <option value="légère">Légère</option>
                        <option value="moyenne">Moyenne</option>
                        <option value="forte">Forte</option>
                        <option value="très forte">Très forte</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Genre Cible</label>
                      <select value={genreCible} onChange={e => setGenreCible(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold">
                        <option value="mixte">Mixte</option>
                        <option value="homme">Homme</option>
                        <option value="femme">Femme</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Durée</label>
                      <select value={duree} onChange={e => setDuree(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold">
                        <option value="courte">Courte</option>
                        <option value="moyenne">Moyenne</option>
                        <option value="longue">Longue</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Concentration Max (%)</label>
                      <input 
                        value={concentrationMax} 
                        onChange={e => setConcentrationMax(e.target.value)}
                        placeholder="15.00"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Marque</label>
                      <input 
                        value={marque} 
                        onChange={e => setMarque(e.target.value)}
                        placeholder="Exclusif"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Fournisseur</label>
                      <input 
                        value={fournisseur} 
                        onChange={e => setFournisseur(e.target.value)}
                        placeholder="Hervé S.A."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Couleur</label>
                      <input 
                        value={couleur} 
                        onChange={e => setCouleur(e.target.value)}
                        placeholder="Marron"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Origine Pays</label>
                      <input 
                        value={originePays} 
                        onChange={e => setOriginePays(e.target.value)}
                        placeholder="Cameroun"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Notes de Tête</label>
                      <input 
                        value={notesTete} 
                        onChange={e => setNotesTete(e.target.value)}
                        placeholder="Citron"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-3 text-xs outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Notes de Coeur</label>
                      <input 
                        value={notesCoeur} 
                        onChange={e => setNotesCoeur(e.target.value)}
                        placeholder="Patchouli"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-3 text-xs outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Notes de Fond</label>
                      <input 
                        value={notesFond} 
                        onChange={e => setNotesFond(e.target.value)}
                        placeholder="Santal"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-3 text-xs outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Description</label>
                    <textarea 
                      value={description} 
                      onChange={e => setDescription(e.target.value)}
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-gold resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Description IA</label>
                    <textarea 
                      value={descriptionIa} 
                      onChange={e => setDescriptionIa(e.target.value)}
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-gold resize-none"
                    />
                  </div>
                </div>

                {/* Split Logic Toggle */}
                <div className="col-span-1 md:col-span-2 py-4 border-y border-white/5">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-12 h-6 rounded-full relative transition-colors ${venduFini ? 'bg-gold' : 'bg-white/10'}`}>
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={venduFini}
                        onChange={e => setVenduFini(e.target.checked)}
                      />
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${venduFini ? 'left-7' : 'left-1'}`} />
                    </div>
                    <div>
                      <span className="font-bold text-foreground group-hover:text-gold transition-colors">Vendre comme produit fini en boutique</span>
                      <p className="text-[10px] text-foreground/40">Si activé, l'essence apparaîtra dans le catalogue public de la boutique.</p>
                    </div>
                  </label>
                </div>

                {/* Shop Fields (Visible only if toggle is true) */}
                {venduFini && (
                  <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gold/5 border border-gold/20 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="col-span-full flex items-center gap-2 text-gold mb-2">
                      <Info size={14} />
                      <p className="text-[10px] font-bold uppercase">Paramètres de la Boutique</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Prix de vente (FCFA)</label>
                      <input 
                        type="number"
                        value={shopPrice} 
                        onChange={e => setShopPrice(e.target.value)}
                        placeholder="15000"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold text-gold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Taille par défaut (ml)</label>
                      <select value={shopSize} onChange={e => setShopSize(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold">
                        <option value="10">10 ml</option>
                        <option value="30">30 ml</option>
                        <option value="50">50 ml</option>
                        <option value="100">100 ml</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Stock Initial</label>
                      <input 
                        type="number"
                        value={shopStock} 
                        onChange={e => setShopStock(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-4 rounded-xl border border-white/10 text-foreground/60 font-bold hover:bg-white/5 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 px-6 py-4 rounded-xl bg-gold text-black font-bold hover:bg-gold/80 transition-transform active:scale-95"
                >
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