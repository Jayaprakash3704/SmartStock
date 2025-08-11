import React, { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import { Product } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';

const Inventory: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low' | 'good'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [updatingProduct, setUpdatingProduct] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await productsAPI.getAll();
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockUpdate = async (productId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    setUpdatingProduct(productId);
    try {
      const response = await productsAPI.update(productId, { quantity: newQuantity });
      if (response.success) {
        setProducts(products.map(p => 
          p.id === productId ? { ...p, quantity: newQuantity } : p
        ));
      }
    } catch (error) {
      console.error('Error updating stock:', error);
    } finally {
      setUpdatingProduct(null);
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) return 'out';
    if (product.minStockLevel && product.quantity <= product.minStockLevel) return 'low';
    if (product.minStockLevel && product.quantity <= product.minStockLevel * 2) return 'medium';
    return 'good';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.supplier && product.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
    
    let matchesFilter = true;
    if (filter === 'low') {
      matchesFilter = product.minStockLevel ? product.quantity <= product.minStockLevel : false;
    } else if (filter === 'good') {
      matchesFilter = product.minStockLevel ? product.quantity > product.minStockLevel : product.quantity > 0;
    }
    
    return matchesSearch && matchesCategory && matchesFilter;
  });

  const categories = Array.from(new Set(products.map(p => p.category)));
  const stockStats = {
    total: products.length,
    low: products.filter(p => p.minStockLevel && p.quantity <= p.minStockLevel).length,
    out: products.filter(p => p.quantity === 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.quantity), 0)
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div className="loading-spinner"></div>
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading inventory...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
  <h1 className="page-title page-title--solid" style={{ fontSize: '32px', marginBottom: '8px' }}>
          Inventory Management
        </h1>
  <p className="page-description">
          Monitor and update your stock levels
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Items</h3>
          <div className="stat-value">{stockStats.total}</div>
          <div className="stat-label">Products tracked</div>
        </div>
  <div className="stat-card">
          <h3>Low Stock</h3>
          <div className="stat-value">{stockStats.low}</div>
          <div className="stat-label">Need restocking</div>
        </div>
  <div className="stat-card">
          <h3>Out of Stock</h3>
          <div className="stat-value">{stockStats.out}</div>
          <div className="stat-label">Unavailable items</div>
        </div>
  <div className="stat-card">
          <h3>Total Value</h3>
          <div className="stat-value">{formatCurrency(stockStats.totalValue)}</div>
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
            <div className="search-container" style={{ flex: 1, minWidth: '250px' }}>
              <div className="search-icon">🔍</div>
              <input
                type="text"
                className="search-input"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={filter === 'all' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setFilter('all')}
            >
              All Items
            </button>
            <button
              className={filter === 'low' ? 'btn-warning' : 'btn-secondary'}
              onClick={() => setFilter('low')}
            >
              Low Stock
            </button>
            <button
              className={filter === 'good' ? 'btn-success' : 'btn-secondary'}
              onClick={() => setFilter('good')}
            >
              In Stock
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ padding: '16px', background: 'var(--surface-2)', color: 'var(--text)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{filteredProducts.length}</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Showing</div>
          </div>
          {filter === 'low' && (
            <div style={{ padding: '16px', background: 'var(--surface-2)', color: 'var(--text)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {filteredProducts.reduce((sum, p) => sum + (p.minStockLevel || 0), 0)}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Min Required</div>
            </div>
          )}
        </div>

        {/* Inventory Table */}
        {filteredProducts.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Min Level</th>
                  <th>Status</th>
                  <th>Unit Price</th>
                  <th>Stock Value</th>
                  <th>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product);
                  const isUpdating = updatingProduct === product.id;
                  
                  return (
                    <tr key={product.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>{product.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{product.supplier}</div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-success">{product.category}</span>
                      </td>
                      <td>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          fontWeight: '600',
                          fontSize: '16px'
                        }}>
                          {isUpdating ? (
                            <>
                              <span className="loading-spinner" style={{ width: '16px', height: '16px' }}></span>
                              Updating...
                            </>
                          ) : (
                            <>
                              <span style={{ 
                                color: status === 'out' ? 'var(--danger)' : 
                                       status === 'low' ? 'var(--warning)' : 'var(--success)' 
                              }}>
                                {product.quantity}
                              </span>
                              units
                            </>
                          )}
                        </div>
                      </td>
                      <td>{product.minStockLevel}</td>
                      <td>
                        <span className={`badge ${
                          status === 'out' ? 'badge-danger' :
                          status === 'low' ? 'badge-danger' :
                          status === 'medium' ? 'badge-warning' :
                          'badge-success'
                        }`}>
                          {status === 'out' ? 'Out of Stock' :
                           status === 'low' ? 'Low Stock' :
                           status === 'medium' ? 'Medium Stock' :
                           'In Stock'}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600', color: '#059669' }}>
                        {formatCurrency(product.price)}
                      </td>
                      <td style={{ fontWeight: '600', color: '#6366f1' }}>
                        {formatCurrency(product.price * product.quantity)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <button
                            className="btn-danger"
                            onClick={() => handleStockUpdate(product.id, Math.max(0, product.quantity - 1))}
                            disabled={product.quantity === 0 || isUpdating}
                            style={{ padding: '6px 8px', fontSize: '12px' }}
                          >
                            -1
                          </button>
                          <button
                            className="btn-warning"
                            onClick={() => handleStockUpdate(product.id, product.quantity + 1)}
                            disabled={isUpdating}
                            style={{ padding: '6px 8px', fontSize: '12px' }}
                          >
                            +1
                          </button>
                          <button
                            className="btn-success"
                            onClick={() => {
                              const newQuantity = prompt(`Update stock for ${product.name}:`, product.quantity.toString());
                              if (newQuantity !== null) {
                                const qty = parseInt(newQuantity);
                                if (!isNaN(qty) && qty >= 0) {
                                  handleStockUpdate(product.id, qty);
                                }
                              }
                            }}
                            disabled={isUpdating}
                            style={{ padding: '6px 8px', fontSize: '12px' }}
                          >
                            Set
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px', 
            color: 'var(--text-muted)' 
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No inventory items found</h3>
            <p>
              {searchTerm || selectedCategory || filter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No products in inventory'
              }
            </p>
          </div>
        )}
      </div>

      {/* Low Stock Alerts */}
      {stockStats.low > 0 && filter === 'all' && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '24px', marginRight: '12px' }}>🚨</span>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--danger)' }}>
              Urgent: Low Stock Alerts
            </h2>
          </div>
          <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
            <strong>{stockStats.low}</strong> item(s) need immediate restocking!
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {products
              .filter(p => p.minStockLevel && p.quantity <= p.minStockLevel)
              .slice(0, 6)
              .map(product => (
                <div key={product.id} style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--text)' }}>
                    {product.name}
                  </h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Stock: {product.quantity} / Min: {product.minStockLevel}
                  </p>
                  <button
                    className="btn-danger"
                    onClick={() => setFilter('low')}
                    style={{ width: '100%', fontSize: '12px' }}
                  >
                    View in Inventory
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
