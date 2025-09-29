import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap
} from 'recharts';
import { Product } from '../types';
import { formatIndianNumber } from '../utils/helpers';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContextNew';
// import reportService from '../services/reportService'; // Removed unused import
import { productsAPI } from '../services/api';
import AdvancedFilters from '../components/AdvancedFilters';
import ProductDataTable from '../components/ProductDataTable';
import ExportButtons from '../components/ExportButtons';

const REPORT_TYPES = [
  { 
    id: 'inventory', 
    name: 'Inventory Analytics', 
    icon: '📦', 
    description: 'Stock levels, valuations, movement patterns & product lifecycle',
  gradient: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-600) 100%)',
  color: 'var(--primary)',
    features: ['Stock Analysis', 'ABC Analysis', 'Turnover Rates', 'Reorder Points']
  },
  { 
    id: 'sales', 
    name: 'Sales Performance', 
    icon: '💰', 
    description: 'Revenue insights, customer analytics, trends & forecasting',
  gradient: 'var(--gradient-secondary)',
  color: 'var(--danger)',
    features: ['Revenue Trends', 'Customer Segmentation', 'Product Performance', 'Seasonal Analysis']
  },
  { 
    id: 'financial', 
    name: 'Financial Overview', 
    icon: '📈', 
    description: 'P&L analysis, cash flow, margins & profitability insights',
  gradient: 'var(--gradient-success)',
  color: 'var(--info)',
    features: ['Profit Analysis', 'Cost Tracking', 'ROI Metrics', 'Budget Variance']
  },
  { 
    id: 'gst', 
    name: 'Tax & Compliance', 
    icon: '🧾', 
    description: 'GST reports, tax compliance & regulatory filings',
  gradient: 'var(--gradient-success)',
  color: 'var(--success)',
    features: ['GSTR Reports', 'Tax Liability', 'Compliance Score', 'Return Filing']
  }
  ,
  {
    id: 'detailed',
    name: 'Detailed Report',
    icon: '🧠',
    description: 'Combined insights across Inventory, Sales, Financial & Compliance',
  gradient: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-600) 100%)',
  color: 'var(--primary)',
    features: ['All Sections', 'Unified Exports (PDF/Excel/CSV)', 'Full Data Table']
  }
];

const CHART_COLORS = [
  'var(--chart-blue)', 'var(--chart-purple)', 'var(--chart-indigo)', 
  'var(--chart-green)', 'var(--chart-teal)', 'var(--chart-cyan)',
  'var(--chart-orange)', 'var(--chart-red)', 'var(--chart-pink)', 
  'var(--chart-yellow)', 'var(--primary)', 'var(--accent)'
];

// Enhanced color scheme with semantic meanings
const COLOR_SCHEME = {
  success: '#10b981',      // Emerald Green - High performance, good values, positive trends
  warning: '#f59e0b',      // Amber Orange - Medium performance, caution, moderate values  
  danger: '#ef4444',       // Red - Low performance, urgent attention, poor values
  primary: '#3b82f6',      // Blue - Primary data, normal values, neutral information
  info: '#06b6d4',         // Cyan - Information, secondary data
};

// Robust 4-color pattern ensuring all bars are colored
const getChartColors = (theme: 'light' | 'dark') => {
  return [
    COLOR_SCHEME.primary,    // Blue - Primary/Normal values
    COLOR_SCHEME.success,    // Green - High/Good performance  
    COLOR_SCHEME.warning,    // Orange - Medium/Caution
    COLOR_SCHEME.danger,     // Red - Low/Poor performance
  ];
};

// Theme-aware chart configuration
const getChartConfig = (theme: 'light' | 'dark') => ({
  backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
  textColor: theme === 'dark' ? '#ffffff' : '#0f172a',
  gridColor: theme === 'dark' ? '#333333' : '#e2e8f0',
  tooltipBg: theme === 'dark' ? '#262626' : '#ffffff',
  tooltipBorder: theme === 'dark' ? '#404040' : '#e2e8f0',
  tooltip: {
    contentStyle: {
      backgroundColor: theme === 'dark' ? '#262626' : '#ffffff',
      border: `1px solid ${theme === 'dark' ? '#404040' : '#e2e8f0'}`,
      borderRadius: '8px',
      color: theme === 'dark' ? '#ffffff' : '#0f172a'
    }
  }
});

interface AvailableFiltersType {
  categories: string[];
  suppliers: string[];
  locations: string[];
}

const ReportsEnhanced: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const { theme } = useTheme();
  const chartConfig = getChartConfig(theme);
  const [selectedReportType, setSelectedReportType] = useState('inventory');
  
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    return {
      start: thirtyDaysAgo.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  });
  
  const [advancedFilters, setAdvancedFilters] = useState({
    category: '',
    supplier: '',
    location: '',
    stockLevel: 'all',
    valueRange: 'all',
    quickDateRange: 'thisMonth',
    sortBy: 'name',
    sortOrder: 'asc',
    minQuantity: '',
    maxQuantity: '',
    priceRange: { min: '', max: '' },
    searchTerm: '',
    tags: [],
    groupBy: 'category'
  });
  
  const [reportData, setReportData] = useState<any>(null);
  const [productDetails, setProductDetails] = useState<Product[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);
  // View Mode removed; always show charts and summary. Detailed table lives only in Detailed Report.
  const [availableFilters, setAvailableFilters] = useState<AvailableFiltersType>({
    categories: [],
    suppliers: [],
    locations: []
  });

  // Load available filter options
  const loadFilterOptions = useCallback(async () => {
    try {
      const response = await productsAPI.getAll();
      const products = response.success ? response.data : [];
      const categories: string[] = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
      const suppliers: string[] = Array.from(new Set(products.map(p => p.supplier).filter(Boolean))) as string[];
      const locations: string[] = Array.from(new Set(products.map(p => p.location).filter(Boolean))) as string[];
      
      setAvailableFilters({ categories, suppliers, locations });
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  }, []);

  // Apply date range presets
  const applyDateRangePreset = useCallback((preset: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'today':
        start = new Date(today);
        end = new Date(today);
        break;
      case 'thisWeek':
        start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        end = new Date(today);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today);
        break;
      case 'custom':
        return; // Don't change dates for custom
      default:
        return;
    }
    
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
    
    setAdvancedFilters(prev => ({ ...prev, quickDateRange: preset }));
  }, []);

  // Generate report with filters
  const generateReport = useCallback(async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      const filterOptions = {
        ...advancedFilters,
        dateRange,
        includeDetailedData: true
      };
      
      const data = {
        reportType: selectedReportType,
        dateRange,
        generated: true
      };
      // Always load product details for charts and summary
      const response = await productsAPI.getAll();
      const allProducts = response.success ? response.data : [];
      const productData = allProducts.filter(product => {
        if (filterOptions.category && product.category !== filterOptions.category) return false;
        if (filterOptions.supplier && product.supplier !== filterOptions.supplier) return false;
        if (filterOptions.location && product.location !== filterOptions.location) return false;
        if (filterOptions.priceRange) {
          const { min, max } = filterOptions.priceRange;
          if (min && parseFloat(min) > 0 && product.price < parseFloat(min)) return false;
          if (max && parseFloat(max) > 0 && product.price > parseFloat(max)) return false;
        }
        return true;
      });
      setProductDetails(productData);
      
      setReportData(data);
      
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedReportType, dateRange, advancedFilters, isGenerating]);

  // Filter update handler
  const updateFilter = useCallback((key: string, value: any) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setAdvancedFilters({
      category: '',
      supplier: '',
      location: '',
      stockLevel: 'all',
      valueRange: 'all',
      quickDateRange: 'thisMonth',
      sortBy: 'name',
      sortOrder: 'asc',
      minQuantity: '',
      maxQuantity: '',
      priceRange: { min: '', max: '' },
      searchTerm: '',
      tags: [],
      groupBy: 'category'
    });
    applyDateRangePreset('thisMonth');
  }, [applyDateRangePreset]);

  // Date change handler
  const handleDateChange = useCallback((field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (advancedFilters.quickDateRange !== 'custom') {
      setAdvancedFilters(prev => ({ ...prev, quickDateRange: 'custom' }));
    }
  }, [advancedFilters.quickDateRange]);

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // Auto-generate report when dependencies change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generateReport();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [selectedReportType, dateRange, advancedFilters]);

  // Render charts based on report type and data (distinct per section). Also render all 4 sections for 'detailed'.
  const renderCharts = useMemo(() => {
    if (!reportData) return null;

    // Helpers derived from products
    const getInventoryDatasets = () => {
      const chartColors = getChartColors(theme);
      const categoryMap: Record<string, number> = {};
      productDetails.forEach(p => {
        const key = p.category || 'Uncategorized';
        categoryMap[key] = (categoryMap[key] || 0) + (p.quantity || 0);
      });
      const categories = Object.entries(categoryMap).map(([name, value], i) => ({
        name,
        value,
        color: chartColors[i % chartColors.length]
      }));

      const topProducts = [...productDetails]
        .map(p => ({ name: p.name, value: (p.price || 0) * (p.quantity || 0) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

      return { categories, topProducts };
    };

    const getSalesDatasets = () => {
      const totalRevenue = productDetails.reduce((s, p) => s + (p.price || 0) * (p.quantity || 0) * 0.6, 0);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const monthlySales = months.map((m, idx) => {
        const base = totalRevenue / months.length;
        const sales = Math.round(base * (0.9 + idx * 0.05));
        return { month: m, sales, target: Math.round(sales * 1.1) };
      });
      const productPerformance = [...productDetails]
        .sort((a, b) => (b.price || 0) - (a.price || 0))
        .slice(0, 6)
        .map(p => ({ name: p.name, sales: Math.round((p.price || 0) * (p.quantity || 0) * 0.6), margin: 20 + (p.quantity % 15) }));
      const customerSegments = [
        { segment: 'Retail', revenue: Math.round(totalRevenue * 0.45) },
        { segment: 'Wholesale', revenue: Math.round(totalRevenue * 0.35) },
        { segment: 'Online', revenue: Math.round(totalRevenue * 0.20) }
      ];
      return { monthlySales, productPerformance, customerSegments };
    };

    const getFinancialDatasets = () => {
      const totalRevenue = productDetails.reduce((s, p) => s + (p.price || 0) * (p.quantity || 0) * 0.7, 0);
      const monthly = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, idx) => {
        const rev = Math.round(totalRevenue * (0.15 + idx * 0.02));
        const exp = Math.round(rev * 0.65);
        return { month: m, revenue: rev, expenses: exp, profit: rev - exp };
      });
      const expenseCategories = [
        { category: 'COGS', amount: Math.round(totalRevenue * 0.455) },
        { category: 'Operations', amount: Math.round(totalRevenue * 0.15) },
        { category: 'Marketing', amount: Math.round(totalRevenue * 0.065) },
        { category: 'Administration', amount: Math.round(totalRevenue * 0.065) }
      ];
      const cashFlow = monthly.map(m => ({ month: m.month, net: m.profit }));
      return { monthly, expenseCategories, cashFlow };
    };

    const getGSTDatasets = () => {
      const totalSales = productDetails.reduce((s, p) => s + (p.price || 0) * (p.quantity || 0) * 0.6, 0);
      const collected = totalSales * 0.18;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const monthlyGST = months.map(m => {
        const c = Math.round(collected / months.length);
        return { month: m, collected: c, paid: Math.round(c * 0.7), liability: Math.round(c * 0.3) };
      });
      const rateDistribution = [
        { rate: '18%', amount: Math.round(collected * 0.7) },
        { rate: '12%', amount: Math.round(collected * 0.2) },
        { rate: '5%', amount: Math.round(collected * 0.1) }
      ];
      const compliance = [
        { metric: 'Timely Filing', score: 98 },
        { metric: 'Accurate Returns', score: 95 },
        { metric: 'ITC Reconciliation', score: 92 },
        { metric: 'Documentation', score: 96 }
      ];
      return { monthlyGST, rateDistribution, compliance };
    };

  const renderSection = (id: string, titleIcon: string, title: string, content: React.ReactNode) => (
      <div id={id} className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '28px', marginRight: '12px' }}>{titleIcon}</div>
          <h3 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>{title}</h3>
        </div>
        {content}
      </div>
    );

    const grid = (children: React.ReactNode) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>{children}</div>
    );

    // Render for a single selected type
    const renderByType = (type: string) => {
      if (type === 'inventory') {
        const { categories, topProducts } = getInventoryDatasets();
        const series = topProducts.map(tp => ({ name: tp.name, value: tp.value }));
        
        // Stock level distribution for pie chart
        const stockLevels = [
          { name: 'High Stock (>50)', value: productDetails.filter(p => (p.quantity || 0) > 50).length, color: COLOR_SCHEME.success },
          { name: 'Medium Stock (21-50)', value: productDetails.filter(p => (p.quantity || 0) >= 21 && (p.quantity || 0) <= 50).length, color: COLOR_SCHEME.primary },
          { name: 'Low Stock (11-20)', value: productDetails.filter(p => (p.quantity || 0) >= 11 && (p.quantity || 0) <= 20).length, color: COLOR_SCHEME.warning },
          { name: 'Critical Stock (≤10)', value: productDetails.filter(p => (p.quantity || 0) <= 10).length, color: COLOR_SCHEME.danger }
        ].filter(item => item.value > 0);

        // Time-based stock data for area chart
        const stockTrend = [
          { month: 'Jan', currentStock: 850, reorderLevel: 200, excessStock: 150 },
          { month: 'Feb', currentStock: 920, reorderLevel: 220, excessStock: 180 },
          { month: 'Mar', currentStock: 780, reorderLevel: 200, excessStock: 120 },
          { month: 'Apr', currentStock: 1050, reorderLevel: 250, excessStock: 200 },
          { month: 'May', currentStock: 1200, reorderLevel: 280, excessStock: 240 },
          { month: 'Jun', currentStock: 1100, reorderLevel: 260, excessStock: 220 }
        ];

        return renderSection(
          'inventory-charts',
          '📦',
          'Inventory Analytics — Best Chart Selection',
          grid(
            <>
              {/* PIE CHART - Perfect for Category Distribution (shows proportions clearly) */}
              <div className="chart-container">
                <h4 style={{ marginBottom: '16px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🥧 Category Distribution
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>
                    (Pie Chart - Best for proportions)
                  </span>
                </h4>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={categories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, value }) => `${name}: ${value} (${((percent || 0) * 100).toFixed(1)}%)`}
                      outerRadius={120}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="rgba(255,255,255,0.8)"
                      strokeWidth={2}
                    >
                      {categories.map((entry, index) => (
                        <Cell 
                          key={`pie-cell-${index}`} 
                          fill={getChartColors(theme)[index % getChartColors(theme).length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: any) => [`${value} products`, name]}
                      contentStyle={{
                        background: chartConfig.tooltipBg,
                        border: `1px solid ${chartConfig.tooltipBorder}`,
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  📊 <strong>Why Pie Chart:</strong> Perfect for showing category proportions and percentages at a glance
                </div>
              </div>

              {/* DONUT CHART - Perfect for Stock Level Status */}
              <div className="chart-container">
                <h4 style={{ marginBottom: '16px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🍩 Stock Level Status
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>
                    (Donut Chart - Best for status overview)
                  </span>
                </h4>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={stockLevels}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, value }) => `${name}: ${value} (${((percent || 0) * 100).toFixed(1)}%)`}
                      outerRadius={120}
                      innerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth={3}
                    >
                      {stockLevels.map((entry, index) => (
                        <Cell key={`donut-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: any) => [`${value} products`, name]}
                      contentStyle={{
                        background: chartConfig.tooltipBg,
                        border: `1px solid ${chartConfig.tooltipBorder}`,
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  🍩 <strong>Why Donut Chart:</strong> Excellent for showing stock health status with clear color coding
                  <br />
                  Status: <span style={{ color: COLOR_SCHEME.success }}>● High</span> 
                  <span style={{ color: COLOR_SCHEME.primary }}> ● Medium</span> 
                  <span style={{ color: COLOR_SCHEME.warning }}> ● Low</span> 
                  <span style={{ color: COLOR_SCHEME.danger }}> ● Critical</span>
                </div>
              </div>

              {/* AREA CHART - Perfect for Stock Trends Over Time */}
              <div className="chart-container">
                <h4 style={{ marginBottom: '16px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📈 Stock Trend Analysis
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>
                    (Area Chart - Best for trends over time)
                  </span>
                </h4>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={stockTrend} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLOR_SCHEME.primary} stopOpacity={0.8}/>
                        <stop offset="100%" stopColor={COLOR_SCHEME.primary} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="reorderGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLOR_SCHEME.warning} stopOpacity={0.6}/>
                        <stop offset="100%" stopColor={COLOR_SCHEME.warning} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.gridColor} />
                    <XAxis dataKey="month" stroke={chartConfig.textColor} fontSize={12} />
                    <YAxis stroke={chartConfig.textColor} fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        background: chartConfig.tooltipBg,
                        border: `1px solid ${chartConfig.tooltipBorder}`,
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area 
                      type="monotone" 
                      dataKey="currentStock" 
                      stroke={COLOR_SCHEME.primary}
                      strokeWidth={3}
                      fill="url(#stockGradient)"
                      name="Current Stock Level"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="reorderLevel" 
                      stroke={COLOR_SCHEME.warning}
                      strokeWidth={2}
                      fill="url(#reorderGradient)"
                      name="Reorder Level"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  📈 <strong>Why Area Chart:</strong> Perfect for showing stock trends, seasonality, and reorder patterns over time
                  <br />
                  Trend Lines: <span style={{ color: COLOR_SCHEME.primary }}>● Current Stock</span> 
                  <span style={{ color: COLOR_SCHEME.warning }}> ● Reorder Level</span>
                </div>
              </div>

              {/* HORIZONTAL BAR CHART - Perfect for Top Products Ranking */}
              <div className="chart-container">
                <h4 style={{ marginBottom: '16px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🏆 Top Products by Value
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>
                    (Horizontal Bar - Best for rankings)
                  </span>
                </h4>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={series} 
                    layout="horizontal"
                    margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.gridColor} />
                    <XAxis 
                      type="number"
                      stroke={chartConfig.textColor} 
                      fontSize={12}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name" 
                      stroke={chartConfig.textColor} 
                      fontSize={11}
                      width={70}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Product Value']}
                      contentStyle={{
                        background: chartConfig.tooltipBg,
                        border: `1px solid ${chartConfig.tooltipBorder}`,
                        borderRadius: '12px'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      name="Product Value (₹)"
                      radius={[0, 6, 6, 0]}
                      strokeWidth={1}
                    >
                      {series.map((entry, index) => {
                        // Performance-based color coding
                        const value = entry.value || 0;
                        const maxValue = Math.max(...series.map(s => s.value || 0));
                        const performance = maxValue > 0 ? value / maxValue : 0;
                        
                        let color = COLOR_SCHEME.primary;
                        if (performance >= 0.75) color = COLOR_SCHEME.success;        // Top 25% - Green
                        else if (performance >= 0.5) color = COLOR_SCHEME.primary;   // 50-75% - Blue
                        else if (performance >= 0.25) color = COLOR_SCHEME.warning;  // 25-50% - Orange
                        else color = COLOR_SCHEME.danger;                            // Bottom 25% - Red
                        
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={color}
                            stroke={color}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  🏆 <strong>Why Horizontal Bar:</strong> Perfect for product rankings - easier to read product names
                  <br />
                  Performance: <span style={{ color: COLOR_SCHEME.success }}>● Top Performers</span> 
                  <span style={{ color: COLOR_SCHEME.primary }}> ● Good</span> 
                  <span style={{ color: COLOR_SCHEME.warning }}> ● Average</span> 
                  <span style={{ color: COLOR_SCHEME.danger }}> ● Poor</span>
                </div>
              </div>
            </>
          )
        );
      }

      if (type === 'sales') {
        const { monthlySales, productPerformance, customerSegments } = getSalesDatasets();
        const totalSales = monthlySales.reduce((s, m) => s + m.sales, 0);
        const topSegment = [...customerSegments].sort((a,b)=>b.revenue-a.revenue)[0];
        
        // Enhanced data for different chart types
        const salesTrendData = monthlySales.map((item, index) => ({
          ...item,
          growth: index > 0 ? ((item.sales - monthlySales[index - 1].sales) / monthlySales[index - 1].sales * 100) : 0
        }));

        const performanceRadarData = productPerformance.slice(0, 5).map(p => ({
          product: p.name.substring(0, 8),
          sales: Math.round(p.sales / 1000), // Normalize for radar
          margin: p.margin,
          customer_rating: 70 + (p.sales % 30),
          inventory_turnover: 50 + (p.margin % 40),
          market_share: 30 + (p.sales % 50)
        }));

        return renderSection(
          'sales-charts',
          '💰',
          'Sales Performance — Optimized Chart Selection',
          grid(
            <>
              {/* LINE CHART - Perfect for Sales Trends Over Time */}
              <div className="chart-container">
                <h4 style={{ marginBottom: '16px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📈 Sales Trend Analysis
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>
                    (Line Chart - Best for time series trends)
                  </span>
                </h4>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={salesTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.gridColor} />
                    <XAxis dataKey="month" stroke={chartConfig.textColor} fontSize={12} />
                    <YAxis stroke={chartConfig.textColor} fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        background: chartConfig.tooltipBg,
                        border: `1px solid ${chartConfig.tooltipBorder}`,
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke={COLOR_SCHEME.success}
                      strokeWidth={4}
                      dot={{ fill: COLOR_SCHEME.success, strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: COLOR_SCHEME.success, strokeWidth: 3 }}
                      name="Actual Sales (₹)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke={COLOR_SCHEME.warning}
                      strokeWidth={3}
                      strokeDasharray="8 8"
                      dot={{ fill: COLOR_SCHEME.warning, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: COLOR_SCHEME.warning, strokeWidth: 2 }}
                      name="Sales Target (₹)"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  📈 <strong>Why Line Chart:</strong> Perfect for showing sales trends, growth patterns, and target comparison over time
                  <br />
                  Summary: Total Sales Rs. {totalSales.toLocaleString('en-IN')} · 
                  <span style={{ color: COLOR_SCHEME.success }}> ● Actual Sales</span> vs 
                  <span style={{ color: COLOR_SCHEME.warning }}> ● Target (Dashed)</span>
                </div>
              </div>

              {/* RADAR CHART - Perfect for Multi-dimensional Product Performance */}
              <div className="chart-container">
                <h4 style={{ marginBottom: '16px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🎯 Product Performance Matrix
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>
                    (Radar Chart - Best for multi-metric comparison)
                  </span>
                </h4>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={performanceRadarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                    <PolarGrid stroke={chartConfig.gridColor} />
                    <PolarAngleAxis 
                      dataKey="product" 
                      tick={{ fontSize: 11, fill: chartConfig.textColor }}
                    />
                    <PolarRadiusAxis 
                      tick={{ fontSize: 10, fill: chartConfig.textColor }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{
                        background: chartConfig.tooltipBg,
                        border: `1px solid ${chartConfig.tooltipBorder}`,
                        borderRadius: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Radar
                      name="Sales Performance"
                      dataKey="sales"
                      stroke={COLOR_SCHEME.success}
                      fill={COLOR_SCHEME.success}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Profit Margin"
                      dataKey="margin"
                      stroke={COLOR_SCHEME.primary}
                      fill={COLOR_SCHEME.primary}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Customer Rating"
                      dataKey="customer_rating"
                      stroke={COLOR_SCHEME.warning}
                      fill={COLOR_SCHEME.warning}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  🎯 <strong>Why Radar Chart:</strong> Perfect for comparing multiple performance metrics across products simultaneously
                  <br />
                  Metrics: <span style={{ color: COLOR_SCHEME.success }}>● Sales</span> 
                  <span style={{ color: COLOR_SCHEME.primary }}> ● Margin</span> 
                  <span style={{ color: COLOR_SCHEME.warning }}> ● Rating</span>
                </div>
              </div>

              {/* STACKED AREA CHART - Perfect for Customer Segment Growth */}
              <div className="chart-container">
                <h4 style={{ marginBottom: '16px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  👥 Customer Segment Growth
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>
                    (Stacked Area - Best for segment composition over time)
                  </span>
                </h4>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart 
                    data={[
                      { month: 'Jan', Retail: 45000, Wholesale: 35000, Online: 20000 },
                      { month: 'Feb', Retail: 52000, Wholesale: 38000, Online: 25000 },
                      { month: 'Mar', Retail: 48000, Wholesale: 32000, Online: 28000 },
                      { month: 'Apr', Retail: 61000, Wholesale: 42000, Online: 32000 },
                      { month: 'May', Retail: 68000, Wholesale: 45000, Online: 38000 },
                      { month: 'Jun', Retail: 65000, Wholesale: 48000, Online: 42000 }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="retailGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLOR_SCHEME.success} stopOpacity={0.8}/>
                        <stop offset="100%" stopColor={COLOR_SCHEME.success} stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="wholesaleGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLOR_SCHEME.primary} stopOpacity={0.8}/>
                        <stop offset="100%" stopColor={COLOR_SCHEME.primary} stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="onlineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLOR_SCHEME.warning} stopOpacity={0.8}/>
                        <stop offset="100%" stopColor={COLOR_SCHEME.warning} stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.gridColor} />
                    <XAxis dataKey="month" stroke={chartConfig.textColor} fontSize={12} />
                    <YAxis stroke={chartConfig.textColor} fontSize={12} />
                    <Tooltip 
                      formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, '']}
                      contentStyle={{
                        background: chartConfig.tooltipBg,
                        border: `1px solid ${chartConfig.tooltipBorder}`,
                        borderRadius: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area
                      type="monotone"
                      dataKey="Retail"
                      stackId="1"
                      stroke={COLOR_SCHEME.success}
                      fill="url(#retailGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="Wholesale"
                      stackId="1"
                      stroke={COLOR_SCHEME.primary}
                      fill="url(#wholesaleGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="Online"
                      stackId="1"
                      stroke={COLOR_SCHEME.warning}
                      fill="url(#onlineGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  📊 <strong>Why Stacked Area:</strong> Perfect for showing customer segment contribution and growth patterns over time
                  <br />
                  Segments: <span style={{ color: COLOR_SCHEME.success }}>● Retail</span> 
                  <span style={{ color: COLOR_SCHEME.primary }}> ● Wholesale</span> 
                  <span style={{ color: COLOR_SCHEME.warning }}> ● Online</span>
                </div>
              </div>

              {/* COMPOSED CHART - Perfect for Sales vs Targets with Growth Rate */}
              <div className="chart-container">
                <h4 style={{ marginBottom: '16px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📊 Sales Performance Dashboard
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>
                    (Combined Chart - Best for multiple data types)
                  </span>
                </h4>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={salesTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.gridColor} />
                    <XAxis dataKey="month" stroke={chartConfig.textColor} fontSize={12} />
                    <YAxis yAxisId="sales" stroke={chartConfig.textColor} fontSize={12} />
                    <YAxis yAxisId="growth" orientation="right" stroke={chartConfig.textColor} fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        background: chartConfig.tooltipBg,
                        border: `1px solid ${chartConfig.tooltipBorder}`,
                        borderRadius: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar 
                      yAxisId="sales"
                      dataKey="sales" 
                      fill={COLOR_SCHEME.success}
                      name="Actual Sales (₹)"
                      radius={[4,4,0,0]}
                      fillOpacity={0.8}
                    />
                    <Bar 
                      yAxisId="sales"
                      dataKey="target" 
                      fill={COLOR_SCHEME.warning}
                      name="Sales Target (₹)"
                      radius={[4,4,0,0]}
                      fillOpacity={0.6}
                    />
                    <Line 
                      yAxisId="growth"
                      type="monotone" 
                      dataKey="growth" 
                      stroke={COLOR_SCHEME.danger}
                      strokeWidth={3}
                      dot={{ fill: COLOR_SCHEME.danger, strokeWidth: 2, r: 5 }}
                      name="Growth Rate (%)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  📊 <strong>Why Combined Chart:</strong> Perfect for showing sales bars with growth trend line - multiple data types together
                  <br />
                  Data Types: <span style={{ color: COLOR_SCHEME.success }}>● Sales (Bar)</span> 
                  <span style={{ color: COLOR_SCHEME.warning }}> ● Target (Bar)</span> 
                  <span style={{ color: COLOR_SCHEME.danger }}> ● Growth % (Line)</span>
                </div>
              </div>
            </>
          )
        );
      }

      if (type === 'financial') {
        const { monthly, expenseCategories, cashFlow } = getFinancialDatasets();
        const totalRev = monthly.reduce((s,m)=> s+m.revenue,0);
        const totalExp = monthly.reduce((s,m)=> s+m.expenses,0);
        const topExpense = [...expenseCategories].sort((a,b)=> b.amount-a.amount)[0];
        
        // Enhanced financial data for different chart types
        const profitLossData = monthly.map(m => ({
          ...m,
          grossProfit: m.revenue * 0.6,
          netProfit: m.profit,
          profitMargin: m.revenue > 0 ? (m.profit / m.revenue * 100) : 0
        }));

        const cumulativeCashFlow = cashFlow.map((item, index) => ({
          ...item,
          cumulative: cashFlow.slice(0, index + 1).reduce((sum, cf) => sum + cf.net, 0)
        }));

        return renderSection(
          'financial-charts',
          '📈',
          'Financial Overview — Strategic Chart Selection',
          grid(
            <>
              {/* STACKED COLUMN CHART - Perfect for Revenue vs Expenses Comparison */}
              <div className="chart-container">
                <h4 style={{ marginBottom: '16px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📊 Revenue vs Expenses Breakdown
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>
                    (Stacked Column - Best for component comparison)
                  </span>
                </h4>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={monthly} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.gridColor} />
                    <XAxis dataKey="month" stroke={chartConfig.textColor} fontSize={12} />
                    <YAxis stroke={chartConfig.textColor} fontSize={12} />
                    <Tooltip 
                      formatter={(value: any, name: any) => [`₹${value.toLocaleString('en-IN')}`, name]}
                      contentStyle={{
                        background: chartConfig.tooltipBg,
                        border: `1px solid ${chartConfig.tooltipBorder}`,
                        borderRadius: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar 
                      dataKey="revenue" 
                      fill={COLOR_SCHEME.success}
                      name="Revenue (₹)"
                      radius={[4,4,0,0]}
                      fillOpacity={0.8}
                    />
                    <Bar 
                      dataKey="expenses" 
                      fill={COLOR_SCHEME.danger}
                      name="Expenses (₹)"
                      radius={[4,4,0,0]}
                      fillOpacity={0.8}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke={COLOR_SCHEME.primary}
                      strokeWidth={4}
                      dot={{ fill: COLOR_SCHEME.primary, strokeWidth: 2, r: 6 }}
                      name="Net Profit (₹)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  📊 <strong>Why Combined Chart:</strong> Perfect for showing revenue/expense bars with profit trend line
                  <br />
                  Summary: Total Revenue ₹{totalRev.toLocaleString('en-IN')} · Expenses ₹{totalExp.toLocaleString('en-IN')} · 
                  Net ₹{(totalRev-totalExp).toLocaleString('en-IN')}
                </div>
              </div>

              {/* PIE CHART - Perfect for Expense Distribution */}
              <div className="chart-container">
                <h4 style={{ marginBottom: '16px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🥧 Expense Distribution
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>
                    (Pie Chart - Best for expense proportions)
                  </span>
                </h4>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent, amount }) => `${category}: ₹${amount.toLocaleString('en-IN')} (${((percent || 0) * 100).toFixed(1)}%)`}
                      outerRadius={120}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="amount"
                      stroke="rgba(255,255,255,0.8)"
                      strokeWidth={2}
                    >
                      {expenseCategories.map((entry, index) => {
                        const expenseColors = [
                          COLOR_SCHEME.danger,    // COGS - Red (Highest priority)
                          COLOR_SCHEME.warning,   // Operations - Orange (Medium)
                          COLOR_SCHEME.primary,   // Marketing - Blue (Regular)
                          COLOR_SCHEME.success,   // Admin - Green (Lower priority)
                        ];
                        return (
                          <Cell 
                            key={`pie-expense-${index}`} 
                            fill={expenseColors[index % expenseColors.length]}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: any) => [`₹${value.toLocaleString('en-IN')}`, name]}
                      contentStyle={{
                        background: chartConfig.tooltipBg,
                        border: `1px solid ${chartConfig.tooltipBorder}`,
                        borderRadius: '12px'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  🥧 <strong>Why Pie Chart:</strong> Perfect for showing expense category proportions and budget allocation
                  <br />
                  Top Expense: {topExpense?.category} (₹{topExpense?.amount.toLocaleString('en-IN')}) · 
                  <span style={{ color: COLOR_SCHEME.danger }}>● High</span> 
                  <span style={{ color: COLOR_SCHEME.warning }}> ● Medium</span> 
                  <span style={{ color: COLOR_SCHEME.primary }}> ● Regular</span> 
                  <span style={{ color: COLOR_SCHEME.success }}> ● Low</span>
                </div>
              </div>

              {/* LINE CHART - Perfect for Cash Flow Trends */}
              <div className="chart-container">
                <h4 style={{ marginBottom: '16px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  💧 Cash Flow Analysis
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>
                    (Line Chart - Best for cash flow trends)
                  </span>
                </h4>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={cumulativeCashFlow} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.gridColor} />
                    <XAxis dataKey="month" stroke={chartConfig.textColor} fontSize={12} />
                    <YAxis stroke={chartConfig.textColor} fontSize={12} />
                    <Tooltip 
                      formatter={(value: any, name: any) => [`₹${value.toLocaleString('en-IN')}`, name]}
                      contentStyle={{
                        background: chartConfig.tooltipBg,
                        border: `1px solid ${chartConfig.tooltipBorder}`,
                        borderRadius: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="net" 
                      stroke={COLOR_SCHEME.primary}
                      strokeWidth={4}
                      dot={{ fill: COLOR_SCHEME.primary, strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: COLOR_SCHEME.primary, strokeWidth: 3 }}
                      name="Monthly Cash Flow (₹)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke={COLOR_SCHEME.success}
                      strokeWidth={3}
                      strokeDasharray="8 8"
                      dot={{ fill: COLOR_SCHEME.success, strokeWidth: 2, r: 4 }}
                      name="Cumulative Cash Flow (₹)"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  💧 <strong>Why Line Chart:</strong> Perfect for tracking cash flow patterns, trends, and cumulative position
                  <br />
                  Best Month: {cashFlow.reduce((a,b)=> a.net>b.net?a:b, cashFlow[0])?.month} · 
                  <span style={{ color: COLOR_SCHEME.primary }}>● Monthly Flow</span> 
                  <span style={{ color: COLOR_SCHEME.success }}> ● Cumulative (Dashed)</span>
                </div>
              </div>

              {/* WATERFALL-STYLE CHART - Perfect for Profit Analysis */}
              <div className="chart-container">
                <h4 style={{ marginBottom: '16px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📈 Profit Margin Analysis
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>
                    (Multi-metric Chart - Best for profitability trends)
                  </span>
                </h4>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={profitLossData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.gridColor} />
                    <XAxis dataKey="month" stroke={chartConfig.textColor} fontSize={12} />
                    <YAxis yAxisId="amount" stroke={chartConfig.textColor} fontSize={12} />
                    <YAxis yAxisId="percent" orientation="right" stroke={chartConfig.textColor} fontSize={12} />
                    <Tooltip 
                      formatter={(value: any, name: any) => {
                        if (name.includes('Margin')) return [`${value.toFixed(1)}%`, name];
                        return [`₹${value.toLocaleString('en-IN')}`, name];
                      }}
                      contentStyle={{
                        background: chartConfig.tooltipBg,
                        border: `1px solid ${chartConfig.tooltipBorder}`,
                        borderRadius: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar 
                      yAxisId="amount"
                      dataKey="grossProfit" 
                      fill={COLOR_SCHEME.success}
                      name="Gross Profit (₹)"
                      radius={[4,4,0,0]}
                      fillOpacity={0.7}
                    />
                    <Bar 
                      yAxisId="amount"
                      dataKey="netProfit" 
                      fill={COLOR_SCHEME.primary}
                      name="Net Profit (₹)"
                      radius={[4,4,0,0]}
                      fillOpacity={0.8}
                    />
                    <Line 
                      yAxisId="percent"
                      type="monotone" 
                      dataKey="profitMargin" 
                      stroke={COLOR_SCHEME.warning}
                      strokeWidth={4}
                      dot={{ fill: COLOR_SCHEME.warning, strokeWidth: 2, r: 6 }}
                      name="Profit Margin (%)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  📈 <strong>Why Multi-metric Chart:</strong> Perfect for analyzing profitability with both amounts and percentages
                  <br />
                  Profitability: <span style={{ color: COLOR_SCHEME.success }}>● Gross Profit</span> 
                  <span style={{ color: COLOR_SCHEME.primary }}> ● Net Profit</span> 
                  <span style={{ color: COLOR_SCHEME.warning }}> ● Margin %</span>
                </div>
              </div>
            </>
          )
        );
      }

      if (type === 'gst') {
        const { monthlyGST, rateDistribution, compliance } = getGSTDatasets();
        const totalCollected = monthlyGST.reduce((s,m)=> s+m.collected,0);
        
        // Enhanced GST data for different chart types
        const gstTrendData = monthlyGST.map((item, index) => ({
          ...item,
          netLiability: item.collected - item.paid,
          complianceRate: 85 + (index * 2) // Sample compliance rate
        }));

        const complianceRadarData = [
          {
            metric: 'Filing',
            score: 98,
            maxScore: 100
          },
          {
            metric: 'Returns',
            score: 95,
            maxScore: 100
          },
          {
            metric: 'ITC',
            score: 92,
            maxScore: 100
          },
          {
            metric: 'Documentation',
            score: 96,
            maxScore: 100
          },
          {
            metric: 'Payments',
            score: 94,
            maxScore: 100
          }
        ];

        return renderSection(
          'gst-charts',
          '🧾',
          'Tax & Compliance — Regulatory Chart Selection',
          grid(
            <>
              {/* AREA CHART - Perfect for GST Trend Analysis */}
              <div className="chart-container">
                <h4 style={{ marginBottom: '16px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📈 GST Collection Trends
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>
                    (Area Chart - Best for tax trends over time)
                  </span>
                </h4>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={gstTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLOR_SCHEME.success} stopOpacity={0.8}/>
                        <stop offset="100%" stopColor={COLOR_SCHEME.success} stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="liabilityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLOR_SCHEME.warning} stopOpacity={0.6}/>
                        <stop offset="100%" stopColor={COLOR_SCHEME.warning} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLOR_SCHEME.primary} stopOpacity={0.6}/>
                        <stop offset="100%" stopColor={COLOR_SCHEME.primary} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.gridColor} />
                    <XAxis dataKey="month" stroke={chartConfig.textColor} fontSize={12} />
                    <YAxis stroke={chartConfig.textColor} fontSize={12} />
                    <Tooltip 
                      formatter={(value: any, name: any) => [`₹${value.toLocaleString('en-IN')}`, name]}
                      contentStyle={{
                        background: chartConfig.tooltipBg,
                        border: `1px solid ${chartConfig.tooltipBorder}`,
                        borderRadius: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area 
                      type="monotone" 
                      dataKey="collected" 
                      stackId="1"
                      stroke={COLOR_SCHEME.success}
                      fill="url(#collectedGradient)"
                      strokeWidth={3}
                      name="GST Collected (₹)"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="paid" 
                      stackId="2"
                      stroke={COLOR_SCHEME.primary}
                      fill="url(#paidGradient)"
                      strokeWidth={2}
                      name="GST Paid (₹)"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="liability" 
                      stackId="3"
                      stroke={COLOR_SCHEME.warning}
                      fill="url(#liabilityGradient)"
                      strokeWidth={2}
                      name="GST Liability (₹)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  📈 <strong>Why Area Chart:</strong> Perfect for showing GST collection trends and cumulative tax obligations
                  <br />
                  Total Collected: ₹{totalCollected.toLocaleString('en-IN')} · 
                  <span style={{ color: COLOR_SCHEME.success }}>● Collected</span> 
                  <span style={{ color: COLOR_SCHEME.primary }}> ● Paid</span> 
                  <span style={{ color: COLOR_SCHEME.warning }}> ● Liability</span>
                </div>
              </div>

              {/* DONUT CHART - Perfect for GST Rate Distribution */}
              <div className="chart-container">
                <h4 style={{ marginBottom: '16px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🍩 GST Rate Structure
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>
                    (Donut Chart - Best for rate distribution)
                  </span>
                </h4>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={rateDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ rate, percent, amount }) => `${rate}: ₹${amount.toLocaleString('en-IN')} (${((percent || 0) * 100).toFixed(1)}%)`}
                      outerRadius={120}
                      innerRadius={60}
                      fill="#8884d8"
                      dataKey="amount"
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth={3}
                    >
                      {rateDistribution.map((entry, index) => {
                        const rate = parseFloat(entry.rate.replace('%', ''));
                        let color = COLOR_SCHEME.primary;
                        if (rate === 0) color = COLOR_SCHEME.success;      // 0% - Green (Exempt)
                        else if (rate <= 5) color = COLOR_SCHEME.primary;  // 5% - Blue (Low rate)
                        else if (rate <= 18) color = COLOR_SCHEME.warning; // 12%/18% - Orange (Medium rate)  
                        else color = COLOR_SCHEME.danger;                  // 28% - Red (Highest rate)
                        
                        return (
                          <Cell key={`donut-gst-${index}`} fill={color} />
                        );
                      })}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: any) => [`₹${value.toLocaleString('en-IN')}`, `${name} Tax`]}
                      contentStyle={{
                        background: chartConfig.tooltipBg,
                        border: `1px solid ${chartConfig.tooltipBorder}`,
                        borderRadius: '12px'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  🍩 <strong>Why Donut Chart:</strong> Perfect for visualizing GST rate structure and tax distribution
                  <br />
                  Rate Structure: <span style={{ color: COLOR_SCHEME.success }}>● 0% (Exempt)</span> 
                  <span style={{ color: COLOR_SCHEME.primary }}> ● 5% (Essential)</span> 
                  <span style={{ color: COLOR_SCHEME.warning }}> ● 12-18% (Standard)</span> 
                  <span style={{ color: COLOR_SCHEME.danger }}> ● 28% (Luxury)</span>
                </div>
              </div>

              {/* RADAR CHART - Perfect for Compliance Metrics */}
              <div className="chart-container">
                <h4 style={{ marginBottom: '16px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🎯 Compliance Score Matrix
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>
                    (Radar Chart - Best for multi-metric compliance)
                  </span>
                </h4>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={complianceRadarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                    <PolarGrid stroke={chartConfig.gridColor} />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      tick={{ fontSize: 12, fill: chartConfig.textColor }}
                    />
                    <PolarRadiusAxis 
                      tick={{ fontSize: 10, fill: chartConfig.textColor }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      formatter={(value: any, name: any) => [`${value}%`, name]}
                      contentStyle={{
                        background: chartConfig.tooltipBg,
                        border: `1px solid ${chartConfig.tooltipBorder}`,
                        borderRadius: '12px'
                      }}
                    />
                    <Radar
                      name="Current Score"
                      dataKey="score"
                      stroke={COLOR_SCHEME.success}
                      fill={COLOR_SCHEME.success}
                      fillOpacity={0.4}
                      strokeWidth={3}
                      dot={{ r: 6, strokeWidth: 2, fill: COLOR_SCHEME.success }}
                    />
                    <Radar
                      name="Target Score"
                      dataKey="maxScore"
                      stroke={COLOR_SCHEME.primary}
                      fill={COLOR_SCHEME.primary}
                      fillOpacity={0.1}
                      strokeWidth={2}
                      strokeDasharray="8 8"
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  🎯 <strong>Why Radar Chart:</strong> Perfect for visualizing compliance performance across multiple regulatory areas
                  <br />
                  Average Score: {Math.round(complianceRadarData.reduce((s,c)=> s+c.score,0)/complianceRadarData.length)}% · 
                  <span style={{ color: COLOR_SCHEME.success }}>● Current</span> 
                  <span style={{ color: COLOR_SCHEME.primary }}> ● Target (Dashed)</span>
                </div>
              </div>

              {/* PROGRESS BAR CHART - Perfect for Individual Compliance Metrics */}
              <div className="chart-container">
                <h4 style={{ marginBottom: '16px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ✅ Detailed Compliance Status
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>
                    (Horizontal Progress - Best for individual metrics)
                  </span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 0' }}>
                  {compliance.map((item, index) => {
                    let color = COLOR_SCHEME.primary;
                    if (item.score >= 95) color = COLOR_SCHEME.success;      // Excellent - Green
                    else if (item.score >= 85) color = COLOR_SCHEME.primary; // Good - Blue
                    else if (item.score >= 70) color = COLOR_SCHEME.warning; // Satisfactory - Orange
                    else color = COLOR_SCHEME.danger;                        // Critical - Red

                    return (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ 
                          minWidth: '140px', 
                          fontSize: '14px', 
                          fontWeight: '500',
                          color: 'var(--text)'
                        }}>
                          {item.metric}
                        </div>
                        <div style={{ 
                          flex: 1, 
                          height: '20px', 
                          background: chartConfig.gridColor,
                          borderRadius: '10px',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          <div style={{
                            width: `${item.score}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                            borderRadius: '10px',
                            transition: 'width 0.8s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingRight: '8px'
                          }}>
                            <span style={{ 
                              fontSize: '11px', 
                              fontWeight: '600', 
                              color: 'white',
                              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                            }}>
                              {item.score}%
                            </span>
                          </div>
                        </div>
                        <div style={{ 
                          minWidth: '80px', 
                          fontSize: '12px', 
                          color: color,
                          fontWeight: '600'
                        }}>
                          {item.score >= 95 ? '🟢 Excellent' :
                           item.score >= 85 ? '🔵 Good' :
                           item.score >= 70 ? '🟠 Satisfactory' : '🔴 Critical'}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  ✅ <strong>Why Progress Bars:</strong> Perfect for showing individual compliance metric performance with clear visual status
                  <br />
                  Status Levels: <span style={{ color: COLOR_SCHEME.success }}>● Excellent (95%+)</span> 
                  <span style={{ color: COLOR_SCHEME.primary }}> ● Good (85%+)</span> 
                  <span style={{ color: COLOR_SCHEME.warning }}> ● Satisfactory (70%+)</span> 
                  <span style={{ color: COLOR_SCHEME.danger }}> ● Critical (&lt;70%)</span>
                </div>
              </div>
            </>
          )
        );
      }
      return null;
    };

    if (selectedReportType === 'detailed') {
      return (
        <>
          {renderByType('inventory')}
          {renderByType('sales')}
          {renderByType('financial')}
          {renderByType('gst')}
        </>
      );
    }

    return renderByType(selectedReportType);
  }, [reportData, selectedReportType, productDetails]);

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title page-title--solid">Advanced Reports & Analytics</h1>
            <p className="page-description">Comprehensive business intelligence with advanced filtering & detailed insights</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="btn-secondary">
              {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button onClick={generateReport} disabled={isGenerating} className="btn-primary">
              {isGenerating ? 'Generating…' : 'Generate Report'}
            </button>
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="glass-card" style={{ padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {REPORT_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedReportType(type.id)}
                className={`report-tab ${selectedReportType === type.id ? 'active' : ''}`}
                style={{
                  textAlign: 'left',
                  padding: '16px',
                  borderRadius: '12px',
                  border: selectedReportType === type.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: selectedReportType === type.id ? 'var(--primary-light)' : 'var(--surface)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>{type.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0' }}>{type.name}</h3>
                <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-muted)' }}>{type.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                  {type.features.map(feature => (
                    <span key={feature} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      {feature}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <AdvancedFilters
          filters={advancedFilters}
          availableFilters={availableFilters}
          onFilterChange={updateFilter}
          onReset={resetFilters}
          onApplyDateRange={applyDateRangePreset}
          dateRange={dateRange}
          onDateChange={handleDateChange}
        />
      )}

  {/* View Mode removed: charts and summary shown by default */}

  {/* Charts */}
      {renderCharts}

      {/* Summary */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: 0, marginBottom: '16px', color: 'var(--text)' }}>Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Records</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{productDetails.length}</div>
          </div>
          <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Value</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>₹{productDetails.reduce((s, p) => s + (p.price || 0) * (p.quantity || 0), 0).toLocaleString('en-IN')}</div>
          </div>
          <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Categories</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{new Set(productDetails.map(p => p.category).filter(Boolean)).size}</div>
          </div>
          <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Suppliers</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{new Set(productDetails.map(p => p.supplier).filter(Boolean)).size}</div>
          </div>
        </div>
      </div>

      {/* Export Section - Shown for all report types; Detailed combines all sections */}
      <ExportButtons
        data={reportData}
        products={productDetails}
        reportType={selectedReportType}
        dateRange={dateRange}
        isLoading={isGenerating}
      />

  {/* Detailed Product Data - Only for Detailed Report */}
  {selectedReportType === 'detailed' && (
        <ProductDataTable 
          products={productDetails} 
          isLoading={isGenerating}
        />
      )}

      {/* Loading State */}
      {isGenerating && (
  <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
          <h3 style={{ marginBottom: '8px', color: 'var(--text)' }}>
            Generating Advanced Analytics...
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
            Processing filters and calculating comprehensive business insights
          </p>
          <div style={{
            width: '200px',
            height: '4px',
            background: 'var(--border)',
            borderRadius: '2px',
            margin: '0 auto',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '60px',
              height: '100%',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-600))',
              borderRadius: '2px',
              animation: 'loading 1.5s infinite'
            }} />
          </div>
        </div>
      )}

      {/* No Data State */}
      {!isGenerating && !reportData && (
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <h3 style={{ marginBottom: '8px', color: 'var(--text)' }}>
            Ready to Generate Insights
          </h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Select your desired report type and filters, then click "Generate Report" to begin
          </p>
        </div>
      )}

      <style>
        {`
          @keyframes loading {
            0% { transform: translateX(-100px); }
            100% { transform: translateX(300px); }
          }
        `}
      </style>
    </div>
  );
};

export default ReportsEnhanced;
