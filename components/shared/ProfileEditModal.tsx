'use client';

import { useState } from 'react';
import { User, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/store/useToastStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/Input';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ProfileEditModal({
  isOpen,
  onClose,
  onSuccess,
}: ProfileEditModalProps) {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const { user, updateProfile } = useAuthStore();

  const formSchema = z.object({
    firstName: z.string().min(1, t('required_field')),
    lastName: z.string().min(1, t('required_field')),
    email: z.string().email(t('invalid_email')),
    phone: z.string().min(1, t('required_field')),
  });

  type FormData = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    focus,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const success = await updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
      });

      if (success) {
        addToast(t('profile_updated_success', 'Profile updated successfully'), 'success');
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      console.error('Profile update failed:', error);
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        t('profile_update_failed', 'Failed to update profile');
      addToast(errorMsg, 'error');

      // Handle field-specific errors from the API
      const errData = error.response?.data;
      if (errData) {
        // Map API error to field
        if (errData.first_name?.[0]) {
          setError('firstName', { type: 'manual', message: errData.first_name[0] });
          focus('firstName');
        } else if (errData.last_name?.[0]) {
          setError('lastName', { type: 'manual', message: errData.last_name[0] });
          focus('lastName');
        } else if (errData.email?.[0]) {
          setError('email', { type: 'manual', message: errData.email[0] });
          focus('email');
        } else if (errData.telephone?.[0]) {
          // Note: the API uses 'telephone' for phone
          setError('phone', { type: 'manual', message: errData.telephone[0] });
          focus('phone');
        } else {
          // If we can't map, focus the first field
          focus('firstName');
        }
      } else {
        // If we can't determine the field, focus the first field
        focus('firstName');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-background rounded-2xl border border-white/10 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center text-gold">
              <User size={20} />
            </div>
            <h2 className="text-lg font-bold text-foreground">{t('edit_profile', 'Edit Profile')}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* First Name */}
          <div>
            <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">
              {t('first_name', 'Prénom')}
            </label>
            <input
              id="field-firstName"
              type="text"
              {...register('firstName')}
              disabled={loading}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-base text-foreground placeholder-text-foreground/30 focus:outline-none focus:border-gold/50 transition-colors"
              placeholder={t('enter_first_name')}
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">
              {t('last_name', 'Nom')}
            </label>
            <input
              id="field-lastName"
              type="text"
              {...register('lastName')}
              disabled={loading}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-base text-foreground placeholder-text-foreground/30 focus:outline-none focus:border-gold/50 transition-colors"
              placeholder={t('enter_last_name')}
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">
              {t('email', 'Email')}
            </label>
            <input
              id="field-email"
              type="email"
              {...register('email')}
              disabled={loading}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-base text-foreground placeholder-text-foreground/30 focus:outline-none focus:border-gold/50 transition-colors"
              placeholder={t('enter_email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">
              {t('phone', 'Téléphone')}
            </label>
            <input
              id="field-phone"
              type="tel"
              {...register('phone')}
              disabled={loading}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-base text-foreground placeholder-text-foreground/30 focus:outline-none focus:border-gold/50 transition-colors"
              placeholder={t('enter_phone')}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-foreground text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gold text-black text-sm font-bold hover:bg-gold/80 transition-colors disabled:opacity-50"
            >
              {loading ? t('loading') : t('save_changes', 'Enregistrer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}