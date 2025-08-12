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
import reportService from '../services/reportService_new';
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
  gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  color: 'var(--danger)',
    features: ['Revenue Trends', 'Customer Segmentation', 'Product Performance', 'Seasonal Analysis']
  },
  { 
    id: 'financial', 
    name: 'Financial Overview', 
    icon: '📈', 
    description: 'P&L analysis, cash flow, margins & profitability insights',
  gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  color: 'var(--info)',
    features: ['Profit Analysis', 'Cost Tracking', 'ROI Metrics', 'Budget Variance']
  },
  { 
    id: 'gst', 
    name: 'Tax & Compliance', 
    icon: '🧾', 
    description: 'GST reports, tax compliance & regulatory filings',
  gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
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
  '#667eea', '#f5576c', '#4facfe', '#43e97b', '#fa709a', '#764ba2',
  '#ffd89b', '#19547b', '#667db6', '#84fab0', '#8fd3f4', '#96e6a1'
];

interface AvailableFiltersType {
  categories: string[];
  suppliers: string[];
  locations: string[];
}

const ReportsEnhanced: React.FC = () => {
  const { formatCurrency } = useCurrency();
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
      const categoryMap: Record<string, number> = {};
      productDetails.forEach(p => {
        const key = p.category || 'Uncategorized';
        categoryMap[key] = (categoryMap[key] || 0) + (p.quantity || 0);
      });
      const categories = Object.entries(categoryMap).map(([name, value], i) => ({
        name,
        value,
        color: CHART_COLORS[i % CHART_COLORS.length]
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>{children}</div>
    );

    // Render for a single selected type
    const renderByType = (type: string) => {
      if (type === 'inventory') {
        const { categories, topProducts } = getInventoryDatasets();
        const series = topProducts.map(tp => ({ name: tp.name, value: tp.value }));
        return renderSection(
          'inventory-charts',
          '📦',
          'Inventory Analytics — Analytics',
          grid(
            <>
              <div>
                <h4 style={{ marginBottom: '16px', color: 'var(--text)' }}>📊 Category Distribution</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={categories} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">
                      {categories.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 style={{ marginBottom: '16px', color: 'var(--text)' }}>📦 Stock by Category</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categories}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} interval={0} angle={-10} dy={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="value" fill="var(--primary)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 style={{ marginBottom: '16px', color: 'var(--text)' }}>🏆 Top Products by Value</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="var(--success)" fill="var(--success)" fillOpacity={0.25} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )
        );
      }

      if (type === 'sales') {
        const { monthlySales, productPerformance, customerSegments } = getSalesDatasets();
        const totalSales = monthlySales.reduce((s, m) => s + m.sales, 0);
        const topSegment = [...customerSegments].sort((a,b)=>b.revenue-a.revenue)[0];
        const renderPieLabel = ({ name, percent, value }: any) => `${name}: Rs. ${value.toLocaleString('en-IN')} (${(percent*100).toFixed(0)}%)`;
        return renderSection(
          'sales-charts',
          '💰',
          'Sales Performance — Analytics',
          grid(
            <>
              <div>
                <h4 style={{ marginBottom: '16px', color: 'var(--text)' }}>📈 Monthly Sales vs Target</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={monthlySales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" />
                    <Tooltip />
                    <Bar dataKey="sales" fill="var(--primary)" radius={[4,4,0,0]} />
                    <Line type="monotone" dataKey="target" stroke="var(--warning)" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  Summary: Total Sales (6 mo) Rs. {totalSales.toLocaleString('en-IN')} · Avg per month Rs. {(Math.round(totalSales/Math.max(1,monthlySales.length))).toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <h4 style={{ marginBottom: '16px', color: 'var(--text)' }}>🏅 Product Performance</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" />
                    <Tooltip />
                    <Bar dataKey="sales" fill="var(--success)" />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  Summary: Top product by revenue — {productPerformance[0]?.name || 'N/A'}
                </div>
              </div>
              <div>
                <h4 style={{ marginBottom: '16px', color: 'var(--text)' }}>👥 Customer Segments</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={customerSegments} dataKey="revenue" nameKey="segment" cx="50%" cy="50%" outerRadius={100} label={renderPieLabel}>
                      {customerSegments.map((s, idx)=> <Cell key={s.segment} fill={CHART_COLORS[idx%CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  Summary: Top segment — {topSegment?.segment} (Rs. {topSegment?.revenue.toLocaleString('en-IN')})
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
        const renderPieLabel = ({ name, value, percent }: any) => `${name}: Rs. ${value.toLocaleString('en-IN')} (${(percent*100).toFixed(0)}%)`;
        return renderSection(
          'financial-charts',
          '📈',
          'Financial Overview — Analytics',
          grid(
            <>
              <div>
                <h4 style={{ marginBottom: '16px', color: 'var(--text)' }}>💵 Revenue vs Expenses</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="expenses" stroke="var(--danger)" fill="var(--danger)" fillOpacity={0.15} />
                    <Line type="monotone" dataKey="profit" stroke="var(--success)" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  Summary: Total Revenue Rs. {totalRev.toLocaleString('en-IN')} · Total Expenses Rs. {totalExp.toLocaleString('en-IN')} · Net Rs. {(totalRev-totalExp).toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <h4 style={{ marginBottom: '16px', color: 'var(--text)' }}>🧾 Expense Categories</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={expenseCategories} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={renderPieLabel}>
                      {expenseCategories.map((e, idx)=>(<Cell key={e.category} fill={CHART_COLORS[idx%CHART_COLORS.length]} />))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  Summary: Top expense — {topExpense?.category} (Rs. {topExpense?.amount.toLocaleString('en-IN')})
                </div>
              </div>
              <div>
                <h4 style={{ marginBottom: '16px', color: 'var(--text)' }}>💧 Cash Flow (Net)</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={cashFlow}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" />
                    <Tooltip />
                    <Area type="monotone" dataKey="net" stroke="var(--info)" fill="var(--info)" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  Summary: Best month — {cashFlow.reduce((a,b)=> a.net>b.net?a:b, cashFlow[0])?.month}
                </div>
              </div>
            </>
          )
        );
      }

      if (type === 'gst') {
        const { monthlyGST, rateDistribution, compliance } = getGSTDatasets();
        const totalCollected = monthlyGST.reduce((s,m)=> s+m.collected,0);
        const renderPieLabel = ({ name, value, percent }: any) => `${name}: Rs. ${value.toLocaleString('en-IN')} (${(percent*100).toFixed(0)}%)`;
        return renderSection(
          'gst-charts',
          '🧾',
          'Tax & Compliance — Analytics',
          grid(
            <>
              <div>
                <h4 style={{ marginBottom: '16px', color: 'var(--text)' }}>📅 Monthly GST Trend</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={monthlyGST}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" />
                    <Tooltip />
                    <Bar dataKey="collected" fill="var(--primary)" />
                    <Line type="monotone" dataKey="liability" stroke="var(--danger)" />
                  </ComposedChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  Summary: GST Collected (6 mo) Rs. {totalCollected.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <h4 style={{ marginBottom: '16px', color: 'var(--text)' }}>📊 GST Rate Distribution</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={rateDistribution} dataKey="amount" nameKey="rate" cx="50%" cy="50%" outerRadius={100} label={renderPieLabel}>
                      {rateDistribution.map((r, idx)=>(<Cell key={r.rate} fill={CHART_COLORS[idx%CHART_COLORS.length]} />))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 style={{ marginBottom: '16px', color: 'var(--text)' }}>✅ Compliance Metrics</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={compliance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="metric" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" />
                    <Tooltip />
                    <Bar dataKey="score" fill="var(--success)" />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  Summary: Average compliance score {Math.round(compliance.reduce((s,c)=> s+c.score,0)/Math.max(1,compliance.length))}%
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
                style={{
                  textAlign: 'left',
                  padding: '16px',
                  borderRadius: '12px',
                  border: selectedReportType === type.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  cursor: 'pointer'
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
