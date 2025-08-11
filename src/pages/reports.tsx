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

  // Render charts based on report type and data
  const renderCharts = useMemo(() => {
    if (!reportData) return null;

    const selectedReport = REPORT_TYPES.find(r => r.id === selectedReportType);

    // Build derived datasets from productDetails for consistent visuals
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

    const series = topProducts.map((tp, i) => ({ index: i + 1, value: tp.value, name: tp.name }));

    const containerId = `${selectedReportType}-charts`;

    return (
      <div id={containerId} className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '28px', marginRight: '12px' }}>{selectedReport?.icon}</div>
          <h3 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
            {selectedReport?.name} — Analytics
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
          {/* Pie Chart */}
          <div>
            <h4 style={{ marginBottom: '16px', color: 'var(--text)' }}>📊 Category Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categories} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {categories.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
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

          {/* Area Chart */}
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
        </div>
      </div>
    );
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

      {/* Export Section - Only for Detailed Report */}
  {selectedReportType === 'detailed' && (
        <ExportButtons
          data={reportData}
          products={productDetails}
          reportType={selectedReportType}
          dateRange={dateRange}
          isLoading={isGenerating}
        />
      )}

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
