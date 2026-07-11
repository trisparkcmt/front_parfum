'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Trash2, Edit2, Search, Loader2, Tag, X,
  CheckCircle, Users2, Percent, RefreshCw, Eye, EyeOff,
} from 'lucide-react';
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
      if (editingCode) { await promoApi.update(editingCode.id, payload); addToast('Code promo mis a jour', 'success'); }
      else { await promoApi.create(payload); addToast('Code promo cree - emails & notifications envoyes aux clients selectionnes', 'success'); }
      setShowModal(false); fetchCodes();
    } catch (err: any) {
      addToast(err?.response?.data ? JSON.stringify(err.response.data) : 'Erreur lors de la sauvegarde', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (code: PromoCode) => {
    if (!confirm(`Supprimer le code "${code.code}" ?`)) return;
    try { await promoApi.delete(code.id); addToast('Code promo supprime', 'success'); fetchCodes(); }
    catch { addToast('Erreur lors de la suppression', 'error'); }
  };

  const toggleClient = (id: number) => setFormClients(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Tag size={22} className="text-gold" /> Codes Promo</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Creez des codes de reduction personnalises et envoyez-les par email aux clients selectionnes.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCodes} className="p-2.5 border border-white/10 rounded-xl text-foreground/40 hover:bg-white/5 hover:text-foreground transition-all">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gold/80 transition-all">
            <Plus size={16} /> Creer un code promo
          </button>
        </div>
      </div>

      <div className="bg-gold/5 border border-gold/20 rounded-2xl px-5 py-4 flex items-start gap-3">
        <CheckCircle size={18} className="text-gold mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gold">Envoi automatique</p>
          <p className="text-xs text-foreground/60 mt-0.5">A la creation, le backend envoie automatiquement un email et une notification push aux clients autorises selectionnes.</p>
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gold"><Loader2 size={32} className="animate-spin" /><p className="text-sm font-medium">Chargement des codes promo...</p></div>
        ) : codes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-foreground/30">
            <Tag size={48} className="opacity-20" /><p className="text-sm italic">Aucun code promo cree.</p>
            <button onClick={openCreate} className="px-4 py-2 bg-gold text-black rounded-xl text-sm font-semibold hover:bg-gold/80 transition-all">Creer le premier code</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>{['Code', 'Reduction', 'Clients autorises', 'Statut', 'Cree le', 'Actions'].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-foreground/40 uppercase tracking-wider px-5 py-3.5 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {codes.map(code => (
                  <tr key={code.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-4"><span className="font-mono text-sm font-bold text-gold tracking-widest bg-gold/10 px-3 py-1 rounded-lg border border-gold/20">{code.code}</span></td>
                    <td className="px-5 py-4"><span className="flex items-center gap-1 text-emerald-400 font-bold text-sm"><Percent size={13} />{Number(code.reduction_pourcentage).toFixed(0)}%</span></td>
                    <td className="px-5 py-4"><span className="flex items-center gap-1.5 text-sm text-foreground/70"><Users2 size={14} className="text-foreground/40" />{code.clients_autorises?.length > 0 ? `${code.clients_autorises.length} client(s)` : <span className="text-foreground/30 italic">Tous</span>}</span></td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${code.est_actif ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-foreground/40 bg-white/5 border-white/10'}`}>
                        {code.est_actif ? <Eye size={11} /> : <EyeOff size={11} />}{code.est_actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-foreground/40 whitespace-nowrap">{fmt(code.date_creation)}</td>
                    <td className="px-5 py-4"><div className="flex items-center gap-2">
                      <button onClick={() => openEdit(code)} className="p-1.5 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(code)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
    </div>
  );
}
