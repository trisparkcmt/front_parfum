'use client';

import React, { useState } from 'react';
import { boutiqueService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { Loader2, Store, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ApplyBoutiquePage() {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    ville: '',
    telephone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !formData.nom) {
      addToast('Le nom et la photo (logo/vitrine) sont obligatoires', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('nom', formData.nom);
      payload.append('photo', file);
      if (formData.adresse) payload.append('adresse', formData.adresse);
      if (formData.ville) payload.append('ville', formData.ville);
      if (formData.telephone) payload.append('telephone', formData.telephone);

      await boutiqueService.apply(payload);
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
      <div className="max-w-md w-full bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl animate-in fade-in zoom-in-95 duration-300 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center border border-gold/20">
            <Store className="text-gold" size={32} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-foreground mb-2">Ouvrir votre Boutique</h1>
        <p className="text-center text-sm text-foreground/50 mb-8">
          Rejoignez la plateforme et vendez vos parfums et accessoires.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">Nom de la boutique *</label>
            <input
              type="text"
              required
              value={formData.nom}
              onChange={e => setFormData({...formData, nom: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none transition-colors"
              placeholder="Ex: Élégance Parfums"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">Logo ou Vitrine *</label>
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
                {file ? file.name : 'Cliquez ou glissez une image'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">Ville</label>
              <input
                type="text"
                value={formData.ville}
                onChange={e => setFormData({...formData, ville: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none"
                placeholder="Ex: Abidjan"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">Téléphone</label>
              <input
                type="text"
                value={formData.telephone}
                onChange={e => setFormData({...formData, telephone: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none"
                placeholder="+225..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">Adresse</label>
            <input
              type="text"
              value={formData.adresse}
              onChange={e => setFormData({...formData, adresse: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none"
              placeholder="Ex: Marcory Zone 4"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-black font-bold py-3.5 rounded-xl uppercase tracking-wider text-sm hover:bg-gold/90 transition-colors mt-4 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Soumettre la demande'}
          </button>
        </form>
      </div>
    </div>
  );
}
