'use client';

import React, { useState } from 'react';
import { partnerService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { Loader2, UserPlus, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ApplyPrestatairePage() {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      addToast('Une photo (profil/pièce d\'identité) est obligatoire', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('photo', file);

      await partnerService.applyAsPartner(payload);
      addToast('Votre demande a été envoyée avec succès !', 'success');
      router.push('/dashboard/profile');
    } catch (err: any) {
      addToast(err.response?.data?.detail || 'Erreur lors de la candidature', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center border border-gold/20">
            <UserPlus className="text-gold" size={32} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-foreground mb-2">Devenir Prestataire</h1>
        <p className="text-center text-sm text-foreground/50 mb-8">
          Rejoignez la plateforme et gagnez des commissions sur vos ventes affiliées.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">Photo de profil ou Identité *</label>
            <div className="relative border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:bg-white/5 hover:border-gold/50 transition-colors cursor-pointer">
              <input
                type="file"
                required
                accept="image/*"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud className="mx-auto text-foreground/40 mb-2" size={24} />
              <p className="text-sm font-semibold text-foreground/70">
                {file ? file.name : 'Cliquez ou glissez votre photo'}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-black font-bold py-3.5 rounded-xl uppercase tracking-wider text-sm hover:bg-gold/90 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Soumettre ma demande'}
          </button>
        </form>
      </div>
    </div>
  );
}
