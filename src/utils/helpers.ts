import { CurrencySettings, INDIAN_CURRENCY } from '../types';

// Currency formatting for Indian market
export const formatCurrency = (
  amount: number, 
  currency: CurrencySettings = INDIAN_CURRENCY
): string => {
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `${currency.symbol}${amount.toFixed(2)}`;
  }
};

// Format numbers in Indian numbering system (lakhs, crores)
export const formatIndianNumber = (num: number): string => {
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    return `${(num / 100000).toFixed(2)} L`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(2)} K`;
  }
  return num.toString();
};

// Calculate GST
export const calculateGST = (amount: number, gstRate: number) => {
  const gstAmount = (amount * gstRate) / 100;
  return {
    baseAmount: amount,
    gstAmount: gstAmount,
    totalAmount: amount + gstAmount,
    cgst: gstAmount / 2,
    sgst: gstAmount / 2,
  };
};

// Validate HSN Code
export const validateHSNCode = (hsnCode: string): boolean => {
  return /^\d{4,8}$/.test(hsnCode);
};

// Validate GST Number
export const validateGSTNumber = (gstNumber: string): boolean => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gstNumber);
};

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Format date for Indian locale
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Stock level helpers
export const getStockStatus = (current: number, min?: number, max?: number) => {
  if (current === 0) return { status: 'critical', color: '#ef4444', label: 'Out of Stock' };
  if (min && current <= min) return { status: 'critical', color: '#ef4444', label: 'Critical' };
  if (min && current <= min * 1.5) return { status: 'low', color: '#f59e0b', label: 'Low Stock' };
  if (max && current >= max) return { status: 'overstock', color: '#3b82f6', label: 'Overstock' };
  return { status: 'good', color: '#10b981', label: 'Good Stock' };
};

export const validateInput = (input: string): boolean => {
    return input.trim().length > 0;
};

export const calculateStockValue = (price: number, quantity: number): number => {
    return price * quantity;
};

export const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
};