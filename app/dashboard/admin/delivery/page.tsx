'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import AppImage from '@/components/ui/AppImage';
import { SlideOver } from '@/components/ui/SlideOver';

// --- Types ---

interface Driver {
  id: number;
  user_details: {
    id: number;
    email: string;
    telephone: string;
    first_name: string;
    last_name: string;
    roles: string[];
  };
  photo: string;
  statut: 'disponible' | 'indisponible' | 'en_livraison';
  nombre_livraisons: number;
  date_embauche: string | null;
  date_creation: string;
}

interface Delivery {
  id: number;
  numero_commande: string;
  livraison_nom_complet: string;
  livraison_telephone: string;
  livraison_quartier: string;
  livraison_ville: string;
  methode_paiement?: string;
  statut_paiement: 'payé' | 'en attente' | 'échoué' | string;
  total_ttc: number;
  statut_livraison: 'en attente' | 'en cours' | 'livrée' | 'échouée' | string;
}

// --- Shared Primitives & Helpers ---

const cx = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

type StatusType = 'disponible' | 'indisponible' | 'en_livraison' | 'payé' | 'en attente' | 'échoué' | 'livrée' | 'échouée' | string;

function StatusChip({ status }: { status: StatusType }) {
  const normalized = status.toLowerCase().trim();

  let styles = 'text-foreground/60 bg-white/5 ring-white/10';
  let dotStyle = 'bg-foreground/40';

  if (['disponible', 'payé', 'livrée'].includes(normalized)) {
    styles = 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20';
    dotStyle = 'bg-emerald-400';
  } else if (['en_livraison', 'en cours', 'validé'].includes(normalized)) {
    styles = 'text-blue-400 bg-blue-500/10 ring-blue-500/20';
    dotStyle = 'bg-blue-400';
  } else if (['en attente', 'indisponible'].includes(normalized)) {
    styles = 'text-amber-400 bg-amber-500/10 ring-amber-500/20';
    dotStyle = 'bg-amber-400';
  } else if (['échoué', 'échouée', 'annulé'].includes(normalized)) {
    styles = 'text-red-400 bg-red-500/10 ring-red-500/20';
    dotStyle = 'bg-red-400';
  }

  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset capitalize', styles)}>
      <span className={cx('h-1.5 w-1.5 rounded-full', dotStyle)} />
      {status.replace('_', ' ')}
    </span>
  );
}

function IconButton({
  onClick,
  children,
  variant = 'gold',
  title,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'gold' | 'red' | 'blue' | 'neutral';
  title?: string;
  disabled?: boolean;
}) {
  const hoverColors = {
    gold: 'hover:text-gold hover:bg-gold/10',
    red: 'hover:text-red-400 hover:bg-red-500/10',
    blue: 'hover:text-blue-400 hover:bg-blue-500/10',
    neutral: 'hover:text-foreground hover:bg-white/10',
  };

  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cx(
        'rounded-md p-1.5 text-foreground/45 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground/45',
        hoverColors[variant]
      )}
    >
      {children}
    </button>
  );
}

// --- Main Page Component ---

export default function DeliveryPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [userIdVal, setUserIdVal] = useState('');

  const { addToast } = useToastStore();

  const fetchDriversAndDeliveries = useCallback(async () => {
    try {
      setLoading(true);

      try {
        const driversData = await adminService.getDeliveryDrivers();
        const processedDrivers: Driver[] = driversData.resultats || driversData.results || (Array.isArray(driversData) ? driversData : []);
        setDrivers(processedDrivers);
      } catch (drvError) {
        console.error("Error loading drivers:", drvError);
        addToast('Erreur lors du chargement de la flotte de livreurs', 'error');
      }

      try {
        const deliveriesData = await adminService.getDeliveries();
        const processedDeliveries: Delivery[] = deliveriesData.resultats || deliveriesData.results || (Array.isArray(deliveriesData) ? deliveriesData : []);
        setDeliveries(processedDeliveries);
      } catch (delError) {
        console.error("Error loading deliveries:", delError);
        addToast('Le serveur de livraison a rencontré une erreur', 'error');
      }
    } catch (error) {
      addToast('Erreur lors du chargement des données de livraison', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDriversAndDeliveries();
  }, [fetchDriversAndDeliveries]);

  const handlePromote = async () => {
    if (!userIdVal) return;
    try {
      await adminService.promoteToDriver(parseInt(userIdVal));
      addToast('Utilisateur promu au rang de livreur avec succès', 'success');
      setShowModal(false);
      setUserIdVal('');
      fetchDriversAndDeliveries();
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Erreur lors de la promotion', 'error');
    }
  };

  const handleToggleStatus = async (id: number, currentStatut: string) => {
    const nextStatut = currentStatut === 'disponible' ? 'indisponible' : 'disponible';
    try {
      await adminService.updateDeliveryDriver(id, { statut: nextStatut });
      addToast('Statut du livreur mis à jour', 'success');
      fetchDriversAndDeliveries();
    } catch (error: any) {
      addToast('Erreur lors du modification du statut', 'error');
    }
  };

  const handleDeleteDriver = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer ce livreur ?')) return;
    try {
      await adminService.deleteDeliveryDriver(id);
      addToast('Livreur supprimé de la flotte avec succès', 'success');
      fetchDriversAndDeliveries();
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Erreur lors de la suppression', 'error');
    }
  };

  const activeDriversCount = drivers.filter(d => d.statut === 'disponible' || d.statut === 'en_livraison').length;
  const inDeliveryCount = drivers.filter(d => d.statut === 'en_livraison').length;
  const completedDeliveriesCount = deliveries.filter(d => d.statut_livraison === 'livrée').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Livreurs & Flotte</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Gestion des livreurs et suivi opérationnel</p>
        </div>
        <div className="flex items-center gap-2">
          <IconButton
            onClick={fetchDriversAndDeliveries}
            variant="neutral"
            title="Rafraîchir"
          >
            <RefreshCw size={16} />
          </IconButton>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gold text-black px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-gold/90 transition-colors"
          >
            <Plus size={15} />
            Promouvoir un livreur
          </button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Flotte totale</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-1">{drivers.length}</p>
        </div>
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Livreurs actifs</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-1">{activeDriversCount}</p>
        </div>
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">En livraison</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-1">{inDeliveryCount}</p>
        </div>
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Livraisons terminées</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-1">{completedDeliveriesCount}</p>
        </div>
      </div>

      {/* Driver cards section */}
      <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02] p-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 mb-4">
          Livreurs de la Flotte
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-foreground/40 text-xs gap-2">
            <Loader2 className="animate-spin text-gold" size={16} />
            <span>Chargement des livreurs...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map(d => {
              const firstName = d.user_details?.first_name || '';
              const lastName = d.user_details?.last_name || '';
              const fullName = `${firstName} ${lastName}`.trim() || 'Livreur';
              const displayEmail = d.user_details?.email || '';
              const displayPhone = d.user_details?.telephone || '—';
              const displayStatus = d.statut || 'disponible';
              const displayDeliveriesCount = d.nombre_livraisons || 0;

              return (
                <div key={d.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between hover:border-white/20 transition-colors">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 rounded-full bg-gold/20 text-gold border border-gold/30 flex items-center justify-center font-semibold text-xs overflow-hidden shrink-0">
                          {d.photo ? (
                            <AppImage src={d.photo} alt={`${fullName}'s photo`} fill className="object-cover" />
                          ) : (
                            <span>
                              {(firstName.charAt(0) || '') + (lastName.charAt(0) || '')}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{fullName}</p>
                          {displayEmail && <p className="text-[11px] text-foreground/40 truncate">{displayEmail}</p>}
                          {d.user_details?.roles && d.user_details.roles.length > 0 && (
                            <p className="text-[10px] text-foreground/30 truncate mt-0.5">
                              Rôles: {d.user_details.roles.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <IconButton
                        onClick={() => handleDeleteDriver(d.id)}
                        variant="red"
                        title="Supprimer le livreur"
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </div>

                    <div className="mb-3">
                      <StatusChip status={displayStatus} />
                    </div>

                    <div className="space-y-1 text-xs text-foreground/60 border-t border-white/5 pt-3 mb-4">
                      <p><span className="text-foreground/40">Téléphone:</span> {displayPhone}</p>
                      <p><span className="text-foreground/40">Date Embauche:</span> {d.date_embauche ? new Date(d.date_embauche).toLocaleDateString() : '—'}</p>
                      <p><span className="text-foreground/40">Total Livraisons:</span> <span className="tabular-nums font-medium text-foreground/80">{displayDeliveriesCount}</span></p>
                      {d.date_creation && (
                        <p><span className="text-foreground/40">Créé le:</span> {new Date(d.date_creation).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(d.id, displayStatus)}
                    disabled={displayStatus === 'en_livraison'}
                    className={cx(
                      'w-full py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-40',
                      displayStatus === 'disponible'
                        ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                        : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                    )}
                  >
                    {displayStatus === 'disponible' ? 'Rendre indisponible' : 'Rendre disponible'}
                  </button>
                </div>
              );
            })}
            {drivers.length === 0 && (
              <div className="col-span-full py-12 text-center text-sm italic text-foreground/30">
                Aucun livreur dans la flotte actuellement.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deliveries Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
            Suivi Global des Livraisons
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Commande</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Client</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Quartier / Ville</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Paiement</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Montant</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Statut Livraison</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {deliveries.map(del => (
                <tr key={del.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-foreground/80">{del.numero_commande}</td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-foreground">{del.livraison_nom_complet}</p>
                    <p className="text-[11px] text-foreground/40 font-mono">{del.livraison_telephone}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-foreground/70">
                    {del.livraison_quartier}, {del.livraison_ville}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {del.methode_paiement && (
                        <span className="text-xs text-foreground/60 capitalize">{del.methode_paiement}</span>
                      )}
                      <StatusChip status={del.statut_paiement} />
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold tabular-nums text-foreground">
                    {del.total_ttc?.toLocaleString()} FCFA
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusChip status={del.statut_livraison} />
                  </td>
                </tr>
              ))}
              {deliveries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm italic text-foreground/30">
                    Aucune livraison en cours actuellement.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Untouched form & logic, restyled modal wrapper */}
      <SlideOver
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Promouvoir en tant que Livreur"
        description="Attribue le rôle opérationnel à l'utilisateur."
        size="md"
        footer={
          <div className="flex gap-3 w-full justify-end">
            <button
              onClick={() => setShowModal(false)}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-foreground/60 hover:bg-white/5 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handlePromote}
              className="rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-black hover:bg-gold/90 transition-colors"
            >
              Promouvoir
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">ID de l'utilisateur</label>
            <input
              type="number"
              placeholder="Ex: 42"
              value={userIdVal}
              onChange={e => setUserIdVal(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
            />
          </div>
        </div>
      </SlideOver>
    </div>
  );
}