import React, { useState, useEffect } from 'react';
import { dashboardAPI, productsAPI } from '../services/api';
import { DashboardStats, Product, SalesTrendData, ChartData } from '../types';
import { formatIndianNumber, getStockStatus, formatDate } from '../utils/helpers';
import { useCurrency } from '../contexts/CurrencyContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardProps {
  onNavigate: (page: 'products' | 'inventory' | 'reports' | 'settings' | 'users') => void;
  onAddProduct: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onAddProduct }) => {
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [salesData, setSalesData] = useState<SalesTrendData[]>([]);
  const [categoryData, setCategoryData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Enhanced color palette for better visual hierarchy
  const COLORS = [
    '#667eea', // Primary purple-blue gradient start
    '#f093fb', // Pink gradient start  
    '#4facfe', // Blue gradient start
    '#43e97b', // Green gradient start
    '#fa709a', // Pink-orange gradient start
    '#a8edea', // Cyan gradient start
    '#ff9a9e', // Pink gradient start
    '#a1c4fd'  // Blue gradient start
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsResponse, productsResponse, salesResponse, categoryResponse] = await Promise.all([
        dashboardAPI.getStats(),
        productsAPI.getAll({ lowStock: true }),
        dashboardAPI.getSalesData(),
        dashboardAPI.getCategoryData()
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
      if (productsResponse.success) {
        setLowStockProducts(productsResponse.data);
      }
      if (salesResponse.success) {
        setSalesData(salesResponse.data);
      }
      if (categoryResponse.success) {
        setCategoryData(categoryResponse.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
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
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
    <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
      <h1 className="page-title page-title--solid" style={{ fontSize: '32px', marginBottom: '8px' }}>Dashboard Overview</h1>
      <p className="page-description">Welcome back! Here's what's happening with your inventory today.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <div style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}>
            ↻
          </div>
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '16px', opacity: 0.9, marginBottom: '8px' }}>Total Products</h3>
              <div className="stat-value">{stats?.totalProducts || 0}</div>
              <div className="stat-label">Items in inventory</div>
            </div>
            <div style={{ fontSize: '40px', opacity: 0.7 }}>📦</div>
          </div>
        </div>

  <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '16px', opacity: 0.9, marginBottom: '8px' }}>Low Stock Items</h3>
              <div className="stat-value">{stats?.lowStockItems || 0}</div>
              <div className="stat-label">Need attention</div>
            </div>
            <div style={{ fontSize: '40px', opacity: 0.7 }}>⚠️</div>
          </div>
        </div>

  <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '16px', opacity: 0.9, marginBottom: '8px' }}>Total Value</h3>
              <div className="stat-value">{formatCurrency(stats?.totalValue || 0)}</div>
              <div className="stat-label">Inventory worth</div>
            </div>
            <div style={{ fontSize: '40px', opacity: 0.7 }}>{getCurrencySymbol()}</div>
          </div>
        </div>

  <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '16px', opacity: 0.9, marginBottom: '8px' }}>Monthly Sales</h3>
              <div className="stat-value">{formatCurrency(salesData[salesData.length - 1]?.sales || 0)}</div>
              <div className="stat-label">This month</div>
            </div>
            <div style={{ fontSize: '40px', opacity: 0.7 }}>📈</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {/* Sales Trend Chart (Row 1) */}
  <div className="glass-card" style={{ minWidth: 0, marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📈
          Sales Trend (6 Months)
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--text-muted)" />
            <YAxis tickFormatter={(value) => formatIndianNumber(value)} stroke="var(--text-muted)" />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Sales']}
              labelStyle={{ color: 'var(--text)' }}
            />
            <Line 
              type="monotone" 
              dataKey="sales" 
              stroke="var(--primary)" 
              strokeWidth={3}
              dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category Distribution Chart (Row 2) */}
  <div className="glass-card" style={{ padding: '32px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', minWidth: '0', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text)', alignSelf: 'flex-start' }}>
          📊 Category Distribution
        </h2>
        <ResponsiveContainer width="100%" height={600}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="45%"
              labelLine={false}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                if (typeof midAngle !== 'number' || typeof percent !== 'number') return null;
                if (percent < 0.05) return null; // Only show labels for slices > 5%
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5; // Position closer to center
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                
                return (
                  <g>
                    {/* Semi-transparent background for better readability */}
                    <rect
                      x={x - 25}
                      y={y - 12}
                      width={50}
                      height={24}
                      fill="rgba(0,0,0,0.7)"
                      rx={4}
                    />
                    <text
                      x={x}
                      y={y}
                      fill="#ffffff"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={16}
                      fontWeight="bold"
                      style={{ 
                        pointerEvents: 'none'
                      }}
                    >
                      {`${(percent * 100).toFixed(1)}%`}
                    </text>
                  </g>
                );
              }}
              outerRadius={200}
              innerRadius={80}
              fill="#8884d8"
              dataKey="value"
              strokeWidth={4}
              stroke="var(--surface)"
              isAnimationActive={false}
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number, name: string) => [`${value} items`, name]} />
            <Legend 
              wrapperStyle={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'var(--text)',
                paddingTop: '30px'
              }}
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Actions */}
  <div className="glass-card" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <button 
            onClick={onAddProduct}
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
            <span style={{ fontSize: '24px' }}>➕</span>
            Add New Product
          </button>
          <button 
            onClick={() => onNavigate('inventory')}
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
            Manage Inventory
          </button>
          <button 
            onClick={() => onNavigate('reports')}
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
            <span style={{ fontSize: '24px' }}>📥</span>
            Generate Reports
          </button>
          <button 
            onClick={() => onNavigate('users')}
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Manage Users
          </button>
          <button 
            onClick={() => onNavigate('settings')}
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Settings
          </button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
  <div className="glass-card">
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--danger)' }}>⚠️</span>
            Low Stock Alerts
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Min Level</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => {
                  const status = getStockStatus(product.quantity, product.minStockLevel, product.maxStockLevel);
                  return (
                    <tr key={product.id}>
                      <td style={{ fontWeight: '600' }}>{product.name}</td>
                      <td>{product.category}</td>
                      <td>{product.quantity} {product.unit}</td>
                      <td>{product.minStockLevel} {product.unit}</td>
                      <td>
                        <span 
                          className="badge"
                          style={{ 
                            backgroundColor: status.color + '20',
                            color: status.color,
                            border: `1px solid ${status.color}40`
                          }}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => onNavigate('inventory')}
                          className="btn-warning"
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activities */}
      {stats?.recentActivities && stats.recentActivities.length > 0 && (
  <div className="glass-card" style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
            Recent Activities
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats.recentActivities.map((activity) => (
              <div 
                key={activity.id}
                style={{
                  padding: '16px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--surface-2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <p style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--text)' }}>{activity.description}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Product: {activity.productName}
                  </p>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {formatDate(activity.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
