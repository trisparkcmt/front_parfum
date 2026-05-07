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
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';

const loginSchema = z.object({
  email: z.string().email("L'adresse email est invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const { login, isLoading } = useAuthStore();
  const { addToast } = useToastStore();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    const success = await login(data.email, data.password);
    if (success) {
      addToast('Connexion réussie', 'success');
      router.push(redirectUrl);
    } else {
      addToast('Email ou mot de passe incorrect (Utilisez jean@mail.com)', 'error');
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
        <h1 className="font-display text-3xl font-bold mb-2">Bon retour.</h1>
        <p className="text-foreground/60">Connectez-vous pour accéder à votre espace exclusif.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Adresse Email"
          type="email"
          placeholder="vous@exemple.com"
          icon={<Mail size={18} />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="space-y-1">
          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            icon={<Lock size={18} />}
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end">
            <Link href="#" className="text-xs text-gold hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full mt-6" isLoading={isLoading} rightIcon={<LogIn size={18} />}>
          Se connecter
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-foreground/60">
        Vous n'avez pas de compte ?{' '}
        <Link href={`/register?redirect=${encodeURIComponent(redirectUrl)}`} className="text-gold font-medium hover:underline">
          Créer un compte
        </Link>
      </div>

      {/* Helper text since we use mock data */}
      <div className="mt-8 p-4 bg-gold/10 border border-gold/20  text-xs text-foreground/70">
        <p className="font-bold mb-1 text-gold">Comptes de test (mot de passe libre) :</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Client :</strong> jean@mail.com</li>
          <li><strong>Admin :</strong> admin@exclusif.cm</li>
          <li><strong>Livreur :</strong> paul@mail.com</li>
          <li><strong>Prestataire :</strong> aicha@mail.com</li>
        </ul>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
