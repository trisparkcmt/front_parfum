'use client';

/**
 * @file app/(auth)/register/page.tsx
 * Refactored — visual chrome lives in shared (auth)/layout.tsx.
 */
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Mail, Lock, Phone, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';

function RegisterFormContent() {
  const { t } = useTranslation();

  const registerSchema = z
    .object({
      firstName: z.string().min(2, t('first_name_short')),
      lastName: z.string().min(2, t('last_name_short')),
      email: z.string().email(t('invalid_email')),
      phone: z.string().min(8, t('phone_short')),
      password: z.string().min(8, t('password_short', { defaultValue: 'Le mot de passe doit contenir au moins 8 caractères.' })),
      passwordConfirm: z.string().min(1, t('password_confirm_required', { defaultValue: 'Veuillez confirmer le mot de passe.' })),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: t('passwords_must_match', { defaultValue: 'Les mots de passe ne correspondent pas.' }),
      path: ['passwordConfirm'],
    });

  type RegisterForm = z.infer<typeof registerSchema>;

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const { register: registerUser, loginWithGoogle, isLoading } = useAuthStore();
  const { addToast } = useToastStore();
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setFormError(null);
    try {
      const success = await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      if (success) {
        addToast(
          t('registration_success_check_email', {
            defaultValue: 'Inscription réussie! Veuillez vérifier votre email pour confirmer votre compte.',
          }),
          'success',
        );
        // Pass email along so /verify-email can pre-fill the resend field
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      }
    } catch (err: any) {
      setFormError(err.message || "Échec de l'inscription. Veuillez réessayer.");
    }
  };

  const handleGoogleRegister = async (googleAccessToken: string) => {
    setFormError(null);
    try {
      const success = await loginWithGoogle(googleAccessToken);
      if (success) router.push(redirectUrl);
    } catch (err: any) {
      setFormError(err.message || 'Échec de la connexion Google');
    }
  };

  return (
    <div>
      <div className="mb-7">
        <span className="inline-block text-[10px] uppercase tracking-[0.3em] text-gold/80 mb-2">Inscription</span>
        <h1 className="font-display text-3xl font-bold mb-2">{t('create_account_title')}</h1>
        <p className="text-foreground/60 text-sm">{t('register_desc')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {formError && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold text-center">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input label={t('first_name')} placeholder="Jean" icon={<User size={18} />} error={errors.firstName?.message} {...register('firstName')} />
          <Input label={t('last_name')} placeholder="Dupont" icon={<User size={18} />} error={errors.lastName?.message} {...register('lastName')} />
        </div>

        <Input label={t('email')} type="email" placeholder="vous@exemple.com" icon={<Mail size={18} />} error={errors.email?.message} {...register('email')} />
        <Input label={t('phone')} type="tel" placeholder="+237 6XX XX XX XX" icon={<Phone size={18} />} error={errors.phone?.message} {...register('phone')} />
        <Input label={t('password_required').split(' ')[0]} type="password" placeholder="••••••••" icon={<Lock size={18} />} error={errors.password?.message} {...register('password')} />
        <Input label={t('confirm_password', { defaultValue: 'Confirmer le mot de passe' })} type="password" placeholder="••••••••" icon={<Lock size={18} />} error={errors.passwordConfirm?.message} {...register('passwordConfirm')} />

        <Button type="submit" className="w-full mt-6" isLoading={isLoading} rightIcon={<UserPlus size={18} />}>
          {t('register_btn')}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-foreground/10" />
        <span className="text-xs text-foreground/40 uppercase tracking-wider">ou</span>
        <div className="h-px flex-1 bg-foreground/10" />
      </div>

      <GoogleAuthButton onTokenReceived={handleGoogleRegister} disabled={isLoading} label="S'inscrire avec Google" />

      <div className="mt-7 text-center text-sm text-foreground/60">
        {t('already_have_account')}{' '}
        <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`} className="text-gold font-medium hover:underline">
          {t('login_btn')}
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="text-gold">{t('loading')}</div>}>
      <RegisterFormContent />
    </Suspense>
  );
}
