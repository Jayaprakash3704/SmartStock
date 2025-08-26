import React, { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import { Product } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { motion } from 'framer-motion';

const Inventory: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low' | 'good'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [updatingProduct, setUpdatingProduct] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    setRefreshing(true);
    try {
      const response = await productsAPI.getAll();
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchProducts();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
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
        <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>Loading inventory...</span>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ 
      padding: '20px',
      minHeight: 'auto',
      height: 'auto',
      overflow: 'visible'
    }}>
      {/* Enhanced Header with Refresh */}
      <motion.div 
        style={{ marginBottom: '32px' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: 'white',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              marginBottom: '8px'
            }}>
              📦 Inventory Management
            </h1>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontSize: '16px',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
            }}>
              Monitor and update your stock levels in real-time
            </p>
          </div>
          <motion.button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.7 : 1
            }}
            whileHover={{ scale: refreshing ? 1 : 1.05 }}
            whileTap={{ scale: refreshing ? 1 : 0.95 }}
          >
            <span style={{ fontSize: '16px' }}>🔄</span>
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </motion.button>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Items</h3>
          <div className="stat-value">{stockStats.total}</div>
          <div className="stat-label">Products tracked</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
          <h3>Low Stock</h3>
          <div className="stat-value">{stockStats.low}</div>
          <div className="stat-label">Need restocking</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
          <h3>Out of Stock</h3>
          <div className="stat-value">{stockStats.out}</div>
          <div className="stat-label">Unavailable items</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
          <h3>Total Value</h3>
          <div className="stat-value">{formatCurrency(stockStats.totalValue)}</div>
          <div className="stat-label">Inventory worth</div>
        </div>
      </div>

      {/* Enhanced Inventory Management Section */}
      <div className="glass-card" style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Enhanced Search & Filter Controls */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '16px',
          background: 'rgba(102, 126, 234, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(102, 126, 234, 0.1)'
        }}>
          {/* Search and Category Section */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            flex: 1, 
            flexWrap: 'wrap',
            minWidth: '300px'
          }}>
            <div style={{ 
              position: 'relative',
              flex: 1, 
              minWidth: '250px',
              marginBottom: '8px'
            }}>
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '18px',
                color: '#6b7280',
                zIndex: 2
              }}>🔍</div>
              <input
                type="text"
                placeholder="Search by product name, SKU, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '500',
                  background: 'white',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                }}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ 
                minWidth: '180px', 
                padding: '14px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                background: 'white',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <option value="">🏷️ All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>📂 {category}</option>
              ))}
            </select>
          </div>
          
          {/* Filter Buttons Section */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              color: '#6b7280',
              marginRight: '8px',
              whiteSpace: 'nowrap'
            }}>
              Filter by:
            </span>
            <button
              className={filter === 'all' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setFilter('all')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              📦 All Items
            </button>
            <button
              className={filter === 'low' ? 'btn-warning' : 'btn-secondary'}
              onClick={() => setFilter('low')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              ⚠️ Low Stock
            </button>
            <button
              className={filter === 'good' ? 'btn-success' : 'btn-secondary'}
              onClick={() => setFilter('good')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              ✅ In Stock
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
          <div style={{ 
            padding: '16px', 
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{filteredProducts.length}</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Showing</div>
          </div>
          {filter === 'low' && (
            <div style={{ 
              padding: '16px', 
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {filteredProducts.reduce((sum, p) => sum + (p.minStockLevel || 0), 0)}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Min Required</div>
            </div>
          )}
        </div>

        {/* Enhanced Inventory Table */}
        {filteredProducts.length > 0 ? (
          <div style={{ 
            marginTop: '24px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            background: 'white',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ 
              overflowX: 'auto',
              overflowY: 'visible'
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <tr>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600',
                      borderBottom: '2px solid rgba(255,255,255,0.2)'
                    }}>📦 Product</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600',
                      borderBottom: '2px solid rgba(255,255,255,0.2)'
                    }}>🏷️ Category</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'center', 
                      fontWeight: '600',
                      borderBottom: '2px solid rgba(255,255,255,0.2)'
                    }}>📊 Current Stock</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'center', 
                      fontWeight: '600',
                      borderBottom: '2px solid rgba(255,255,255,0.2)'
                    }}>⚠️ Min Level</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'center', 
                      fontWeight: '600',
                      borderBottom: '2px solid rgba(255,255,255,0.2)'
                    }}>🚦 Status</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      borderBottom: '2px solid rgba(255,255,255,0.2)'
                    }}>💰 Unit Price</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      borderBottom: '2px solid rgba(255,255,255,0.2)'
                    }}>💎 Stock Value</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'center', 
                      fontWeight: '600',
                      borderBottom: '2px solid rgba(255,255,255,0.2)'
                    }}>⚡ Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => {
                    const status = getStockStatus(product);
                    const isUpdating = updatingProduct === product.id;
                    
                    return (
                      <tr 
                        key={product.id}
                        style={{
                          backgroundColor: index % 2 === 0 ? '#f9fafb' : 'white',
                          transition: 'all 0.2s ease',
                          borderBottom: '1px solid #e5e7eb'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                          e.currentTarget.style.transform = 'scale(1.01)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f9fafb' : 'white';
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                      <td>
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>{product.name}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{product.supplier}</div>
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
                                color: status === 'out' ? '#dc2626' : 
                                       status === 'low' ? '#f59e0b' : '#059669' 
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
        </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px', 
            color: '#6b7280' 
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
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>
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
                <div key={product.id} style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  borderRadius: '12px',
                  border: '1px solid #fca5a5'
                }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#991b1b' }}>
                    {product.name}
                  </h4>
                  <p style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '8px' }}>
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
