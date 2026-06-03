'use client';

/**
 * @file app/(auth)/register/page.tsx
 * @description User Registration / Sign-up Page.
 *
 * This component handles the creation of new user accounts on the platform.
 * Key responsibilities:
 * - **Data Collection**: Gathers user metadata including first name, last name, email, and phone number.
 * - **Validation**: Implements strict client-side validation via `zod` to ensure data integrity.
 * - **Account Creation**: Interfaces with the `register` method in `useAuthStore` to create a mock account.
 * - **Auto-Login**: Automatically authenticates the user upon successful registration.
 * - **Redirection**: Directs the user back to their previous page or the homepage.
 *
 * It utilizes a multi-field form with real-time error feedback and luxury styling.
 */
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, UserPlus, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';

function RegisterFormContent() {
  const { t } = useTranslation();

  const registerSchema = z.object({
    firstName: z.string().min(2, t('first_name_short')),
    lastName: z.string().min(2, t('last_name_short')),
    email: z.string().email(t('invalid_email')),
    phone: z.string().min(8, t('phone_short')),
    password: z.string().min(6, t('password_short')),
  });
  
  type RegisterForm = z.infer<typeof registerSchema>;

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const { register: registerUser, isLoading } = useAuthStore();
  const { addToast } = useToastStore();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    const success = await registerUser(data);
    if (success) {
      addToast(t('register_success'), 'success');
      router.push(redirectUrl);
    } else {
      addToast(t('register_error'), 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">{t('create_account_title')}</h1>
        <p className="text-foreground/60">{t('register_desc')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('first_name')}
            placeholder="Jean"
            icon={<User size={18} />}
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label={t('last_name')}
            placeholder="Dupont"
            icon={<User size={18} />}
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <Input
          label={t('email')}
          type="email"
          placeholder="vous@exemple.com"
          icon={<Mail size={18} />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label={t('phone')}
          type="tel"
          placeholder="+237 6XX XX XX XX"
          icon={<Phone size={18} />}
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Input
          label={t('password_required').split(' ')[0]} // fallback to 'Password'
          type="password"
          placeholder="••••••••"
          icon={<Lock size={18} />}
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" className="w-full mt-6" isLoading={isLoading} rightIcon={<UserPlus size={18} />}>
          {t('register_btn')}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-foreground/60">
        {t('already_have_account')}{' '}
        <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`} className="text-gold font-medium hover:underline">
          {t('login_btn')}
        </Link>
      </div>
    </motion.div>
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

