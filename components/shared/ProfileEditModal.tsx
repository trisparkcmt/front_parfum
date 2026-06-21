'use client';

import { useState, useEffect } from 'react';
import { User, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/store/useToastStore';
import { useAuthStore } from '@/store/useAuthStore';
import { FloatInput } from '@/components/ui/Input';

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
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      setErrors({});
    }
  }, [isOpen, user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) newErrors.firstName = t('required_field');
    if (!formData.lastName?.trim()) newErrors.lastName = t('required_field');
    if (!formData.email?.trim()) {
      newErrors.email = t('required_field');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('invalid_email', 'Invalid email address');
    }
    if (!formData.phone?.trim()) newErrors.phone = t('required_field');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const success = await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      });

      if (success) {
        addToast(t('profile_updated_success', 'Profile updated successfully'), 'success');
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      console.error('Profile update failed:', error);
      addToast(t('profile_update_failed', 'Failed to update profile'), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-background rounded-2xl border border-white/10 shadow-2xl">
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
        <form onSubmit={handleSubmit} className="p-6 space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <FloatInput
              label={t('first_name', 'Prénom')}
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              disabled={loading}
              placeholder={t('enter_first_name')}
              error={errors.firstName}
            />
            <FloatInput
              label={t('last_name', 'Nom')}
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              disabled={loading}
              placeholder={t('enter_last_name')}
              error={errors.lastName}
            />
          </div>

          <FloatInput
            label={t('email', 'Email')}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={loading}
            placeholder={t('enter_email')}
            error={errors.email}
          />

          <FloatInput
            label={t('phone', 'Téléphone')}
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={loading}
            placeholder={t('enter_phone')}
            error={errors.phone}
          />

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
