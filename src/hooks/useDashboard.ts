import { useState, useEffect, useCallback, useRef } from 'react';
import { dataManager } from '../services/dataManager';
import { notificationManager } from '../services/notificationManager';
import { Product, StockAlert, Activity } from '../types';

// Custom hook for real-time dashboard data
export const useDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<any>({});
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const unsubscribeRefs = useRef<(() => void)[]>([]);

  // Initialize data and subscriptions
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setIsLoading(true);
        
        // Subscribe to real-time updates
        const unsubscribeProducts = dataManager.subscribe('products', (newProducts) => {
          setProducts(newProducts);
          setLastUpdate(new Date());
        });

        const unsubscribeStats = dataManager.subscribe('dashboardStats', (newStats) => {
          setStats(newStats);
          setLastUpdate(new Date());
        });

        const unsubscribeAlerts = dataManager.subscribe('stockAlerts', (newAlerts) => {
          setAlerts(newAlerts);
          // Show notifications for new critical alerts
          newAlerts.forEach((alert: StockAlert) => {
            if (alert.severity === 'critical') {
              notificationManager.createStockAlert(alert);
            }
          });
          setLastUpdate(new Date());
        });

        unsubscribeRefs.current = [unsubscribeProducts, unsubscribeStats, unsubscribeAlerts];

        // Load initial data
        const [initialProducts, initialStats, initialAlerts] = await Promise.all([
          dataManager.getProducts(),
          dataManager.getDashboardStats(),
          dataManager.getStockAlerts()
        ]);

        setProducts(initialProducts);
        setStats(initialStats);
        setAlerts(initialAlerts);

        // Generate activities
        const initialActivities = await dataManager.generateActivities(20);
        setActivities(initialActivities);

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        notificationManager.showError('Dashboard Error', 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeDashboard();

    // Cleanup subscriptions
    return () => {
      unsubscribeRefs.current.forEach(unsub => unsub());
    };
  }, []);

  // Manual refresh function
  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await dataManager.refreshAllData();
      const newActivities = await dataManager.generateActivities(20);
      setActivities(newActivities);
      notificationManager.showSuccess('Data Refreshed', 'Dashboard data updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
      notificationManager.showError('Refresh Error', 'Failed to refresh dashboard data');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Get chart data for different visualizations
  const getChartData = useCallback(() => {
    if (!products.length) return { categories: [], stockLevels: [], trends: [] };

    // Category distribution
    const categoryMap = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + product.quantity;
      return acc;
    }, {} as Record<string, number>);

    // Enhanced color palette for categories using professional gradients
    const categoryColors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)'
    ];

    const categories = Object.entries(categoryMap).map(([name, value], index) => ({
      name,
      value,
      color: categoryColors[index % categoryColors.length],
      solidColor: ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#a8edea', '#ff9a9e', '#a1c4fd'][index % 8]
    }));

    // Stock levels distribution with professional colors
    const stockLevels = [
      { name: 'Good Stock', value: products.filter(p => p.minStockLevel && p.quantity > p.minStockLevel * 1.5).length, color: 'var(--chart-green)', gradient: 'var(--gradient-success)' },
      { name: 'Low Stock', value: products.filter(p => p.minStockLevel && p.quantity <= p.minStockLevel && p.quantity > 0).length, color: 'var(--chart-yellow)', gradient: 'var(--gradient-secondary)' },
      { name: 'Out of Stock', value: products.filter(p => p.quantity === 0).length, color: 'var(--chart-red)', gradient: 'var(--gradient-secondary)' }
    ];

    // Sales trends (mock data for now)
    const trends = dataManager.generateSalesTrends(7);

    return { categories, stockLevels, trends };
  }, [products]);

  // Get top products by value
  const getTopProducts = useCallback((limit: number = 5) => {
    return products
      .map(product => ({
        ...product,
        totalValue: product.price * product.quantity
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, limit);
  }, [products]);

  // Get recent activities
  const getRecentActivities = useCallback((limit: number = 10) => {
    return activities.slice(0, limit);
  }, [activities]);

  // Get critical alerts
  const getCriticalAlerts = useCallback(() => {
    return alerts.filter(alert => alert.severity === 'critical');
  }, [alerts]);

  // Performance metrics
  const getPerformanceMetrics = useCallback(() => {
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const avgPrice = products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0;
    const stockTurnover = products.filter(p => p.quantity > 0).length / products.length;
    const alertsRatio = alerts.length / Math.max(products.length, 1);

    return {
      totalValue,
      avgPrice,
      stockTurnover: stockTurnover * 100,
      alertsRatio: alertsRatio * 100,
      healthScore: Math.max(0, 100 - (alertsRatio * 50) - (100 - stockTurnover * 100))
    };
  }, [products, alerts]);

  return {
    // Data
    products,
    stats,
    alerts,
    activities,
    
    // State
    isLoading,
    refreshing,
    error,
    lastUpdate,
    
    // Actions
    refresh,
    
    // Computed data
    chartData: getChartData(),
    topProducts: getTopProducts(),
    recentActivities: getRecentActivities(),
    criticalAlerts: getCriticalAlerts(),
    performanceMetrics: getPerformanceMetrics(),
    
    // Helpers
    getTopProducts,
    getRecentActivities
  };
};

// Custom hook for real-time notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Subscribe to notifications
    const unsubscribe = notificationManager.subscribe((newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(notificationManager.getUnreadCount());
    });

    unsubscribeRef.current = unsubscribe;

    // Load initial notifications
    setNotifications(notificationManager.getNotifications());
    setUnreadCount(notificationManager.getUnreadCount());

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const markAsRead = useCallback((id: string) => {
    notificationManager.markAsRead(id);
  }, []);

  const markAllAsRead = useCallback(() => {
    notificationManager.markAllAsRead();
  }, []);

  const removeNotification = useCallback((id: string) => {
    notificationManager.removeNotification(id);
  }, []);

  const clearAll = useCallback(() => {
    notificationManager.clearAll();
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    return notificationManager.showSuccess(title, message);
  }, []);

  const showError = useCallback((title: string, message: string) => {
    return notificationManager.showError(title, message);
  }, []);

  const showInfo = useCallback((title: string, message: string) => {
    return notificationManager.showInfo(title, message);
  }, []);

  const testNotification = useCallback(() => {
    return notificationManager.testNotification();
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showInfo,
    testNotification
  };
};

// Custom hook for real-time performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    memoryUsage: 0,
    loadTime: 0,
    apiResponseTime: 0,
    cacheHitRate: 0,
    errorRate: 0
  });

  useEffect(() => {
    const updateMetrics = () => {
      // Memory usage (if available)
      const memory = (performance as any).memory;
      if (memory) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100
        }));
      }

      // Get cache info from data manager
      try {
        const cacheInfo = dataManager.getCacheInfo();
        setMetrics(prev => ({
          ...prev,
          cacheHitRate: cacheInfo.totalEntries > 0 ? 85 + Math.random() * 15 : 0 // Mock cache hit rate
        }));
      } catch (error) {
        console.error('Error getting cache info:', error);
      }
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics({
      memoryUsage: 0,
      loadTime: 0,
      apiResponseTime: 0,
      cacheHitRate: 0,
      errorRate: 0
    });
  }, []);

  return {
    metrics,
    resetMetrics
  };
};
