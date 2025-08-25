import { Product } from '../types';
import { productsAPI } from './api';

// Comprehensive mock data for demonstration
export const DEMO_PRODUCTS: Product[] = [
  // Electronics Category
  {
    id: 'prod-001',
    name: 'iPhone 15 Pro Max',
    description: 'Latest iPhone with titanium build and advanced camera system',
    category: 'Electronics',
    price: 159900,
    quantity: 25,
    supplier: 'Apple India',
    location: 'Warehouse A-1',
    sku: 'APPL-IP15-PM-256',
    minStockLevel: 5,
    maxStockLevel: 50,
    barcode: '1234567890123',
    gstRate: 18,
    hsnCode: '85171200',
    brand: 'Apple',
    unit: 'Piece',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-08-20')
  },
  {
    id: 'prod-002',
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Premium Android smartphone with S Pen',
    category: 'Electronics',
    price: 124999,
    quantity: 18,
    supplier: 'Samsung Electronics',
    location: 'Warehouse A-1',
    sku: 'SMSG-GS24-ULT-512',
    minStockLevel: 5,
    maxStockLevel: 40,
    barcode: '1234567890124',
    gstRate: 18,
    hsnCode: '85171200',
    brand: 'Samsung',
    unit: 'Piece',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-08-22')
  },
  {
    id: 'prod-003',
    name: 'MacBook Pro 16"',
    description: 'Apple MacBook Pro with M3 Max chip',
    category: 'Electronics',
    price: 399900,
    quantity: 8,
    supplier: 'Apple India',
    location: 'Warehouse A-2',
    sku: 'APPL-MBP-16-M3MAX',
    minStockLevel: 3,
    maxStockLevel: 15,
    barcode: '1234567890125',
    gstRate: 18,
    hsnCode: '84713000',
    brand: 'Apple',
    unit: 'Piece',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-08-23')
  },
  {
    id: 'prod-004',
    name: 'Sony WH-1000XM5',
    description: 'Wireless noise-canceling headphones',
    category: 'Electronics',
    price: 29990,
    quantity: 45,
    supplier: 'Sony India',
    location: 'Warehouse B-1',
    sku: 'SONY-WH1000XM5-BLK',
    minStockLevel: 10,
    maxStockLevel: 100,
    barcode: '1234567890126',
    gstRate: 18,
    hsnCode: '85183000',
    brand: 'Sony',
    unit: 'Piece',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-08-21')
  },
  {
    id: 'prod-005',
    name: 'Dell XPS 13',
    description: 'Ultra-portable laptop with Intel Core i7',
    category: 'Electronics',
    price: 149999,
    quantity: 12,
    supplier: 'Dell Technologies',
    location: 'Warehouse A-2',
    sku: 'DELL-XPS13-I7-16GB',
    minStockLevel: 5,
    maxStockLevel: 25,
    barcode: '1234567890127',
    gstRate: 18,
    hsnCode: '84713000',
    brand: 'Dell',
    unit: 'Piece',
    createdAt: new Date('2024-04-05'),
    updatedAt: new Date('2024-08-24')
  },

  // Fashion & Clothing
  {
    id: 'prod-006',
    name: 'Nike Air Jordan 1',
    description: 'Classic basketball sneakers - White/Black colorway',
    category: 'Fashion & Clothing',
    price: 12995,
    quantity: 35,
    supplier: 'Nike India',
    location: 'Warehouse C-1',
    sku: 'NIKE-AJ1-WB-US9',
    minStockLevel: 10,
    maxStockLevel: 80,
    barcode: '1234567890128',
    gstRate: 12,
    hsnCode: '64039900',
    brand: 'Nike',
    unit: 'Pair',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-08-20')
  },
  {
    id: 'prod-007',
    name: 'Levi\'s 501 Original Jeans',
    description: 'Classic straight-fit denim jeans',
    category: 'Fashion & Clothing',
    price: 4999,
    quantity: 50,
    supplier: 'Levi Strauss India',
    location: 'Warehouse C-2',
    sku: 'LEVI-501-ORIG-32',
    minStockLevel: 15,
    maxStockLevel: 100,
    barcode: '1234567890129',
    gstRate: 12,
    hsnCode: '62034200',
    brand: 'Levi\'s',
    unit: 'Piece',
    createdAt: new Date('2024-01-30'),
    updatedAt: new Date('2024-08-22')
  },
  {
    id: 'prod-008',
    name: 'Adidas Ultraboost 22',
    description: 'Premium running shoes with boost technology',
    category: 'Fashion & Clothing',
    price: 17999,
    quantity: 28,
    supplier: 'Adidas India',
    location: 'Warehouse C-1',
    sku: 'ADIDAS-UB22-BLK-US10',
    minStockLevel: 8,
    maxStockLevel: 60,
    barcode: '1234567890130',
    gstRate: 12,
    hsnCode: '64039900',
    brand: 'Adidas',
    unit: 'Pair',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-08-25')
  },

  // Home & Garden
  {
    id: 'prod-009',
    name: 'Dyson V15 Detect',
    description: 'Cordless vacuum cleaner with laser dust detection',
    category: 'Home & Garden',
    price: 65900,
    quantity: 15,
    supplier: 'Dyson India',
    location: 'Warehouse D-1',
    sku: 'DYSON-V15-DETECT-GOLD',
    minStockLevel: 5,
    maxStockLevel: 30,
    barcode: '1234567890131',
    gstRate: 18,
    hsnCode: '85081100',
    brand: 'Dyson',
    unit: 'Piece',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-08-23')
  },
  {
    id: 'prod-010',
    name: 'IKEA MALM Bed Frame',
    description: 'Queen size bed frame in white finish',
    category: 'Home & Garden',
    price: 14999,
    quantity: 22,
    supplier: 'IKEA India',
    location: 'Warehouse D-2',
    sku: 'IKEA-MALM-QUEEN-WHT',
    minStockLevel: 5,
    maxStockLevel: 40,
    barcode: '1234567890132',
    gstRate: 18,
    hsnCode: '94036000',
    brand: 'IKEA',
    unit: 'Piece',
    createdAt: new Date('2024-04-12'),
    updatedAt: new Date('2024-08-24')
  },
  {
    id: 'prod-011',
    name: 'Philips Air Purifier',
    description: 'HEPA filter air purifier for large rooms',
    category: 'Home & Garden',
    price: 25999,
    supplier: 'Philips India',
    location: 'Warehouse D-1',
    sku: 'PHILIPS-AP3000-WHT',
    quantity: 18,
    minStockLevel: 5,
    maxStockLevel: 35,
    barcode: '1234567890133',
    gstRate: 18,
    hsnCode: '84213910',
    brand: 'Philips',
    unit: 'Piece',
    createdAt: new Date('2024-03-08'),
    updatedAt: new Date('2024-08-21')
  },

  // Automotive
  {
    id: 'prod-012',
    name: 'Michelin Pilot Sport 4',
    description: 'High-performance car tires 225/45R17',
    category: 'Automotive',
    price: 18500,
    quantity: 40,
    supplier: 'Michelin India',
    location: 'Warehouse E-1',
    sku: 'MICH-PS4-225-45R17',
    minStockLevel: 12,
    maxStockLevel: 80,
    barcode: '1234567890134',
    gstRate: 28,
    hsnCode: '40111000',
    brand: 'Michelin',
    unit: 'Piece',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-08-20')
  },
  {
    id: 'prod-013',
    name: 'Bosch Car Battery',
    description: '12V 70Ah maintenance-free car battery',
    category: 'Automotive',
    price: 8999,
    quantity: 25,
    supplier: 'Bosch India',
    location: 'Warehouse E-2',
    sku: 'BOSCH-BAT-12V70AH',
    minStockLevel: 8,
    maxStockLevel: 50,
    barcode: '1234567890135',
    gstRate: 18,
    hsnCode: '85071000',
    brand: 'Bosch',
    unit: 'Piece',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-08-22')
  },
  {
    id: 'prod-014',
    name: 'Castrol GTX Engine Oil',
    description: '5W-30 synthetic blend motor oil - 5L',
    category: 'Automotive',
    price: 2499,
    quantity: 60,
    supplier: 'Castrol India',
    location: 'Warehouse E-3',
    sku: 'CASTROL-GTX-5W30-5L',
    minStockLevel: 20,
    maxStockLevel: 120,
    barcode: '1234567890136',
    gstRate: 28,
    hsnCode: '27101981',
    brand: 'Castrol',
    unit: 'Bottle',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-08-25')
  },

  // Sports & Fitness
  {
    id: 'prod-015',
    name: 'Decathlon Treadmill',
    description: 'Electric treadmill with 12 preset programs',
    category: 'Sports & Fitness',
    price: 45999,
    quantity: 8,
    supplier: 'Decathlon India',
    location: 'Warehouse F-1',
    sku: 'DECA-TREAD-ELEC-T900C',
    minStockLevel: 3,
    maxStockLevel: 20,
    barcode: '1234567890137',
    gstRate: 18,
    hsnCode: '95069990',
    brand: 'Decathlon',
    unit: 'Piece',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-08-23')
  },
  {
    id: 'prod-016',
    name: 'Nike Dri-FIT T-Shirt',
    description: 'Moisture-wicking sports t-shirt',
    category: 'Sports & Fitness',
    price: 1999,
    quantity: 75,
    supplier: 'Nike India',
    location: 'Warehouse F-2',
    sku: 'NIKE-DRIFIT-TEE-M-BLK',
    minStockLevel: 20,
    maxStockLevel: 150,
    barcode: '1234567890138',
    gstRate: 12,
    hsnCode: '61091000',
    brand: 'Nike',
    unit: 'Piece',
    createdAt: new Date('2024-02-28'),
    updatedAt: new Date('2024-08-24')
  },

  // Books & Media
  {
    id: 'prod-017',
    name: 'Atomic Habits by James Clear',
    description: 'Bestselling self-help book on habit formation',
    category: 'Books & Media',
    price: 599,
    quantity: 120,
    supplier: 'Penguin Random House',
    location: 'Warehouse G-1',
    sku: 'BOOK-ATOM-HAB-ENG',
    minStockLevel: 30,
    maxStockLevel: 200,
    barcode: '1234567890139',
    gstRate: 0,
    hsnCode: '49019900',
    brand: 'Penguin',
    unit: 'Piece',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-08-21')
  },
  {
    id: 'prod-018',
    name: 'PlayStation 5',
    description: 'Latest generation gaming console',
    category: 'Books & Media',
    price: 54990,
    quantity: 6,
    supplier: 'Sony Interactive',
    location: 'Warehouse G-2',
    sku: 'SONY-PS5-STD-825GB',
    minStockLevel: 2,
    maxStockLevel: 15,
    barcode: '1234567890140',
    gstRate: 18,
    hsnCode: '95045000',
    brand: 'Sony',
    unit: 'Piece',
    createdAt: new Date('2024-05-15'),
    updatedAt: new Date('2024-08-25')
  },

  // Food & Beverages
  {
    id: 'prod-019',
    name: 'Amul Gold Milk',
    description: 'Full cream milk - 1 liter pack',
    category: 'Food & Beverages',
    price: 62,
    quantity: 200,
    supplier: 'Amul Dairy',
    location: 'Cold Storage A',
    sku: 'AMUL-GOLD-1L',
    minStockLevel: 50,
    maxStockLevel: 500,
    barcode: '1234567890141',
    gstRate: 5,
    hsnCode: '04012000',
    brand: 'Amul',
    unit: 'Liter',
    createdAt: new Date('2024-08-01'),
    updatedAt: new Date('2024-08-25')
  },
  {
    id: 'prod-020',
    name: 'Maggi 2-Minute Noodles',
    description: 'Instant noodles - Masala flavor pack of 12',
    category: 'Food & Beverages',
    price: 144,
    quantity: 150,
    supplier: 'Nestle India',
    location: 'Warehouse H-1',
    sku: 'MAGGI-2MIN-MASALA-12P',
    minStockLevel: 40,
    maxStockLevel: 300,
    barcode: '1234567890142',
    gstRate: 12,
    hsnCode: '19023090',
    brand: 'Maggi',
    unit: 'Pack',
    createdAt: new Date('2024-07-20'),
    updatedAt: new Date('2024-08-24')
  },

  // Health & Beauty
  {
    id: 'prod-021',
    name: 'L\'Oreal Paris Shampoo',
    description: 'Total Repair 5 damage-erasing shampoo 650ml',
    category: 'Health & Beauty',
    price: 399,
    quantity: 85,
    supplier: 'L\'Oreal India',
    location: 'Warehouse I-1',
    sku: 'LOREAL-TR5-SHAMP-650ML',
    minStockLevel: 25,
    maxStockLevel: 150,
    barcode: '1234567890143',
    gstRate: 18,
    hsnCode: '33051000',
    brand: 'L\'Oreal',
    unit: 'Bottle',
    createdAt: new Date('2024-06-10'),
    updatedAt: new Date('2024-08-23')
  },
  {
    id: 'prod-022',
    name: 'Himalaya Face Wash',
    description: 'Neem and turmeric face wash 150ml',
    category: 'Health & Beauty',
    price: 165,
    quantity: 95,
    supplier: 'Himalaya Wellness',
    location: 'Warehouse I-1',
    sku: 'HIMAL-NEEM-TUR-150ML',
    minStockLevel: 30,
    maxStockLevel: 180,
    barcode: '1234567890144',
    gstRate: 18,
    hsnCode: '33049900',
    brand: 'Himalaya',
    unit: 'Tube',
    createdAt: new Date('2024-05-25'),
    updatedAt: new Date('2024-08-22')
  },

  // Toys & Games
  {
    id: 'prod-023',
    name: 'LEGO Creator Expert Set',
    description: 'Advanced building set for adults - 2000+ pieces',
    category: 'Toys & Games',
    price: 15999,
    quantity: 20,
    supplier: 'LEGO India',
    location: 'Warehouse J-1',
    sku: 'LEGO-CREATOR-EXP-2000',
    minStockLevel: 5,
    maxStockLevel: 40,
    barcode: '1234567890145',
    gstRate: 12,
    hsnCode: '95030000',
    brand: 'LEGO',
    unit: 'Set',
    createdAt: new Date('2024-04-20'),
    updatedAt: new Date('2024-08-24')
  },
  {
    id: 'prod-024',
    name: 'Monopoly Board Game',
    description: 'Classic property trading board game',
    category: 'Toys & Games',
    price: 1299,
    quantity: 45,
    supplier: 'Hasbro India',
    location: 'Warehouse J-2',
    sku: 'HASBRO-MONO-CLASSIC',
    minStockLevel: 15,
    maxStockLevel: 100,
    barcode: '1234567890146',
    gstRate: 12,
    hsnCode: '95049000',
    brand: 'Hasbro',
    unit: 'Box',
    createdAt: new Date('2024-03-30'),
    updatedAt: new Date('2024-08-21')
  },

  // Office Supplies
  {
    id: 'prod-025',
    name: 'HP LaserJet Pro Printer',
    description: 'Monochrome laser printer with WiFi',
    category: 'Office Supplies',
    price: 18999,
    quantity: 12,
    supplier: 'HP India',
    location: 'Warehouse K-1',
    sku: 'HP-LJ-PRO-M404DN',
    minStockLevel: 5,
    maxStockLevel: 25,
    barcode: '1234567890147',
    gstRate: 18,
    hsnCode: '84433200',
    brand: 'HP',
    unit: 'Piece',
    createdAt: new Date('2024-06-05'),
    updatedAt: new Date('2024-08-25')
  },

  // Some low stock items for alerts
  {
    id: 'prod-026',
    name: 'Canon EOS R5 Camera',
    description: 'Professional mirrorless camera body',
    category: 'Electronics',
    price: 349999,
    quantity: 2, // Low stock
    supplier: 'Canon India',
    location: 'Warehouse A-3',
    sku: 'CANON-EOSR5-BODY',
    minStockLevel: 5,
    maxStockLevel: 15,
    barcode: '1234567890148',
    gstRate: 18,
    hsnCode: '90069100',
    brand: 'Canon',
    unit: 'Piece',
    createdAt: new Date('2024-07-10'),
    updatedAt: new Date('2024-08-25')
  },
  {
    id: 'prod-027',
    name: 'Tesla Model Y Accessories',
    description: 'Premium floor mats set',
    category: 'Automotive',
    price: 8999,
    quantity: 0, // Out of stock
    supplier: 'Tesla India',
    location: 'Warehouse E-4',
    sku: 'TESLA-MY-FLOOR-MATS',
    minStockLevel: 5,
    maxStockLevel: 30,
    barcode: '1234567890149',
    gstRate: 28,
    hsnCode: '87089900',
    brand: 'Tesla',
    unit: 'Set',
    createdAt: new Date('2024-08-01'),
    updatedAt: new Date('2024-08-25')
  },
  {
    id: 'prod-028',
    name: 'Apple AirPods Pro 2',
    description: 'Wireless earbuds with active noise cancellation',
    category: 'Electronics',
    price: 26900,
    quantity: 3, // Low stock
    supplier: 'Apple India',
    location: 'Warehouse A-1',
    sku: 'APPL-AIRPODS-PRO2',
    minStockLevel: 10,
    maxStockLevel: 50,
    barcode: '1234567890150',
    gstRate: 18,
    hsnCode: '85183000',
    brand: 'Apple',
    unit: 'Pair',
    createdAt: new Date('2024-07-15'),
    updatedAt: new Date('2024-08-25')
  }
];

// Function to initialize mock data
export async function initializeMockData(): Promise<void> {
  try {
    console.log('🎭 Initializing comprehensive mock data for demonstration...');
    
    // Clear existing products first
    const existingProducts = await productsAPI.getAll();
    if (existingProducts.success && existingProducts.data.length > 0) {
      console.log(`📝 Found ${existingProducts.data.length} existing products`);
      // Only clear if we have very few products (to avoid accidentally clearing real data)
      if (existingProducts.data.length < 5) {
        for (const product of existingProducts.data) {
          await productsAPI.delete(product.id);
        }
      }
    }
    
    // Add all demo products
    let successCount = 0;
    for (const product of DEMO_PRODUCTS) {
      try {
        const result = await productsAPI.create(product);
        if (result.success) {
          successCount++;
        }
      } catch (error) {
        console.warn(`Failed to create product ${product.name}:`, error);
      }
    }
    
    console.log(`✅ Successfully initialized ${successCount}/${DEMO_PRODUCTS.length} demo products`);
    console.log('📊 Categories added:');
    
    const categories = Array.from(new Set(DEMO_PRODUCTS.map(p => p.category)));
    categories.forEach(category => {
      const count = DEMO_PRODUCTS.filter(p => p.category === category).length;
      console.log(`   • ${category}: ${count} products`);
    });
    
    console.log('🚨 Alert simulation ready:');
    const lowStockItems = DEMO_PRODUCTS.filter(p => p.minStockLevel && p.quantity <= p.minStockLevel);
    console.log(`   • ${lowStockItems.length} items with low/out of stock alerts`);
    
    console.log('🎉 Mock data initialization complete! Ready for demonstration.');
    
  } catch (error) {
    console.error('❌ Error initializing mock data:', error);
    throw error;
  }
}

// Function to add even more variety for extensive demo
export async function addExtendedMockData(): Promise<void> {
  const extendedProducts: Product[] = [
    // More Electronics
    {
      id: 'prod-029',
      name: 'Microsoft Surface Pro 9',
      description: '2-in-1 laptop tablet with pen support',
      category: 'Electronics',
      price: 149999,
      quantity: 15,
      supplier: 'Microsoft India',
      location: 'Warehouse A-2',
      sku: 'MSFT-SURF-PRO9-512',
      minStockLevel: 5,
      maxStockLevel: 30,
      barcode: '1234567890151',
      gstRate: 18,
      hsnCode: '84713000',
      brand: 'Microsoft',
      unit: 'Piece',
      createdAt: new Date('2024-08-10'),
      updatedAt: new Date('2024-08-25')
    },
    {
      id: 'prod-030',
      name: 'JBL Charge 5 Speaker',
      description: 'Portable Bluetooth speaker with powerbank',
      category: 'Electronics',
      price: 14999,
      quantity: 32,
      supplier: 'JBL India',
      location: 'Warehouse B-1',
      sku: 'JBL-CHARGE5-BLU',
      minStockLevel: 10,
      maxStockLevel: 60,
      barcode: '1234567890152',
      gstRate: 18,
      hsnCode: '85183000',
      brand: 'JBL',
      unit: 'Piece',
      createdAt: new Date('2024-07-25'),
      updatedAt: new Date('2024-08-24')
    },
    
    // More Fashion items
    {
      id: 'prod-031',
      name: 'Zara Casual Shirt',
      description: 'Cotton blend formal casual shirt',
      category: 'Fashion & Clothing',
      price: 2999,
      quantity: 40,
      supplier: 'Zara India',
      location: 'Warehouse C-2',
      sku: 'ZARA-SHIRT-CTN-L-WHT',
      minStockLevel: 12,
      maxStockLevel: 80,
      barcode: '1234567890153',
      gstRate: 12,
      hsnCode: '62052000',
      brand: 'Zara',
      unit: 'Piece',
      createdAt: new Date('2024-08-05'),
      updatedAt: new Date('2024-08-23')
    },
    
    // More Home items
    {
      id: 'prod-032',
      name: 'Godrej Refrigerator',
      description: 'Double door frost-free refrigerator 250L',
      category: 'Home & Garden',
      price: 32999,
      quantity: 8,
      supplier: 'Godrej Appliances',
      location: 'Warehouse D-3',
      sku: 'GODREJ-REF-250L-SS',
      minStockLevel: 3,
      maxStockLevel: 20,
      barcode: '1234567890154',
      gstRate: 18,
      hsnCode: '84182100',
      brand: 'Godrej',
      unit: 'Piece',
      createdAt: new Date('2024-08-12'),
      updatedAt: new Date('2024-08-25')
    }
  ];
  
  for (const product of extendedProducts) {
    await productsAPI.create(product);
  }
  
  console.log(`✅ Added ${extendedProducts.length} additional products for extended demo`);
}

export default { initializeMockData, addExtendedMockData, DEMO_PRODUCTS };
