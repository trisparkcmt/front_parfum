'use client';

import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/apiService';
import { BoutiqueAdminFinancier, BoutiqueAdminRequest } from '@/types';
import { useToastStore } from '@/store/useToastStore';
import { Loader2, Eye, AlertCircle, RefreshCw, Store, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { resolveImageUrl } from '@/lib/utils';

export default function AdminBoutiquesPage() {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [boutiques, setBoutiques] = useState<BoutiqueAdminFinancier[]>([]);
  const [allBoutiques, setAllBoutiques] = useState<BoutiqueAdminRequest[]>([]);
  const [requests, setRequests] = useState<BoutiqueAdminRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'all' | 'finances'>('requests');
  const [loading, setLoading] = useState(true);
  const [allLoading, setAllLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchBoutiques = async () => {
    setLoading(true);
    try {
      const data = await adminService.getBoutiquesFinancier();
      setBoutiques(data);
    } catch (err: any) {
      addToast(err.response?.data?.detail || 'Erreur lors du chargement des boutiques', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setRequestsLoading(true);
    try {
      setRequests(await adminService.getBoutiqueRequests());
    } catch (err: any) {
      addToast(err.response?.data?.detail || 'Erreur lors du chargement des demandes', 'error');
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchAllBoutiques = async () => {
    setAllLoading(true);
    try {
      setAllBoutiques(await adminService.getBoutiquesAdmin());
    } catch (err: any) {
      addToast(err.response?.data?.detail || 'Erreur lors du chargement des boutiques', 'error');
    } finally {
      setAllLoading(false);
    }
  };

  useEffect(() => {
    fetchBoutiques();
    fetchRequests();
    fetchAllBoutiques();
  }, []);

  const listRows = activeTab === 'requests' ? requests : allBoutiques;
  const listLoading = activeTab === 'requests' ? requestsLoading : allLoading;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des boutiques</h1>
          <p className="text-sm text-foreground/50 mt-1">
            Demandes d’ouverture, boutiques actives et suivi financier
          </p>
        </div>
        <button
          onClick={() => {
            fetchBoutiques();
            fetchRequests();
            fetchAllBoutiques();
          }}
          disabled={loading || requestsLoading || allLoading}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm transition-all text-foreground"
        >
          <RefreshCw size={16} className={loading || requestsLoading || allLoading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      <div className="flex gap-1 border-b border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'requests' ? 'border-gold text-gold' : 'border-transparent text-foreground/55 hover:text-foreground'}`}
        >
          <Store size={16} /> Demandes
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs tabular-nums">{requests.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('finances')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'finances' ? 'border-gold text-gold' : 'border-transparent text-foreground/55 hover:text-foreground'}`}
        >
          <Wallet size={16} /> Finances des boutiques
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs tabular-nums">{boutiques.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'all' ? 'border-gold text-gold' : 'border-transparent text-foreground/55 hover:text-foreground'}`}
        >
          <Store size={16} /> Toutes les boutiques
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs tabular-nums">{allBoutiques.length}</span>
        </button>
      </div>

      {activeTab !== 'finances' && (listLoading ? (
        <div className="h-64 flex items-center justify-center border border-white/5 bg-white/5 rounded-2xl">
          <Loader2 className="animate-spin text-gold" size={32} />
        </div>
      ) : listRows.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border border-white/5 bg-white/5 rounded-2xl text-foreground/40">
          <AlertCircle size={48} className="mb-4 opacity-50" />
          <p>{activeTab === 'requests' ? 'Aucune demande de boutique en attente.' : 'Aucune boutique trouvée.'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0a0a0a]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs text-foreground/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Boutique</th>
                <th className="px-4 py-3 font-semibold">Propriétaire</th>
                <th className="px-4 py-3 font-semibold">Coordonnées</th>
                <th className="px-4 py-3 font-semibold">Reçue le</th>
                <th className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {listRows.map((request) => {
                const owner = request.user_details;
                const ownerName = request.proprietaire_nom || `${owner?.first_name || ''} ${owner?.last_name || ''}`.trim() || 'Propriétaire';
                const photo = request.photo || request.photo_url;
                return (
                  <tr key={request.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => photo && setPreviewImage(resolveImageUrl(photo))}
                          disabled={!photo}
                          className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 disabled:cursor-default"
                          title={photo ? 'Voir le logo de la boutique' : undefined}
                        >
                          {photo ? <img src={resolveImageUrl(photo)} alt={request.nom} className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-xs font-bold text-foreground/50">{request.nom.slice(0, 2).toUpperCase()}</span>}
                        </button>
                        <div>
                          <p className="font-semibold text-foreground">{request.nom}</p>
                          <p className="text-xs text-foreground/45">{[request.adresse, request.ville].filter(Boolean).join(', ') || 'Adresse non renseignée'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground/80">
                      <p>{ownerName}</p>
                      {activeTab === 'all' && <p className="mt-1 text-[10px] uppercase text-foreground/40">{request.statut || '—'}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground/55">
                      <p>{request.proprietaire_email || owner?.email || '—'}</p>
                      <p className="mt-1">{request.proprietaire_telephone || request.telephone || owner?.telephone || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground/55">{request.date_creation ? new Date(request.date_creation).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => router.push(`/dashboard/admin/boutiques/${request.id}`)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-black hover:bg-gold/90"
                      >
                        <Eye size={14} /> {activeTab === 'requests' ? 'Examiner' : 'Détails'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      {activeTab === 'finances' && (loading ? (
        <div className="h-64 flex items-center justify-center border border-white/5 bg-white/5 rounded-2xl">
          <Loader2 className="animate-spin text-gold" size={32} />
        </div>
      ) : boutiques.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border border-white/5 bg-white/5 rounded-2xl text-foreground/40">
          <AlertCircle size={48} className="mb-4 opacity-50" />
          <p>Aucune boutique active trouvée.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {boutiques.map((boutique) => (
            <div key={boutique.id} className="border border-white/10 bg-[#0a0a0a] rounded-2xl p-5 hover:border-gold/30 transition-all flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setPreviewImage(resolveImageUrl(boutique.photo || boutique.photo_url || boutique.avatar_url))}
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:border-gold/40 transition-colors"
                  title="Voir le logo de la boutique"
                >
                  {boutique.photo || boutique.photo_url || boutique.avatar_url ? (
                    <img
                      src={resolveImageUrl(boutique.photo || boutique.photo_url || boutique.avatar_url)}
                      alt={boutique.nom}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase text-foreground/50">
                      {boutique.nom.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-lg text-foreground truncate">{boutique.nom}</h3>
                  <p className="text-xs text-foreground/50 truncate">{boutique.proprietaire}</p>
                </div>
                <span className="bg-gold/10 text-gold text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border border-gold/20">
                  {parseFloat(boutique.taux_commission).toFixed(1)}% COM
                </span>
              </div>
              
              <div className="space-y-3 flex-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground/50">Solde Disponible:</span>
                  <span className="font-mono font-bold text-green-400">{boutique.solde_disponible} FCFA</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground/50">Total Reçu:</span>
                  <span className="font-mono font-semibold text-foreground/80">{boutique.solde_total_recu} FCFA</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground/50">CA Brut:</span>
                  <span className="font-mono text-foreground/70">{boutique.chiffre_affaires_brut} FCFA</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground/50">Commissions plateforme:</span>
                  <span className="font-mono text-red-300">{boutique.commissions_admin_perdues} FCFA</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground/50">Net cumulé boutique:</span>
                  <span className="font-mono text-foreground/70">{boutique.net_boutique_cumule} FCFA</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/5 flex gap-2">
                <button
                  onClick={() => router.push(`/dashboard/admin/boutiques/${boutique.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Eye size={14} />
                  Détails & Produits
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative max-w-2xl w-full rounded-2xl border border-white/10 bg-[#0a0a0a] p-3 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/40 p-2 text-foreground/70 hover:text-foreground"
              aria-label="Fermer"
            >
              ×
            </button>
            <img src={previewImage} alt="Logo de la boutique" className="max-h-[70vh] w-full rounded-xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
