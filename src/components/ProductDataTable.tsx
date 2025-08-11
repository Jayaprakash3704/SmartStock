import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatIndianNumber } from '../utils/helpers';

interface ProductDataTableProps {
  products: Product[];
  isLoading?: boolean;
}

const ProductDataTable: React.FC<ProductDataTableProps> = ({ products, isLoading }) => {
  const { formatCurrency } = useCurrency();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return products.slice(startIndex, endIndex);
  }, [products, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(products.length / itemsPerPage);

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) return { status: 'Out of Stock', color: '#ef4444', bg: '#fee2e2' };
    if (product.minStockLevel && product.quantity <= product.minStockLevel) return { status: 'Low Stock', color: '#f59e0b', bg: '#fef3c7' };
    if (product.maxStockLevel && product.quantity > product.maxStockLevel) return { status: 'Overstock', color: '#8b5cf6', bg: '#f3e8ff' };
    return { status: 'In Stock', color: '#10b981', bg: '#d1fae5' };
  };

  if (isLoading) {
    return (
      <div className="glass-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <h3 style={{ marginBottom: '8px', color: 'var(--text)' }}>Loading Product Data...</h3>
        <p style={{ color: 'var(--text-muted)' }}>Please wait while we fetch detailed product information</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
        <h3 style={{ marginBottom: '8px', color: 'var(--text)' }}>No Products Found</h3>
        <p style={{ color: 'var(--text-muted)' }}>Try adjusting your filters to see more results</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px'
      }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'var(--text)' }}>
            📊 Detailed Product Data
          </h3>
          <p style={{ 
            margin: '4px 0 0 0', 
            color: '#6b7280', 
            fontSize: '14px' 
          }}>
            Showing {paginatedProducts.length} of {products.length} products
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="modern-select"
            style={{ padding: '6px 12px', marginBottom: 0, width: 'auto' }}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{
        overflow: 'auto',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        maxHeight: '600px'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead style={{ background: 'var(--primary)', position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              {[
                { key: 'name', label: '📦 Product' },
                { key: 'category', label: '🏷️ Category' },
                { key: 'quantity', label: '📊 Stock' },
                { key: 'price', label: '💰 Price' },
                { key: 'value', label: '💎 Total Value' },
                { key: 'supplier', label: '🏢 Supplier' },
                { key: 'location', label: '📍 Location' },
                { key: 'status', label: '⚡ Status' }
              ].map(col => (
                <th key={col.key} style={{ padding: '16px 12px', textAlign: 'left', color: '#ffffff', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap' }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((product, index) => {
              const stockInfo = getStockStatus(product);
              const totalValue = product.price * product.quantity;
              
              return (
                <tr key={product.id} style={{ borderBottom: '1px solid var(--border)', transition: 'all 0.2s', background: index % 2 === 0 ? 'var(--surface-2)' : 'transparent' }}>
                  {/* Product Name */}
                  <td style={{ padding: '16px 12px' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                        {product.name}
                      </div>
                      {product.description && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product.description}
                        </div>
                      )}
                      {product.brand && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Brand: {product.brand}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: '12px', fontWeight: '500' }}>
                      {product.category}
                    </span>
                  </td>

                  {/* Quantity */}
                  <td style={{ padding: '16px 12px' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                        {formatIndianNumber(product.quantity)} {product.unit}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Min: {product.minStockLevel} | Max: {product.maxStockLevel}
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                      {formatCurrency(product.price)}
                    </div>
                    {product.gstRate && product.gstRate > 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        +{product.gstRate}% GST
                      </div>
                    )}
                  </td>

                  {/* Total Value */}
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '15px' }}>
                      {formatCurrency(totalValue)}
                    </div>
                  </td>

                  {/* Supplier */}
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ color: 'var(--text)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {product.supplier}
                    </div>
                  </td>

                  {/* Location */}
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: '12px', fontWeight: '500' }}>
                      {product.location}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: stockInfo.bg,
                      color: stockInfo.color,
                      fontSize: '12px',
                      fontWeight: '600',
                      border: `1px solid ${stockInfo.color}20`
                    }}>
                      {stockInfo.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '24px',
          padding: '16px',
          background: 'var(--surface-2)',
          borderRadius: '12px',
          border: '1px solid var(--border)'
        }}>
          <div style={{ 
            fontSize: '14px', 
            color: '#6b7280' 
          }}>
            Page {currentPage} of {totalPages}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="btn-secondary"
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              First
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="btn-secondary"
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              ← Prev
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={currentPage === pageNum ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="btn-secondary"
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Next →
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="btn-secondary"
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginTop: '24px'
      }}>
        {[
          {
            label: 'Total Products',
            value: formatIndianNumber(products.length),
            icon: '📦',
            color: '#667eea'
          },
          {
            label: 'Total Value',
            value: formatCurrency(products.reduce((sum, p) => sum + (p.price * p.quantity), 0)),
            icon: '💰',
            color: '#10b981'
          },
          {
            label: 'Low Stock Items',
            value: formatIndianNumber(products.filter(p => p.minStockLevel && p.quantity <= p.minStockLevel).length),
            icon: '⚠️',
            color: '#f59e0b'
          },
          {
            label: 'Out of Stock',
            value: formatIndianNumber(products.filter(p => p.quantity === 0).length),
            icon: '🔴',
            color: '#ef4444'
          }
        ].map(stat => (
          <div key={stat.label} style={{
            padding: '16px',
            borderRadius: '12px',
            background: `${stat.color}10`,
            border: `1px solid ${stat.color}20`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: '700', 
              color: stat.color,
              marginBottom: '4px'
            }}>
              {stat.value}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#6b7280',
              fontWeight: '500'
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductDataTable;
