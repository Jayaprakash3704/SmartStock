import { Product } from '../types';
import { productsAPI } from './api';

// Minimal demo data for application demonstration (5 products only)
export const DEMO_PRODUCTS: Product[] = [
  {
    id: 'demo-001',
    name: 'Smartphone',
    description: 'Basic smartphone for demo',
    category: 'Electronics',
    price: 25000,
    quantity: 10,
    supplier: 'Demo Supplier',
    location: 'Store',
    sku: 'DEMO-001',
    minStockLevel: 5,
    maxStockLevel: 50,
    barcode: '1234567890001',
    gstRate: 18,
    hsnCode: '85171200',
    brand: 'Demo Brand',
    unit: 'Piece',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'demo-002',
    name: 'T-Shirt',
    description: 'Cotton t-shirt for demo',
    category: 'Clothing',
    price: 500,
    quantity: 20,
    supplier: 'Demo Supplier',
    location: 'Store',
    sku: 'DEMO-002',
    minStockLevel: 10,
    maxStockLevel: 100,
    barcode: '1234567890002',
    gstRate: 5,
    hsnCode: '61091000',
    brand: 'Demo Brand',
    unit: 'Piece',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'demo-003',
    name: 'Coffee Mug',
    description: 'Ceramic coffee mug for demo',
    category: 'Home & Garden',
    price: 200,
    quantity: 3,
    supplier: 'Demo Supplier',
    location: 'Store',
    sku: 'DEMO-003',
    minStockLevel: 5,
    maxStockLevel: 30,
    barcode: '1234567890003',
    gstRate: 12,
    hsnCode: '69120000',
    brand: 'Demo Brand',
    unit: 'Piece',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'demo-004',
    name: 'Notebook',
    description: 'Spiral notebook for demo',
    category: 'Books & Media',
    price: 50,
    quantity: 50,
    supplier: 'Demo Supplier',
    location: 'Store',
    sku: 'DEMO-004',
    minStockLevel: 20,
    maxStockLevel: 200,
    barcode: '1234567890004',
    gstRate: 12,
    hsnCode: '48201000',
    brand: 'Demo Brand',
    unit: 'Piece',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'demo-005',
    name: 'Water Bottle',
    description: 'Stainless steel water bottle for demo',
    category: 'Sports & Fitness',
    price: 800,
    quantity: 15,
    supplier: 'Demo Supplier',
    location: 'Store',
    sku: 'DEMO-005',
    minStockLevel: 10,
    maxStockLevel: 50,
    barcode: '1234567890005',
    gstRate: 18,
    hsnCode: '73239300',
    brand: 'Demo Brand',
    unit: 'Piece',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Simple function to initialize minimal demo data
export async function initializeDemoData(): Promise<void> {
  try {
    console.log('📦 Loading minimal demo data...');
    
    let successCount = 0;
    for (const product of DEMO_PRODUCTS) {
      try {
        const result = await productsAPI.create(product);
        if (result.success) {
          successCount++;
        }
      } catch (error) {
        console.warn(`Failed to create demo product ${product.name}:`, error);
      }
    }
    
    console.log(`✅ Demo data loaded: ${successCount}/${DEMO_PRODUCTS.length} products`);
    
  } catch (error) {
    console.error('❌ Error loading demo data:', error);
    throw error;
  }
}

export default { initializeDemoData, DEMO_PRODUCTS };
