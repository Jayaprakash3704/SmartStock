import { StockAlert, Activity } from '../types';

export interface NotificationConfig {
  sound: boolean;
  desktop: boolean;
  email: boolean;
  sms: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'stock' | 'sales' | 'system' | 'user';
  persistent: boolean;
}

class NotificationManager {
  private static instance: NotificationManager;
  private notifications: Notification[] = [];
  private subscribers: Set<(notifications: Notification[]) => void> = new Set();
  private config: NotificationConfig = {
    sound: true,
    desktop: true,
    email: false,
    sms: false
  };
  private maxNotifications = 100;

  private constructor() {
    this.initializeDesktopNotifications();
    this.loadFromStorage();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Initialize desktop notifications
  private async initializeDesktopNotifications() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  // Load notifications from localStorage
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('smartstock_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
    }
  }

  // Save notifications to localStorage
  private saveToStorage() {
    try {
      localStorage.setItem('smartstock_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications to storage:', error);
    }
  }

  // Subscribe to notification updates
  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.subscribers.add(callback);
    // Send current notifications immediately
    callback(this.getNotifications());
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Emit notification updates
  private emit() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.getNotifications());
      } catch (error) {
        console.error('Error in notification subscriber:', error);
      }
    });
  }

  // Create a new notification
  createNotification(params: {
    type: Notification['type'];
    title: string;
    message: string;
    priority?: Notification['priority'];
    category?: Notification['category'];
    persistent?: boolean;
    action?: Notification['action'];
  }): string {
    const notification: Notification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: params.type,
      title: params.title,
      message: params.message,
      timestamp: new Date(),
      read: false,
      priority: params.priority || 'medium',
      category: params.category || 'system',
      persistent: params.persistent || false,
      action: params.action
    };

    this.notifications.unshift(notification);

    // Trim notifications if too many
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    // Show desktop notification
    this.showDesktopNotification(notification);

    // Play sound
    this.playNotificationSound(notification.priority);

    // Save to storage
    this.saveToStorage();

    // Emit to subscribers
    this.emit();

    // Auto-remove non-persistent notifications after 5 seconds
    if (!notification.persistent) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, 5000);
    }

    return notification.id;
  }

  // Show desktop notification
  private showDesktopNotification(notification: Notification) {
    if (!this.config.desktop || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const desktopNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: notification.id
    });

    desktopNotification.onclick = () => {
      window.focus();
      this.markAsRead(notification.id);
      desktopNotification.close();
    };

    setTimeout(() => {
      desktopNotification.close();
    }, 5000);
  }

  // Play notification sound
  private playNotificationSound(priority: Notification['priority']) {
    if (!this.config.sound) return;

    // Different sounds for different priorities
    const soundMap = {
      low: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUdBThyl/LNezEGN2TH7eGVSQ4NYKfh8LpkGz',
      medium: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUdBThyl/LNezEGKX/E6+OWTg8OZanE8bNiHgU+ltryxnkpBSuBzvLZiTcIG',
      high: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUdBThyl/LNezEG',
      critical: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUdBThyl/LNezEG'
    };

    const audio = new Audio(soundMap[priority]);
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore audio play errors (browser restrictions)
    });
  }

  // Stock alert notifications
  createStockAlert(alert: StockAlert) {
    return this.createNotification({
      type: alert.severity === 'critical' ? 'error' : 'warning',
      title: alert.severity === 'critical' ? 'Critical Stock Alert' : 'Low Stock Warning',
      message: `${alert.productName} has ${alert.currentStock} units left (min: ${alert.minStockLevel})`,
      priority: alert.severity === 'critical' ? 'critical' : 'high',
      category: 'stock',
      persistent: true,
      action: {
        label: 'View Product',
        callback: () => {
          // Navigate to product page
          console.log(`Navigating to product ${alert.productId}`);
        }
      }
    });
  }

  // Success notifications
  showSuccess(title: string, message: string) {
    return this.createNotification({
      type: 'success',
      title,
      message,
      priority: 'low',
      category: 'system'
    });
  }

  // Error notifications
  showError(title: string, message: string) {
    return this.createNotification({
      type: 'error',
      title,
      message,
      priority: 'high',
      category: 'system',
      persistent: true
    });
  }

  // Info notifications
  showInfo(title: string, message: string) {
    return this.createNotification({
      type: 'info',
      title,
      message,
      priority: 'low',
      category: 'system'
    });
  }

  // Activity notifications
  createActivityNotification(activity: Activity) {
    const titles = {
      add: '➕ Product Added',
      update: '✏️ Product Updated',
      delete: '🗑️ Product Removed',
      stock_alert: '⚠️ Stock Alert'
    };

    return this.createNotification({
      type: activity.type === 'delete' ? 'warning' : 'info',
      title: titles[activity.type],
      message: activity.description || 'Activity recorded',
      priority: activity.type === 'stock_alert' ? 'high' : 'low',
      category: activity.type === 'stock_alert' ? 'stock' : 'system'
    });
  }

  // Mark notification as read
  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      this.saveToStorage();
      this.emit();
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    let changed = false;
    this.notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        changed = true;
      }
    });
    
    if (changed) {
      this.saveToStorage();
      this.emit();
    }
  }

  // Remove notification
  removeNotification(id: string) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.saveToStorage();
      this.emit();
    }
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.saveToStorage();
    this.emit();
  }

  // Get notifications
  getNotifications(): Notification[] {
    return this.notifications.slice();
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Get notifications by category
  getNotificationsByCategory(category: Notification['category']): Notification[] {
    return this.notifications.filter(n => n.category === category);
  }

  // Update configuration
  updateConfig(config: Partial<NotificationConfig>) {
    this.config = { ...this.config, ...config };
    localStorage.setItem('smartstock_notification_config', JSON.stringify(this.config));
  }

  // Get configuration
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  // Test notification
  testNotification() {
    return this.createNotification({
      type: 'info',
      title: '🧪 Test Notification',
      message: 'This is a test notification from SmartStock. All systems working correctly!',
      priority: 'medium',
      category: 'system'
    });
  }
}

// Export singleton instance
export const notificationManager = NotificationManager.getInstance();

export default notificationManager;
