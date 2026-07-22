'use client';

/**
 * Verify Email — handles ?key=... callbacks after registration.
 * If there's no key (user landed here directly), we now redirect-style
 * suggest the public /resend-verification page (which anyone can reach).
 */
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';

function VerifyEmailContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { addToast } = useToastStore();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'resend'>('verifying');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [isResending, setIsResending] = useState(false);

  const key = searchParams.get('key') || '';

  useEffect(() => {
    const run = async () => {
      if (!key) {
        setStatus('resend');
        return;
      }
      try {
        await authService.verifyEmail(key);
        setStatus('success');
        addToast(t('email_verified_success', { defaultValue: 'Adresse e-mail validée avec succès !' }), 'success');
      } catch {
        setStatus('error');
        addToast(t('email_verified_error', { defaultValue: "Échec de la validation de l'adresse e-mail." }), 'error');
      }
    };
    run();
  }, [key]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      addToast(t('email_required_field', { defaultValue: 'Veuillez saisir votre adresse e-mail.' }), 'error');
      return;
    }
    setIsResending(true);
    try {
      await authService.resendVerificationEmail(email);
      addToast(t('verification_email_resent', { defaultValue: 'Lien de validation envoyé avec succès.' }), 'success');
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.email?.[0] ||
        t('resend_email_error', { defaultValue: "Impossible de renvoyer l'e-mail de validation." });
      addToast(errorMsg, 'error');
      
      // Focus the email field on error
      setTimeout(() => {
        const emailInput = document.getElementById('field-email-verify');
        if (emailInput instanceof HTMLInputElement) {
          emailInput.focus();
        }
      }, 0);
    } finally {
      setIsResending(false);
    }
  };

  if (status === 'verifying') {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-6"><Loader2 className="h-16 w-16 text-gold animate-spin" /></div>
        <h1 className="font-display text-3xl font-bold mb-4">{t('verifying_email', { defaultValue: 'Validation de votre adresse...' })}</h1>
        <p className="text-foreground/60 leading-relaxed">Veuillez patienter pendant que nous vérifions vos informations.</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-6"><CheckCircle2 className="h-16 w-16 text-gold animate-bounce" /></div>
        <h1 className="font-display text-3xl font-bold mb-4">{t('email_verified', { defaultValue: 'Compte activé !' })}</h1>
        <p className="text-foreground/60 mb-8 leading-relaxed">
          Votre adresse e-mail a été validée. Vous pouvez dès à présent vous connecter.
        </p>
        <Link href="/login"><Button className="w-full">{t('login_btn', { defaultValue: 'Se connecter' })}</Button></Link>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-6"><XCircle className="h-16 w-16 text-red-500 animate-pulse" /></div>
        <h1 className="font-display text-3xl font-bold mb-4">{t('verification_failed', { defaultValue: 'Validation impossible' })}</h1>
        <p className="text-foreground/60 mb-8 leading-relaxed">
          Le lien semble expiré ou invalide. Demandez un nouveau lien de validation.
        </p>
        <Button className="w-full" onClick={() => setStatus('resend')}>
          {t('ask_new_link', { defaultValue: 'Demander un nouveau lien' })}
        </Button>
      </div>
    );
  }

  // resend
  return (
    <div>
      <div className="mb-7">
        <span className="inline-block text-[10px] uppercase tracking-[0.3em] text-gold/80 mb-2">Validation</span>
        <h1 className="font-display text-3xl font-bold mb-2">{t('resend_verification_title', { defaultValue: 'Validation de compte' })}</h1>
        <p className="text-foreground/60 text-sm leading-relaxed">
          Entrez votre adresse e-mail pour recevoir un nouveau lien de validation.
        </p>
      </div>

      <form onSubmit={handleResend} className="space-y-5">
        <Input
          label={t('email', { defaultValue: 'Adresse e-mail' })}
          type="email"
          placeholder="vous@exemple.com"
          icon={<Mail size={18} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          id="field-email-verify"
        />
        {/* Error will be handled by toast and focus - keeping it simple for this page */}
        <Button type="submit" className="w-full mt-6" isLoading={isResending}>
          {t('resend_email_btn', { defaultValue: "Renvoyer l'e-mail de validation" })}
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

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <Suspense fallback={<div className="text-gold">{t('loading', { defaultValue: 'Chargement...' })}</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}