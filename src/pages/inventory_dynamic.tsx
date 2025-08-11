import React, { useState, useEffect, useCallback } from 'react';
import { productsAPI } from '../services/api';
import { Product } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { useDashboard, useNotifications } from '../hooks/useDashboard';
import { dataManager } from '../services/dataManager';

const InventoryDynamic: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const { products, stats, refresh, refreshing } = useDashboard();
  const { showSuccess, showError } = useNotifications();
  
  const [filter, setFilter] = useState<'all' | 'low' | 'good' | 'out'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [updatingProduct, setUpdatingProduct] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'value' | 'updated'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category)));

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      // Search filter
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !product.category.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !(product.supplier && product.supplier.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false;
      }

      // Category filter
      if (selectedCategory && product.category !== selectedCategory) {
        return false;
      }

      // Stock level filter
      switch (filter) {
        case 'low':
          return product.minStockLevel ? product.quantity <= product.minStockLevel && product.quantity > 0 : false;
        case 'out':
          return product.quantity === 0;
        case 'good':
          return product.minStockLevel ? product.quantity > product.minStockLevel : product.quantity > 0;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'value':
          aValue = a.price * a.quantity;
          bValue = b.price * b.quantity;
          break;
        case 'updated':
          aValue = new Date(a.updatedAt || new Date());
          bValue = new Date(b.updatedAt || new Date());
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Update stock quantity
  const updateStock = useCallback(async (productId: string, newQuantity: number) => {
    if (updatingProduct) return;
    
    setUpdatingProduct(productId);
    try {
      const response = await productsAPI.update(productId, { quantity: newQuantity } as any);
      if (response.success) {
        showSuccess('Stock Updated', `Stock level updated successfully to ${newQuantity} units`);
        await dataManager.refreshAllData(); // Refresh the data
      } else {
        showError('Update Failed', response.error || 'Failed to update stock');
      }
    } catch (error) {
      showError('Update Failed', 'An error occurred while updating stock');
    } finally {
      setUpdatingProduct(null);
    }
  }, [updatingProduct, showSuccess, showError]);

  // Quick stock actions
  const adjustStock = (productId: string, currentQuantity: number, adjustment: number) => {
    const newQuantity = Math.max(0, currentQuantity + adjustment);
    updateStock(productId, newQuantity);
  };

  // Calculate stock statistics
  const stockStats = {
    total: products.length,
    good: products.filter(p => p.minStockLevel ? p.quantity > p.minStockLevel : p.quantity > 0).length,
    low: products.filter(p => p.minStockLevel && p.quantity <= p.minStockLevel && p.quantity > 0).length,
    out: products.filter(p => p.quantity === 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.quantity), 0),
    avgValue: products.length > 0 ? products.reduce((sum, p) => sum + (p.price * p.quantity), 0) / products.length : 0
  };

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) return { status: 'out', color: '#ef4444', label: 'Out of Stock' };
    if (product.minStockLevel && product.quantity <= product.minStockLevel) return { status: 'low', color: '#f59e0b', label: 'Low Stock' };
    if (product.minStockLevel && product.quantity <= product.minStockLevel * 1.5) return { status: 'medium', color: '#3b82f6', label: 'Medium Stock' };
    return { status: 'good', color: '#10b981', label: 'Good Stock' };
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '20px'
    }}>
      <style>
        {`
          .inventory-table {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: var(--shadow);
          }
          
          .inventory-table table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .inventory-table th {
            background: var(--primary);
            color: #ffffff;
            padding: 16px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            position: sticky;
            top: 0;
            z-index: 10;
          }
          
          .inventory-table td {
            padding: 16px;
            border-bottom: 1px solid var(--border);
            vertical-align: middle;
          }
          
          .inventory-table tbody tr {
            transition: background-color 0.2s ease;
          }
          
          .inventory-table tbody tr:hover {
            background: var(--surface-2);
          }
          
          .stock-input {
            width: 80px;
            padding: 6px 8px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            font-size: 14px;
            text-align: center;
          }
          
          .stock-btn {
            width: 28px;
            height: 28px;
            border: none;
            border-radius: 50%;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          
          .stock-btn:hover {
            transform: scale(1.1);
          }
          
          .stock-btn.add {
            background: #10b981;
            color: white;
          }
          
          .stock-btn.remove {
            background: #ef4444;
            color: white;
          }
          
          .badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.025em;
          }
          
          .badge-success { background: #dcfce7; color: #166534; }
          .badge-warning { background: #fef3c7; color: #92400e; }
          .badge-danger { background: #fee2e2; color: #991b1b; }
          
          .stat-card { background: var(--surface); color: var(--text); border: 1px solid var(--border); border-radius: 16px; padding: 20px; transition: all 0.2s ease; text-align: center; box-shadow: var(--shadow); }
          
          .stat-card:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          }
          
          .stat-value {
            font-size: 32px;
            font-weight: 700;
            margin: 8px 0;
          }
          
          .stat-label {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            font-weight: 500;
          }
          
          .glass-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 24px; box-shadow: var(--shadow); }
        `}
      </style>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
  <h1 className="page-title page-title--solid" style={{ fontSize: '32px', marginBottom: '8px' }}>
          Dynamic Inventory Management
        </h1>
  <p className="page-description" style={{ margin: 0 }}>
          Monitor and update your stock levels in real-time
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '32px'
      }}>
        <div className="stat-card">
          <h3 style={{ margin: 0, marginBottom: '8px', fontSize: '16px', fontWeight: '600' }}>Total Items</h3>
          <div className="stat-value" style={{ color: '#6366f1' }}>{stockStats.total}</div>
          <div className="stat-label">Products tracked</div>
        </div>
        <div className="stat-card">
          <h3 style={{ margin: 0, marginBottom: '8px', fontSize: '16px', fontWeight: '600' }}>Good Stock</h3>
          <div className="stat-value" style={{ color: '#10b981' }}>{stockStats.good}</div>
          <div className="stat-label">Well stocked</div>
        </div>
        <div className="stat-card">
          <h3 style={{ margin: 0, marginBottom: '8px', fontSize: '16px', fontWeight: '600' }}>Low Stock</h3>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{stockStats.low}</div>
          <div className="stat-label">Need restocking</div>
        </div>
        <div className="stat-card">
          <h3 style={{ margin: 0, marginBottom: '8px', fontSize: '16px', fontWeight: '600' }}>Out of Stock</h3>
          <div className="stat-value" style={{ color: '#ef4444' }}>{stockStats.out}</div>
          <div className="stat-label">Unavailable items</div>
        </div>
        <div className="stat-card">
          <h3 style={{ margin: 0, marginBottom: '8px', fontSize: '16px', fontWeight: '600' }}>Total Value</h3>
          <div className="stat-value" style={{ color: '#6366f1', fontSize: '20px' }}>
            {formatCurrency(stockStats.totalValue)}
          </div>
          <div className="stat-label">Inventory worth</div>
        </div>
      </div>

      {/* Inventory Management */}
      <div className="glass-card">
        {/* Controls */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', gap: '16px', flex: 1, flexWrap: 'wrap' }}>
            <div style={{ 
              position: 'relative', 
              flex: 1, 
              minWidth: '250px',
              maxWidth: '400px'
            }}>
              <div style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                fontSize: '16px', 
                color: '#9ca3af' 
              }}>
                🔍
              </div>
              <input
                type="text"
                placeholder="Search products, categories, suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="modern-input"
                style={{ paddingLeft: '40px' }}
              />
            </div>
            <select
              className="modern-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ minWidth: '150px', marginBottom: '0' }}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className={filter === 'all' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setFilter('all')}
              style={{ fontSize: '12px', padding: '8px 12px' }}
            >
              All ({stockStats.total})
            </button>
            <button
              className={filter === 'good' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setFilter('good')}
              style={{ fontSize: '12px', padding: '8px 12px' }}
            >
              Good ({stockStats.good})
            </button>
            <button
              className={filter === 'low' ? 'btn-warning' : 'btn-secondary'}
              onClick={() => setFilter('low')}
              style={{ fontSize: '12px', padding: '8px 12px' }}
            >
              Low ({stockStats.low})
            </button>
            <button
              className={filter === 'out' ? 'btn-danger' : 'btn-secondary'}
              onClick={() => setFilter('out')}
              style={{ fontSize: '12px', padding: '8px 12px' }}
            >
              Out ({stockStats.out})
            </button>
            <button
              onClick={refresh}
              disabled={refreshing}
              className={`btn-primary ${refreshing ? 'pulse' : ''}`}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '12px',
                padding: '8px 12px'
              }}
            >
              {refreshing ? (
                <>
                  <div className="loading-spinner" style={{ width: '12px', height: '12px' }}></div>
                  Refreshing...
                </>
              ) : (
                <>
                  🔄 Refresh
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sort Controls */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="modern-select"
            style={{ fontSize: '12px', padding: '6px 10px' }}
          >
            <option value="name">Name</option>
            <option value="quantity">Quantity</option>
            <option value="value">Value</option>
            <option value="updated">Last Updated</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 10px' }}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            Showing {filteredProducts.length} of {products.length} products
          </span>
        </div>

        {/* Products Table */}
        <div className="inventory-table">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Current Stock</th>
                <th>Min Stock</th>
                <th>Status</th>
                <th>Value</th>
                <th>Quick Actions</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const stockInfo = getStockStatus(product);
                const isUpdating = updatingProduct === product.id;
                
                return (
                  <tr key={product.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>
                          {product.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {product.supplier}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '14px' }}>{product.category}</td>
                    <td style={{ fontSize: '14px', fontWeight: '500' }}>
                      {formatCurrency(product.price)}
                    </td>
                    <td>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        opacity: isUpdating ? 0.6 : 1,
                        transition: 'opacity 0.2s'
                      }}>
                        {isUpdating ? (
                          <>
                            <span className="loading-spinner" style={{ width: '16px', height: '16px' }}></span>
                            <span style={{ fontSize: '14px' }}>Updating...</span>
                          </>
                        ) : (
                          <>
                            <span style={{ 
                              fontSize: '16px',
                              fontWeight: '600',
                              color: stockInfo.color
                            }}>
                              {product.quantity}
                            </span>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>units</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '14px' }}>{product.minStockLevel}</td>
                    <td>
                      <span 
                        className={`badge ${
                          stockInfo.status === 'out' ? 'badge-danger' :
                          stockInfo.status === 'low' ? 'badge-danger' :
                          stockInfo.status === 'medium' ? 'badge-warning' :
                          'badge-success'
                        }`}
                      >
                        {stockInfo.label}
                      </span>
                    </td>
                    <td style={{ fontSize: '14px', fontWeight: '500' }}>
                      {formatCurrency(product.price * product.quantity)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button
                          className="stock-btn remove"
                          onClick={() => adjustStock(product.id, product.quantity, -1)}
                          disabled={isUpdating || product.quantity === 0}
                          title="Remove 1 unit"
                        >
                          −
                        </button>
                        <button
                          className="stock-btn remove"
                          onClick={() => adjustStock(product.id, product.quantity, -5)}
                          disabled={isUpdating || product.quantity < 5}
                          title="Remove 5 units"
                          style={{ fontSize: '12px' }}
                        >
                          -5
                        </button>
                        <button
                          className="stock-btn add"
                          onClick={() => adjustStock(product.id, product.quantity, 1)}
                          disabled={isUpdating}
                          title="Add 1 unit"
                        >
                          +
                        </button>
                        <button
                          className="stock-btn add"
                          onClick={() => adjustStock(product.id, product.quantity, 5)}
                          disabled={isUpdating}
                          title="Add 5 units"
                          style={{ fontSize: '12px' }}
                        >
                          +5
                        </button>
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: '#6b7280' }}>
                      {new Date(product.updatedAt || new Date()).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            color: '#6b7280' 
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              No products found
            </h3>
            <p style={{ fontSize: '14px' }}>
              {searchTerm || selectedCategory || filter !== 'all' 
                ? 'Try adjusting your filters or search criteria' 
                : 'Start by adding some products to your inventory'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryDynamic;
