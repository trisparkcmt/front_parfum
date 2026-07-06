'use client';

/**
 * @file app/(auth)/login/page.tsx
 * Refactored: outer motion + card chrome now live in the shared (auth)/layout.tsx.
 * Adds a "Didn't receive the verification email?" link → /resend-verification.
 */
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, LogIn, MailQuestion } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from 'react-i18next';

function LoginFormContent() {
  const { t, i18n } = useTranslation();

  const loginSchema = z
    .object({
      loginInput: z.string().min(1, t('email_required', { defaultValue: 'Identifiant requis' })),
      password: z.string().min(1, t('password_required')),
      rememberMe: z.boolean().optional(),
    })
    .refine(
      (data) => {
        const input = data.loginInput.trim();
        if (input.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
        const cleaned = input.replace(/[\s\-\(\)\+]/g, '');
        return cleaned.length >= 8 && /^\d+$/.test(cleaned);
      },
      {
        message:
          i18n.language === 'en'
            ? 'Please enter a valid email or phone number'
            : 'Veuillez saisir un e-mail ou un numéro de téléphone valide',
        path: ['loginInput'],
      },
    );

  type LoginForm = z.infer<typeof loginSchema>;

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const { login, loginWithGoogle, isLoading } = useAuthStore();
  const [formError, setFormError] = useState<string | null>(null);

  // Read persisted remember state values
  const getRememberedLogin = () => {
    if (typeof window === 'undefined') return { loginInput: '', rememberMe: false };
    const savedInput = localStorage.getItem('remembered_login');
    return {
      loginInput: savedInput || '',
      rememberMe: !!savedInput,
    };
  };

  const remembered = getRememberedLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginInput: remembered.loginInput,
      rememberMe: remembered.rememberMe,
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setFormError(null);
    try {
      const success = await login(data.loginInput, data.password);
      if (success) {
        if (data.rememberMe) {
          localStorage.setItem('remembered_login', data.loginInput);
        } else {
          localStorage.removeItem('remembered_login');
        }
        router.push(redirectUrl);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.detail || t('login_error') || 'Identifiant ou mot de passe incorrect.');
    }
  };

  const handleGoogleLogin = async (googleAccessToken: string) => {
    setFormError(null);
    try {
      const success = await loginWithGoogle(googleAccessToken);
      if (success) router.push(redirectUrl);
    } catch (err: any) {
      setFormError(err.message || err.response?.data?.detail || t('login_error') || 'Échec de la connexion Google');
    }
  };

  return (
    <div>
      <div className="mb-7">
        <span className="inline-block text-[10px] uppercase tracking-[0.3em] text-gold/80 mb-2">Connexion</span>
        <h1 className="font-display text-3xl font-bold mb-2">{t('welcome_back')}</h1>
        <p className="text-foreground/60 text-sm">{t('login_desc')}</p>
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
            label={t('password', { defaultValue: 'Mot de passe' })}
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

        {/* Remember Me Checkbox */}
        <div className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold size-4 cursor-pointer"
            />
            <span className="text-xs text-foreground/75">
              {i18n.language === 'en' ? 'Remember Me' : 'Se souvenir de moi'}
            </span>
          </label>
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

      {/* Flow fix: resend verification reachable from login */}
      <div className="mt-5">
        <Link
          href="/resend-verification"
          className="group flex items-center justify-center gap-2 w-full rounded-xl border border-gold/15 bg-charcoal/30 px-4 py-2.5 text-xs text-foreground/70 hover:text-gold hover:border-gold/40 transition-colors"
        >
          <MailQuestion size={14} className="text-gold/80" />
          Vous n'avez pas reçu l'e-mail de validation&nbsp;?
          <span className="text-gold font-medium group-hover:underline">Renvoyer</span>
        </Link>
      </div>

      <div className="mt-7 text-center text-sm text-foreground/60">
        {t('no_account')}{' '}
        <Link
          href={`/register?redirect=${encodeURIComponent(redirectUrl)}`}
          className="text-gold font-medium hover:underline"
        >
          {t('create_account_link')}
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <Suspense fallback={<div className="text-gold">{t('loading')}</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
