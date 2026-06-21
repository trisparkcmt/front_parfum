'use client';

/**
 * @file app/(auth)/login/page.tsx
 * @description User Authentication / Login Page.
 *
 * This component provides the interface for existing users to sign in.
 * Key technical features include:
 * - **Form Management**: Utilizes `react-hook-form` for efficient state handling.
 * - **Validation**: Uses `zod` schema-based validation for the email and password fields.
 * - **State Integration**: Connects to the `useAuthStore` to execute the login process.
 * - **Feedback**: Triggers success or error toasts based on the authentication result.
 * - **Navigation**: Supports post-login redirection using the `redirect` query parameter.
 *
 * It features a premium, animated UI using `framer-motion`.
 */
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';

function LoginFormContent() {
  const { t, i18n } = useTranslation();
  
  const loginSchema = z.object({
    loginInput: z.string().min(1, t('email_required', { defaultValue: 'Identifiant requis' })),
    password: z.string().min(1, t('password_required')),
  }).refine((data) => {
    const input = data.loginInput.trim();
    if (input.includes('@')) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    }
    const cleaned = input.replace(/[\s\-\(\)\+]/g, '');
    return cleaned.length >= 8 && /^\d+$/.test(cleaned);
  }, {
    message: i18n.language === 'en'
      ? 'Please enter a valid email or phone number'
      : 'Veuillez saisir un e-mail ou un numéro de téléphone valide',
    path: ['loginInput'],
  });
  
  type LoginForm = z.infer<typeof loginSchema>;

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const { login, loginWithGoogle, isLoading } = useAuthStore();
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setFormError(null);
    try {
      const success = await login(data.loginInput, data.password);
      if (success) {
        router.push('/');
      }
    } catch (err: any) {
      setFormError(err.response?.data?.detail || t('login_error') || 'Identifiant ou mot de passe incorrect.');
    }
  };

  const handleGoogleLogin = async (googleAccessToken: string) => {
    setFormError(null);
    try {
      const success = await loginWithGoogle(googleAccessToken);
      if (success) {
        router.push('/');
      }
    } catch (err: any) {
      setFormError(err.message || err.response?.data?.detail || t('login_error') || 'Échec de la connexion Google');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">{t('welcome_back')}</h1>
        <p className="text-foreground/60">{t('login_desc')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {formError && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold text-center">
            {formError}
          </div>
        )}

        <Input
          label={t('email') + ' / ' + t('phone')}
          type="text"
          placeholder="vous@exemple.com / +2376XXXXXXXX"
          icon={<Mail size={18} />}
          error={errors.loginInput?.message}
          {...register('loginInput')}
        />

        <div className="space-y-1">
          <Input
            label={t('password_required').split(' ')[0]} // fallback to 'Password' or similar
            type="password"
            placeholder="••••••••"
            icon={<Lock size={18} />}
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-gold hover:underline">
              {t('forgot_password')}
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full mt-6" isLoading={isLoading} rightIcon={<LogIn size={18} />}>
          {t('login_btn')}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-foreground/10" />
        <span className="text-xs text-foreground/40 uppercase tracking-wider">ou</span>
        <div className="h-px flex-1 bg-foreground/10" />
      </div>

      <GoogleAuthButton
        onTokenReceived={handleGoogleLogin}
        disabled={isLoading}
        label="Continuer avec Google"
      />

      <div className="mt-8 text-center text-sm text-foreground/60">
        {t('no_account')}{' '}
        <Link href={`/register?redirect=${encodeURIComponent(redirectUrl)}`} className="text-gold font-medium hover:underline">
          {t('create_account_link')}
        </Link>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Suspense fallback={<div className="text-gold">{t('loading')}</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
