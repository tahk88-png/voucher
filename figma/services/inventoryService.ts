import { PRODUCTS, RENTALS, Product, Rental } from './unifiedData';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type RentalStatus = 'available' | 'rented' | 'maintenance' | 'reserved';
export type OrderStatus = 'new' | 'processing' | 'ready' | 'completed' | 'returned' | 'cancelled';

export interface StockItem extends Product {
  quantity: number;
  sku: string;
  minLevel: number; // Low stock alert threshold
  location: string; // Warehouse shelf/bin
}

export interface RentalAsset extends Rental {
  assets: {
    id: string;
    serialNumber: string;
    status: RentalStatus;
    notes?: string;
    nextBooking?: string;
  }[];
}

export interface Order {
  id: string;
  customerName: string;
  date: string;
  total: number;
  status: OrderStatus;
  items: { name: string; quantity: number; type: 'product' | 'rental' }[];
  type: 'shop' | 'rental' | 'mixed';
}

// Mock Data Extension
let SHOP_INVENTORY: StockItem[] = PRODUCTS.map((p, i) => ({
  ...p,
  quantity: Math.floor(Math.random() * 50) + 2, // Random stock
  sku: `SH-${1000 + i}`,
  minLevel: 5,
  location: `Riiul A-${i + 1}`
}));

let RENTAL_INVENTORY: RentalAsset[] = RENTALS.map((r, i) => ({
  ...r,
  assets: [
    { id: `a1-${i}`, serialNumber: `SN-${2024}-${i}A`, status: 'available' },
    { id: `a2-${i}`, serialNumber: `SN-${2024}-${i}B`, status: Math.random() > 0.7 ? 'rented' : 'available' }
  ]
}));

let ORDERS: Order[] = [
  { 
    id: 'ORD-001', 
    customerName: 'Mari Maasikas', 
    date: '2024-05-20', 
    total: 45.00, 
    status: 'new', 
    type: 'shop',
    items: [{ name: 'Villane Kampsun', quantity: 1, type: 'product' }]
  },
  { 
    id: 'ORD-002', 
    customerName: 'Jüri Tamm', 
    date: '2024-05-19', 
    total: 120.00, 
    status: 'processing', 
    type: 'rental',
    items: [{ name: 'Sony A7 IV', quantity: 1, type: 'rental' }]
  },
  { 
    id: 'ORD-003', 
    customerName: 'Kati Karu', 
    date: '2024-05-18', 
    total: 85.50, 
    status: 'ready', 
    type: 'mixed',
    items: [{ name: 'Kõrvaklapid', quantity: 1, type: 'product' }, { name: 'DJ Pult', quantity: 1, type: 'rental' }]
  }
];

export const InventoryService = {
  // Shop Methods
  getShopInventory: () => SHOP_INVENTORY,
  
  updateStock: (productId: string, delta: number) => {
    SHOP_INVENTORY = SHOP_INVENTORY.map(item => 
      item.id === productId 
        ? { ...item, quantity: Math.max(0, item.quantity + delta) } 
        : item
    );
    return SHOP_INVENTORY;
  },

  // Rental Methods
  getRentalInventory: () => RENTAL_INVENTORY,

  updateAssetStatus: (rentalId: string, assetId: string, status: RentalStatus) => {
    RENTAL_INVENTORY = RENTAL_INVENTORY.map(item => {
      if (item.id === rentalId) {
        return {
          ...item,
          assets: item.assets.map(a => a.id === assetId ? { ...a, status } : a)
        };
      }
      return item;
    });
    return RENTAL_INVENTORY;
  },

  // Order Methods
  getOrders: () => ORDERS,

  updateOrderStatus: (orderId: string, status: OrderStatus) => {
    ORDERS = ORDERS.map(o => o.id === orderId ? { ...o, status } : o);
    return ORDERS;
  },

  // Helpers
  getStockStatus: (qty: number, min: number): StockStatus => {
    if (qty === 0) return 'out_of_stock';
    if (qty <= min) return 'low_stock';
    return 'in_stock';
  }
};