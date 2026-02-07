// See fail toimib meie "andmebaasina" frontendis

export interface Product {
  id: string;
  type: 'product';
  name: string;
  price: number;
  category: string;
  image: string;
  videoUrl?: string; // YouTube URL
  description?: string;
  colors?: { name: string; value: string }[];
  inStock?: boolean;
  merchantId?: string;
  merchantName?: string;
  merchantLogo?: string; // New field
}

export interface Rental {
  id: string;
  type: 'rental';
  title: string;
  location: string;
  pricePerDay: number;
  stock: number; // Inventory quantity
  minRentalDays?: number; // Minimum rental duration in days
  priceTiers?: { minDays: number; price: number }[]; // Tiered pricing (price per day)
  category: string;
  image: string;
  videoUrl?: string; // YouTube URL
  rating?: number;
  features?: string[];
  specs?: Record<string, string>;
  merchantId?: string;
  merchantName?: string;
  merchantLogo?: string; // New field
  description?: string; // Full description
  usageGuide?: string; // Quick start guide or tips
  manualUrl?: string; // URL to PDF manual
}

export interface Campaign {
  id: string;
  type: 'campaign';
  title: string;
  price: number;
  original_price?: number;
  image_url?: string;
  videoUrl?: string; // YouTube URL
  category_name?: string;
  merchant?: string; // Merchant Name
  merchantId?: string;
  stats?: { purchases: number; totalVouchers: number };
}

// Helper to generate logo
const getLogo = (name: string) => `https://api.dicebear.com/9.x/initials/svg?seed=${name}&backgroundColor=E7DCC7&textColor=2D2721`;

// Mock Data
export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    type: 'product',
    name: 'Premium Meriinovillane Kampsun',
    price: 89.90,
    category: 'Riided',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
    colors: [{ name: 'Beež', value: '#E8DCC4' }, { name: 'Must', value: '#1A1A1A' }],
    inStock: true,
    merchantId: 'm1',
    merchantName: 'Nordic Knitwear',
    merchantLogo: getLogo('NordicKnitwear')
  },
  {
    id: 'p2',
    type: 'product',
    name: 'Keraamiline Vaas "Nordic"',
    price: 34.50,
    category: 'Kodu',
    image: 'https://images.unsplash.com/photo-1612196808214-b7e239e5f6b7?ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80',
    inStock: true,
    merchantId: 'm2',
    merchantName: 'Home & Decor',
    merchantLogo: getLogo('HomeDecor')
  },
  {
    id: 'p3',
    type: 'product',
    name: 'Luksuslik Aroomiküünal',
    price: 24.90,
    category: 'Kodu',
    image: 'https://images.unsplash.com/photo-1602825266988-750a130e6252?ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4',
    inStock: true,
    merchantId: 'm2',
    merchantName: 'Home & Decor',
    merchantLogo: getLogo('HomeDecor')
  },
  {
    id: 'p4',
    type: 'product',
    name: 'Juhtmevabad Kõrvaklapid',
    price: 149.90,
    category: 'Elektroonika',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.youtube.com/embed/m7Bc3pLyij0',
    inStock: true,
    merchantId: 'm3',
    merchantName: 'TechGear',
    merchantLogo: getLogo('TechGear')
  },
  {
    id: 'p5',
    type: 'product',
    name: 'Joogamatt Eco-Friendly',
    price: 45.00,
    category: 'Sport',
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80',
    inStock: true,
    merchantId: 'm4',
    merchantName: 'FitLife',
    merchantLogo: getLogo('FitLife')
  },
  {
    id: 'p6',
    type: 'product',
    name: 'Käsitöö Kõrvarõngad',
    price: 29.00,
    category: 'Ehted',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80',
    inStock: true,
    merchantId: 'm1',
    merchantName: 'Nordic Knitwear',
    merchantLogo: getLogo('NordicKnitwear')
  }
];

export const RENTALS: Rental[] = [
  {
    id: 'r1',
    type: 'rental',
    title: 'Sony A7 IV + 24-70mm GM',
    location: 'Tallinn, Kesklinn',
    pricePerDay: 45,
    stock: 3,
    minRentalDays: 3,
    priceTiers: [
      { minDays: 3, price: 40 },
      { minDays: 7, price: 35 }
    ],
    category: 'Foto & Video',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.youtube.com/embed/I05u79805Xg',
    rating: 4.9,
    features: ['4K 60p video', '33MP sensor', 'Reaalajas autofookus'],
    specs: { 'Sensor': 'Full-frame', 'ISO': '100-51200', 'Kaal': '658g', 'Aku': 'NP-FZ100' },
    merchantId: 'm5',
    merchantName: 'ProRent',
    merchantLogo: getLogo('ProRent'),
    description: 'Sony A7 IV on tõeline hübriidkaamera, mis sobib suurepäraselt nii fotograafidele kui ka videograafidele. 33MP sensor tagab detailsed pildid ning 4K 60p salvestus võimaldab luua professionaalset sisu. Kaasasolev 24-70mm GM objektiiv katab enamiku vajalikest fookuskaugustest.',
    usageGuide: '1. Sisesta aku ja mälukaart (komplektis).\n2. Eemalda objektiivikork.\n3. Lülita kaamera sisse ON/OFF lülitist päästiku juures.\n4. Vali režiimikettalt Foto või Video.\n5. Autofookus töötab poolenisti päästikut alla vajutades.',
    manualUrl: 'https://helpguide.sony.net/ilc/2110/v1/en/index.html'
  },
  {
    id: 'r2',
    type: 'rental',
    title: 'DJI Mavic 3 Cine',
    location: 'Tartu',
    pricePerDay: 55,
    stock: 1,
    minRentalDays: 3,
    priceTiers: [
      { minDays: 3, price: 50 },
      { minDays: 7, price: 45 }
    ],
    category: 'Droonid',
    image: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.youtube.com/embed/5k5e7t_GuPs',
    rating: 5.0,
    features: ['5.1K video', '46 min lennuaega', 'Hasselblad kaamera'],
    specs: { 'Kaal': '899g', 'Lennuaeg': '46 min', 'Video': '5.1K Apple ProRes' },
    merchantId: 'm5',
    merchantName: 'ProRent',
    merchantLogo: getLogo('ProRent'),
    description: 'DJI tippmudel Mavic 3 Cine pakub enneolematut pildikvaliteeti tänu Hasselbladi kaamerale ja Apple ProRes toele. Sisseehitatud 1TB SSD tagab, et ruum ei saa kunagi otsa.',
    usageGuide: 'Ära lenda lennukeelutsoonides. Veendu, et akud on laetud. Kalibreeri kompass enne lendu uues asukohas.',
    manualUrl: 'https://dl.djicdn.com/downloads/DJI_Mavic_3/DJI_Mavic_3_User_Manual_v1.0_en.pdf'
  },
  {
    id: 'r3',
    type: 'rental',
    title: 'Nintendo Switch OLED',
    location: 'Pärnu',
    pricePerDay: 15,
    stock: 5,
    minRentalDays: 2,
    category: 'Mängukonsoolid',
    image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    merchantId: 'm3',
    merchantName: 'TechGear',
    merchantLogo: getLogo('TechGear'),
    description: 'Uus Nintendo Switch OLED mudel pakub erksamaid värve ja suuremat kontrasti. Ideaalne reisimiseks või kodus mängimiseks. Kaasas Mario Kart 8.',
    usageGuide: 'Ühenda dokk teleriga HDMI kaabli abil. Aseta konsool dokki teleris mängimiseks või võta välja käsikonsoolina kasutamiseks.',
    manualUrl: '#'
  },
  {
    id: 'r4',
    type: 'rental',
    title: 'Makita Akutrellide Komplekt',
    location: 'Tallinn, Mustamäe',
    pricePerDay: 20,
    stock: 2,
    minRentalDays: 1,
    priceTiers: [
       { minDays: 2, price: 15 }
    ],
    category: 'Tööriistad',
    image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    merchantId: 'm6',
    merchantName: 'EhitusRent',
    merchantLogo: getLogo('EhitusRent'),
    description: 'Professionaalne Makita komplekt, mis sisaldab akutrelli, löökruvikeerajat, kahte 5Ah akut ja kiirlaadijat.',
    usageGuide: 'Kasuta alati kaitseprille. Vali õige otsik vastavalt kruvi tüübile. Ära kata mootori ventilatsiooniavasid.',
    manualUrl: '#'
  },
  {
    id: 'r5',
    type: 'rental',
    title: 'Bose S1 Pro Kõlar',
    location: 'Tallinn, Kesklinn',
    pricePerDay: 35,
    stock: 4,
    minRentalDays: 1,
    category: 'Heli',
    image: 'https://images.unsplash.com/photo-1545459720-aac3e5c2d13f?ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80',
    merchantId: 'm5',
    merchantName: 'ProRent',
    merchantLogo: getLogo('ProRent'),
    description: 'Võimas ja kaasaskantav PA-süsteem akutoitega. Sobib ideaalselt väiksemateks üritusteks, kõnedeks või taustamuusikaks. Bluetooth ühendus.',
    usageGuide: 'Lülita sisse ja vajuta Bluetooth nuppu paaritamiseks. "Auto EQ" optimeerib heli vastavalt kõlari asendile.',
    manualUrl: '#'
  }
];

// Helper functions to mimic DB queries
export const UnifiedData = {
  getAllProducts: () => PRODUCTS,
  getAllRentals: () => RENTALS,
  getProductById: (id: string) => PRODUCTS.find(p => p.id === id),
  getRentalById: (id: string) => RENTALS.find(r => r.id === id),
  getProductsByMerchant: (merchantId: string) => PRODUCTS.filter(p => p.merchantId === merchantId),
  getRentalsByMerchant: (merchantId: string) => RENTALS.filter(r => r.merchantId === merchantId),
  getCampaignsByMerchant: (merchantId: string) => UnifiedData.getAllCampaigns().filter(c => c.merchantId === merchantId),
  getAllCampaigns: () => {
    return [
      {
        id: 'c1',
        type: 'campaign',
        title: 'Nädalavahetuse Spaapuhkus Kahele',
        price: 149.00,
        original_price: 249.00,
        image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80',
        category_name: 'Ilu & Tervis',
        merchant: 'Grand Rose Spa',
        merchantId: 'm7',
        stats: { purchases: 124, totalVouchers: 5 }
      },
      {
        id: 'c2',
        type: 'campaign',
        title: '3-Käiguline Õhtusöök Restoranis NOA',
        price: 75.00,
        original_price: 110.00,
        image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80',
        category_name: 'Restoranid',
        merchant: 'NOA Restoran',
        merchantId: 'm8',
        stats: { purchases: 89, totalVouchers: 3 }
      },
      {
        id: 'c3',
        type: 'campaign',
        title: 'Kardisõit 20 minutit -50%',
        price: 12.50,
        original_price: 25.00,
        image_url: 'https://images.unsplash.com/photo-1506422748879-887454f9cdff?ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80',
        category_name: 'Meelelahutus',
        merchant: 'LaitseRallyPark',
        merchantId: 'm9',
        stats: { purchases: 432, totalVouchers: 1 }
      },
      {
        id: 'c4',
        type: 'campaign',
        title: 'Jooga ja Meditatsiooni Retriit',
        price: 45.00,
        original_price: 60.00,
        image_url: 'https://images.unsplash.com/photo-1545205539-3fa50605a9d9?ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80',
        category_name: 'Ilu & Tervis',
        merchant: 'Joogaruum',
        merchantId: 'm10',
        stats: { purchases: 56, totalVouchers: 2 }
      }
    ] as Campaign[]; 
  },
  getCampaignById: (id: string) => UnifiedData.getAllCampaigns().find(c => c.id === id),
  searchAll: (query: string) => {
    const lowerQuery = query.toLowerCase();
    const products = PRODUCTS.filter(p => p.name.toLowerCase().includes(lowerQuery));
    const rentals = RENTALS.filter(r => r.title.toLowerCase().includes(lowerQuery));
    return { products, rentals };
  },
  getMerchantSettings: () => {
    try {
        const saved = localStorage.getItem('merchantSettings');
        return saved ? JSON.parse(saved) : {
            paymentMode: 'platform',
            deliveryOptions: {
                pickupAllowed: true,
                pickupPrice: 0,
                pickupLocation: 'Tallinn, Pärnu mnt 123',
                courierAllowed: true,
                courierPrice: 5.90,
                smartpostAllowed: true,
                smartpostPrice: 2.90,
                omnivaAllowed: true,
                omnivaPrice: 2.50
            }
        };
    } catch (e) { return null; }
  },
  saveMerchantSettings: (settings: any) => {
      localStorage.setItem('merchantSettings', JSON.stringify(settings));
  }
};