import { Product } from '../types';
import { productsAPI } from './api';
import { notificationManager } from './notificationManager';
import { getDbInstance, isFirebaseEnabled } from './firebase';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  subtotal: number;
  gstAmount: number;
  total: number;
  timestamp: Date;
  customerName?: string;
  paymentMethod: 'cash' | 'card' | 'upi';
  userId?: string; // For Firebase multi-user support
}

class SalesService {
  private sales: Sale[] = [];

  // Initialize with mock data or load from localStorage/Firebase
  constructor() {
    this.loadSales();
  }

  private async loadSales() {
    try {
      if (isFirebaseEnabled()) {
        await this.loadSalesFromFirebase();
      } else {
        this.loadSalesFromLocalStorage();
      }
    } catch (error) {
      console.error('Error loading sales:', error);
      this.sales = [];
    }
  }

  private async loadSalesFromFirebase() {
    try {
      const db = getDbInstance();
      if (!db) return;
      
      const currentUser = this.getCurrentUserId();
      if (!currentUser) return;

      const salesRef = collection(db, `users/${currentUser}/sales`);
      const q = query(salesRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      this.sales = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as Sale[];
    } catch (error) {
      console.error('Error loading sales from Firebase:', error);
      this.loadSalesFromLocalStorage(); // Fallback
    }
  }

  private loadSalesFromLocalStorage() {
    try {
      const saved = localStorage.getItem('smartstock_sales');
      if (saved) {
        this.sales = JSON.parse(saved).map((sale: any) => ({
          ...sale,
          timestamp: new Date(sale.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading sales from localStorage:', error);
      this.sales = [];
    }
  }

  private async saveSales() {
    try {
      if (isFirebaseEnabled()) {
        // Firebase saves are handled individually in saveSale method
        return;
      } else {
        localStorage.setItem('smartstock_sales', JSON.stringify(this.sales));
      }
    } catch (error) {
      console.error('Error saving sales:', error);
    }
  }

  private async saveSale(sale: Sale): Promise<void> {
    try {
      if (isFirebaseEnabled()) {
        const db = getDbInstance();
        const currentUser = this.getCurrentUserId();
        
        if (db && currentUser) {
          const saleData = {
            ...sale,
            timestamp: Timestamp.fromDate(sale.timestamp),
            userId: currentUser
          };
          
          const salesRef = collection(db, `users/${currentUser}/sales`);
          await addDoc(salesRef, saleData);
        }
      } else {
        // For localStorage, save all sales
        this.saveSales();
      }
    } catch (error) {
      console.error('Error saving sale:', error);
      // Fallback to localStorage
      this.saveSales();
    }
  }

  private getCurrentUserId(): string | null {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Process a sale and update inventory
  async processSale(items: SaleItem[], customerName?: string, paymentMethod: 'cash' | 'card' | 'upi' = 'cash'): Promise<Sale> {
    try {
      // Validate inventory availability
      const products = await productsAPI.getAll();
      if (!products.success) {
        throw new Error('Failed to load inventory');
      }

      const productMap = new Map(products.data.map(p => [p.id!, p]));

      // Check stock availability
      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productName} not found`);
        }
        if (product.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.productName}. Available: ${product.quantity}, Requested: ${item.quantity}`);
        }
      }

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const gstAmount = subtotal * 0.18; // 18% GST
      const total = subtotal + gstAmount;

      // Create sale record
      const sale: Sale = {
        id: Date.now().toString(),
        items,
        subtotal,
        gstAmount,
        total,
        timestamp: new Date(),
        customerName,
        paymentMethod
      };

      // Update inventory
      for (const item of items) {
        const product = productMap.get(item.productId)!;
        const updatedProduct = {
          ...product,
          quantity: product.quantity - item.quantity
        };
        await productsAPI.update(product.id!, updatedProduct);
      }

      // Save sale to Firebase or localStorage
      await this.saveSale(sale);
      this.sales.unshift(sale); // Add to beginning for recent first
      
      notificationManager.showSuccess(
        'Sale Completed',
        `Sale of ₹${total.toFixed(2)} processed successfully`
      );

      return sale;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process sale';
      notificationManager.showError('Sale Failed', message);
      throw error;
    }
  }

  // Get all sales
  getAllSales(): Sale[] {
    return [...this.sales];
  }

  // Get sales for a date range
  getSalesForPeriod(startDate: Date, endDate: Date): Sale[] {
    return this.sales.filter(sale => 
      sale.timestamp >= startDate && sale.timestamp <= endDate
    );
  }

  // Get today's sales
  getTodaysSales(): Sale[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.getSalesForPeriod(today, tomorrow);
  }

  // Get sales summary
  getSalesSummary(sales: Sale[] = this.sales) {
    return {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
      totalGST: sales.reduce((sum, sale) => sum + sale.gstAmount, 0),
      avgSaleValue: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0,
      topProducts: this.getTopProducts(sales),
      paymentMethods: this.getPaymentMethodBreakdown(sales)
    };
  }

  private getTopProducts(sales: Sale[]) {
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const existing = productMap.get(item.productId) || { name: item.productName, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.total;
        productMap.set(item.productId, existing);
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  private getPaymentMethodBreakdown(sales: Sale[]) {
    const breakdown = { cash: 0, card: 0, upi: 0 };
    sales.forEach(sale => {
      breakdown[sale.paymentMethod] += sale.total;
    });
    return breakdown;
  }

  // Generate receipt text
  generateReceipt(sale: Sale, shopName: string = 'SmartStock Retail'): string {
    const receipt = `
═══════════════════════════════
        ${shopName}
═══════════════════════════════
Date: ${sale.timestamp.toLocaleString('en-IN')}
Receipt #: ${sale.id}
${sale.customerName ? `Customer: ${sale.customerName}` : ''}
───────────────────────────────
ITEMS:
${sale.items.map(item => 
  `${item.productName}\n  ${item.quantity} x ₹${item.unitPrice.toFixed(2)} = ₹${item.total.toFixed(2)}`
).join('\n')}
───────────────────────────────
Subtotal:      ₹${sale.subtotal.toFixed(2)}
GST (18%):     ₹${sale.gstAmount.toFixed(2)}
───────────────────────────────
TOTAL:         ₹${sale.total.toFixed(2)}
Payment:       ${sale.paymentMethod.toUpperCase()}
───────────────────────────────
     Thank you for shopping!
═══════════════════════════════`;
    return receipt;
  }
}

export const salesService = new SalesService();
