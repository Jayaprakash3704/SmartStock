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
import reportService, { ReportDataType } from '../services/reportService';
import AdvancedFilters from '../components/AdvancedFilters';
import ProductDataTable from '../components/ProductDataTable';

const REPORT_TYPES = [
  { 
    id: 'inventory', 
    name: 'Inventory Analytics', 
    icon: '📦', 
    description: 'Stock levels, valuations, movement patterns & product lifecycle',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#667eea',
    features: ['Stock Analysis', 'ABC Analysis', 'Turnover Rates', 'Reorder Points']
  },
  { 
    id: 'sales', 
    name: 'Sales Performance', 
    icon: '💰', 
    description: 'Revenue insights, customer analytics, trends & forecasting',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: '#f5576c',
    features: ['Revenue Trends', 'Customer Segmentation', 'Product Performance', 'Seasonal Analysis']
  },
  { 
    id: 'financial', 
    name: 'Financial Overview', 
    icon: '📈', 
    description: 'P&L analysis, cash flow, margins & profitability insights',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: '#4facfe',
    features: ['Profit Analysis', 'Cost Tracking', 'ROI Metrics', 'Budget Variance']
  },
  { 
    id: 'gst', 
    name: 'Tax & Compliance', 
    icon: '🧾', 
    description: 'GST reports, tax compliance & regulatory filings',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    color: '#43e97b',
    features: ['GSTR Reports', 'Tax Liability', 'Compliance Score', 'Return Filing']
  },
  { 
    id: 'operational', 
    name: 'Operations Analytics', 
    icon: '⚙️', 
    description: 'Efficiency metrics, KPIs & operational performance',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    color: '#fa709a',
    features: ['KPI Dashboard', 'Efficiency Metrics', 'Process Analysis', 'Resource Utilization']
  }
];

const CHART_COLORS = [
  '#667eea', '#f5576c', '#4facfe', '#43e97b', '#fa709a', '#764ba2',
  '#ffd89b', '#19547b', '#667db6', '#84fab0', '#8fd3f4', '#96e6a1'
];

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
    includeInactive: false,
    minQuantity: '',
    maxQuantity: '',
    priceRange: { min: '', max: '' },
    searchTerm: '',
    tags: [],
    showCharts: true,
    showDetailedData: true,
    groupBy: 'category'
  });
  
  const [reportData, setReportData] = useState<ReportDataType | null>(null);
  const [productDetails, setProductDetails] = useState<Product[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);
  const [viewMode, setViewMode] = useState<'charts' | 'table' | 'both'>('both');
  const [availableFilters, setAvailableFilters] = useState({
    categories: [],
    suppliers: [],
    locations: []
  });

  // Load available filter options
  const loadFilterOptions = useCallback(async () => {
    try {
      const products = await reportService.getAllProducts();
      const categories = Array.from(new Set(products.map(p => p.category)));
      const suppliers = Array.from(new Set(products.map(p => p.supplier)));
      const locations = Array.from(new Set(products.map(p => p.location)));
      
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
        includeDetailedData: advancedFilters.showDetailedData
      };
      
      const data = await reportService.generateReportData(selectedReportType, dateRange, filterOptions);
      
      if (advancedFilters.showDetailedData) {
        const productData = await reportService.getFilteredProducts(filterOptions);
        setProductDetails(productData);
      }
      
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
      includeInactive: false,
      minQuantity: '',
      maxQuantity: '',
      priceRange: { min: '', max: '' },
      searchTerm: '',
      tags: [],
      showCharts: true,
      showDetailedData: true,
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
    if (!reportData || !advancedFilters.showCharts) return null;

    const selectedReport = REPORT_TYPES.find(r => r.id === selectedReportType);
    
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '32px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '28px', marginRight: '12px' }}>
            {selectedReport?.icon}
          </div>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '700',
            margin: 0,
            background: selectedReport?.gradient,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {selectedReport?.name} Dashboard
          </h3>
        </div>

        {selectedReportType === 'inventory' && reportData.inventory && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '24px'
          }}>
            {/* Category Breakdown Chart */}
            <div>
              <h4 style={{ marginBottom: '16px', color: '#374151' }}>
                📊 Stock by Category
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.inventory.categories || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="value" fill="#667eea" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Products */}
            <div>
              <h4 style={{ marginBottom: '16px', color: '#374151' }}>
                🏆 Top Value Products
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={reportData.inventory.topProducts || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#43e97b" 
                    fill="rgba(67, 233, 123, 0.3)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedReportType === 'operational' && reportData.operational && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {/* KPI Metrics */}
            <div>
              <h4 style={{ marginBottom: '16px', color: '#374151' }}>
                📈 Key Performance Indicators
              </h4>
              <div style={{ display: 'grid', gap: '12px' }}>
                {reportData.operational.kpis.map((kpi, index) => (
                  <div key={kpi.name} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: 'rgba(248, 250, 252, 0.8)',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#374151' }}>
                        {kpi.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Target: {kpi.target}{kpi.unit}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: kpi.value >= kpi.target ? '#10b981' : '#f59e0b'
                    }}>
                      {kpi.value.toFixed(1)}{kpi.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Process Efficiency */}
            <div>
              <h4 style={{ marginBottom: '16px', color: '#374151' }}>
                ⚙️ Process Efficiency
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={reportData.operational.processMetrics || []}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="process" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar 
                    name="Efficiency" 
                    dataKey="efficiency" 
                    stroke="#fa709a" 
                    fill="#fa709a" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip 
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  }, [reportData, advancedFilters.showCharts, selectedReportType]);

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '32px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '800',
              margin: 0,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              📊 Advanced Reports & Analytics
            </h1>
            <p style={{ 
              margin: '8px 0 0 0', 
              color: '#6b7280', 
              fontSize: '16px',
              fontWeight: '500'
            }}>
              Comprehensive business intelligence with advanced filtering & detailed insights
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: '2px solid #667eea',
                background: showAdvancedFilters ? '#667eea' : 'transparent',
                color: showAdvancedFilters ? 'white' : '#667eea',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              {showAdvancedFilters ? '🔼' : '🔽'} Advanced Filters
            </button>

            <button
              onClick={generateReport}
              disabled={isGenerating}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                opacity: isGenerating ? 0.7 : 1,
                transition: 'all 0.3s'
              }}
            >
              {isGenerating ? '⏳ Generating...' : '🚀 Generate Report'}
            </button>
          </div>
        </div>

        {/* Report Type Selection */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {REPORT_TYPES.map(type => (
            <div
              key={type.id}
              onClick={() => setSelectedReportType(type.id)}
              style={{
                padding: '20px',
                borderRadius: '16px',
                background: selectedReportType === type.id ? type.gradient : 'rgba(248, 250, 252, 0.8)',
                border: selectedReportType === type.id ? 'none' : '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.3s',
                color: selectedReportType === type.id ? 'white' : '#374151'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                {type.icon}
              </div>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                margin: '0 0 8px 0' 
              }}>
                {type.name}
              </h3>
              <p style={{ 
                fontSize: '13px', 
                margin: '0 0 12px 0',
                opacity: 0.8
              }}>
                {type.description}
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px'
              }}>
                {type.features.map(feature => (
                  <span key={feature} style={{
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: selectedReportType === type.id 
                      ? 'rgba(255, 255, 255, 0.2)' 
                      : 'rgba(102, 126, 234, 0.1)',
                    color: selectedReportType === type.id ? 'white' : '#667eea'
                  }}>
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          ))}
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

      {/* View Mode Toggle */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{ fontWeight: '600', color: '#374151' }}>
          👁️ View Mode:
        </span>
        {[
          { key: 'both', label: '📊 Charts & Data', icon: '📈📋' },
          { key: 'charts', label: '📊 Charts Only', icon: '📈' },
          { key: 'table', label: '📋 Data Only', icon: '📋' }
        ].map(mode => (
          <button
            key={mode.key}
            onClick={() => setViewMode(mode.key as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: viewMode === mode.key ? '2px solid #667eea' : '1px solid #e5e7eb',
              background: viewMode === mode.key ? 'rgba(102, 126, 234, 0.1)' : 'white',
              color: viewMode === mode.key ? '#667eea' : '#6b7280',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      {(viewMode === 'charts' || viewMode === 'both') && renderCharts}

      {/* Detailed Product Data */}
      {(viewMode === 'table' || viewMode === 'both') && 
       advancedFilters.showDetailedData && (
        <ProductDataTable 
          products={productDetails} 
          isLoading={isGenerating}
        />
      )}

      {/* Loading State */}
      {isGenerating && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '60px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
          <h3 style={{ marginBottom: '8px', color: '#374151' }}>
            Generating Advanced Analytics...
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            Processing filters and calculating comprehensive business insights
          </p>
          <div style={{
            width: '200px',
            height: '4px',
            background: '#e5e7eb',
            borderRadius: '2px',
            margin: '0 auto',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '60px',
              height: '100%',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: '2px',
              animation: 'loading 1.5s infinite'
            }} />
          </div>
        </div>
      )}

      {/* No Data State */}
      {!isGenerating && !reportData && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '60px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <h3 style={{ marginBottom: '8px', color: '#374151' }}>
            Ready to Generate Insights
          </h3>
          <p style={{ color: '#6b7280' }}>
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
