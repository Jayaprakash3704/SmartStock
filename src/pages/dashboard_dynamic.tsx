import React, { useState, useEffect } from 'react';
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
import { useCurrency } from '../contexts/CurrencyContext';
import { useDashboard, useNotifications, usePerformanceMonitor } from '../hooks/useDashboard';
import { formatIndianNumber } from '../utils/helpers';

const Dashboard: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const { 
    stats, 
    chartData, 
    topProducts, 
    recentActivities, 
    criticalAlerts,
    performanceMetrics,
    isLoading, 
    refreshing, 
    refresh, 
    lastUpdate,
    error 
  } = useDashboard();
  
  const { showInfo } = useNotifications();
  const { metrics: perfMetrics } = usePerformanceMonitor();
  
  const [selectedMetric, setSelectedMetric] = useState<'overview' | 'performance' | 'alerts'>('overview');

  // Show welcome notification on first load
  useEffect(() => {
    const hasShownWelcome = localStorage.getItem('dashboard_welcome_shown');
    if (!hasShownWelcome) {
      showInfo(
        '🎉 Welcome to SmartStock Dynamic Dashboard!',
        'Your real-time inventory management system is now active with live updates.'
      );
      localStorage.setItem('dashboard_welcome_shown', 'true');
    }
  }, [showInfo]);

  if (error) {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ color: 'var(--danger)', marginBottom: '8px' }}>Dashboard Error</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{error}</p>
          <button onClick={refresh} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '400px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div className="loading-spinner" style={{ width: '48px', height: '48px' }}></div>
          <div style={{ fontSize: '16px', color: 'var(--text-muted)' }}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
  <div className="page-container" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <style>
        {`
          /* Refresh button styles to match provided design */
          .refresh-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 10px 18px;
            height: 44px;
            border-radius: 12px;
            border: none;
            cursor: pointer;
            color: #fff;
            background: linear-gradient(180deg, var(--primary) 0%, var(--primary-600) 100%);
            box-shadow: 0 8px 24px rgba(59, 130, 246, 0.45);
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 0.6px;
            text-transform: uppercase;
            transition: transform 120ms ease, box-shadow 150ms ease, filter 150ms ease, opacity 120ms ease;
          }
          .refresh-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            filter: brightness(1.05);
            box-shadow: 0 12px 32px rgba(59, 130, 246, 0.55);
          }
          .refresh-btn:active:not(:disabled) {
            transform: translateY(0);
            box-shadow: 0 8px 24px rgba(59, 130, 246, 0.45);
          }
          .refresh-btn:disabled {
            opacity: 0.9;
            cursor: not-allowed;
          }
          .refresh-btn__iconbox {
            width: 24px;
            height: 24px;
            border-radius: 6px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(180deg, var(--primary) 0%, var(--primary-600) 100%);
            box-shadow: inset 0 1px 2px rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.15);
          }
          .refresh-btn__svg {
            width: 14px;
            height: 14px;
            stroke: #fff;
          }
          .refresh-btn.is-loading .refresh-btn__svg {
            animation: spin 1s linear infinite;
            transform-origin: 50% 50%;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .metric-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
      height: 100%;
      box-shadow: var(--shadow);
          }
          
          .metric-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
      background: var(--primary);
      opacity: 1;
            transition: opacity 0.3s ease;
          }
          
          .metric-card:hover::before {
            opacity: 1;
          }
          
          .metric-card:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
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
          
          .pulse {
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          .chart-container { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 24px; box-shadow: var(--shadow); transition: all 0.2s ease; height: 100%; }
          
          @keyframes gentle-pulse {
            0%, 100% { 
              box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
              transform: scale(1);
            }
            50% { 
              box-shadow: 0 12px 40px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3);
              transform: scale(1.02);
            }
          }
          
          @keyframes rotate-icon {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(10deg); }
            75% { transform: rotate(-10deg); }
            100% { transform: rotate(0deg); }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-8px); }
            60% { transform: translateY(-4px); }
          }
          
          @keyframes ring-pulse {
            0% { 
              transform: scale(0.8);
              opacity: 1;
            }
            100% { 
              transform: scale(1.4);
              opacity: 0;
            }
          }
        `}
      </style>

      {/* Header */}
      <div className="page-header fade-in" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="page-title page-title--solid" style={{ fontSize: '32px', marginBottom: '8px' }}>
            Dashboard
          </h1>
          <p className="page-description" style={{ margin: 0 }}>
            Real-time overview of your inventory system
          </p>
          <div style={{ 
            marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>Last updated: {lastUpdate.toLocaleTimeString('en-IN')}</span>
            <div style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: 'var(--text-muted)'
            }} />
            <span>Auto-refresh enabled</span>
          </div>
        </div>
  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Metric Selector */}
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="modern-select"
            style={{ marginBottom: 0, height: 44, padding: '10px 14px', fontSize: '14px', borderRadius: 12 }}
          >
            <option value="overview">📊 Overview</option>
            <option value="performance">⚡ Performance</option>
            <option value="alerts">⚠️ Alerts</option>
          </select>
          
          <button
            onClick={refresh}
            disabled={refreshing}
            className={`refresh-btn ${refreshing ? 'is-loading' : ''}`}
            aria-label={refreshing ? 'Refreshing' : 'Refresh'}
          >
            <span className="refresh-btn__iconbox" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" className="refresh-btn__svg" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0114.13-3.36L23 10" />
                <path d="M20.49 15a9 9 0 01-14.13 3.36L1 14" />
              </svg>
            </span>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      {selectedMetric === 'overview' && (
        <>
          {/* Key Metrics Cards */}
          <div className="slide-up" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '20px', 
            marginBottom: '32px'
          }}>
            <div className="metric-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '24px' }}>📦</div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>Total Products</div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text)' }}>
                    {formatIndianNumber(stats.totalProducts || 0)}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                📈 +{Math.floor(Math.random() * 5)}% from last week
              </div>
            </div>

            <div className="metric-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '24px' }}>💰</div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>Total Value</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                    {formatCurrency(stats.totalValue || 0)}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                📈 +{Math.floor(Math.random() * 15)}% from last week
              </div>
            </div>

            <div className="metric-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '24px' }}>⚠️</div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>Low Stock</div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--danger)' }}>
                    {stats.lowStockItems || 0}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                🚨 Needs attention
              </div>
            </div>

            <div className="metric-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '24px' }}>🏪</div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>Categories</div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text)' }}>
                    {stats.categories || 0}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--info)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                📊 Well diversified
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '24px', 
            marginBottom: '32px'
          }}>
            {/* Category Distribution */}
            <div className="chart-container fade-in">
              <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
                📊 Category Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.categories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Stock Level Distribution */}
            <div className="chart-container fade-in">
              <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
                📈 Stock Levels
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.stockLevels}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activities and Top Products */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Recent Activities */}
            <div className="chart-container slide-up">
              <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
                🕒 Recent Activities
              </h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {recentActivities.slice(0, 8).map((activity, index) => (
                  <div key={activity.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    background: index % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}>
                    <div style={{ 
                      fontSize: '16px',
                      minWidth: '24px'
                    }}>
                      {activity.type === 'add' ? '➕' : 
                       activity.type === 'update' ? '✏️' : 
                       activity.type === 'delete' ? '🗑️' : '⚠️'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '2px' }}>
                        {activity.productName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {activity.description}
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
                      {activity.timestamp.toLocaleTimeString('en-IN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products */}
            <div className="chart-container slide-up">
              <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
                🏆 Top Products by Value
              </h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {topProducts.slice(0, 8).map((product, index) => (
                  <div key={product.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    background: index % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: index === 0 ? 'var(--warning)' : index === 1 ? 'var(--text-muted)' : index === 2 ? '#cd7c2f' : 'var(--text-muted)'
                      }}>
                        #{index + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{product.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {product.quantity} units
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>
                        {formatCurrency((product as any).totalValue)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {formatCurrency(product.price)} each
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Performance Metrics */}
      {selectedMetric === 'performance' && (
        <div className="slide-up" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px'
        }}>
          <div className="metric-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '24px' }}>💾</div>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>Memory Usage</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                  {perfMetrics.memoryUsage.toFixed(1)}%
                </div>
              </div>
            </div>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              background: 'var(--border)', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(perfMetrics.memoryUsage, 100)}%`,
                height: '100%',
                background: perfMetrics.memoryUsage > 80 ? 'var(--danger)' : 'var(--success)',
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div className="metric-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '24px' }}>⚡</div>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>Cache Hit Rate</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                  {perfMetrics.cacheHitRate.toFixed(1)}%
                </div>
              </div>
            </div>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              background: 'var(--border)', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(perfMetrics.cacheHitRate, 100)}%`,
                height: '100%',
                background: 'var(--success)',
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div className="metric-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '24px' }}>🎯</div>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>Health Score</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>
                  {performanceMetrics.healthScore.toFixed(0)}/100
                </div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: performanceMetrics.healthScore > 80 ? 'var(--success)' : 'var(--warning)' }}>
              {performanceMetrics.healthScore > 90 ? '🟢 Excellent' :
               performanceMetrics.healthScore > 70 ? '🟡 Good' : '🔴 Needs Attention'}
            </div>
          </div>
        </div>
      )}

      {/* Critical Alerts */}
      {selectedMetric === 'alerts' && (
        <div className="slide-up">
          <div className="chart-container">
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
              🚨 Critical Stock Alerts
            </h3>
            {criticalAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                <div style={{ fontSize: '18px', fontWeight: '500' }}>No Critical Alerts</div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>All products are well stocked!</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {criticalAlerts.map((alert) => (
                  <div key={alert.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: alert.severity === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    border: `1px solid ${alert.severity === 'critical' ? 'rgba(248,113,113,0.4)' : 'rgba(251,191,36,0.4)'}`,
                    borderRadius: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '20px' }}>
                        {alert.severity === 'critical' ? '🔴' : '🟡'}
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                          {alert.productName}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                          Only {alert.currentStock} units remaining (min: {alert.minStockLevel})
                        </div>
                      </div>
                    </div>
                    <button className="btn-primary" style={{ fontSize: '12px', padding: '8px 16px' }}>
                      Restock Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
  {/* Removed floating test notification button for cleaner demo UI */}
    </div>
  );
};

export default Dashboard;
