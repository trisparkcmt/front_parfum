'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Users, Heart, FlaskConical, Loader2, Power, UserCheck } from 'lucide-react';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';

function isServeuse(user: { roles?: string[]; role?: string }) {
  const roles = user.roles || (user.role ? [user.role] : []);
  return roles.includes('serveuse');
}

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [promoting, setPromoting] = useState(false);
  const { addToast } = useToastStore();

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers({ search });
      const list = data.results || data.resultats || (Array.isArray(data) ? data : []);
      setClients(list);
    } catch (error) {
      console.error(error);
      addToast('Erreur lors du chargement des clients', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, addToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchClients]);

  const handleToggleStatus = async (userId: number) => {
    try {
      await adminService.toggleUserStatus(userId);
      addToast('Statut de l\'utilisateur mis Ã  jour', 'success');
      fetchClients();
      if (selected && selected.id === userId) {
        setSelected((prev: any) => ({ ...prev, is_active: !prev.is_active }));
      }
    } catch (error) {
      addToast('Erreur lors de la modification du statut', 'error');
    }
  };

  const handlePromoteToServeuse = async () => {
    if (!selected || isServeuse(selected)) return;
    const name = `${selected.first_name || ''} ${selected.last_name || ''}`.trim() || selected.email;
    if (!confirm(`Promouvoir ${name} au rang de serveuse ?`)) return;
    try {
      setPromoting(true);
      await adminService.promoteToServeuse(selected.id);
      addToast('Client promu serveuse avec succÃ¨s', 'success');
      fetchClients();
      setSelected(null);
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Erreur lors de la promotion', 'error');
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Gestion des comptes clients</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: clients.length, icon: <Users size={18} />, color: 'text-gold bg-gold/10' },
          { label: 'Actifs', value: clients.filter(c => c.is_active).length, icon: <Users size={18} />, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Favoris enregistrÃ©s', value: clients.reduce((s, c) => s + (c.favorites?.length || 0), 0), icon: <Heart size={18} />, color: 'text-red-400 bg-red-500/10' },
          { label: 'Compositions crÃ©Ã©es', value: clients.reduce((s, c) => s + (c.custom_perfumes?.length || 0), 0), icon: <FlaskConical size={18} />, color: 'text-purple-400 bg-purple-500/10' },
        ].map(k => (
          <div key={k.label} className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-2xl">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${k.color}`}>
              {k.icon}
            </div>
            <p className="text-2xl font-bold text-foreground">{k.value}</p>
            <p className="text-xs text-foreground/40 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-2xl">
        <div className="flex items-center gap-2 border border-white/10 rounded-lg px-3 py-2 max-w-sm">
          <Search size={15} className="text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client..."
            className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement des donnÃ©es...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  {['Client', 'Contact', 'TÃ©lÃ©phone', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-5 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clients.map(c => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black text-xs font-bold">
                          {(c.first_name || c.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{c.first_name || ''} {c.last_name || ''}</p>
                          <p className="text-[11px] text-foreground/40">ID: {c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-foreground">{c.email}</td>
                    <td className="px-5 py-4 text-xs text-foreground">{c.telephone || 'â€”'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full
                        ${c.is_active ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                        {c.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelected(c)} className="p-1.5 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors" title="DÃ©tails">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => handleToggleStatus(c.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-red-400 transition-colors" title={c.is_active ? "DÃ©sactiver" : "Activer"}>
                          <Power size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-foreground/40 italic">Aucun client trouvÃ©.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Client detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-white/10">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black text-xl font-bold">
                {(selected.first_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-foreground">{selected.first_name || ''} {selected.last_name || ''}</h3>
                <p className="text-xs text-foreground/40">{selected.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Favoris', value: selected.favorites?.length || 0 },
                { label: 'Compositions', value: selected.custom_perfumes?.length || 0 },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[11px] text-foreground/40">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-foreground/40 mb-4">TÃ©lÃ©phone: {selected.telephone || 'â€”'} Â· Statut: {selected.is_active ? 'Actif' : 'Inactif'}</p>
            {isServeuse(selected) ? (
              <p className="text-xs text-emerald-400 text-center mb-4 font-medium">DÃ©jÃ  serveuse</p>
            ) : (
              <button
                onClick={handlePromoteToServeuse}
                disabled={promoting}
                className="w-full mb-3 flex items-center justify-center gap-2 bg-gold text-black rounded-lg py-2.5 text-sm font-medium hover:bg-gold/80 transition-colors disabled:opacity-50"
              >
                {promoting ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                Convertir en serveuse
              </button>
            )}
            <button onClick={() => setSelected(null)} className="w-full border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}




