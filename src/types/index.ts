// Clean types file for SmartStock inventory management system

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  quantity: number;
  supplier?: string;
  location?: string;
  sku?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  barcode?: string;
  imageUrl?: string;
  gstRate?: number;
  hsnCode?: string;
  brand?: string;
  unit?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReportConfig {
  reportType: 'inventory' | 'sales' | 'financial' | 'gst';
  format?: 'pdf' | 'excel' | 'csv';
}

export interface SalesData {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  date: string;
}

export interface SalesTrendData {
  month: string;
  sales: number;
  profit: number;
  orders: number;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  permissions: string[];
  isActive?: boolean;
  lastLogin?: Date;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface EnhancedUser extends User {
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    department: string;
    avatar?: string;
  };
  settings: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    dashboard: {
      showRecentActivities: boolean;
      showQuickStats: boolean;
    };
  };
  isActive: boolean;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface ProductFormData {
  name: string;
  category: string;
  price: number;
  quantity: number;
  supplier?: string;
  location?: string;
  sku?: string;
  description?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  barcode?: string;
  gstRate?: number;
  hsnCode?: string;
  brand?: string;
  unit?: string;
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface ProductFilters {
  category?: string;
  supplier?: string;
  inStock?: boolean;
  lowStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface Activity {
  id: string;
  type: 'add' | 'update' | 'delete' | 'stock_alert';
  productId: string;
  productName: string;
  action: string;
  description?: string;
  timestamp: Date;
  userId: string;
}

export interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  totalValue: number;
  recentActivities: Activity[];
}

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  minStockLevel: number;
  alertType: 'low_stock' | 'out_of_stock';
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
}

export interface InventoryReportData {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  categories: number;
  avgProductValue: number;
  stockHealthScore: number;
  topProducts: Array<{
    name: string;
    stock: number;
    value: number;
    category: string;
    status: string;
  }>;
  stockAnalysis?: Array<{
    name: string;
    current: number;
    minimum: number;
    status: string;
    action: string;
  }>;
  chartData: {
    categoryDistribution: Array<{
      name: string;
      value: number;
      count: number;
      percentage: number;
      trend?: string;
    }>;
    stockLevels?: Array<{
      name: string;
      stock: number;
      status: string;
    }>;
    monthlyMovement?: Array<{
      month: string;
      inward: number;
      outward: number;
      closing: number;
    }>;
  };
}

export interface SalesReportData {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  growthRate: number;
  topProducts: Array<{
    name: string;
    revenue: number;
    quantity: number;
    growth: string;
  }>;
  chartData: {
    monthlySalesTrend: Array<{
      month: string;
      sales: number;
      target: number;
      growth: number;
    }>;
  };
}

export interface FinancialReportData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
  workingCapital: number;
  chartData: {
    monthlyProfitTrend: Array<{
      month: string;
      revenue: number;
      expenses: number;
      profit: number;
    }>;
  };
}

export interface GSTReportData {
  totalGSTCollected: number;
  inputTaxCredit: number;
  netGSTLiability: number;
  complianceScore: number;
  gstTransactions: Array<{
    date: string;
    invoiceNo: string;
    customerName: string;
    amount: number;
    gstRate: number;
    gstAmount: number;
    type: 'B2B' | 'B2C' | 'Export';
  }>;
  chartData: {
    monthlyGSTTrend: Array<{
      month: string;
      collected: number;
      paid: number;
      liability: number;
    }>;
    gstRateDistribution: Array<{
      rate: string;
      amount: number;
      percentage: number;
    }>;
    complianceMetrics: Array<{
      metric: string;
      score: number;
      target: number;
    }>;
  };
}

export interface CurrencySettings {
  code: 'INR' | 'USD' | 'EUR';
  symbol: string;
  locale: string;
}

export const INDIAN_CURRENCY: CurrencySettings = {
  code: 'INR',
  symbol: '₹',
  locale: 'en-IN'
};

export interface AppSettings {
  preferences: {
    language: string;
  theme: 'light' | 'dark' | 'system';
    dateFormat: string;
    timeFormat: string;
    numberFormat: string;
    notifications: boolean;
    autoBackup: boolean;
    lowStockThreshold: number;
    itemsPerPage: number;
    dataRetention: number;
    timezone: string;
  };
  features: {
    multiLocation: boolean;
    barcodeScranning: boolean;
    gstReporting: boolean;
    advancedAnalytics: boolean;
    inventory: boolean;
    sales: boolean;
    purchases: boolean;
    reports: boolean;
  };
  business: BusinessSettings;
}

export interface BusinessSettings {
  companyName: string;
  businessName: string;
  address: string;
  phone: string;
  email: string;
  gstNumber?: string;
  logo?: string;
  currency?: CurrencySettings;
  taxSettings?: {
    defaultGstRate: number;
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
  };
}

export interface GSTReport {
  period: string;
  totalSales: number;
  totalGST: number;
  gstByRate: {
    rate: number;
    amount: number;
  }[];
  transactions: {
    date: Date;
    invoiceNumber: string;
    amount: number;
    gstAmount: number;
    gstRate: number;
  }[];
}
