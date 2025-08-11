import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  ResponsiveContainer 
} from 'recharts';
import { ChartData, SalesData, GSTReport } from '../types';
import { formatIndianNumber } from '../utils/helpers';
import { useCurrency } from '../contexts/CurrencyContext';
import reportService, { ReportDataType } from '../services/reportService';

const REPORT_TYPES = [
  { 
    id: 'inventory', 
    name: 'Inventory Analytics', 
    icon: '�', 
    description: 'Stock levels, valuations & movement patterns',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#667eea'
  },
  { 
    id: 'sales', 
    name: 'Sales Performance', 
    icon: '�', 
    description: 'Revenue insights, trends & forecasting',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: '#f5576c'
  },
  { 
    id: 'financial', 
    name: 'Financial Overview', 
    icon: '📈', 
    description: 'Profit & loss, cash flow analysis',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: '#4facfe'
  },
  { 
    id: 'gst', 
    name: 'Tax & Compliance', 
    icon: '🧾', 
    description: 'GST reports & regulatory filings',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    color: '#43e97b'
  },
  { 
    id: 'custom', 
    name: 'Custom Reports', 
    icon: '⚙️', 
    description: 'Build personalized business insights',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    color: '#fa709a'
  },
];

const CHART_COLORS = ['#667eea', '#f5576c', '#4facfe', '#43e97b', '#fa709a', '#764ba2'];

const Reports: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [selectedReportType, setSelectedReportType] = useState('inventory');
  
  // Set dynamic date range - from last 30 days to today with proper validation
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    return {
      start: thirtyDaysAgo.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  });
  
  const [filters, setFilters] = useState({
    category: '',
    supplier: '',
    location: '',
  });
  const [reportData, setReportData] = useState<ReportDataType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const chartsRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Memoized calculations for better performance
  const chartColors = useMemo(() => ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f97316'], []);
  
  // Optimized formatters with caching
  const safeFormatCurrency = useCallback((num: number | undefined) =>
    typeof num === 'number' ? formatCurrency(num) : '-', [formatCurrency]);
  const safeLocaleString = useCallback((num: number | undefined) =>
    typeof num === 'number' ? num.toLocaleString() : '-', []);

  // Validate date range
  const validateDateRange = useCallback((start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();
    
    // Ensure start is not after end
    if (startDate > endDate) {
      return false;
    }
    
    // Ensure end is not in the future
    if (endDate > today) {
      return false;
    }
    
    // Ensure range is not more than 2 years
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(today.getFullYear() - 2);
    if (startDate < twoYearsAgo) {
      return false;
    }
    
    return true;
  }, []);

  // Handle date range changes with validation
  const handleDateRangeChange = useCallback((field: 'start' | 'end', value: string) => {
    const newDateRange = { ...dateRange, [field]: value };
    
    if (validateDateRange(newDateRange.start, newDateRange.end)) {
      setDateRange(newDateRange);
    } else {
      // Show error or reset to valid range
      console.warn('Invalid date range selected');
    }
  }, [dateRange, validateDateRange]);

  const generateReport = useCallback(async () => {
    if (isGenerating) return; // Prevent multiple concurrent requests
    
    if (!validateDateRange(dateRange.start, dateRange.end)) {
      alert('Please select a valid date range.');
      return;
    }
    
    setIsGenerating(true);
    setLoadingProgress(0);
    setAnimationKey(prev => prev + 1);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 100);
      
      // Generate report with real-time updates
      const data = await reportService.generateReportData(selectedReportType, dateRange);
      
      clearInterval(progressInterval);
      setLoadingProgress(100);
      
      // Small delay for smooth transition
      setTimeout(() => {
        setReportData(data);
        setLoadingProgress(0);
      }, 200);
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
      setLoadingProgress(0);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedReportType, dateRange, isGenerating, validateDateRange]);

  // Auto-generate report when filters change (with debounce) - Only after initial load
  useEffect(() => {
    if (!isInitialLoad) {
      const timeoutId = setTimeout(() => {
        if (selectedReportType && dateRange.start && dateRange.end) {
          generateReport();
        }
      }, 500); // Increased debounce time to reduce flickering
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedReportType, dateRange.start, dateRange.end, isInitialLoad]); // Removed generateReport from deps
  
  // Initial load effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const exportReport = useCallback(async (format: 'pdf' | 'csv' | 'excel') => {
    if (!reportData) {
      alert('No report data available. Please generate a report first.');
      return;
    }
    
    if (isExporting) return; // Prevent multiple concurrent exports

    setIsExporting(true);
    try {
      switch (format) {
        case 'pdf':
          await reportService.exportToPDF(selectedReportType, reportData, dateRange);
          break;
        case 'excel':
          await reportService.exportToExcel(selectedReportType, reportData, dateRange);
          break;
        case 'csv':
          await reportService.exportToCSV(selectedReportType, reportData, dateRange);
          break;
      }
      
      // Show success notification
      const successMessage = `Report successfully exported as ${format.toUpperCase()}!`;
      alert(successMessage);
      
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Error exporting report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [reportData, selectedReportType, dateRange, isExporting]);

  const scheduleReport = () => {
    setShowScheduleModal(true);
  };

  const exportChart = async () => {
    if (chartsRef.current) {
      try {
        await reportService.exportChartToImage(chartsRef.current, selectedReportType);
        alert('Chart exported successfully!');
      } catch (error) {
        console.error('Error exporting chart:', error);
        alert('Error exporting chart. Please try again.');
      }
    }
  };

  // Helper function to render report header with key metrics - Memoized
  const renderReportHeader = useMemo(() => {
    if (!reportData) return null;
    
    return (
      <div className="metric-card slide-up" style={{ marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '20px'
        }}>
          <div>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              margin: 0, 
              color: '#1f2937',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {REPORT_TYPES.find(t => t.id === selectedReportType)?.name}
            </h2>
            <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
              Generated on {new Date().toLocaleDateString('en-IN')} | 
              Period: {new Date(dateRange.start).toLocaleDateString('en-IN')} - {new Date(dateRange.end).toLocaleDateString('en-IN')}
            </p>
          </div>
          <div className="pulse" style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            ✓ Live Data
          </div>
        </div>

        {/* Key Metrics Row */}
        {selectedReportType === 'inventory' && reportData.inventory && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px' 
          }}>
            <div className="metric-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#6366f1' }}>
                {reportData.inventory.totalProducts}
              </div>
              <div style={{ color: '#64748b', fontSize: '14px' }}>Total Products</div>
            </div>
            <div className="metric-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                {safeFormatCurrency(reportData.inventory.totalValue)}
              </div>
              <div style={{ color: '#64748b', fontSize: '14px' }}>Inventory Value</div>
            </div>
            <div className="metric-card" style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: reportData.inventory.lowStockItems > 0 ? '#ef4444' : '#10b981' 
              }}>
                {reportData.inventory.lowStockItems}
              </div>
              <div style={{ color: '#64748b', fontSize: '14px' }}>Low Stock Items</div>
            </div>
          </div>
        )}
        
        {selectedReportType === 'sales' && reportData.sales && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px' 
          }}>
            <div className="metric-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                {safeFormatCurrency(reportData.sales.totalRevenue)}
              </div>
              <div style={{ color: '#64748b', fontSize: '14px' }}>Total Revenue</div>
            </div>
            <div className="metric-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#6366f1' }}>
                {safeFormatCurrency(reportData.sales.totalProfit)}
              </div>
              <div style={{ color: '#64748b', fontSize: '14px' }}>Total Profit</div>
            </div>
            <div className="metric-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>
                {reportData.sales.totalOrders}
              </div>
              <div style={{ color: '#64748b', fontSize: '14px' }}>Total Orders</div>
            </div>
          </div>
        )}
      </div>
    );
  }, [reportData, selectedReportType, dateRange, safeFormatCurrency]);

  // Helper function to render main report content - Memoized
  const renderReportContent = useMemo(() => {
    if (!reportData) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {selectedReportType === 'inventory' && reportData.inventory && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="chart-container">
                <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                  Product Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.inventory.categories}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {reportData.inventory.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                  Stock Analysis
                </h3>
                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                  {reportData.inventory.stockAnalysis.slice(0, 8).map((item, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.1)',
                      background: item.status === 'Low Stock' 
                        ? 'rgba(239, 68, 68, 0.1)' 
                        : 'rgba(16, 185, 129, 0.1)',
                      borderRadius: '8px',
                      marginBottom: '8px'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          Stock: {item.stock} | Min: {item.minStock}
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: item.status === 'Low Stock' ? '#ef4444' : '#10b981',
                        color: 'white'
                      }}>
                        {item.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {selectedReportType === 'sales' && reportData.sales && (
          <div className="chart-container">
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              Sales Trend Analysis
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={reportData.sales.trends}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'sales' ? formatCurrency(value as number) : formatCurrency(value as number),
                    name === 'sales' ? 'Sales' : 'Profit'
                  ]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorSales)"
                  strokeWidth={3}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  }, [reportData, selectedReportType, chartColors, formatCurrency]);

  return (
    <div className="page-container" style={{ 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      minHeight: '100vh',
      transition: 'all 0.3s ease'
    }}>
      <style>
        {`
          .report-loading {
            position: relative;
            overflow: hidden;
          }
          
          .report-loading::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent);
            animation: shimmer 1.5s infinite;
          }
          
          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .progress-bar {
            width: 100%;
            height: 4px;
            background-color: rgba(99, 102, 241, 0.2);
            border-radius: 2px;
            overflow: hidden;
            margin: 10px 0;
          }
          
          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #6366f1, #8b5cf6);
            border-radius: 2px;
            transition: width 0.3s ease;
            position: relative;
          }
          
          .progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: progress-shine 1s infinite;
          }
          
          @keyframes progress-shine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          .card-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .card-hover:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }
          
          .fade-in {
            animation: fadeIn 0.5s ease forwards;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .slide-up {
            animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
          
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .bounce-in {
            animation: bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
          }
          
          @keyframes bounceIn {
            0% { opacity: 0; transform: scale(0.3); }
            50% { opacity: 1; transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
          }
          
          .glass-enhanced {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            transition: all 0.3s ease;
          }
          
          .glass-enhanced:hover {
            background: rgba(255, 255, 255, 0.35);
            transform: translateY(-2px);
          }
          
          .metric-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 16px;
            padding: 20px;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          }
          
          .metric-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .metric-card:hover::before {
            opacity: 1;
          }
          
          .metric-card:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          }
          
          .chart-container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 24px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .chart-container::after {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, #6366f1, #8b5cf6, #ec4899, #f59e0b);
            border-radius: 22px;
            z-index: -1;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .chart-container:hover::after {
            opacity: 0.7;
          }
          
          .pulse {
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          /* Smooth transitions for dynamic content */
          .report-content {
            transition: all 0.3s ease;
            opacity: 1;
          }
          
          .report-content.updating {
            opacity: 0.7;
            pointer-events: none;
          }
        `}
      </style>
      
      {/* Progress bar for loading */}
      {isGenerating && loadingProgress > 0 && (
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>
      )}
      
      <div className={`page-header ${reportData ? 'fade-in' : ''}`}>
        <div>
          <h1 className="page-title" style={{ 
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '32px',
            fontWeight: '700'
          }}>
            Advanced Reports & Analytics
          </h1>
          <p className="page-description" style={{ color: '#64748b', fontSize: '16px' }}>
            Generate comprehensive business reports and insights with real-time data
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={exportChart}
            className="btn-secondary card-hover"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '12px 20px'
            }}
            disabled={!reportData || isExporting}
          >
            <span style={{ fontSize: '16px' }}>📊</span>
            Export Chart
          </button>
          <button
            onClick={() => exportReport(exportFormat)}
            className="btn-secondary card-hover"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '12px 20px'
            }}
            disabled={!reportData || isExporting}
          >
            {isExporting ? (
              <div className="loading-spinner pulse" style={{ width: '16px', height: '16px' }}></div>
            ) : (
              <span style={{ fontSize: '16px' }}>📥</span>
            )}
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          <button
            onClick={scheduleReport}
            className="btn-secondary card-hover"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '12px 20px'
            }}
          >
            <span style={{ fontSize: '16px' }}>📧</span>
            Schedule
          </button>
          <button
            onClick={generateReport}
            disabled={isGenerating}
            className={`btn-primary card-hover ${isGenerating ? 'pulse' : ''}`}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              background: isGenerating 
                ? 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 20px',
              color: 'white',
              fontWeight: '600'
            }}
          >
            {isGenerating ? (
              <div className="loading-spinner" style={{ 
                width: '16px', 
                height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            ) : (
              <span style={{ fontSize: '16px' }}>✨</span>
            )}
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '320px 1fr', 
        gap: '24px', 
        height: 'calc(100vh - 200px)',
        padding: '0 20px'
      }}>
        {/* Enhanced Sidebar - Report Types and Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="slide-up">
          {/* Report Types */}
          <div className="glass-enhanced" style={{ 
            padding: '24px', 
            borderRadius: '20px',
            position: 'sticky',
            top: '20px'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '700', 
              marginBottom: '20px', 
              color: '#1f2937',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              📊 Report Types
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {REPORT_TYPES.map((type, index) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedReportType(type.id)}
                  style={{
                    padding: '16px',
                    border: 'none',
                    borderRadius: '12px',
                    background: selectedReportType === type.id 
                      ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
                      : 'rgba(255, 255, 255, 0.7)',
                    color: selectedReportType === type.id ? 'white' : '#374151',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: 'blur(10px)',
                    transform: selectedReportType === type.id ? 'translateX(4px)' : 'translateX(0)',
                    boxShadow: selectedReportType === type.id 
                      ? '0 10px 25px rgba(99, 102, 241, 0.3)' 
                      : '0 4px 15px rgba(0, 0, 0, 0.1)',
                    animation: `fadeIn 0.5s ease ${index * 0.1}s both`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '20px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                      {type.icon}
                    </span>
                    <span style={{ fontWeight: '600', fontSize: '15px' }}>{type.name}</span>
                  </div>
                  <p style={{ 
                    fontSize: '12px', 
                    opacity: 0.8, 
                    margin: 0, 
                    lineHeight: '1.4' 
                  }}>
                    {type.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Date Range and Filters */}
          <div className="glass-enhanced" style={{ 
            padding: '24px', 
            borderRadius: '20px' 
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '700', 
              marginBottom: '20px', 
              color: '#1f2937',
              background: 'linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🗓️ Date Range & Filters
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '8px' 
              }}>
                From Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '8px' 
              }}>
                To Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '8px' 
              }}>
                Export Format
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'csv' | 'excel')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="pdf">📄 PDF Report</option>
                <option value="excel">📊 Excel Spreadsheet</option>
                <option value="csv">📈 CSV Data</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content Area - Enhanced */}
        <div className={`${reportData ? 'bounce-in' : ''} report-content ${isGenerating ? 'updating' : ''}`} style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px'
        }} key={`${animationKey}-${selectedReportType}`}>
          {isGenerating && !reportData ? (
            <div className="glass-enhanced report-loading" style={{ 
              padding: '60px 40px',
              borderRadius: '20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                border: '4px solid rgba(99, 102, 241, 0.2)',
                borderTop: '4px solid #6366f1',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <h3 style={{ 
                color: '#6366f1', 
                fontSize: '18px', 
                fontWeight: '600',
                margin: 0
              }}>
                Generating {selectedReportType.charAt(0).toUpperCase() + selectedReportType.slice(1)} Report
              </h3>
              <p style={{ color: '#64748b', margin: 0 }}>
                Analyzing data and preparing comprehensive insights...
              </p>
            </div>
          ) : reportData ? (
            <>
              {/* Report Header with Key Metrics */}
              {renderReportHeader}
              
              {/* Main Report Content */}
              <div ref={chartsRef} className="chart-container fade-in">
                {renderReportContent}
              </div>
            </>
          ) : (
            <div className="glass-enhanced" style={{ 
              padding: '60px 40px',
              borderRadius: '20px',
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <h3 style={{ color: '#64748b', fontSize: '18px', fontWeight: '600' }}>
                Select a report type and click Generate to begin
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                Choose from inventory, sales, financial, or GST reports
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Reports);
