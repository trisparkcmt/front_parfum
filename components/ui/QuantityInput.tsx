'use client';

import { useState, useEffect } from 'react';

interface QuantityInputProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  className?: string;
  ariaLabel?: string;
}

export function QuantityInput({
  value,
  min = 1,
  max = Infinity,
  onChange,
  className,
  ariaLabel = 'Quantité',
}: QuantityInputProps) {
  const [localValue, setLocalValue] = useState<string>(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Only allow numeric digits or empty string
    if (raw !== '' && !/^\d+$/.test(raw)) return;

    setLocalValue(raw);

    if (raw !== '') {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= min) {
        const clamped = Math.min(max, parsed);
        onChange(clamped);
      }
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(localValue, 10);
    if (isNaN(parsed) || parsed < min) {
      setLocalValue(String(min));
      onChange(min);
    } else if (parsed > max) {
      setLocalValue(String(max));
      onChange(max);
    } else {
      setLocalValue(String(parsed));
      onChange(parsed);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={(e) => e.target.select()}
      aria-label={ariaLabel}
      className={className}
    />
  );
}
