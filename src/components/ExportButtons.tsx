import React, { useState } from 'react';
import { Product } from '../types';
import exportService, { ExportOptions } from '../services/exportService';
import { notificationManager } from '../services/notificationManager';

interface ExportButtonsProps {
  data: any;
  products: Product[];
  reportType: string;
  dateRange: { start: string; end: string };
  isLoading?: boolean;
  className?: string;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({
  data,
  products,
  reportType,
  dateRange,
  isLoading = false,
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'excel' | 'csv' | 'all'>('pdf');

  const baseExportOptions: ExportOptions = {
    title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
    reportType: reportType,
    dateRange,
    includeCharts: true,
    includeDetails: true,
    companyInfo: {
      name: 'SmartStock Enterprise',
      address: '123 Business District, Tech City - 500001',
      phone: '+91 98765 43210',
      email: 'info@smartstock.com'
    }
  };

  const handleExport = async (type: 'pdf' | 'excel' | 'csv' | 'all') => {
    if (isExporting || isLoading) return;

    setIsExporting(true);
    setShowPreview(false);

    try {
  switch (type) {
        case 'pdf':
          console.log('Starting PDF generation for:', reportType);
          {
            const chartIds = exportService.getChartContainerIdsForReport(reportType);
            const chartElements = await exportService.captureChartImages(chartIds);
            await exportService.exportToPDF(data, products, baseExportOptions, chartElements);
          }
          break;
        case 'excel':
          await exportService.exportToExcel(data, products, baseExportOptions);
          break;
        case 'csv':
          exportService.exportToCSV(products, baseExportOptions);
          break;
        case 'all':
          // For 'all' exports, include charts for all sections when on detailed report
          const chartIds = exportService.getChartContainerIdsForReport(reportType);
          const chartElements = await exportService.captureChartImages(chartIds);
          await exportService.exportAll(data, products, baseExportOptions, chartElements);
          break;
      }

  // Show success notification via centralized manager
  const typeLabel = type.toUpperCase();
  notificationManager.showSuccess('Export Complete', `Successfully exported ${typeLabel} report.`);
    } catch (error) {
      console.error('Export failed:', error);
  notificationManager.showError('Export Failed', 'Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportPreview = exportService.generateExportPreview(products, baseExportOptions);

  return (
    <div className={className}>
      <style>
        {`
          .export-button { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .export-button:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15); }
          .export-button:active { transform: translateY(0); }
        `}
      </style>

  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              margin: 0,
              color: 'var(--text)'
            }}>
              📤 Export Data
            </h3>
            <p style={{
              margin: '4px 0 0 0',
              color: 'var(--text-muted)',
              fontSize: '14px'
            }}>
              Download your reports in multiple formats
            </p>
          </div>

          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            {showPreview ? '🔼' : '🔽'} Preview
          </button>
        </div>

        {showPreview && (
          <div style={{ background: 'var(--surface-2)', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text)' }}>
              Export Preview
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Records</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>
                  {exportPreview.totalRecords}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Value</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--chart-green)' }}>
                  ₹{exportPreview.summary.totalValue.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Categories</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--chart-yellow)' }}>
                  {exportPreview.summary.categories}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Suppliers</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--chart-purple)' }}>
                  {exportPreview.summary.suppliers}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          {/* PDF Export */}
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting || isLoading}
            className="export-button btn-danger"
            style={{ padding: '16px', borderRadius: '12px', opacity: isExporting || isLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '16px' }}>📄</span>
            <div>
              <div>Export PDF</div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>
                {exportPreview.estimatedSize.pdf}
              </div>
            </div>
          </button>

          {/* Excel Export */}
          <button
            onClick={() => handleExport('excel')}
            disabled={isExporting || isLoading}
            className="export-button btn-success"
            style={{ padding: '16px', borderRadius: '12px', opacity: isExporting || isLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '16px' }}>📊</span>
            <div>
              <div>Export Excel</div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>
                {exportPreview.estimatedSize.excel}
              </div>
            </div>
          </button>

          {/* CSV Export */}
          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting || isLoading}
            className="export-button btn-primary"
            style={{ padding: '16px', borderRadius: '12px', opacity: isExporting || isLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '16px' }}>📋</span>
            <div>
              <div>Export CSV</div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>
                {exportPreview.estimatedSize.csv}
              </div>
            </div>
          </button>

          {/* Export All */}
          <button
            onClick={() => handleExport('all')}
            disabled={isExporting || isLoading}
            className="export-button btn-secondary"
            style={{ padding: '16px', borderRadius: '12px', opacity: isExporting || isLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '16px' }}>📦</span>
            <div>
              <div>Export All</div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>
                PDF + Excel + CSV
              </div>
            </div>
          </button>
        </div>

        {isExporting && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'var(--surface-2)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid var(--primary)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary)' }}>
                Generating Export...
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Processing {products.length} records with charts and formatting
              </div>
            </div>
          </div>
        )}

        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default ExportButtons;
