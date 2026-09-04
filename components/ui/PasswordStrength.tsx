'use client';

import { evaluatePasswordStrength, type PasswordStrength as PasswordStrengthType } from '@/lib/validation';
import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

/**
 * PasswordStrength: Visual password strength indicator with requirements checklist
 * 
 * @example
 * <PasswordStrength 
 *   password={password} 
 *   showRequirements={true}
 * />
 */
export function PasswordStrength({
  password,
  showRequirements = true,
  className,
}: PasswordStrengthProps) {
  const strength = useMemo(
    () => evaluatePasswordStrength(password),
    [password]
  );
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;

  const getStrengthColor = (str: PasswordStrengthType['strength']) => {
    switch (str) {
      case 'very-weak':
        return 'bg-red-500';
      case 'weak':
        return 'bg-orange-500';
      case 'moderate':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-green-500';
      case 'very-strong':
        return 'bg-emerald-500';
    }
  };

  const getStrengthLabel = (str: PasswordStrengthType['strength']) => {
    return str.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getTextColor = (str: PasswordStrengthType['strength']) => {
    switch (str) {
      case 'very-weak':
        return 'text-red-500';
      case 'weak':
        return 'text-orange-500';
      case 'moderate':
        return 'text-yellow-600';
      case 'strong':
        return 'text-green-500';
      case 'very-strong':
        return 'text-emerald-500';
    }
  };

  if (!password) return null;

  return (
    <div className={cn('space-y-3 mt-2', className)}>
      {/* Strength indicator bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-600">
            {isEn ? 'Password Strength' : 'Force du mot de passe'}
          </label>
          <span className={cn('text-xs font-medium', getTextColor(strength.strength))}>
            {getStrengthLabel(strength.strength)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              getStrengthColor(strength.strength)
            )}
            style={{
              width: `${(strength.score + 1) * 20}%`,
            }}
          />
        </div>
      </div>

      {/* Feedback */}
      <p className="text-xs text-slate-600">{strength.feedback}</p>

      {/* Requirements checklist */}
      {showRequirements && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-slate-700">{isEn ? 'Requirements:' : 'Exigences :'}</p>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2 text-xs">
              {strength.requirements.hasMinLength ? (
                <Check size={14} className="text-green-500 shrink-0" />
              ) : (
                <X size={14} className="text-slate-400 shrink-0" />
              )}
              <span
                className={
                  strength.requirements.hasMinLength
                    ? 'text-slate-700'
                    : 'text-slate-500'
                }
              >
                {isEn ? 'At least 8 characters' : 'Au moins 8 caractères'}
              </span>
            </li>
            <li className="flex items-center gap-2 text-xs">
              {strength.requirements.hasUpperCase ? (
                <Check size={14} className="text-green-500 shrink-0" />
              ) : (
                <X size={14} className="text-slate-400 shrink-0" />
              )}
              <span
                className={
                  strength.requirements.hasUpperCase
                    ? 'text-slate-700'
                    : 'text-slate-500'
                }
              >
                {isEn ? 'Uppercase letter (A-Z)' : 'Lettre majuscule (A-Z)'}
              </span>
            </li>
            <li className="flex items-center gap-2 text-xs">
              {strength.requirements.hasLowerCase ? (
                <Check size={14} className="text-green-500 shrink-0" />
              ) : (
                <X size={14} className="text-slate-400 shrink-0" />
              )}
              <span
                className={
                  strength.requirements.hasLowerCase
                    ? 'text-slate-700'
                    : 'text-slate-500'
                }
              >
                {isEn ? 'Lowercase letter (a-z)' : 'Lettre minuscule (a-z)'}
              </span>
            </li>
            <li className="flex items-center gap-2 text-xs">
              {strength.requirements.hasNumbers ? (
                <Check size={14} className="text-green-500 shrink-0" />
              ) : (
                <X size={14} className="text-slate-400 shrink-0" />
              )}
              <span
                className={
                  strength.requirements.hasNumbers
                    ? 'text-slate-700'
                    : 'text-slate-500'
                }
              >
                {isEn ? 'Number (0-9)' : 'Chiffre (0-9)'}
              </span>
            </li>
            <li className="flex items-center gap-2 text-xs">
              {strength.requirements.hasSpecialChars ? (
                <Check size={14} className="text-green-500 shrink-0" />
              ) : (
                <X size={14} className="text-slate-400 shrink-0" />
              )}
              <span
                className={
                  strength.requirements.hasSpecialChars
                    ? 'text-slate-700'
                    : 'text-slate-500'
                }
              >
                {isEn ? 'Special character (!@#$%^&*)' : 'Caractère spécial (!@#$%^&*)'}
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
