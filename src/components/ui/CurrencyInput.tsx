'use client';

import React, { useState, useEffect } from 'react';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string | number;
  onChange: (value: string) => void; // Retorna valor numérico em string (ex: "1000000.00")
}

export function formatBRL(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function CurrencyInput({ value, onChange, className = '', placeholder = 'R$ 0,00', ...props }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value === '' || value === undefined || value === null) {
      setDisplayValue('');
      return;
    }

    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
    if (isNaN(num)) {
      setDisplayValue('');
    } else {
      setDisplayValue(formatBRL(num));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;

    // Extrai apenas os dígitos numéricos
    const digits = rawInput.replace(/\D/g, '');

    if (!digits) {
      setDisplayValue('');
      onChange('');
      return;
    }

    // Converte para centavos
    const cents = parseInt(digits, 10);
    const numericValue = cents / 100;

    // Atualiza a exibição formatada (ex: R$ 1.000.000,00)
    setDisplayValue(formatBRL(numericValue));

    // Notifica o pai com a string float (ex: "1000000.00")
    onChange(numericValue.toFixed(2));
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      className={className}
      {...props}
    />
  );
}
