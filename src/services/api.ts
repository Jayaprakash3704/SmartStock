import { Product, User, DashboardStats, ApiResponse, ProductFormData, LoginFormData, ProductFilters, SalesData, SalesTrendData, ChartData } from '../types';
import { generateId } from '../utils/helpers';
import { getAuthInstance, getDbInstance, isFirebaseEnabled } from './firebase';
import { 
  signInWithEmailAndPassword, signOut, onAuthStateChanged, type User as FirebaseUser,
  GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, updateProfile
} from 'firebase/auth';
import { 
  collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc, serverTimestamp, query, where
} from 'firebase/firestore';

// Utility function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Auth API
export const authAPI = {
  login: async (credentials: LoginFormData): Promise<ApiResponse<{ user: User; token: string }>> => {
    try {
      if (isFirebaseEnabled()) {
        const auth = getAuthInstance();
        if (!auth) throw new Error('Auth not initialized');
        const res = await signInWithEmailAndPassword(auth, credentials.username, credentials.password);
        const fbUser = res.user;
        const user: User = {
          id: fbUser.uid,
          username: fbUser.email || fbUser.uid,
          email: fbUser.email || '',
          role: 'manager',
          isActive: true,
          permissions: ['products:read','inventory:read','reports:read'],
          lastLogin: new Date(),
        };
        const token = await fbUser.getIdToken();
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true, data: { user, token }, message: 'Login successful' };
      }

      // Fallback mock auth
      await delay(500);
      if (credentials.username === 'admin' && credentials.password === 'admin123') {
        const user: User = {
          id: '1', username: 'admin', email: 'admin@smartstock.com', role: 'admin', isActive: true,
          permissions: ['read', 'write', 'delete', 'admin'], lastLogin: new Date(),
        };
        const token = 'mock-jwt-token';
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true, data: { user, token }, message: 'Login successful' };
      }
      return { success: false, data: {} as any, error: 'Invalid credentials' };
    } catch (error: any) {
      return { success: false, data: {} as any, error: error?.message || 'Login failed' };
    }
  },
  register: async (email: string, password: string, displayName?: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    try {
      if (isFirebaseEnabled()) {
        const auth = getAuthInstance();
        if (!auth) throw new Error('Auth not initialized');
        const res = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) await updateProfile(res.user, { displayName });
        const fbUser = res.user;
        const user: User = {
          id: fbUser.uid,
          username: fbUser.email || fbUser.uid,
          email: fbUser.email || '',
          role: 'manager',
          isActive: true,
          permissions: ['products:read','inventory:read','reports:read'],
          lastLogin: new Date(),
        };
        const token = await fbUser.getIdToken();
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true, data: { user, token }, message: 'Registration successful' };
      }
      // Mock registration
      await delay(500);
      const user: User = {
        id: generateId(), username: email, email, role: 'manager', isActive: true,
        permissions: ['products:read','inventory:read','reports:read'], lastLogin: new Date(),
      };
      const token = 'mock-jwt-token';
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return { success: true, data: { user, token }, message: 'Registration successful' };
    } catch (error: any) {
      return { success: false, data: {} as any, error: error?.message || 'Registration failed' };
    }
  },
  loginWithGoogle: async (): Promise<ApiResponse<{ user: User; token: string }>> => {
    try {
      if (!isFirebaseEnabled()) {
        return { success: false, data: {} as any, error: 'Google Sign-In requires Firebase' };
      }
      const auth = getAuthInstance();
      if (!auth) throw new Error('Auth not initialized');
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const fbUser = res.user;
      const user: User = {
        id: fbUser.uid,
        username: fbUser.email || fbUser.uid,
        email: fbUser.email || '',
        role: 'manager',
        isActive: true,
        permissions: ['products:read','inventory:read','reports:read'],
        lastLogin: new Date(),
      };
      const token = await fbUser.getIdToken();
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return { success: true, data: { user, token }, message: 'Login successful' };
    } catch (error: any) {
      return { success: false, data: {} as any, error: error?.message || 'Google login failed' };
    }
  },

  logout: async (): Promise<ApiResponse<void>> => {
    try {
      if (isFirebaseEnabled()) {
        const auth = getAuthInstance();
        if (auth) await signOut(auth);
      }
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      return { success: true, data: undefined, message: 'Logout successful' };
    } catch (e) {
      return { success: false, data: undefined, error: 'Logout failed' };
    }
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// Helper: current user id (Firebase first, then local storage fallback)
const getCurrentUserId = (): string | null => {
  const auth = getAuthInstance();
  const uid = auth?.currentUser?.uid || null;
  if (uid) return uid;
  try {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?.id || null;
  } catch {
    return null;
  }
};

// Products API
export const productsAPI = {
  getAll: async (filters?: ProductFilters): Promise<ApiResponse<Product[]>> => {
    try {
      if (isFirebaseEnabled()) {
        const db = getDbInstance();
        if (!db) throw new Error('DB not initialized');
        const uid = getCurrentUserId();
        if (!uid) throw new Error('Not authenticated');
        const col = collection(db, `users/${uid}/products`);
        const snap = await getDocs(col);
        let products: Product[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        // Filters client-side for simplicity
        if (filters?.lowStock) products = products.filter(p => p.minStockLevel && p.quantity <= p.minStockLevel);
        if (filters?.category) products = products.filter(p => p.category === filters.category);
        if (filters?.supplier) products = products.filter(p => p.supplier === filters.supplier);
        return { success: true, data: products };
      }

      await delay(300);
      // Initialize empty products storage if needed
      if (!localStorage.getItem('products')) {
        localStorage.setItem('products', JSON.stringify([]));
      }
      const products: Product[] = JSON.parse(localStorage.getItem('products') || '[]');
      let filteredProducts = products;
      if (filters?.lowStock) filteredProducts = products.filter(p => p.minStockLevel && p.quantity <= p.minStockLevel);
      if (filters?.category) filteredProducts = filteredProducts.filter(p => p.category === filters.category);
      if (filters?.supplier) filteredProducts = filteredProducts.filter(p => p.supplier === filters.supplier);
      return { success: true, data: filteredProducts };
    } catch (error) {
      return { success: false, data: [], error: 'Failed to fetch products' };
    }
  },

  getById: async (id: string): Promise<ApiResponse<Product>> => {
    try {
      if (isFirebaseEnabled()) {
  const db = getDbInstance(); if (!db) throw new Error('DB not initialized');
  const uid = getCurrentUserId(); if (!uid) throw new Error('Not authenticated');
  const ref = doc(db, `users/${uid}/products`, id);
        const d = await getDoc(ref);
        if (!d.exists()) return { success: false, data: {} as Product, error: 'Product not found' };
        return { success: true, data: { id: d.id, ...(d.data() as any) } };
      }
      await delay(200);
      const products: Product[] = JSON.parse(localStorage.getItem('products') || '[]');
      const product = products.find(p => p.id === id);
      if (!product) return { success: false, data: {} as Product, error: 'Product not found' };
      return { success: true, data: product };
    } catch (error) {
      return { success: false, data: {} as Product, error: 'Failed to fetch product' };
    }
  },

  create: async (productData: ProductFormData): Promise<ApiResponse<Product>> => {
    try {
      if (isFirebaseEnabled()) {
  const db = getDbInstance(); if (!db) throw new Error('DB not initialized');
  const uid = getCurrentUserId(); if (!uid) throw new Error('Not authenticated');
        const now = new Date();
  const res = await addDoc(collection(db, `users/${uid}/products`), { ...productData, createdAt: now.toISOString(), updatedAt: now.toISOString() });
        return { success: true, data: { id: res.id, ...productData, createdAt: now, updatedAt: now }, message: 'Product created successfully' };
      }
      await delay(500);
      const products: Product[] = JSON.parse(localStorage.getItem('products') || '[]');
      const newProduct: Product = { ...productData, id: generateId(), createdAt: new Date(), updatedAt: new Date() };
      products.push(newProduct);
      localStorage.setItem('products', JSON.stringify(products));
      return { success: true, data: newProduct, message: 'Product created successfully' };
    } catch (error) {
      return { success: false, data: {} as Product, error: 'Failed to create product' };
    }
  },

  update: async (id: string, productData: Partial<ProductFormData>): Promise<ApiResponse<Product>> => {
    try {
      if (isFirebaseEnabled()) {
  const db = getDbInstance(); if (!db) throw new Error('DB not initialized');
  const uid = getCurrentUserId(); if (!uid) throw new Error('Not authenticated');
  const ref = doc(db, `users/${uid}/products`, id);
        const nowIso = new Date().toISOString();
        await updateDoc(ref, { ...productData, updatedAt: nowIso });
        const d = await getDoc(ref);
        return { success: true, data: { id, ...(d.data() as any) }, message: 'Product updated successfully' };
      }
      await delay(400);
      const products: Product[] = JSON.parse(localStorage.getItem('products') || '[]');
      const index = products.findIndex(p => p.id === id);
      if (index === -1) return { success: false, data: {} as Product, error: 'Product not found' };
      products[index] = { ...products[index], ...productData, updatedAt: new Date() };
      localStorage.setItem('products', JSON.stringify(products));
      return { success: true, data: products[index], message: 'Product updated successfully' };
    } catch (error) {
      return { success: false, data: {} as Product, error: 'Failed to update product' };
    }
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    try {
      if (isFirebaseEnabled()) {
  const db = getDbInstance(); if (!db) throw new Error('DB not initialized');
  const uid = getCurrentUserId(); if (!uid) throw new Error('Not authenticated');
  await deleteDoc(doc(db, `users/${uid}/products`, id));
        return { success: true, data: undefined, message: 'Product deleted successfully' };
      }
      await delay(300);
      const products: Product[] = JSON.parse(localStorage.getItem('products') || '[]');
      const filteredProducts = products.filter(p => p.id !== id);
      localStorage.setItem('products', JSON.stringify(filteredProducts));
      return { success: true, data: undefined, message: 'Product deleted successfully' };
    } catch (error) {
      return { success: false, data: undefined, error: 'Failed to delete product' };
    }
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    try {
      const productsRes = await productsAPI.getAll();
      const products = productsRes.data || [];
      const totalProducts = products.length;
      const lowStockItems = products.filter(p => p.minStockLevel && p.quantity <= p.minStockLevel).length;
      const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      const recentActivities = [
        {
          id: '1', type: 'add' as const, productId: products[0]?.id || '1',
          productName: products[0]?.name || 'New Product', action: 'Product Synced', description: 'Inventory synced with database',
          timestamp: new Date(), userId: '1',
        },
      ];
      return { success: true, data: { totalProducts, lowStockItems, totalValue, recentActivities } };
    } catch (error) {
      return { success: false, data: {} as DashboardStats, error: 'Failed to fetch dashboard stats' };
    }
  },

  getSalesData: async (): Promise<ApiResponse<SalesTrendData[]>> => {
    try {
      const productsRes = await productsAPI.getAll();
      const products = productsRes.data || [];
      const currentDate = new Date();
      const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      const baseSalesMultiplier = 1.2;
      const salesData: SalesTrendData[] = Array.from({ length: 6 }, (_, index) => {
        const monthIndex = (currentDate.getMonth() - 5 + index + 12) % 12;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const seasonalMultiplier = 0.8 + (Math.sin((monthIndex / 12) * 2 * Math.PI) + 1) * 0.3;
        const randomVariation = 0.85 + Math.random() * 0.3;
        const monthlySales = Math.round(totalInventoryValue * baseSalesMultiplier * seasonalMultiplier * randomVariation / 6);
        const monthlyProfit = Math.round(monthlySales * (0.20 + Math.random() * 0.15));
        const monthlyOrders = Math.round(monthlySales / (1200 + Math.random() * 800));
        return { month: monthNames[monthIndex], sales: monthlySales, profit: monthlyProfit, orders: monthlyOrders };
      });
      return { success: true, data: salesData };
    } catch (error) {
      return { success: false, data: [], error: 'Failed to fetch sales data' };
    }
  },

  getCategoryData: async (): Promise<ApiResponse<ChartData[]>> => {
    try {
      const productsRes = await productsAPI.getAll();
      const products = productsRes.data || [];
      const categoryData: { [key: string]: number } = {};
      products.forEach(product => {
        categoryData[product.category] = (categoryData[product.category] || 0) + product.quantity;
      });
      const chartData: ChartData[] = Object.entries(categoryData).map(([name, value]) => ({ name, value }));
      return { success: true, data: chartData };
    } catch (error) {
      return { success: false, data: [], error: 'Failed to fetch category data' };
    }
  },
};

// Users API (Firestore-backed profiles). Note: Creating Auth users requires Admin SDK on server.
export const usersAPI = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    try {
      if (isFirebaseEnabled()) {
        const db = getDbInstance(); if (!db) throw new Error('DB not initialized');
        const snap = await getDocs(collection(db, 'users'));
        const users = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        return { success: true, data: users };
      }
      // Fallback to empty
      return { success: true, data: [] };
    } catch (e) {
      return { success: false, data: [], error: 'Failed to fetch users' };
    }
  },
  create: async (profile: any): Promise<ApiResponse<any>> => {
    try {
      if (isFirebaseEnabled()) {
        const db = getDbInstance(); if (!db) throw new Error('DB not initialized');
        const res = await addDoc(collection(db, 'users'), { ...profile, createdAt: new Date().toISOString() });
        return { success: true, data: { id: res.id, ...profile } };
      }
      return { success: true, data: { id: generateId(), ...profile } };
    } catch (e) {
      return { success: false, data: {}, error: 'Failed to create user' } as any;
    }
  },
  update: async (id: string, profile: any): Promise<ApiResponse<any>> => {
    try {
      if (isFirebaseEnabled()) {
        const db = getDbInstance(); if (!db) throw new Error('DB not initialized');
        const ref = doc(db, 'users', id);
        await updateDoc(ref, { ...profile, updatedAt: new Date().toISOString() });
        return { success: true, data: { id, ...profile } };
      }
      return { success: true, data: { id, ...profile } };
    } catch (e) {
      return { success: false, data: {}, error: 'Failed to update user' } as any;
    }
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    try {
      if (isFirebaseEnabled()) {
        const db = getDbInstance(); if (!db) throw new Error('DB not initialized');
        await deleteDoc(doc(db, 'users', id));
      }
      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, data: undefined, error: 'Failed to delete user' };
    }
  }
};

// Initialize data on module load
// Initialize empty products storage if needed
if (!localStorage.getItem('products')) {
  localStorage.setItem('products', JSON.stringify([]));
}