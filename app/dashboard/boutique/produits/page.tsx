'use client';

import React, { useEffect, useState } from 'react';
import { boutiqueService, shopService } from '@/services/apiService';
import { BoutiqueProductItem, BoutiqueProductsParams } from '@/types';
import { useToastStore } from '@/store/useToastStore';
import { Loader2, Package, Search, Plus, Pencil, Trash2, X } from 'lucide-react';
import { resolveImageUrl } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';

type ProductKind = 'parfum' | 'accessoire';

type ProductForm = {
  marque: string;
  nom: string;
  reference_sku: string;
  description_courte: string;
  description_longue: string;
  contenance_ml: string;
  prix_unitaire: string;
  prix_promotionnel: string;
  genre_cible: string;
  intensite: string;
  notes_tete: string;
  notes_coeur: string;
  notes_fond: string;
  stock_quantite: string;
  seuil_alerte_stock: string;
  categorie: string;
  type_accessoire: string;
  matiere: string;
  couleur: string;
  taille: string;
  poids_grammes: string;
  actif: boolean;
};

const emptyProductForm: ProductForm = {
  marque: '',
  nom: '',
  reference_sku: '',
  description_courte: '',
  description_longue: '',
  contenance_ml: '',
  prix_unitaire: '',
  prix_promotionnel: '',
  genre_cible: 'mixte',
  intensite: 'moyenne',
  notes_tete: '',
  notes_coeur: '',
  notes_fond: '',
  stock_quantite: '',
  seuil_alerte_stock: '5',
  categorie: '',
  type_accessoire: '',
  matiere: '',
  couleur: '',
  taille: '',
  poids_grammes: '',
  actif: true,
};

function asOptionList(value: any): Array<{ id: number; nom: string }> {
  const items = value?.results || value?.resultats || value;
  return Array.isArray(items) ? items : [];
}

export default function BoutiqueProductsPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [products, setProducts] = useState<BoutiqueProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'all' | 'parfum' | 'accessoire'>('all');
  const [actif, setActif] = useState<'all' | 'true' | 'false'>('all');
  const [category, setCategory] = useState('');
  const [ordering, setOrdering] = useState('-date_creation');
  const [pageSize, setPageSize] = useState(100);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productKind, setProductKind] = useState<ProductKind>('parfum');
  const [editingProduct, setEditingProduct] = useState<BoutiqueProductItem | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [existingImagePreview, setExistingImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number; nom: string }>>([]);
  const [accessoryTypes, setAccessoryTypes] = useState<Array<{ id: number; nom: string }>>([]);
  const [savingProduct, setSavingProduct] = useState(false);

  const fetchProducts = async (requestedPage = page) => {
    setLoading(true);
    try {
      const params: BoutiqueProductsParams = {
        page: requestedPage,
        page_size: pageSize,
        search: search || undefined,
        type: type === 'all' ? undefined : type,
        actif: actif === 'all' ? undefined : actif === 'true',
        categorie: category.trim() || undefined,
        ordering,
      };
      
      const res = await boutiqueService.getProduits(params);
      setProducts(res.results || []);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      addToast(err.response?.data?.detail || 'Erreur lors du chargement des produits', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, type, actif, category, ordering, pageSize]);

  useEffect(() => {
    Promise.all([shopService.getPerfumeCategories(), shopService.getAccessoryTypes()])
      .then(([categoryData, accessoryTypeData]) => {
        setCategories(asOptionList(categoryData));
        setAccessoryTypes(asOptionList(accessoryTypeData));
      })
      .catch(() => addToast('Impossible de charger les catégories de produits', 'error'));
  }, [addToast]);

  useEffect(() => {
    if (!mainImage) {
      setMainImagePreview(null);
      return;
    }
    const preview = URL.createObjectURL(mainImage);
    setMainImagePreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [mainImage]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setProductKind(type === 'accessoire' ? 'accessoire' : 'parfum');
    setProductForm({
      ...emptyProductForm,
      categorie: categories[0]?.id ? String(categories[0].id) : '',
      type_accessoire: accessoryTypes[0]?.id ? String(accessoryTypes[0].id) : '',
    });
    setMainImage(null);
    setExistingImagePreview(null);
    setShowProductModal(true);
  };

  const openEditModal = async (product: BoutiqueProductItem) => {
    const kind = product.type_produit;
    setSavingProduct(true);
    try {
      const detail = kind === 'parfum'
        ? await shopService.getPerfumeBySlug(product.slug)
        : await shopService.getAccessoryBySlug(product.slug);
      const value = detail as any;
      setEditingProduct(product);
      setProductKind(kind);
      setProductForm({
        ...emptyProductForm,
        marque: value.marque || product.marque || '',
        nom: value.nom || product.nom || '',
        reference_sku: value.reference_sku || product.reference_sku || '',
        description_courte: value.description_courte || '',
        description_longue: value.description_longue || '',
        contenance_ml: value.contenance_ml ? String(value.contenance_ml) : '',
        prix_unitaire: String(value.prix_unitaire ?? product.prix_unitaire ?? ''),
        prix_promotionnel: String(value.prix_promotionnel ?? product.prix_promo ?? ''),
        genre_cible: value.genre_cible || 'mixte',
        intensite: value.intensite || 'moyenne',
        notes_tete: value.notes_tete || '',
        notes_coeur: value.notes_coeur || '',
        notes_fond: value.notes_fond || '',
        stock_quantite: String(value.stock_quantite ?? product.stock_quantite ?? ''),
        seuil_alerte_stock: String(value.seuil_alerte_stock ?? '5'),
        categorie: String(value.categorie?.id ?? value.categorie ?? product.categorie?.id ?? ''),
        type_accessoire: String(value.type_accessoire?.id ?? value.type_accessoire ?? product.type_accessoire?.id ?? ''),
        matiere: value.matiere || '',
        couleur: value.couleur || '',
        taille: value.taille || '',
        poids_grammes: value.poids_grammes ? String(value.poids_grammes) : '',
        actif: value.actif !== false,
      });
      setMainImage(null);
      const existingImage = value.image_principale || value.image || value.images?.find((image: any) => image.est_principale)?.image || null;
      setExistingImagePreview(existingImage ? resolveImageUrl(existingImage) : null);
      setShowProductModal(true);
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Impossible de charger les détails du produit', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleSaveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productForm.nom.trim() || !productForm.marque.trim() || !productForm.prix_unitaire || !productForm.stock_quantite) {
      addToast('Marque, nom, prix et stock sont obligatoires.', 'error');
      return;
    }
    if (productKind === 'parfum' && (!productForm.contenance_ml || !productForm.categorie || !productForm.genre_cible || !productForm.intensite)) {
      addToast('Contenance, catégorie, genre et intensité sont obligatoires pour un parfum.', 'error');
      return;
    }
    if (productKind === 'accessoire' && (!productForm.type_accessoire || !productForm.poids_grammes)) {
      addToast('Type et poids sont obligatoires pour un accessoire.', 'error');
      return;
    }

    setSavingProduct(true);
    const payload = new FormData();
    const perfumeFields: Array<keyof ProductForm> = [
      'marque', 'nom', 'reference_sku', 'description_courte', 'description_longue',
      'contenance_ml', 'prix_unitaire', 'prix_promotionnel', 'genre_cible', 'intensite',
      'notes_tete', 'notes_coeur', 'notes_fond', 'stock_quantite', 'seuil_alerte_stock',
      'categorie', 'actif',
    ];
    const accessoryFields: Array<keyof ProductForm> = [
      'marque', 'nom', 'reference_sku', 'description_courte', 'description_longue',
      'prix_unitaire', 'prix_promotionnel', 'stock_quantite', 'seuil_alerte_stock',
      'type_accessoire', 'matiere', 'couleur', 'taille', 'poids_grammes', 'actif',
    ];
    const fields = productKind === 'parfum' ? perfumeFields : accessoryFields;
    fields.forEach((key) => {
      const value = productForm[key];
      if (value !== '') payload.append(key, String(value));
    });
    if (mainImage) payload.append('image_principale', mainImage);

    try {
      if (editingProduct) {
        if (productKind === 'parfum') {
          await shopService.updatePerfume(editingProduct.slug, payload);
        } else {
          await shopService.updateAccessory(editingProduct.slug, payload);
        }
        addToast('Produit mis à jour.', 'success');
      } else if (productKind === 'parfum') {
        await shopService.createPerfume(payload);
        addToast('Parfum ajouté à votre boutique.', 'success');
      } else {
        await shopService.createAccessory(payload);
        addToast('Accessoire ajouté à votre boutique.', 'success');
      }
      setShowProductModal(false);
      setMainImage(null);
      setExistingImagePreview(null);
      await fetchProducts(1);
      setPage(1);
    } catch (error: any) {
      const data = error.response?.data;
      const detail = data?.detail || Object.entries(data || {})
        .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : String(errors)}`)
        .join(' · ');
      addToast(detail || 'Impossible d’enregistrer le produit.', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (product: BoutiqueProductItem) => {
    if (!window.confirm(`Supprimer « ${product.nom} » de votre boutique ?`)) return;
    try {
      if (product.type_produit === 'parfum') {
        await shopService.deletePerfume(product.slug);
      } else {
        await shopService.deleteAccessory(product.slug);
      }
      addToast('Produit supprimé.', 'success');
      await fetchProducts(page);
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Impossible de supprimer le produit.', 'error');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="text-gold" /> Catalogue Boutique
          </h1>
          <p className="text-sm text-foreground/50 mt-1">Consultez vos parfums et accessoires, leur visibilité et leur stock</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black hover:bg-gold/90"
        >
          <Plus size={16} /> Ajouter un produit
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <input
            type="text"
            placeholder="Rechercher (nom, marque, SKU, description)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-gold outline-none"
          />
          <Search className="absolute left-3.5 top-3 text-foreground/40" size={16} />
        </form>

        <div className="flex gap-2 w-full">
          <select
            value={type}
            onChange={(e) => { setType(e.target.value as any); setPage(1); }}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none cursor-pointer flex-1 md:flex-none"
          >
            <option value="all">Tous types</option>
            <option value="parfum">Parfums</option>
            <option value="accessoire">Accessoires</option>
          </select>
          <select
            value={actif}
            onChange={(e) => { setActif(e.target.value as any); setPage(1); }}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none cursor-pointer flex-1 md:flex-none"
          >
            <option value="all">Tout statut</option>
            <option value="true">Actifs (En ligne)</option>
            <option value="false">Inactifs (Masqués)</option>
          </select>
        </div>
        <input
          type="text"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          placeholder="Catégorie, slug ou ID"
          aria-label="Filtrer par catégorie, slug ou identifiant"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-gold outline-none"
        />
        <select
          value={ordering}
          onChange={(e) => { setOrdering(e.target.value); setPage(1); }}
          aria-label="Trier les produits"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none cursor-pointer"
        >
          <option value="-date_creation">Plus récents</option>
          <option value="date_creation">Plus anciens</option>
          <option value="nom">Nom A-Z</option>
          <option value="-nom">Nom Z-A</option>
          <option value="prix_unitaire">Prix croissant</option>
          <option value="-prix_unitaire">Prix décroissant</option>
          <option value="stock_quantite">Stock croissant</option>
          <option value="-stock_quantite">Stock décroissant</option>
        </select>
        <select
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          aria-label="Nombre de produits par page"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none cursor-pointer"
        >
          <option value={20}>20 par page</option>
          <option value={50}>50 par page</option>
          <option value={100}>100 par page</option>
        </select>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="h-64 flex items-center justify-center border border-white/5 bg-white/5 rounded-2xl">
          <Loader2 className="animate-spin text-gold" size={32} />
        </div>
      ) : products.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border border-white/5 bg-white/5 rounded-2xl text-foreground/40">
          <Package size={48} className="mb-4 opacity-50" />
          <p>Aucun produit trouvé.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const imagePath = product.images?.find(img => img.est_principale)?.image || product.images?.[0]?.image;
              const mainImage = imagePath ? resolveImageUrl(imagePath) : '/placeholder.jpg';
              return (
                <div key={product.id} className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden hover:border-gold/30 transition-all flex flex-col group">
                  <div className="relative h-48 w-full bg-white/5">
                    {/* Fallback image if domain doesn't match for Next/Image, using regular img tag for external generic APIs */}
                    <img src={mainImage} alt={product.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded ${
                        product.actif ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
                      }`}>
                        {product.actif ? 'En ligne' : 'Masqué'}
                      </span>
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 text-[10px] uppercase font-bold rounded bg-black/60 backdrop-blur-md text-white border border-white/10">
                        {product.type_produit}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-[10px] text-foreground/50 uppercase font-bold tracking-widest">{product.marque || product.type_accessoire?.nom || 'Sans marque'}</p>
                    <h3 className="font-bold text-foreground mt-1 line-clamp-1" title={product.nom}>{product.nom}</h3>
                    <p className="text-xs text-foreground/45 mt-1">{product.categorie?.nom || product.type_accessoire?.nom || 'Sans catégorie'}</p>
                    <p className="text-xs text-foreground/40 font-mono mt-1">SKU: {product.reference_sku}</p>
                    
                    <div className="mt-auto pt-4 flex justify-between items-end">
                      <div>
                        {product.prix_promo ? (
                          <>
                            <p className="text-[10px] text-foreground/40 line-through">{product.prix_unitaire} FCFA</p>
                            <p className="font-bold text-gold">{product.prix_promo} FCFA</p>
                          </>
                        ) : (
                          <p className="font-bold text-gold">{product.prix_unitaire} FCFA</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-foreground/50 uppercase">Stock</p>
                        <p className={`font-mono text-sm font-bold ${product.stock_quantite > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {product.stock_quantite}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2 border-t border-white/10 pt-3">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        disabled={savingProduct}
                        className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 text-xs font-semibold text-foreground/75 hover:border-gold/40 hover:text-gold disabled:opacity-50"
                      >
                        <Pencil size={14} /> Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product)}
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-red-500/20 px-3 text-xs font-semibold text-red-300 hover:bg-red-500/10"
                        aria-label={`Supprimer ${product.nom}`}
                        title="Supprimer le produit"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <p className="text-center text-xs text-foreground/45">{products.length} produit(s) affiché(s) par page · {pageSize} max</p>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 border border-white/10 rounded-lg text-sm disabled:opacity-30"
              >
                Précédent
              </button>
              <span className="text-sm text-foreground/60">
                Page {page} sur {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 border border-white/10 rounded-lg text-sm disabled:opacity-30"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingProduct ? 'Modifier un produit' : 'Ajouter un produit'}
        size="2xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-5">
          {!editingProduct && (
            <div className="flex gap-2 border-b border-white/10 pb-4">
              {(['parfum', 'accessoire'] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setProductKind(kind)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${productKind === kind ? 'bg-gold text-black' : 'bg-white/5 text-foreground/65 hover:bg-white/10'}`}
                >
                  {kind === 'parfum' ? 'Parfum' : 'Accessoire'}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs text-foreground/65">Marque *
              <input required value={productForm.marque} onChange={(e) => setProductForm((current) => ({ ...current, marque: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" />
            </label>
            <label className="space-y-1.5 text-xs text-foreground/65">Nom du produit *
              <input required value={productForm.nom} onChange={(e) => setProductForm((current) => ({ ...current, nom: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" />
            </label>
            <label className="space-y-1.5 text-xs text-foreground/65">Référence SKU
              <input value={productForm.reference_sku} onChange={(e) => setProductForm((current) => ({ ...current, reference_sku: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" />
            </label>
            {productKind === 'parfum' ? (
              <>
                <label className="space-y-1.5 text-xs text-foreground/65">Catégorie *
                  <select required value={productForm.categorie} onChange={(e) => setProductForm((current) => ({ ...current, categorie: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold">
                    <option value="">Choisir une catégorie</option>
                    {categories.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}
                  </select>
                </label>
                <label className="space-y-1.5 text-xs text-foreground/65">Contenance (ml) *
                  <input required min="1" type="number" value={productForm.contenance_ml} onChange={(e) => setProductForm((current) => ({ ...current, contenance_ml: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" />
                </label>
                <label className="space-y-1.5 text-xs text-foreground/65">Genre *
                  <select required value={productForm.genre_cible} onChange={(e) => setProductForm((current) => ({ ...current, genre_cible: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold">
                    <option value="homme">Homme</option><option value="femme">Femme</option><option value="mixte">Mixte</option>
                  </select>
                </label>
                <label className="space-y-1.5 text-xs text-foreground/65">Intensité *
                  <select required value={productForm.intensite} onChange={(e) => setProductForm((current) => ({ ...current, intensite: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold">
                    <option value="légère">Légère</option><option value="moyenne">Moyenne</option><option value="forte">Forte</option><option value="très forte">Très forte</option>
                  </select>
                </label>
                <label className="space-y-1.5 text-xs text-foreground/65">Notes de tête<input value={productForm.notes_tete} onChange={(e) => setProductForm((current) => ({ ...current, notes_tete: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" /></label>
                <label className="space-y-1.5 text-xs text-foreground/65">Notes de cœur<input value={productForm.notes_coeur} onChange={(e) => setProductForm((current) => ({ ...current, notes_coeur: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" /></label>
                <label className="space-y-1.5 text-xs text-foreground/65">Notes de fond<input value={productForm.notes_fond} onChange={(e) => setProductForm((current) => ({ ...current, notes_fond: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" /></label>
              </>
            ) : (
              <>
                <label className="space-y-1.5 text-xs text-foreground/65">Type d’accessoire *
                  <select required value={productForm.type_accessoire} onChange={(e) => setProductForm((current) => ({ ...current, type_accessoire: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold">
                    <option value="">Choisir un type</option>
                    {accessoryTypes.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}
                  </select>
                </label>
                <label className="space-y-1.5 text-xs text-foreground/65">Matière<input value={productForm.matiere} onChange={(e) => setProductForm((current) => ({ ...current, matiere: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" /></label>
                <label className="space-y-1.5 text-xs text-foreground/65">Couleur<input value={productForm.couleur} onChange={(e) => setProductForm((current) => ({ ...current, couleur: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" /></label>
                <label className="space-y-1.5 text-xs text-foreground/65">Taille<input value={productForm.taille} onChange={(e) => setProductForm((current) => ({ ...current, taille: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" /></label>
                <label className="space-y-1.5 text-xs text-foreground/65">Poids (g) *<input required min="1" type="number" value={productForm.poids_grammes} onChange={(e) => setProductForm((current) => ({ ...current, poids_grammes: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" /></label>
              </>
            )}
            <label className="space-y-1.5 text-xs text-foreground/65">Prix (FCFA) *
              <input required min="1" type="number" value={productForm.prix_unitaire} onChange={(e) => setProductForm((current) => ({ ...current, prix_unitaire: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" />
            </label>
            <label className="space-y-1.5 text-xs text-foreground/65">Prix promotionnel
              <input min="0" type="number" value={productForm.prix_promotionnel} onChange={(e) => setProductForm((current) => ({ ...current, prix_promotionnel: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" />
            </label>
            <label className="space-y-1.5 text-xs text-foreground/65">Stock *
              <input required min="0" type="number" value={productForm.stock_quantite} onChange={(e) => setProductForm((current) => ({ ...current, stock_quantite: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" />
            </label>
            <label className="space-y-1.5 text-xs text-foreground/65">Seuil d’alerte
              <input min="0" type="number" value={productForm.seuil_alerte_stock} onChange={(e) => setProductForm((current) => ({ ...current, seuil_alerte_stock: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" />
            </label>
          </div>

          <label className="block space-y-1.5 text-xs text-foreground/65">Description courte
            <textarea rows={2} value={productForm.description_courte} onChange={(e) => setProductForm((current) => ({ ...current, description_courte: e.target.value }))} className="w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" />
          </label>
          <label className="block space-y-1.5 text-xs text-foreground/65">Description détaillée
            <textarea rows={4} value={productForm.description_longue} onChange={(e) => setProductForm((current) => ({ ...current, description_longue: e.target.value }))} className="w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" />
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground/70">
            <input type="checkbox" checked={productForm.actif} onChange={(e) => setProductForm((current) => ({ ...current, actif: e.target.checked }))} />
            Publier comme produit actif
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <input type="file" accept="image/*" onChange={(e) => setMainImage(e.target.files?.[0] || null)} className="w-full text-sm text-foreground/65 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground" />
            {(mainImagePreview || existingImagePreview) && <img src={mainImagePreview || existingImagePreview || ''} alt="Aperçu produit" className="h-16 w-16 rounded-lg border border-white/10 object-cover" />}
          </div>
          <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
            <button type="button" onClick={() => setShowProductModal(false)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-foreground/70 hover:bg-white/5"><X size={15} /> Annuler</button>
            <button type="submit" disabled={savingProduct} className="inline-flex min-w-32 items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-black hover:bg-gold/90 disabled:opacity-60">
              {savingProduct && <Loader2 size={15} className="animate-spin" />}
              {editingProduct ? 'Enregistrer' : 'Publier le produit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
