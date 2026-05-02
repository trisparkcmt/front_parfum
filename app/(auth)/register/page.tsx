'use client';

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

const registerSchema = z.object({
  firstName: z.string().min(2, "Le prénom est trop court"),
  lastName: z.string().min(2, "Le nom est trop court"),
  email: z.string().email("L'adresse email est invalide"),
  phone: z.string().min(8, "Le numéro de téléphone est trop court"),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères"),
});

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterFormContent() {
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
      addToast('Compte créé avec succès', 'success');
      router.push(redirectUrl);
    } else {
      addToast("Une erreur est survenue lors de l'inscription", 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-gold mb-8 transition-colors md:hidden">
        <ArrowLeft size={16} /> Retour à l'accueil
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Créer un compte.</h1>
        <p className="text-foreground/60">Rejoignez l'expérience Accessories Exclusif.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Prénom"
            placeholder="Jean"
            icon={<User size={18} />}
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Nom"
            placeholder="Dupont"
            icon={<User size={18} />}
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <Input
          label="Adresse Email"
          type="email"
          placeholder="vous@exemple.com"
          icon={<Mail size={18} />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Téléphone"
          type="tel"
          placeholder="+237 6XX XX XX XX"
          icon={<Phone size={18} />}
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Input
          label="Mot de passe"
          type="password"
          placeholder="••••••••"
          icon={<Lock size={18} />}
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" className="w-full mt-6" isLoading={isLoading} rightIcon={<UserPlus size={18} />}>
          S'inscrire
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-foreground/60">
        Vous avez déjà un compte ?{' '}
        <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`} className="text-gold font-medium hover:underline">
          Se connecter
        </Link>
      </div>
    </motion.div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <RegisterFormContent />
    </Suspense>
  );
}
