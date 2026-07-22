'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const schema = z.object({
    email: z.string().email(t('invalid_email', { defaultValue: 'Veuillez saisir un e-mail valide' })),
  });
  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors }, setError, focus } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await authService.requestPasswordReset(data.email);
      setIsSubmitted(true);
      addToast(t('password_reset_sent', { defaultValue: 'E-mail de réinitialisation envoyé avec succès.' }), 'success');
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.email?.[0] ||
        t('password_reset_error', { defaultValue: 'Une erreur est survenue. Veuillez réessayer.' });
      addToast(errorMsg, 'error');

      // Set field-specific error and focus
      setError('email', { type: 'manual', message: errorMsg });
      focus('email');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-gold/20 blur-xl" />
            <CheckCircle2 className="relative h-16 w-16 text-gold animate-bounce" />
          </div>
        </div>
        <h1 className="font-display text-3xl font-bold mb-4">{t('check_your_email', { defaultValue: 'Vérifiez vos e-mails' })}</h1>
        <p className="text-foreground/60 mb-8 leading-relaxed">
          Nous vous avons envoyé un lien sécurisé pour réinitialiser votre mot de passe. Veuillez consulter votre boîte de réception et vos spams.
        </p>
        <Link href="/login">
          <Button className="w-full">{t('back_to_login', { defaultValue: 'Retour à la connexion' })}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <span className="inline-block text-[10px] uppercase tracking-[0.3em] text-gold/80 mb-2">Récupération</span>
        <h1 className="font-display text-3xl font-bold mb-2">{t('forgot_password_title', { defaultValue: 'Mot de passe oublié' })}</h1>
        <p className="text-foreground/60 text-sm leading-relaxed">
          Entrez votre adresse e-mail ci-dessous et nous vous enverrons un lien pour choisir un nouveau mot de passe.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label={t('email', { defaultValue: 'Adresse e-mail' })}
          type="email"
          placeholder="vous@exemple.com"
          icon={<Mail size={18} />}
          error={errors.email?.message}
          data-field="email"
          {...register('email')}
        />
        <Button type="submit" className="w-full mt-6" isLoading={isLoading} rightIcon={<ArrowRight size={18} />}>
          {t('send_reset_link', { defaultValue: 'Envoyer le lien de réinitialisation' })}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-foreground/60">
        <Link href="/login" className="text-gold font-medium hover:underline">
          {t('back_to_login', { defaultValue: 'Retour à la connexion' })}
        </Link>
      </div>
    </div>
  );
}