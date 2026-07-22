'use client';

import { useState, useRef } from 'react';
import { Eye, EyeOff, Lock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/store/useToastStore';
import { authService } from '@/services/apiService';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PasswordChangeModal({
  isOpen,
  onClose,
  onSuccess,
}: PasswordChangeModalProps) {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    newPasswordConfirm: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Refs for focusing inputs
  const oldPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.oldPassword) {
      newErrors.oldPassword = t('required_field');
    }

    if (!formData.newPassword) {
      newErrors.newPassword = t('required_field');
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = t('password_min_length', 'Minimum 8 characters');
    }

    if (!formData.newPasswordConfirm) {
      newErrors.newPasswordConfirm = t('required_field');
    } else if (formData.newPassword !== formData.newPasswordConfirm) {
      newErrors.newPasswordConfirm = t('passwords_dont_match', 'Passwords do not match');
    }

    setErrors(newErrors);

    // If there are errors, focus the first field with an error
    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0] as keyof typeof formData;
      if (firstErrorKey === 'oldPassword') {
        oldPasswordRef.current?.focus();
      } else if (firstErrorKey === 'newPassword') {
        newPasswordRef.current?.focus();
      } else if (firstErrorKey === 'newPasswordConfirm') {
        confirmPasswordRef.current?.focus();
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword(
        formData.oldPassword,
        formData.newPassword,
        formData.newPasswordConfirm
      );

      addToast(t('password_changed_success', 'Password changed successfully'), 'success');
      setFormData({ oldPassword: '', newPassword: '', newPasswordConfirm: '' });
      setErrors({});
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Password change failed:', error);
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.response?.data?.old_password?.[0] ||
        t('password_change_failed', 'Failed to change password');
      addToast(errorMsg, 'error');

      // Handle field-specific errors from the API
      const errData = error.response?.data;
      if (errData) {
        // Map API error to field
        if (errData.old_password?.[0]) {
          setErrors(prev => ({ ...prev, oldPassword: errData.old_password[0] }));
          oldPasswordRef.current?.focus();
        } else if (errData.password?.[0]) {
          // Assuming this is for new password
          setErrors(prev => ({ ...prev, newPassword: errData.password[0] }));
          newPasswordRef.current?.focus();
        } else if (errData.password_confirm?.[0]) {
          setErrors(prev => ({ ...prev, newPasswordConfirm: errData.password_confirm[0] }));
          confirmPasswordRef.current?.focus();
        } else {
          // If we can't map, focus the first field
          oldPasswordRef.current?.focus();
        }
      } else {
        // If we can't determine the field, focus the first field
        oldPasswordRef.current?.focus();
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
              <Lock size={20} />
            </div>
            <h2 className="text-lg font-bold text-foreground">{t('change_password', 'Change Password')}</h2>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Old Password */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              {t('current_password', 'Current Password')}
            </label>
            <div className="relative">
              <input
                ref={oldPasswordRef}
                type={showPasswords.old ? 'text' : 'password'}
                value={formData.oldPassword}
                onChange={(e) =>
                  setFormData({ ...formData, oldPassword: e.target.value })
                }
                disabled={loading}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-base text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 disabled:opacity-50 transition-colors"
                placeholder={t('enter_current_password')}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({ ...showPasswords, old: !showPasswords.old })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
              >
                {showPasswords.old ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.oldPassword && (
              <p className="text-xs text-red-400 mt-1">{errors.oldPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              {t('new_password', 'New Password')}
            </label>
            <div className="relative">
              <input
                ref={newPasswordRef}
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                disabled={loading}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-base text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 disabled:opacity-50 transition-colors"
                placeholder={t('enter_new_password')}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-red-400 mt-1">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              {t('confirm_password', 'Confirm Password')}
            </label>
            <div className="relative">
              <input
                ref={confirmPasswordRef}
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.newPasswordConfirm}
                onChange={(e) =>
                  setFormData({ ...formData, newPasswordConfirm: e.target.value })
                }
                disabled={loading}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-base text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 disabled:opacity-50 transition-colors"
                placeholder={t('confirm_new_password')}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    confirm: !showPasswords.confirm,
                  })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
              >
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPasswordConfirm && (
              <p className="text-xs text-red-400 mt-1">{errors.newPasswordConfirm}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-foreground text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gold text-black text-sm font-bold hover:bg-gold/80 transition-colors disabled:opacity-50"
            >
              {loading ? t('loading') : t('change_password', 'Change Password')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}