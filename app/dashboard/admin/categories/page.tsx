'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Edit2, Trash2, Plus, Search, Layers, Sparkles, Gem, FlaskConical } from 'lucide-react';
import { shopService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';

type TabKey = 'perfume_categories' | 'accessory_categories' | 'bottle_types';

function TabButton({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 whitespace-nowrap
        ${active
          ? 'border-gold text-gold bg-white/5'
          : 'border-transparent text-foreground/40 hover:text-foreground/80 hover:border-white/20'
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function CategoriesAdminPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('perfume_categories');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // General Form States
  const [form, setForm] = useState({
    nom: '',
    slug: '',
    description: '',
    ordre_affichage: 0,
    actif: true,
    taux_reduction: '0.00'
  });

  const { addToast } = useToastStore();

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      let data: any;
      if (activeTab === 'perfume_categories') {
        data = await shopService.getPerfumeCategories();
      } else if (activeTab === 'accessory_categories') {
        data = await shopService.getAccessoryTypes();
      } else if (activeTab === 'bottle_types') {
        data = await shopService.getBottleTypes();
      }
      const list = data?.results || data?.resultats || (Array.isArray(data) ? data : []);
      setItems(list);
    } catch (error) {
      addToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const updateForm = (field: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      nom: '',
      slug: '',
      description: '',
      ordre_affichage: 0,
      actif: true,
      taux_reduction: '0.00'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setForm({
      nom: item.nom || '',
      slug: item.slug || '',
      description: item.description || '',
      ordre_affichage: item.ordre_affichage || 0,
      actif: item.actif !== undefined ? item.actif : true,
      taux_reduction: item.taux_reduction || '0.00'
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nom) {
      addToast('Le nom est requis', 'error');
      return;
    }

    try {
      if (activeTab === 'perfume_categories') {
        const payload = {
          ...form,
          ordre_affichage: Number(form.ordre_affichage)
        };
        if (editingItem) {
          await shopService.updatePerfumeCategory(editingItem.id, payload);
          addToast('Catégorie parfum mise à jour', 'success');
        } else {
          await shopService.createPerfumeCategory(payload);
          addToast('Catégorie parfum créée', 'success');
        }
      } else if (activeTab === 'accessory_categories') {
        const payload = {
          nom: form.nom,
          description: form.description
        };
        if (editingItem) {
          await shopService.updateAccessoryType(editingItem.id, payload);
          addToast('Type accessoire mis à jour', 'success');
        } else {
          await shopService.createAccessoryType(payload);
          addToast('Type accessoire créé', 'success');
        }
      } else if (activeTab === 'bottle_types') {
        const payload = {
          nom: form.nom,
          description: form.description
        };
        if (editingItem) {
          await shopService.updateBottleType(editingItem.id, payload);
          addToast('Type flacon mis à jour', 'success');
        } else {
          await shopService.createBottleType(payload);
          addToast('Type flacon créé', 'success');
        }
      }
      setShowModal(false);
      fetchItems();
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;
    try {
      if (activeTab === 'perfume_categories') {
        await shopService.deletePerfumeCategory(id);
      } else if (activeTab === 'accessory_categories') {
        await shopService.deleteAccessoryType(id);
      } else if (activeTab === 'bottle_types') {
        await shopService.deleteBottleType(id);
      }
      addToast('Élément supprimé', 'success');
      fetchItems();
    } catch (error) {
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  const filtered = items.filter(c =>
    (c.nom || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.slug || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Classifications & Catégories</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Gérer les types d'accessoires, flacons et catégories de parfums</p>
        </div>
        <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/80 transition-all shadow-lg">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Tab Selectors */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="flex border-b border-white/10 overflow-x-auto">
          <TabButton
            active={activeTab === 'perfume_categories'}
            onClick={() => setActiveTab('perfume_categories')}
            icon={<Sparkles size={14} />}
            label="Catégories Parfums"
          />
          <TabButton
            active={activeTab === 'accessory_categories'}
            onClick={() => setActiveTab('accessory_categories')}
            icon={<Gem size={14} />}
            label="Catégories Accessoires"
          />
          <TabButton
            active={activeTab === 'bottle_types'}
            onClick={() => setActiveTab('bottle_types')}
            icon={<FlaskConical size={14} />}
            label="Types Flacons"
          />
        </div>

        <div className="p-6">
          <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-2xl flex items-center gap-2 w-full max-w-md mb-6">
            <Search size={15} className="text-foreground/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
            />
          </div>

          <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
                <Loader2 className="animate-spin" size={32} />
                <p className="text-sm font-medium">Chargement des éléments...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Nom</th>
                      {activeTab === 'perfume_categories' && (
                        <>
                          <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Slug</th>
                          <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Ordre</th>
                          <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Taux Réduction</th>
                        </>
                      )}
                      {activeTab !== 'perfume_categories' && (
                        <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Description</th>
                      )}
                      <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map(c => (
                      <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 font-medium text-foreground">{c.nom}</td>
                        {activeTab === 'perfume_categories' && (
                          <>
                            <td className="px-6 py-4 text-sm text-foreground/60">{c.slug}</td>
                            <td className="px-6 py-4 text-sm text-foreground/60">{c.ordre_affichage}</td>
                            <td className="px-6 py-4 text-sm text-gold font-bold">{c.taux_reduction}%</td>
                          </>
                        )}
                        {activeTab !== 'perfume_categories' && (
                          <td className="px-6 py-4 text-sm text-foreground/60">{c.description || '—'}</td>
                        )}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleOpenEdit(c)} className="p-2 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-20 text-foreground/40 italic">Aucun élément trouvé.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-foreground mb-4">{editingItem ? 'Modifier l\'élément' : 'Ajouter un élément'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Nom *</label>
                <input placeholder="Nom" value={form.nom} onChange={e => updateForm('nom', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
              </div>
              {activeTab === 'perfume_categories' && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Slug</label>
                    <input placeholder="Ex: collection-prestige" value={form.slug} onChange={e => updateForm('slug', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Ordre d'affichage</label>
                      <input type="number" placeholder="0" value={form.ordre_affichage} onChange={e => updateForm('ordre_affichage', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Taux Réduction (%)</label>
                      <input placeholder="15.00" value={form.taux_reduction} onChange={e => updateForm('taux_reduction', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
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
                </>
              )}
              {activeTab !== 'perfume_categories' && (
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Description</label>
                  <textarea placeholder="Description..." value={form.description} onChange={e => updateForm('description', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" rows={3} />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">Annuler</button>
              <button onClick={handleSave} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
