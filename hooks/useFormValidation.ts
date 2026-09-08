'use client';

/**
 * @file hooks/useFormValidation.ts
 * @description Hook for real-time form validation with debounce
 * Provides validation rules, error tracking, and form state management
 */

import { useState, useCallback, useRef } from 'react';

export interface FieldError {
  [key: string]: string | undefined;
}

export interface ValidationRule {
  required?: string;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
  validate?: (value: any) => string | undefined;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  schema: ValidationSchema
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Validate a single field
  const validateField = useCallback(
    (name: string, value: any): string | undefined => {
      const rule = schema[name];
      if (!rule) return undefined;

      // Required validation
      if (rule.required && !value) {
        return rule.required;
      }

      // Skip other validations if empty and not required
      if (!value && !rule.required) {
        return undefined;
      }

      // Min length
      if (
        rule.minLength &&
        typeof value === 'string' &&
        value.length < rule.minLength.value
      ) {
        return rule.minLength.message;
      }

      // Max length
      if (
        rule.maxLength &&
        typeof value === 'string' &&
        value.length > rule.maxLength.value
      ) {
        return rule.maxLength.message;
      }

      // Pattern
      if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.value.test(value)) {
          return rule.pattern.message;
        }
      }

      // Custom validation
      if (rule.validate) {
        return rule.validate(value);
      }

      return undefined;
    },
    [schema]
  );

  // Handle field change with debounce
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      setValues((prev) => ({ ...prev, [name]: value }));

      // Clear previous debounce timer
      if (debounceTimers.current[name]) {
        clearTimeout(debounceTimers.current[name]);
      }

      // Set new debounce timer for validation (300ms)
      debounceTimers.current[name] = setTimeout(() => {
        const error = validateField(name, value);
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      }, 300);
    },
    [validateField]
  );

  // Handle field blur
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));

      const error = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    },
    [validateField]
  );

  // Validate all fields
  const validateAll = useCallback((): boolean => {
    const newErrors: FieldError = {};
    let isValid = true;

    Object.keys(values).forEach((fieldName) => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(
      Object.keys(values).reduce(
        (acc, key) => {
          acc[key] = true;
          return acc;
        },
        {} as Record<string, boolean>
      )
    );

    return isValid;
  }, [values, validateField]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});

    // Clear all debounce timers
    Object.values(debounceTimers.current).forEach(clearTimeout);
    debounceTimers.current = {};
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    resetForm,
    setValues,
  };
}
