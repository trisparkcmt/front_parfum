'use client';

import React, { useEffect, useState } from 'react';
import { boutiqueService } from '@/services/apiService';
import { BoutiqueProductItem, BoutiqueProductsParams } from '@/types';
import { useToastStore } from '@/store/useToastStore';
import { Loader2, Package, Search, Filter } from 'lucide-react';
import Image from 'next/image';

export default function BoutiqueProductsPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [products, setProducts] = useState<BoutiqueProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'all' | 'parfum' | 'accessoire'>('all');
  const [actif, setActif] = useState<'all' | 'true' | 'false'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: BoutiqueProductsParams = {
        page,
        page_size: 20, // using 20 for better display, but can be 100
        search: search || undefined,
        type: type === 'all' ? undefined : type,
        actif: actif === 'all' ? undefined : actif === 'true',
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
  }, [page, type, actif]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="text-gold" /> Catalogue Boutique
          </h1>
          <p className="text-sm text-foreground/50 mt-1">Gérez vos parfums et accessoires en ligne</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <input
            type="text"
            placeholder="Rechercher (nom, marque, SKU)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-gold outline-none"
          />
          <Search className="absolute left-3.5 top-3 text-foreground/40" size={16} />
        </form>

        <div className="flex gap-2 w-full md:w-auto">
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
              const mainImage = product.images?.find(img => img.est_principale)?.image || product.images?.[0]?.image || '/placeholder.jpg';
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
                    <p className="text-[10px] text-foreground/50 uppercase font-bold tracking-widest">{product.marque}</p>
                    <h3 className="font-bold text-foreground mt-1 line-clamp-1" title={product.nom}>{product.nom}</h3>
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
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
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
    </div>
  );
}
