'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';

function ResetPasswordFormContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { addToast } = useToastStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const uid = searchParams.get('uid') || '';
  const token = searchParams.get('token') || '';

  useEffect(() => {
    if (!uid || !token) {
      addToast(t('invalid_reset_link', { defaultValue: 'Lien de réinitialisation invalide ou manquant.' }), 'error');
    }
  }, [uid, token]);

  const schema = z
    .object({
      password: z.string().min(8, t('password_min_length', { defaultValue: 'Le mot de passe doit contenir au moins 8 caractères.' })),
      passwordConfirm: z.string().min(1, t('password_confirm_required', { defaultValue: 'Veuillez confirmer le mot de passe.' })),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: t('passwords_must_match', { defaultValue: 'Les mots de passe ne correspondent pas.' }),
      path: ['passwordConfirm'],
    });
  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!uid || !token) {
      addToast(t('invalid_reset_link_submission', { defaultValue: 'Impossible de soumettre : paramètres manquants.' }), 'error');
      return;
    }
    setIsLoading(true);
    try {
      await authService.confirmPasswordReset({
        uid,
        token,
        new_password: data.password,
        new_password_confirm: data.passwordConfirm,
      });
      setIsSuccess(true);
      addToast(t('password_reset_success', { defaultValue: 'Votre mot de passe a été réinitialisé avec succès.' }), 'success');
    } catch (error: any) {
      addToast(
        error.response?.data?.detail ||
          error.response?.data?.non_field_errors?.[0] ||
          t('password_reset_confirm_error', { defaultValue: 'Échec de la réinitialisation du mot de passe.' }),
        'error',
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="h-16 w-16 text-gold animate-bounce" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-4">{t('password_changed', { defaultValue: 'Mot de passe modifié !' })}</h1>
        <p className="text-foreground/60 mb-8 leading-relaxed">
          Votre nouveau mot de passe a été enregistré. Vous pouvez dès maintenant vous connecter à votre compte Accessories Exclusifs.
        </p>
        <Link href="/login">
          <Button className="w-full">{t('login_btn', { defaultValue: 'Se connecter' })}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <span className="inline-block text-[10px] uppercase tracking-[0.3em] text-gold/80 mb-2">Nouveau mot de passe</span>
        <h1 className="font-display text-3xl font-bold mb-2">{t('new_password_title', { defaultValue: 'Nouveau mot de passe' })}</h1>
        <p className="text-foreground/60 text-sm leading-relaxed">
          Choisissez un mot de passe fort contenant au moins 8 caractères pour sécuriser votre compte.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input label={t('new_password_field', { defaultValue: 'Nouveau mot de passe' })} type="password" placeholder="••••••••" icon={<Lock size={18} />} error={errors.password?.message} {...register('password')} />
        <Input label={t('confirm_new_password_field', { defaultValue: 'Confirmer le mot de passe' })} type="password" placeholder="••••••••" icon={<Lock size={18} />} error={errors.passwordConfirm?.message} {...register('passwordConfirm')} />
        <Button type="submit" className="w-full mt-6" isLoading={isLoading} disabled={!uid || !token} rightIcon={<ArrowRight size={18} />}>
          {t('update_password_btn', { defaultValue: 'Mettre à jour le mot de passe' })}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <Suspense fallback={<div className="text-gold">{t('loading', { defaultValue: 'Chargement...' })}</div>}>
      <ResetPasswordFormContent />
    </Suspense>
  );
}
