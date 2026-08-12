'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, RefreshCw, Trash2, Power } from 'lucide-react';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { SlideOver } from '@/components/ui/SlideOver';

// Helper utilities
function cx(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Shared StatusChip Component
function StatusChip({ status }: { status: string | boolean }) {
  const isActif = typeof status === 'boolean' ? status : (status || '').toLowerCase() === 'actif' || (status || '').toLowerCase() === 'active';
  
  const style = isActif 
    ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' 
    : 'bg-red-500/10 text-red-400 ring-red-500/20';
  const dotStyle = isActif ? 'bg-emerald-400' : 'bg-red-400';
  const label = isActif ? 'active' : 'inactive';

  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset", style)}>
      <span className={cx("h-1.5 w-1.5 rounded-full", dotStyle)} />
      <span className="capitalize">{label}</span>
    </span>
  );
}

// Shared IconButton Primitive
function IconButton({
  onClick,
  icon: Icon,
  variant = 'gold',
  title,
  disabled
}: {
  onClick: () => void;
  icon: any;
  variant?: 'gold' | 'red' | 'blue';
  title?: string;
  disabled?: boolean;
}) {
  const hoverStyles = {
    gold: 'hover:text-gold hover:bg-gold/10',
    red: 'hover:text-red-400 hover:bg-red-500/10',
    blue: 'hover:text-blue-400 hover:bg-blue-500/10',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cx(
        "rounded-md p-1.5 text-foreground/45 transition-colors disabled:opacity-40",
        hoverStyles[variant]
      )}
    >
      <Icon size={14} />
    </button>
  );
}

export default function ServeusesPage() {
  const [serveuses, setServeuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [userIdVal, setUserIdVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<{ id: number; name: string }[]>([]);
  const { addToast } = useToastStore();

  const fetchServeuses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getServeuses();
      const list = data.resultats || data.results || (Array.isArray(data) ? data : []);
      setServeuses(list);
    } catch (error) {
      addToast('Erreur lors du chargement des serveuses', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchServeuses();
  }, [fetchServeuses]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setUserSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await adminService.getUsers({ search: searchQuery });
        const list: any[] = data.resultats || data.results || (Array.isArray(data) ? data : []);
        setUserSuggestions(
          list.map((u: any) => ({
            id: u.id,
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || `User #${u.id}`,
          }))
        );
      } catch {
        setUserSuggestions([]);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePromote = async () => {
    if (!userIdVal) return;
    try {
      await adminService.promoteToServeuse(parseInt(userIdVal));
      addToast('Utilisateur promu au rang de serveuse avec succès', 'success');
      setShowModal(false);
      setUserIdVal('');
      fetchServeuses();
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Erreur lors de la promotion', 'error');
    }
  };

  const handleToggleStatus = async (id: number, currentActif: boolean) => {
    // Optimistic flip
    setServeuses(prev => prev.map(s => s.id === id ? { ...s, actif: !currentActif } : s));
    try {
      await adminService.updateServeuse(id, { actif: !currentActif });
      addToast('Statut de la serveuse mis à jour', 'success');
    } catch (error: any) {
      // Rollback
      setServeuses(prev => prev.map(s => s.id === id ? { ...s, actif: currentActif } : s));
      addToast('Erreur lors de la modification du statut', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette serveuse ?')) return;
    const snapshot = serveuses.find(s => s.id === id);
    setServeuses(prev => prev.filter(s => s.id !== id));
    try {
      await adminService.deleteServeuse(id);
      addToast('Serveuse supprimée avec succès', 'success');
    } catch (error: any) {
      if (snapshot) setServeuses(prev => [snapshot, ...prev]);
      addToast(error.response?.data?.detail || 'Erreur lors de la suppression', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Read-Only */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Gestion des Serveuses</h1>
          <p className="text-sm text-foreground/40 mt-0.5">
            Promouvoir, désactiver et gérer les serveuses de la boutique
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchServeuses}
            className="flex items-center gap-2 border border-white/10 px-3 py-2 rounded-lg text-xs font-medium text-foreground/60 hover:bg-white/6 transition-colors"
            title="Actualiser"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Actualiser</span>
          </button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gold text-black px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-gold/90 transition-colors"
          >
            <Plus size={14} />
            <span>Promouvoir une serveuse</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Strip */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="grid grid-cols-3 divide-x divide-white/10">
          <div className="px-3 first:pl-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Total Serveuses</p>
            <p className="text-xl font-semibold tabular-nums text-foreground mt-1">{serveuses.length}</p>
          </div>
          <div className="px-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Actives</p>
            <p className="text-xl font-semibold tabular-nums text-emerald-400 mt-1">
              {serveuses.filter(s => (s.actif !== undefined ? s.actif : true)).length}
            </p>
          </div>
          <div className="px-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Inactives</p>
            <p className="text-xl font-semibold tabular-nums text-red-400 mt-1">
              {serveuses.filter(s => !(s.actif !== undefined ? s.actif : true)).length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Container / Grid */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-xs text-foreground/40">
            <Loader2 size={16} className="animate-spin text-gold" />
            <span>Chargement des serveuses...</span>
          </div>
        ) : serveuses.length === 0 ? (
          <div className="text-center py-12 text-sm italic text-foreground/30">
            Aucune serveuse dans l'équipe actuellement.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {serveuses.map(s => {
              const details = s.user_details || s;
              const name = `${details.first_name || ''} ${details.last_name || ''}`.trim() || 'Serveuse';
              const email = details.email || '';
              const phone = details.telephone || '—';
              const isActive = s.actif !== undefined ? s.actif : true;

              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold text-xs font-semibold">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-xs">{name}</p>
                          <p className="text-[11px] font-mono text-foreground/40">{email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StatusChip status={isActive} />
                        <IconButton
                          onClick={() => handleDelete(s.id)}
                          icon={Trash2}
                          variant="red"
                          title="Supprimer la serveuse"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs border-t border-white/5 pt-3 mb-4 text-foreground/60">
                      <p className="flex justify-between items-center">
                        <span className="text-foreground/40">Téléphone:</span>
                        <span className="font-mono">{phone}</span>
                      </p>
                      <p className="flex justify-between items-center">
                        <span className="text-foreground/40">Date Ajout:</span>
                        <span>{s.cree_le ? new Date(s.cree_le).toLocaleDateString('fr-FR') : '—'}</span>
                      </p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(s.id, isActive)}
                    className={cx(
                      "w-full py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5",
                      isActive 
                        ? "border-red-500/20 text-red-400 hover:bg-red-500/10" 
                        : "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                    )}
                  >
                    <Power size={12} />
                    <span>{isActive ? 'Désactiver' : 'Activer'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SlideOver Form Modal - Fields & Logic untouched */}
      <SlideOver
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Promouvoir en tant que Serveuse"
        description="Attribue le rôle opérationnel à l'utilisateur."
        size="md"
        footer={
          <div className="flex gap-3 mt-5">
            <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">Annuler</button>
            <button onClick={handlePromote} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-medium hover:bg-gold/80 transition-colors">Promouvoir</button>
          </div>
        }
      >
        <div className="p-6 lg:p-8">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Rechercher un utilisateur par nom</label>
              <input
                type="text"
                placeholder="Ex: Jean"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
              />
            </div>
            {userSuggestions.length > 0 && (
              <div className="space-y-1 p-3 bg-white/5 border border-white/10 rounded-lg max-h-60 overflow-y-auto">
                {userSuggestions.map((user: { id: number; name: string }) => (
                  <div
                    key={user.id}
                    onClick={() => { setUserIdVal(String(user.id)); setSearchQuery(user.name); setUserSuggestions([]); }}
                    className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                      userIdVal === String(user.id)
                        ? 'bg-gold/20 text-gold font-semibold'
                        : 'text-foreground/70 hover:bg-white/5 hover:text-foreground'
                    }`}
                  >
                    {user.name}
                  </div>
                ))}
              </div>
            )}
            {userIdVal && (
              <p className="text-xs text-emerald-400 font-medium">✓ Utilisateur sélectionné : ID #{userIdVal}</p>
            )}
          </div>
        </div>
      </SlideOver>
    </div>
  );
}