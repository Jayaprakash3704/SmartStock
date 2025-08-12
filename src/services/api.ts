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

// Enhanced mock data for Indian market
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Samsung Galaxy S24',
    description: 'Latest Samsung smartphone with AI features',
    category: 'Electronics',
    price: 79999,
    quantity: 15,
    minStockLevel: 5,
    maxStockLevel: 50,
    supplier: 'Samsung India',
    barcode: '8801643171780',
    gstRate: 18,
    hsnCode: '85171200',
    brand: 'Samsung',
    unit: 'pieces',
    location: 'A1-Shelf-01',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Apple iPhone 15',
    description: 'Latest iPhone with USB-C',
    category: 'Electronics',
    price: 134900,
    quantity: 3,
    minStockLevel: 5,
    maxStockLevel: 30,
    supplier: 'Apple India',
    barcode: '194253781234',
    gstRate: 18,
    hsnCode: '85171200',
    brand: 'Apple',
    unit: 'pieces',
    location: 'A1-Shelf-02',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-16'),
  },
  {
    id: '3',
    name: 'Sony WH-1000XM5',
    description: 'Premium noise-canceling headphones',
    category: 'Electronics',
    price: 29990,
    quantity: 8,
    minStockLevel: 3,
    maxStockLevel: 25,
    supplier: 'Sony India',
    barcode: '4548736139534',
    gstRate: 18,
    hsnCode: '85183000',
    brand: 'Sony',
    unit: 'pieces',
    location: 'A2-Shelf-01',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-17'),
  },
  {
    id: '4',
    name: 'Patanjali Aloe Vera Gel',
    description: 'Natural aloe vera gel for skin care',
    category: 'Health & Beauty',
    price: 150,
    quantity: 45,
    minStockLevel: 20,
    maxStockLevel: 100,
    supplier: 'Patanjali Ayurved',
    barcode: '8904109401234',
    gstRate: 5,
    hsnCode: '33049900',
    brand: 'Patanjali',
    unit: 'pieces',
    location: 'B1-Shelf-03',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '5',
    name: 'Amul Fresh Milk',
    description: 'Fresh full cream milk 1L',
    category: 'Dairy',
    price: 60,
    quantity: 25,
    minStockLevel: 10,
    maxStockLevel: 60,
    supplier: 'Amul India',
    barcode: '8901430001234',
    gstRate: 5,
    hsnCode: '04011000',
    brand: 'Amul',
    unit: 'liters',
    location: 'Cold-Storage-01',
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: '6',
    name: 'Hindustan Unilever Shampoo',
    description: 'Clinic Plus Strong & Long Shampoo 650ml',
    category: 'Health & Beauty',
    price: 285,
    quantity: 32,
    minStockLevel: 15,
    maxStockLevel: 80,
    supplier: 'Hindustan Unilever',
    barcode: '8901030895234',
    gstRate: 18,
    hsnCode: '33051000',
    brand: 'Clinic Plus',
    unit: 'pieces',
    location: 'B2-Shelf-01',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: '7',
    name: 'Haldirams Bhujia',
    description: 'Aloo Bhujia 400g pack',
    category: 'Snacks',
    price: 120,
    quantity: 18,
    minStockLevel: 10,
    maxStockLevel: 50,
    supplier: 'Haldirams',
    barcode: '8904063201234',
    gstRate: 12,
    hsnCode: '19059090',
    brand: 'Haldirams',
    unit: 'pieces',
    location: 'C1-Shelf-02',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-20'),
  },
  {
    id: '8',
    name: 'MI Band 7',
    description: 'Xiaomi Mi Smart Band 7 Fitness Tracker',
    category: 'Electronics',
    price: 2799,
    quantity: 12,
    minStockLevel: 5,
    maxStockLevel: 30,
    supplier: 'MI India',
    barcode: '6934177771234',
    gstRate: 18,
    hsnCode: '85176220',
    brand: 'MI',
    unit: 'pieces',
    location: 'A3-Shelf-01',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-25'),
  },
  {
    id: '9',
    name: 'Maggi 2-Minute Noodles',
    description: 'Masala Noodles 70g pack',
    category: 'Food',
    price: 14,
    quantity: 85,
    minStockLevel: 30,
    maxStockLevel: 200,
    supplier: 'Nestle India',
    barcode: '8901030875234',
    gstRate: 12,
    hsnCode: '19023010',
    brand: 'Maggi',
    unit: 'pieces',
    location: 'C2-Shelf-01',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-15'),
  },
  {
    id: '10',
    name: 'Honda Activa Engine Oil',
    description: 'Honda 10W-30 4T Plus Engine Oil 1L',
    category: 'Automotive',
    price: 450,
    quantity: 8,
    minStockLevel: 5,
    maxStockLevel: 25,
    supplier: 'Honda India',
    barcode: '4902770501234',
    gstRate: 28,
    hsnCode: '27101981',
    brand: 'Honda',
    unit: 'liters',
    location: 'D1-Shelf-01',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-25'),
  },
  {
    id: '11',
    name: 'Himalaya Face Wash',
    description: 'Purifying Neem Face Wash 150ml',
    category: 'Health & Beauty',
    price: 95,
    quantity: 28,
    minStockLevel: 15,
    maxStockLevel: 60,
    supplier: 'Himalaya Drug Company',
    barcode: '8901138501234',
    gstRate: 18,
    hsnCode: '33049100',
    brand: 'Himalaya',
    unit: 'pieces',
    location: 'B3-Shelf-02',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-30'),
  },
  {
    id: '12',
    name: 'Mother Dairy Butter',
    description: 'Fresh Salted Butter 500g',
    category: 'Dairy',
    price: 240,
    quantity: 15,
    minStockLevel: 8,
    maxStockLevel: 40,
    supplier: 'Mother Dairy',
    barcode: '8901020301234',
    gstRate: 12,
    hsnCode: '04051000',
    brand: 'Mother Dairy',
    unit: 'pieces',
    location: 'Cold-Storage-02',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-15'),
  },
];

// Mock sales data for charts
const MOCK_SALES_DATA: SalesTrendData[] = [
  { month: 'Jan', sales: 250000, profit: 50000, orders: 145 },
  { month: 'Feb', sales: 320000, profit: 65000, orders: 189 },
  { month: 'Mar', sales: 280000, profit: 58000, orders: 167 },
  { month: 'Apr', sales: 390000, profit: 78000, orders: 223 },
  { month: 'May', sales: 450000, profit: 92000, orders: 267 },
  { month: 'Jun', sales: 520000, profit: 105000, orders: 298 },
];

// Initialize mock data (only when Firebase is disabled)
const initializeMockData = () => {
  if (isFirebaseEnabled()) return;
  if (!localStorage.getItem('products')) {
    localStorage.setItem('products', JSON.stringify(MOCK_PRODUCTS));
  }
};

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
      initializeMockData();
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
initializeMockData();