'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle, UserCheck, Percent, Gift, Search, User, Mail, Phone, Calendar, Info } from 'lucide-react';
import { shopService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';

/**
 * Note: Ensure you have the following methods in your shopService (or adminService):
 * getPrestataireRequests: () => axios.get('/api/v1/utilisateur/prestataire-requests/'),
 * validatePrestataire: (id, data) => axios.patch(`/api/v1/auth/admin/prestataires/validate/${id}/`, data),
 */

export default function PrestataireManagementPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<any | null>(null);

  // Validation form states (Payload data)
  const [commission, setCommission] = useState('15.00');
  const [reduction, setReduction] = useState('5.0');

  const { addToast } = useToastStore();

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      // Endpoint 3.6: GET /api/v1/utilisateur/prestataire-requests/
      // @ts-ignore - Assuming implementation in your apiService
      const data = await shopService.getPrestataireRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      addToast('Erreur lors du chargement des demandes', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleOpenValidate = (request: any) => {
    setSelectedRequest(request);
    setCommission('15.00'); // Default suggested value
    setReduction('5.0');   // Default suggested value
    setShowModal(true);
  };

  const handleOpenDetails = (request: any) => {
    setViewingRequest(request);
    setShowDetailsModal(true);
  };

  const handleValidate = async () => {
    if (!selectedRequest) return;

    try {
      const payload = {
        taux_commission: parseFloat(commission),
        reduction_client_pourcentage: parseFloat(reduction),
      };

      // Endpoint 3.8: PATCH /api/v1/auth/admin/prestataires/validate/{id}/
      // @ts-ignore - Assuming implementation in your apiService
      await shopService.validatePrestataire(selectedRequest.id, payload);

      addToast('Prestataire validé avec succès. Un code promo a été généré.', 'success');
      setShowModal(false);
      fetchRequests();
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Erreur lors de la validation', 'error');
    }
  };

  const filtered = requests.filter(r =>
    String(r.id).includes(search) ||
    String(r.client).includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Demandes de Partenariat</h1>
        <p className="text-sm text-foreground/40 mt-0.5">Gérez les demandes d'adhésion au programme prestataire</p>
      </div>

      {/* Search Header */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-2xl">
        <div className="flex items-center gap-2 border border-white/10 rounded-lg px-3 py-2 w-full max-w-md">
          <Search size={15} className="text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par ID demande ou client..."
            className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement des demandes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">ID Demande</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">ID Client</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Date de création</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-gold">#{r.id}</td>
                    <td
                      className="px-6 py-4 text-sm text-foreground font-medium cursor-pointer hover:text-gold transition-colors flex items-center gap-2"
                      onClick={() => handleOpenDetails(r)}
                      title="Voir les détails personnels"
                    >
                      <User size={14} className="text-foreground/20" />
                      Client {r.client}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground/60">{new Date(r.date_creation).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tight bg-amber-500/10 text-amber-400">
                        {r.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenValidate(r)}
                        className="bg-gold text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-gold/80 transition-all inline-flex items-center gap-2 shadow-lg active:scale-95"
                      >
                        <UserCheck size={14} />
                        Approuver
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-20 text-foreground/40 italic">Aucune demande trouvée.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Validation Modal (The Popup requested) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-6 text-gold">
              <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-foreground">Valider le partenaire</h3>
            </div>

            <p className="text-sm text-foreground/60 mb-8 leading-relaxed">
              Veuillez définir les paramètres financiers pour ce prestataire. Une fois validé, il recevra automatiquement son code promo unique par e-mail.
            </p>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-foreground/40 mb-2 block uppercase tracking-wider flex items-center gap-2">
                  <Percent size={14} className="text-gold" /> Taux de Commission (%)
                </label>
                <input
                  type="number"
                  value={commission}
                  onChange={e => setCommission(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                  placeholder="15.00"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground/40 mb-2 block uppercase tracking-wider flex items-center gap-2">
                  <Gift size={14} className="text-gold" /> Réduction Client (%)
                </label>
                <input
                  type="number"
                  value={reduction}
                  onChange={e => setReduction(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                  placeholder="5.0"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-xl py-3.5 text-sm font-medium text-foreground/60 hover:bg-white/5 transition-colors">
                Annuler
              </button>
              <button onClick={handleValidate} className="flex-1 bg-gold text-black rounded-xl py-3.5 text-sm font-bold hover:bg-gold/90 transition-all shadow-lg shadow-gold/10 active:scale-95">
                Valider la demande
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && viewingRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-8 text-gold border-b border-white/5 pb-6">
              <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center">
                <Info size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Détails du Candidat</h3>
                <p className="text-xs text-foreground/40 font-mono">Demande #{viewingRequest.id}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-white/5 text-gold">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-foreground/40 uppercase font-bold tracking-widest mb-0.5">Identifiant Client</p>
                  <p className="text-sm font-medium text-foreground">{viewingRequest.client_name || `Client #${viewingRequest.client}`}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-white/5 text-gold">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-foreground/40 uppercase font-bold tracking-widest mb-0.5">Email</p>
                  <p className="text-sm font-medium text-foreground">{viewingRequest.client_email || 'Non spécifié'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-white/5 text-gold">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-foreground/40 uppercase font-bold tracking-widest mb-0.5">Date de la demande</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(viewingRequest.date_creation).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowDetailsModal(false)}
              className="w-full mt-10 border border-white/10 rounded-xl py-3.5 text-sm font-bold text-foreground hover:bg-white/5 transition-all active:scale-95"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}