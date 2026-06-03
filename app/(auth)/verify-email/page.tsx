'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const key = searchParams.get('key') || '';

  useEffect(() => {
    const performVerification = async () => {
      if (!key) {
        setStatus('resend');
        return;
      }

      try {
        await authService.verifyEmail(key);
        setStatus('success');
        addToast(t('email_verified_success', { defaultValue: 'Adresse e-mail validée avec succès !' }), 'success');
      } catch (error) {
        console.error(error);
        setStatus('error');
        addToast(t('email_verified_error', { defaultValue: "Échec de la validation de l'adresse e-mail." }), 'error');
      }
    };

    performVerification();
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
      setStatus('resend');
    } catch (error: any) {
      console.error(error);
      addToast(
        error.response?.data?.detail || 
        error.response?.data?.email?.[0] || 
        t('resend_email_error', { defaultValue: "Impossible de renvoyer l'e-mail de validation." }), 
        'error'
      );
    } finally {
      setIsResending(false);
    }
  };

  if (status === 'verifying') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex justify-center mb-6">
          <Loader2 className="h-16 w-16 text-gold animate-spin" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-4">
          {t('verifying_email', { defaultValue: 'Validation de votre adresse...' })}
        </h1>
        <p className="text-foreground/60 leading-relaxed">
          Veuillez patienter pendant que nous vérifions vos informations d'authentification.
        </p>
      </motion.div>
    );
  }

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="h-16 w-16 text-gold animate-bounce" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-4">
          {t('email_verified', { defaultValue: 'Compte activé !' })}
        </h1>
        <p className="text-foreground/60 mb-8 leading-relaxed">
          Votre adresse e-mail a été validée. Vous pouvez dès à présent vous connecter et profiter de tous nos services exclusifs.
        </p>
        <Link href="/login">
          <Button className="w-full">
            {t('login_btn', { defaultValue: 'Se connecter' })}
          </Button>
        </Link>
      </motion.div>
    );
  }

  if (status === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex justify-center mb-6">
          <XCircle className="h-16 w-16 text-red-500 animate-pulse" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-4">
          {t('verification_failed', { defaultValue: 'Validation impossible' })}
        </h1>
        <p className="text-foreground/60 mb-8 leading-relaxed">
          Le lien de validation de votre adresse e-mail semble être expiré ou invalide. Veuillez demander un nouveau lien de validation.
        </p>
        <Button className="w-full" onClick={() => setStatus('resend')}>
          {t('ask_new_link', { defaultValue: 'Demander un nouveau lien' })}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">
          {t('resend_verification_title', { defaultValue: 'Validation de compte' })}
        </h1>
        <p className="text-foreground/60 leading-relaxed">
          Entrez votre adresse e-mail pour recevoir un nouveau lien de validation de votre compte.
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
        />

        <Button
          type="submit"
          className="w-full mt-6"
          isLoading={isResending}
        >
          {t('resend_email_btn', { defaultValue: "Renvoyer l'e-mail de validation" })}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-foreground/60">
        <Link href="/login" className="text-gold font-medium hover:underline">
          {t('back_to_login', { defaultValue: 'Retour à la connexion' })}
        </Link>
      </div>
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Suspense fallback={<div className="text-gold">{t('loading', { defaultValue: 'Chargement...' })}</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
