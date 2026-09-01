'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface PeriodContextType {
  month: number;
  year: number;
  setPeriod: (month: number, year: number) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  defaultDateForPeriod: string;
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export function PeriodProvider({ children }: { children: React.ReactNode }) {
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());

  const setPeriod = (newM: number, newY: number) => {
    setMonth(newM);
    setYear(newY);
  };

  const nextMonth = () => {
    let newM = month + 1;
    let newY = year;
    if (newM > 12) {
      newM = 1;
      newY += 1;
    }
    setMonth(newM);
    setYear(newY);
  };

  const prevMonth = () => {
    let newM = month - 1;
    let newY = year;
    if (newM < 1) {
      newM = 12;
      newY -= 1;
    }
    setMonth(newM);
    setYear(newY);
  };

  // Gera uma data válida dentro do mês selecionado para preencher o formulário de lançamento
  const today = new Date();
  const currentDay = today.getDate();
  const daysInSelectedMonth = new Date(year, month, 0).getDate();
  const safeDay = Math.min(currentDay, daysInSelectedMonth);
  const defaultDateForPeriod = `${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;

  return (
    <PeriodContext.Provider
      value={{
        month,
        year,
        setPeriod,
        nextMonth,
        prevMonth,
        defaultDateForPeriod,
      }}
    >
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error('usePeriod deve ser usado dentro de um PeriodProvider');
  }
  return context;
}
