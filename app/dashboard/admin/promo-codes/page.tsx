'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Trash2, Edit2, Search, Loader2, Tag, X,
  CheckCircle, Users2, Percent, RefreshCw, Eye, EyeOff,
} from 'lucide-react';
import { InlineCell } from '@/components/admin/InlineCell';
import { adminService, api } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { SlideOver } from '@/components/ui/SlideOver';

// API helpers
const promoApi = {
  list: async () => { const r = await api.get('orders/admin/codes-promo/'); return r.data; },
  create: async (data: any) => { const r = await api.post('orders/admin/codes-promo/', data); return r.data; },
  update: async (id: number, data: any) => { const r = await api.patch(`orders/admin/codes-promo/${id}/`, data); return r.data; },
  delete: async (id: number) => { await api.delete(`orders/admin/codes-promo/${id}/`); },
};

interface PromoCode { id: number; code: string; reduction_pourcentage: string; est_actif: boolean; clients_autorises: number[]; date_creation: string; }
interface Client { id: number; first_name: string; last_name: string; email: string; telephone?: string; }

// --- Shared UI Primitives ---

function StatusChip({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${
        active
          ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
          : 'bg-white/5 text-foreground/40 ring-white/10'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? 'bg-emerald-400' : 'bg-foreground/40'
        }`}
      />
      {active ? 'Actif' : 'Inactif'}
    </span>
  );
}

function IconButton({
  onClick,
  icon: Icon,
  variant = 'gold',
  title,
}: {
  onClick: () => void;
  icon: any;
  variant?: 'gold' | 'red' | 'blue';
  title?: string;
}) {
  const hoverStyles = {
    gold: 'hover:text-gold hover:bg-gold/10',
    red: 'hover:text-red-400 hover:bg-red-500/10',
    blue: 'hover:text-blue-400 hover:bg-blue-500/10',
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-md p-1.5 text-foreground/45 transition-colors ${hoverStyles[variant]}`}
    >
      <Icon size={14} />
    </button>
  );
}

export default function PromoCodesPage() {
  const { addToast } = useToastStore();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [clientsLoading, setClientsLoading] = useState(false);
  const clientDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [saving, setSaving] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formReduction, setFormReduction] = useState('10.00');
  const [formActif, setFormActif] = useState(true);
  const [formClients, setFormClients] = useState<number[]>([]);
  const [selectedPromoForDetails, setSelectedPromoForDetails] = useState<PromoCode | null>(null);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await promoApi.list();
      setCodes(data.results ?? data.resultats ?? (Array.isArray(data) ? data : []));
    } catch { addToast('Erreur lors du chargement des codes promo', 'error'); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const fetchClients = useCallback(async (search: string) => {
    setClientsLoading(true);
    try {
      const data = await adminService.getUsers({ search });
      setClients(data.results ?? data.resultats ?? (Array.isArray(data) ? data : []));
    } catch { setClients([]); }
    finally { setClientsLoading(false); }
  }, []);

  useEffect(() => {
    if (clientDebounce.current) clearTimeout(clientDebounce.current);
    clientDebounce.current = setTimeout(() => fetchClients(clientSearch), 300);
    return () => { if (clientDebounce.current) clearTimeout(clientDebounce.current); };
  }, [clientSearch, fetchClients]);

  const openCreate = () => { setEditingCode(null); setFormCode(''); setFormReduction('10.00'); setFormActif(true); setFormClients([]); setShowModal(true); setClientSearch(''); setShowClientPicker(false); };
  const openEdit = (code: PromoCode) => { setEditingCode(code); setFormCode(code.code); setFormReduction(code.reduction_pourcentage); setFormActif(code.est_actif); setFormClients(code.clients_autorises ?? []); setShowModal(true); setClientSearch(''); setShowClientPicker(false); };

  const handleSave = async () => {
    if (!formCode.trim()) { addToast('Le code est requis', 'error'); return; }
    const pct = parseFloat(formReduction);
    if (isNaN(pct) || pct < 0 || pct > 100) { addToast('La reduction doit etre entre 0 et 100%', 'error'); return; }
    setSaving(true);
    try {
      const payload = { code: formCode.trim().toUpperCase(), reduction_pourcentage: pct.toFixed(2), est_actif: formActif, clients_autorises: formClients };
      if (editingCode) {
        setCodes(prev => prev.map(c => c.id === editingCode.id ? { ...c, ...payload } : c));
        setShowModal(false);
        await promoApi.update(editingCode.id, payload);
        addToast('Code promo mis a jour', 'success');
        fetchCodes();
      } else {
        setShowModal(false);
        const created = await promoApi.create(payload);
        if (created?.id) {
          setCodes(prev => [created, ...prev]);
        } else {
          fetchCodes();
        }
        addToast('Code promo cree - emails & notifications envoyes aux clients selectionnes', 'success');
      }
    } catch (err: any) {
      addToast(err?.response?.data ? JSON.stringify(err.response.data) : 'Erreur lors de la sauvegarde', 'error');
    } finally { setSaving(false); }
  };

  const patchPromoCode = async (id: number, field: string, value: string) => {
    setCodes(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    try {
      await promoApi.update(id, { [field]: field === 'code' ? value.toUpperCase() : value });
    } catch {
      addToast('Erreur lors de la mise à jour', 'error');
      fetchCodes();
    }
  };

  const handleDelete = async (code: PromoCode) => {
    if (!confirm(`Supprimer le code "${code.code}" ?`)) return;
    const snapshot = codes.find(c => c.id === code.id);
    setCodes(prev => prev.filter(c => c.id !== code.id));
    try {
      await promoApi.delete(code.id);
      addToast('Code promo supprime', 'success');
    } catch {
      if (snapshot) setCodes(prev => [snapshot, ...prev]);
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  const toggleClient = (id: number) => setFormClients(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Codes Promo</h1>
          <p className="text-sm text-foreground/40 mt-0.5">
            Creez des codes de reduction personnalises et envoyez-les par email aux clients selectionnes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCodes}
            className="flex items-center gap-2 border border-white/10 px-3 py-2 rounded-lg text-xs font-medium text-foreground/60 hover:bg-white/[0.06] transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-gold text-black px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-gold/90 transition-colors"
          >
            <Plus size={15} /> Creer un code promo
          </button>
        </div>
      </div>

      {/* Info Notice Panel */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle size={16} className="text-gold mt-0.5 shrink-0" />
        <div className="text-xs">
          <p className="font-semibold text-gold">Envoi automatique</p>
          <p className="text-foreground/60 mt-0.5">
            A la creation, le backend envoie automatiquement un email et une notification push aux clients autorises selectionnes.
          </p>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-xs text-foreground/40">
            <Loader2 size={16} className="animate-spin text-gold" />
            <span>Chargement des codes promo...</span>
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-12 text-sm italic text-foreground/30">
            Aucun code promo cree.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-white/[0.02] border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Reduction</th>
                  <th className="px-4 py-3">Clients autorises</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Cree le</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {codes.map(code => (
                  <tr
                    key={code.id}
                    onClick={() => setSelectedPromoForDetails(code)}
                    className="hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <InlineCell
                        value={code.code}
                        onSave={v => patchPromoCode(code.id, 'code', v)}
                        display={
                          <span className="font-mono font-bold text-gold tracking-wider bg-gold/10 px-2 py-0.5 rounded border border-gold/20 text-xs">
                            {code.code}
                          </span>
                        }
                        className="font-mono font-bold text-gold"
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-400 tabular-nums">
                      <InlineCell
                        value={String(Number(code.reduction_pourcentage).toFixed(0))}
                        onSave={v => patchPromoCode(code.id, 'reduction_pourcentage', v)}
                        inputType="number"
                        display={<>{Number(code.reduction_pourcentage).toFixed(0)}%</>}
                        className="font-semibold text-emerald-400 tabular-nums"
                      />
                    </td>
                    <td className="px-4 py-3 text-foreground/70">
                      <span className="inline-flex items-center gap-1.5">
                        <Users2 size={13} className="text-foreground/40" />
                        {code.clients_autorises?.length > 0 ? (
                          `${code.clients_autorises.length} client(s)`
                        ) : (
                          <span className="text-foreground/30 italic">Tous</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip active={code.est_actif} />
                    </td>
                    <td className="px-4 py-3 text-foreground/40 whitespace-nowrap">
                      {fmt(code.date_creation)}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        <IconButton
                          onClick={() => openEdit(code)}
                          icon={Edit2}
                          variant="gold"
                          title="Modifier"
                        />
                        <IconButton
                          onClick={() => handleDelete(code)}
                          icon={Trash2}
                          variant="red"
                          title="Supprimer"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Untouched Form Modal */}
      <SlideOver
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCode ? 'Modifier le code promo' : 'Creer un code promo'}
        description={!editingCode ? 'Un email sera envoye aux clients selectionnes apres creation.' : undefined}
        size="xl"
        footer={
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-gold text-black rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 hover:bg-gold/80 transition-all disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {editingCode ? 'Enregistrer les modifications' : 'Creer et envoyer'}
            </button>
            <button onClick={() => setShowModal(false)} className="px-5 border border-white/10 rounded-xl py-3 text-sm text-foreground/60 hover:bg-white/5 transition-all">Annuler</button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-2 block">Code promo *</label>
            <input value={formCode} onChange={e => setFormCode(e.target.value.toUpperCase())} placeholder="Ex: VIP2026" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono font-bold text-gold tracking-widest outline-none focus:border-gold transition-all placeholder:text-foreground/20" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-2 block">Reduction (%) *</label>
            <div className="relative">
              <input type="number" min="0" max="100" step="0.5" value={formReduction} onChange={e => setFormReduction(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-gold transition-all pr-10" />
              <Percent size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/30" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div onClick={() => setFormActif(v => !v)} className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${formActif ? 'bg-gold' : 'bg-white/10'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${formActif ? 'left-5' : 'left-0.5'}`} />
            </div>
            <div><p className="text-sm font-medium text-foreground">{formActif ? 'Actif' : 'Inactif'}</p><p className="text-[10px] text-foreground/40">Le code peut etre utilise au checkout</p></div>
          </label>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Clients autorises</label>
              <span className="text-[10px] text-foreground/40">{formClients.length === 0 ? 'Tous les clients' : `${formClients.length} selectionne(s)`}</span>
            </div>
            {formClients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {formClients.map(id => {
                  const c = clients.find(cl => cl.id === id);
                  const label = c ? `${c.first_name} ${c.last_name}`.trim() || c.email : `#${id}`;
                  return (<span key={id} className="inline-flex items-center gap-1 text-[11px] bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 rounded-full">{label}<button onClick={() => toggleClient(id)} className="hover:text-red-400 transition-colors"><X size={10} /></button></span>);
                })}
              </div>
            )}
            <button type="button" onClick={() => setShowClientPicker(v => !v)} className="flex items-center gap-2 w-full px-4 py-2.5 border border-white/10 rounded-xl text-sm text-foreground/60 hover:bg-white/5 hover:border-white/20 transition-all">
              <Users2 size={14} />{showClientPicker ? 'Fermer la selection' : 'Selectionner des clients...'}
            </button>
            {showClientPicker && (
              <div className="mt-2 border border-white/10 rounded-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2">
                  <Search size={14} className="text-foreground/40" />
                  <input autoFocus value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Rechercher par nom ou email..." className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-foreground/30" />
                  {clientsLoading && <Loader2 size={14} className="animate-spin text-gold" />}
                </div>
                <div className="max-h-44 overflow-y-auto">
                  {clients.length === 0 ? (
                    <p className="text-center text-xs text-foreground/30 italic py-4">{clientSearch ? 'Aucun client trouve.' : 'Tapez pour rechercher un client.'}</p>
                  ) : clients.map(c => {
                    const name = `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email;
                    const selected = formClients.includes(c.id);
                    return (
                      <button key={c.id} onClick={() => toggleClient(c.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${selected ? 'bg-gold/10' : 'hover:bg-white/5'}`}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'bg-gold border-gold' : 'border-white/20'}`}>
                          {selected && <CheckCircle size={10} className="text-black" />}
                        </div>
                        <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{name}</p><p className="text-[10px] text-foreground/40 truncate">{c.email}</p></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </SlideOver>
      
      {/* Promo Code Details & User Access SlideOver */}
      <SlideOver
        isOpen={selectedPromoForDetails !== null}
        onClose={() => setSelectedPromoForDetails(null)}
        title={`Détails du Code Promo : ${selectedPromoForDetails?.code}`}
        description="Consultez les informations détaillées et la liste des clients ayant accès à ce code promo."
        size="lg"
        footer={
          <div className="flex justify-end w-full">
            <button
              onClick={() => setSelectedPromoForDetails(null)}
              className="px-5 border border-white/10 rounded-xl py-2.5 text-xs font-semibold text-foreground/60 hover:bg-white/5 transition-all"
            >
              Fermer
            </button>
          </div>
        }
      >
        {selectedPromoForDetails && (
          <div className="space-y-6">
            {/* Promo Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1.5">Réduction</p>
                <p className="text-xl font-bold text-emerald-400 tabular-nums">
                  {Number(selectedPromoForDetails.reduction_pourcentage).toFixed(0)}%
                </p>
              </div>
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1.5">Statut</p>
                <div className="mt-0.5">
                  <StatusChip active={selectedPromoForDetails.est_actif} />
                </div>
              </div>
            </div>

            {/* Access Summary & Client List */}
            <div className="border border-white/10 rounded-xl bg-white/[0.02] p-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/75 flex items-center gap-2 border-b border-white/5 pb-3">
                <Users2 size={15} className="text-gold" />
                Clients avec accès
              </h3>
              
              {(!selectedPromoForDetails.clients_autorises || selectedPromoForDetails.clients_autorises.length === 0) ? (
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold bg-gold/10 text-gold border border-gold/20">
                    Tous les clients
                  </span>
                  <p className="text-xs text-foreground/50 leading-relaxed">
                    Ce code promo est public. N'importe quel client enregistré sur la plateforme peut l'utiliser lors du passage de sa commande.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-foreground/50">
                    Ce code promo est privé. Seuls les {selectedPromoForDetails.clients_autorises.length} client(s) sélectionné(s) ci-dessous peuvent l'utiliser :
                  </p>
                  
                  {/* List of Authorized Users */}
                  <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden bg-black/20 max-h-[350px] overflow-y-auto">
                    {selectedPromoForDetails.clients_autorises.map(id => {
                      const client = clients.find(c => c.id === id);
                      if (!client) {
                        return (
                          <div key={id} className="p-3 flex items-center justify-between text-xs text-foreground/30 italic">
                            <span>Client ID #{id}</span>
                            <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-foreground/40 font-mono">Non chargé dans la session</span>
                          </div>
                        );
                      }
                      const name = `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email;
                      return (
                        <div key={id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/[0.01] transition-colors">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{name}</p>
                            <p className="text-[10px] text-foreground/45 truncate">{client.email}</p>
                          </div>
                          {client.telephone && (
                            <span className="self-start sm:self-center text-[10px] font-mono text-foreground/40 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                              {client.telephone}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}