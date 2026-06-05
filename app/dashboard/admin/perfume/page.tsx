'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle, Edit2, Trash2, Plus, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { shopService } from '@/services/apiService';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import ImageUploader from '@/components/admin/ImageUploader';

// Perfume management admin page
export default function PerfumeAdminPage() {
  // Data states
  const [perfumes, setPerfumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPerfume, setEditingPerfume] = useState<any | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [longDesc, setLongDesc] = useState('');
  const [iaDesc, setIaDesc] = useState('');
  const [volume, setVolume] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { addToast } = useToastStore();

  // Fetch perfumes
  const fetchPerfumes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await shopService.getPerfumes({ search });
      const list = data.results || data.resultats || (Array.isArray(data) ? data : []);
      setPerfumes(list);
    } catch (error) {
      addToast('Erreur lors du chargement des parfums', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, addToast]);

  useEffect(() => {
    const timer = setTimeout(fetchPerfumes, 300);
    return () => clearTimeout(timer);
  }, [fetchPerfumes]);

  // Open modal for add / edit
  const handleOpenAdd = () => {
    setEditingPerfume(null);
    setName('');
    setSlug('');
    setSku('');
    setShortDesc('');
    setLongDesc('');
    setIaDesc('');
    setVolume('');
    setPrice('');
    setImageFile(null);
    setShowModal(true);
  };

  const handleOpenEdit = (perf: any) => {
    setEditingPerfume(perf);
    setName(perf.nom || perf.name || '');
    setSlug(perf.slug || '');
    setSku(perf.reference_sku || '');
    setShortDesc(perf.description_courte || '');
    setLongDesc(perf.description_longue || '');
    setIaDesc(perf.description_ia || '');
    setVolume(String(perf.contenance_ml || ''));
    setPrice(String(perf.prix_unitaire || ''));
    setImageFile(null);
    setShowModal(true);
  };

  // Save (create or update)
  const handleSave = async () => {
    if (!name || !volume || !price) {
      addToast('Nom, contenance et prix sont obligatoires', 'error');
      return;
    }
    const formData = new FormData();
    formData.append('nom', name);
    if (slug) formData.append('slug', slug);
    if (sku) formData.append('reference_sku', sku);
    if (shortDesc) formData.append('description_courte', shortDesc);
    if (longDesc) formData.append('description_longue', longDesc);
    if (iaDesc) formData.append('description_ia', iaDesc);
    formData.append('contenance_ml', volume);
    formData.append('prix_unitaire', price);
    if (imageFile) formData.append('image', imageFile);
    try {
      if (editingPerfume) {
        await adminService.postFormData(`shop/parfums/${editingPerfume.slug}/`, formData);
        addToast('Parfum mis à jour avec succès', 'success');
      } else {
        await adminService.postFormData('shop/parfums/', formData);
        addToast('Parfum créé avec succès', 'success');
      }
      setShowModal(false);
      fetchPerfumes();
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Êtes‑vous sûr de vouloir supprimer ce parfum ?')) return;
    try {
      await shopService.deletePerfume(slug);
      addToast('Parfum supprimé', 'success');
      fetchPerfumes();
    } catch (error) {
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  const filtered = perfumes.filter(p => {
    const term = search.toLowerCase();
    return (
      p.nom?.toLowerCase().includes(term) ||
      p.reference_sku?.toLowerCase().includes(term) ||
      p.slug?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parfums</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Gestion du catalogue de parfums</p>
        </div>
        <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/80 transition-all shadow-lg">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Search */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-2xl flex items-center gap-2 w-full max-w-md">
        <Search size={15} className="text-foreground/40" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un parfum..."
          className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
        />
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement des parfums…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Contenance (ml)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-medium text-foreground">{p.nom || p.name}</td>
                    <td className="px-6 py-4 text-sm text-foreground/60">{p.reference_sku || ''}</td>
                    <td className="px-6 py-4 text-sm text-foreground/60">{p.contenance_ml}</td>
                    <td className="px-6 py-4 text-sm text-gold font-bold">{p.prix_unitaire ? `${p.prix_unitaire} FCFA` : ''}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenEdit(p)} className="p-2 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(p.slug)} className="p-2 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-20 text-foreground/40 italic">Aucun parfum trouvé.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10">
            <h3 className="font-bold text-foreground mb-4">{editingPerfume ? 'Modifier le parfum' : 'Ajouter un parfum'}</h3>
            <div className="space-y-4">
              <input placeholder="Nom" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
              <input placeholder="Slug (optionnel)" value={slug} onChange={e => setSlug(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
              <input placeholder="Référence SKU (optionnel)" value={sku} onChange={e => setSku(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
              <textarea placeholder="Description courte" value={shortDesc} onChange={e => setShortDesc(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" rows={2} />
              <textarea placeholder="Description longue" value={longDesc} onChange={e => setLongDesc(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" rows={3} />
              <textarea placeholder="Description IA" value={iaDesc} onChange={e => setIaDesc(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Contenance (ml)" type="number" value={volume} onChange={e => setVolume(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                <input placeholder="Prix (FCFA)" type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
              </div>
              {/* Image uploader */}
              <ImageUploader onFileSelect={setImageFile} />
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