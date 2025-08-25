import React, { useState, useEffect } from 'react';
import { salesService, Sale } from '../services/salesService';
import { useCurrency } from '../contexts/CurrencyContext';

const Sales: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');

  useEffect(() => {
    loadSales();
  }, [filter]);

  const loadSales = () => {
    let filteredSales: Sale[];
    
    switch (filter) {
      case 'today':
        filteredSales = salesService.getTodaysSales();
        break;
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filteredSales = salesService.getSalesForPeriod(weekAgo, new Date());
        break;
      default:
        filteredSales = salesService.getAllSales();
    }
    
    setSales(filteredSales);
  };

  const summary = salesService.getSalesSummary(sales);

  const printReceipt = (sale: Sale) => {
    const receipt = salesService.generateReceipt(sale);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${sale.id}</title>
            <style>
              body { font-family: 'Courier New', monospace; white-space: pre-line; padding: 20px; }
              @media print { body { margin: 0; padding: 10px; } }
            </style>
          </head>
          <body>${receipt}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title page-title--solid">💰 Sales</h1>
            <p className="page-description">Track sales transactions and revenue</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {(['all', 'today', 'week'] as const).map(period => (
              <button
                key={period}
                onClick={() => setFilter(period)}
                className={filter === period ? 'btn-primary' : 'btn-secondary'}
                style={{ textTransform: 'capitalize' }}
              >
                {period === 'all' ? 'All Sales' : period === 'today' ? 'Today' : 'This Week'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            padding: '20px', 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
              {summary.totalSales}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Sales</div>
          </div>
          
          <div style={{ 
            padding: '20px', 
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
              {formatCurrency(summary.totalRevenue)}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Revenue</div>
          </div>
          
          <div style={{ 
            padding: '20px', 
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
              {formatCurrency(summary.avgSaleValue)}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Avg Sale Value</div>
          </div>
          
          <div style={{ 
            padding: '20px', 
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
              {formatCurrency(summary.totalGST)}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>GST Collected</div>
          </div>
        </div>

        {/* Sales List */}
        <div className="glass-card">
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--text)' }}>
            Sales Transactions
          </h3>
          
          {sales.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Date & Time</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                        #{sale.id}
                      </td>
                      <td>
                        <div>{sale.timestamp.toLocaleDateString('en-IN')}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {sale.timestamp.toLocaleTimeString('en-IN')}
                        </div>
                      </td>
                      <td>
                        {sale.customerName || (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Walk-in customer
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '14px' }}>
                          {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {sale.items.map(item => `${item.quantity}x ${item.productName}`).join(', ').substring(0, 40)}
                          {sale.items.map(item => `${item.quantity}x ${item.productName}`).join(', ').length > 40 ? '...' : ''}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          sale.paymentMethod === 'cash' ? 'badge-success' :
                          sale.paymentMethod === 'card' ? 'badge-warning' : 'badge-info'
                        }`} style={{ textTransform: 'uppercase' }}>
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--success)' }}>
                        {formatCurrency(sale.total)}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-secondary"
                            onClick={() => setSelectedSale(sale)}
                            style={{ fontSize: '12px', padding: '6px 12px' }}
                          >
                            View
                          </button>
                          <button
                            className="btn-primary"
                            onClick={() => printReceipt(sale)}
                            style={{ fontSize: '12px', padding: '6px 12px' }}
                          >
                            Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '48px', 
              color: 'var(--text-muted)' 
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text)' }}>
                No sales found
              </h3>
              <p>
                {filter === 'today' ? 'No sales made today yet' :
                 filter === 'week' ? 'No sales in the past week' :
                 'Start selling products to see sales history here'}
              </p>
            </div>
          )}
        </div>

        {/* Top Products */}
        {summary.topProducts.length > 0 && (
          <div className="glass-card">
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--text)' }}>
              🏆 Top Selling Products
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px'
            }}>
              {summary.topProducts.map((product, index) => (
                <div key={product.name} style={{
                  padding: '16px',
                  background: 'var(--surface-2)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ 
                      fontSize: '18px', 
                      marginRight: '8px',
                      color: index === 0 ? '#f59e0b' : index === 1 ? '#6b7280' : '#cd7f32'
                    }}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
                      {product.name}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Sold: {product.quantity} units
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--success)' }}>
                    Revenue: {formatCurrency(product.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text)' }}>
                🧾 Sale Details
              </h3>
              <button
                onClick={() => setSelectedSale(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                <strong>Receipt #:</strong> {selectedSale.id}
              </div>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                <strong>Date:</strong> {selectedSale.timestamp.toLocaleString('en-IN')}
              </div>
              {selectedSale.customerName && (
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                  <strong>Customer:</strong> {selectedSale.customerName}
                </div>
              )}
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                <strong>Payment:</strong> {selectedSale.paymentMethod.toUpperCase()}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text)' }}>
                Items Sold
              </h4>
              {selectedSale.items.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: index < selectedSale.items.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <div>
                    <div style={{ fontWeight: '500', color: 'var(--text)' }}>{item.productName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </div>
                  </div>
                  <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                    {formatCurrency(item.total)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: 'var(--surface-2)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                <span style={{ color: 'var(--text)' }}>{formatCurrency(selectedSale.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>GST (18%):</span>
                <span style={{ color: 'var(--text)' }}>{formatCurrency(selectedSale.gstAmount)}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>Total:</span>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--success)' }}>
                    {formatCurrency(selectedSale.total)}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => printReceipt(selectedSale)}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                🖨️ Print Receipt
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
