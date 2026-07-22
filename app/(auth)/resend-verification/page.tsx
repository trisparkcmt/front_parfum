'use client';

/**
 * @file app/(auth)/resend-verification/page.tsx
 * @description Public page to request a new email-verification link.
 *
 * Why this exists: previously the resend UI lived inside /verify-email and
 * was only reachable AFTER a successful registration. A user who closed the
 * tab, lost the email, or never received it had no way to ask for another
 * link. This route fixes that — anyone can land here from /login.
 */
import { useState } from 'react';
import Link from 'next/link';
import { Mail, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';

export default function ResendVerificationPage() {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const schema = z.object({
    email: z.string().email(t('invalid_email', { defaultValue: 'Veuillez saisir un e-mail valide' })),
  });
  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors }, setError, setFocus } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await authService.resendVerificationEmail(data.email);
      setIsSent(true);
      addToast(
        t('verification_email_resent', { defaultValue: 'Lien de validation envoyé avec succès.' }),
        'success',
      );
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.email?.[0] ||
        t('resend_email_error', { defaultValue: "Impossible de renvoyer l'e-mail de validation." });
      addToast(errorMsg, 'error');

      // Set field-specific error and focus
      setError('email', { type: 'manual', message: errorMsg });
      setFocus('email');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-gold/20 blur-xl" />
            <CheckCircle2 className="relative h-16 w-16 text-gold animate-bounce" />
          </div>
        </div>
        <h1 className="font-display text-3xl font-bold mb-4">
          {t('check_your_email', { defaultValue: 'Vérifiez vos e-mails' })}
        </h1>
        <p className="text-foreground/60 mb-8 leading-relaxed">
          Un nouveau lien de validation vient de partir. Pensez à consulter vos spams si vous ne le voyez pas dans les prochaines minutes.
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
        <span className="inline-block text-[10px] uppercase tracking-[0.3em] text-gold/80 mb-2">Validation</span>
        <h1 className="font-display text-3xl font-bold mb-2">
          {t('resend_verification_title', { defaultValue: 'Renvoyer le lien de validation' })}
        </h1>
        <p className="text-foreground/60 text-sm leading-relaxed">
          Vous n'avez pas reçu l'e-mail de confirmation&nbsp;? Indiquez votre adresse et nous vous enverrons un nouveau lien sécurisé.
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
        {errors.email && (
          <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
        )}
        <Button type="submit" className="w-full mt-6" isLoading={isLoading} rightIcon={<RefreshCw size={18} />}>
          {t('resend_email_btn', { defaultValue: "Renvoyer l'e-mail de validation" })}
        </Button>
      </form>

      <div className="mt-8 flex items-center justify-between text-sm text-foreground/60">
        <Link href="/login" className="text-gold font-medium hover:underline">
          {t('back_to_login', { defaultValue: 'Retour à la connexion' })}
        </Link>
        <Link href="/register" className="hover:text-gold transition-colors">
          {t('create_account_link', { defaultValue: 'Créer un compte' })}
        </Link>
      </div>
    </div>
  );
}