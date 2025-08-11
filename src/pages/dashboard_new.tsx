import React, { useState, useEffect } from 'react';
import { dashboardAPI, productsAPI } from '../services/api';
import { DashboardStats, Product } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import PDFTestComponent from '../components/PDFTestComponent';

const Dashboard: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, productsResponse] = await Promise.all([
          dashboardAPI.getStats(),
          productsAPI.getAll({ lowStock: true })
        ]);

        if (statsResponse.success) {
          setStats(statsResponse.data);
        }

        if (productsResponse.success) {
          setLowStockProducts(productsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
        <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div>
      {/* PDF Test Component - Remove this after testing */}
      <PDFTestComponent />
      
      <div style={{ marginBottom: '32px' }}>
  <h1 className="page-title page-title--solid" style={{ fontSize: '32px', marginBottom: '8px' }}>
          Dashboard
        </h1>
  <p className="page-description">
          Welcome to your inventory management system
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Products</h3>
            <div className="stat-value">{stats.totalProducts}</div>
            <div className="stat-label">Items in catalog</div>
          </div>
          <div className="stat-card">
            <h3>Low Stock Items</h3>
            <div className="stat-value">{stats.lowStockItems}</div>
            <div className="stat-label">Need attention</div>
          </div>
          <div className="stat-card">
            <h3>Total Value</h3>
            <div className="stat-value">{formatCurrency(stats.totalValue)}</div>
            <div className="stat-label">Inventory worth</div>
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '24px', marginRight: '12px' }}>⚠️</span>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>
              Low Stock Alert
            </h2>
          </div>
          <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
            {lowStockProducts.length} item(s) are running low on stock!
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Stock</th>
                  <th>Min Level</th>
                  <th>Category</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => (
                  <tr key={product.id}>
                    <td style={{ fontWeight: '600' }}>{product.name}</td>
                    <td>{product.quantity}</td>
                    <td>{product.minStockLevel}</td>
                    <td>
                      <span className="badge badge-warning">{product.category}</span>
                    </td>
                    <td>
                      <span className="badge badge-danger">Low Stock</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activities */}
      {stats?.recentActivities && stats.recentActivities.length > 0 && (
        <div className="glass-card">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#374151' }}>
            📈 Recent Activities
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Product</th>
                  <th>Time</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentActivities.slice(0, 5).map((activity) => (
                  <tr key={activity.id}>
                    <td>{activity.description}</td>
                    <td style={{ fontWeight: '600' }}>{activity.productName}</td>
                    <td>{new Date(activity.timestamp).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${
                        activity.type === 'add' ? 'badge-success' :
                        activity.type === 'update' ? 'badge-warning' :
                        activity.type === 'delete' ? 'badge-danger' :
                        'badge-warning'
                      }`}>
                        {activity.type.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="glass-card">
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#374151' }}>
          🚀 Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <button 
            className="btn-primary"
            style={{ 
              padding: '16px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: '8px',
              height: 'auto'
            }}
          >
            <span style={{ fontSize: '24px' }}>📦</span>
            Add New Product
          </button>
          <button 
            className="btn-secondary"
            style={{ 
              padding: '16px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: '8px',
              height: 'auto'
            }}
          >
            <span style={{ fontSize: '24px' }}>📊</span>
            Generate Report
          </button>
          <button 
            className="btn-success"
            style={{ 
              padding: '16px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: '8px',
              height: 'auto'
            }}
          >
            <span style={{ fontSize: '24px' }}>📋</span>
            Update Inventory
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
