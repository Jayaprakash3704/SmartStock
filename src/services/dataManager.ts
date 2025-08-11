import { Product, User, SalesData, SalesTrendData, Activity, StockAlert } from '../types';
import { productsAPI } from './api';

// Real-time data management service
export class DataManager {
  private static instance: DataManager;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  // Initialize the data manager with background sync
  async initialize() {
    if (this.isInitialized) return;
    
    // Start background data sync
    setInterval(() => this.syncData(), 30000); // Sync every 30 seconds
    
    // Initialize cache with fresh data
    await this.refreshAllData();
    
    this.isInitialized = true;
    console.log('🚀 DataManager initialized with real-time sync');
  }

  // Subscribe to data changes
  subscribe(dataType: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(dataType)) {
      this.subscribers.set(dataType, new Set());
    }
    this.subscribers.get(dataType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(dataType);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(dataType);
        }
      }
    };
  }

  // Emit data changes to subscribers
  private emit(dataType: string, data: any) {
    const subscribers = this.subscribers.get(dataType);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${dataType} subscriber:`, error);
        }
      });
    }
  }

  // Cache management
  private setCache(key: string, data: any, ttl: number = 300000) { // 5 minutes default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  // Get products with caching and real-time updates
  async getProducts(forceRefresh = false): Promise<Product[]> {
    const cacheKey = 'products';
    
    if (!forceRefresh) {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await productsAPI.getAll();
      if (response.success) {
        this.setCache(cacheKey, response.data);
        this.emit('products', response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return this.getCache(cacheKey) || [];
    }
  }

  // Get dashboard statistics with real-time updates
  async getDashboardStats(forceRefresh = false) {
    const cacheKey = 'dashboardStats';
    
    if (!forceRefresh) {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const products = await this.getProducts();
      const stats = {
        totalProducts: products.length,
        totalValue: products.reduce((sum, p) => sum + (p.price * p.quantity), 0),
        lowStockItems: products.filter(p => p.minStockLevel && p.quantity <= p.minStockLevel).length,
        outOfStockItems: products.filter(p => p.quantity === 0).length,
        categories: Array.from(new Set(products.map(p => p.category))).length,
        suppliers: Array.from(new Set(products.map(p => p.supplier))).length,
        avgPrice: products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0,
        recentUpdates: products
          .sort((a, b) => new Date(b.updatedAt || new Date()).getTime() - new Date(a.updatedAt || new Date()).getTime())
          .slice(0, 5)
      };

      this.setCache(cacheKey, stats, 60000); // 1 minute TTL for stats
      this.emit('dashboardStats', stats);
      return stats;
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
      return this.getCache(cacheKey) || {};
    }
  }

  // Get stock alerts with priority
  async getStockAlerts(forceRefresh = false): Promise<StockAlert[]> {
    const cacheKey = 'stockAlerts';
    
    if (!forceRefresh) {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const products = await this.getProducts();
      const alerts: StockAlert[] = products
        .filter(p => p.minStockLevel && p.quantity <= p.minStockLevel)
        .map(p => ({
          id: `alert-${p.id}`,
          productId: p.id,
          productName: p.name,
          currentStock: p.quantity,
          minStockLevel: p.minStockLevel!,
          alertType: (p.quantity === 0 ? 'out_of_stock' : 'low_stock') as 'low_stock' | 'out_of_stock',
          severity: (p.quantity === 0 ? 'critical' : 'low') as 'critical' | 'low',
          createdAt: new Date()
        }))
        .sort((a, b) => {
          // Sort by severity (critical first), then by stock percentage
          if (a.severity !== b.severity) {
            return a.severity === 'critical' ? -1 : 1;
          }
          const aPercentage = a.currentStock / a.minStockLevel;
          const bPercentage = b.currentStock / b.minStockLevel;
          return aPercentage - bPercentage;
        });

      this.setCache(cacheKey, alerts, 120000); // 2 minutes TTL
      this.emit('stockAlerts', alerts);
      return alerts;
    } catch (error) {
      console.error('Error getting stock alerts:', error);
      return this.getCache(cacheKey) || [];
    }
  }

  // Generate dynamic sales data with trends
  generateSalesTrends(days: number = 30): SalesTrendData[] {
    const trends: SalesTrendData[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Generate realistic sales data with some randomness and trends
      const baseAmount = 50000 + Math.random() * 100000;
      const seasonality = 1 + 0.3 * Math.sin((date.getDate() / 30) * Math.PI * 2); // Monthly cycle
      const weekdayBoost = [1.2, 1.3, 1.1, 1.0, 1.4, 1.6, 1.5][date.getDay()]; // Weekly pattern
      
      const sales = Math.round(baseAmount * seasonality * weekdayBoost);
      const profit = Math.round(sales * (0.15 + Math.random() * 0.1)); // 15-25% margin
      const orders = Math.round(sales / (800 + Math.random() * 400)); // Avg order value 800-1200
      
      trends.push({
        month: date.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' }),
        sales,
        profit,
        orders
      });
    }
    
    return trends;
  }

  // Generate activity log
  async generateActivities(count: number = 10): Promise<Activity[]> {
    const products = await this.getProducts();
    const activities: Activity[] = [];
    const activityTypes = ['add', 'update', 'delete', 'stock_alert'] as const;
    
    for (let i = 0; i < count; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      if (!product) continue;
      
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days
      
      let description = '';
      switch (type) {
        case 'add':
          description = `Added new product "${product.name}" to inventory`;
          break;
        case 'update':
          description = `Updated "${product.name}" - stock level: ${product.quantity}`;
          break;
        case 'delete':
          description = `Removed "${product.name}" from inventory`;
          break;
        case 'stock_alert':
          description = `Low stock alert for "${product.name}" - only ${product.quantity} left`;
          break;
      }
      
      activities.push({
        id: `activity-${Date.now()}-${i}`,
        type,
        productId: product.id,
        productName: product.name,
        action: type === 'add' ? 'Product Added' : 
               type === 'update' ? 'Product Updated' : 
               type === 'delete' ? 'Product Deleted' : 'Stock Alert',
        description,
        timestamp,
        userId: 'user-1' // Mock user
      });
    }
    
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Sync data in background
  private async syncData() {
    try {
      // Refresh critical data
      await Promise.all([
        this.getProducts(true),
        this.getDashboardStats(true),
        this.getStockAlerts(true)
      ]);
      
      console.log('📊 Background data sync completed');
    } catch (error) {
      console.error('Error during background sync:', error);
    }
  }

  // Refresh all cached data
  async refreshAllData() {
    this.cache.clear();
    await Promise.all([
      this.getProducts(true),
      this.getDashboardStats(true),
      this.getStockAlerts(true)
    ]);
  }

  // Get cache statistics for debugging
  getCacheInfo() {
    const cacheInfo = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      size: JSON.stringify(value.data).length,
      age: Date.now() - value.timestamp,
      ttl: value.ttl
    }));
    
    return {
      totalEntries: this.cache.size,
      subscribers: Array.from(this.subscribers.keys()).map(key => ({
        dataType: key,
        subscriberCount: this.subscribers.get(key)?.size || 0
      })),
      cacheDetails: cacheInfo
    };
  }
}

// Export singleton instance
export const dataManager = DataManager.getInstance();

// Initialize on module load
dataManager.initialize().catch(console.error);

export default dataManager;
