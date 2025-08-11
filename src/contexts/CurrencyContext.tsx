import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CurrencySettings, INDIAN_CURRENCY } from '../types';

// Available currencies
export const AVAILABLE_CURRENCIES: CurrencySettings[] = [
  { code: 'INR', symbol: '₹', locale: 'en-IN' },
  { code: 'USD', symbol: '$', locale: 'en-US' },
  { code: 'EUR', symbol: '€', locale: 'en-EU' },
];

interface CurrencyContextType {
  currentCurrency: CurrencySettings;
  setCurrency: (currency: CurrencySettings) => void;
  formatCurrency: (amount: number) => string;
  getCurrencySymbol: () => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currentCurrency, setCurrentCurrency] = useState<CurrencySettings>(INDIAN_CURRENCY);

  // Load currency from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency) {
      try {
        const parsedCurrency = JSON.parse(savedCurrency);
        const validCurrency = AVAILABLE_CURRENCIES.find(c => c.code === parsedCurrency.code);
        if (validCurrency) {
          setCurrentCurrency(validCurrency);
        }
      } catch (error) {
        console.error('Error parsing saved currency:', error);
      }
    }
  }, []);

  const setCurrency = (currency: CurrencySettings) => {
    setCurrentCurrency(currency);
    localStorage.setItem('selectedCurrency', JSON.stringify(currency));
  };

  const formatCurrency = (amount: number): string => {
    try {
      return new Intl.NumberFormat(currentCurrency.locale, {
        style: 'currency',
        currency: currentCurrency.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      return `${currentCurrency.symbol}${amount.toFixed(2)}`;
    }
  };

  const getCurrencySymbol = (): string => {
    return currentCurrency.symbol;
  };

  const value: CurrencyContextType = {
    currentCurrency,
    setCurrency,
    formatCurrency,
    getCurrencySymbol,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
