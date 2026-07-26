import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Product,
  Category,
  Brand,
  Coupon,
  Order,
  Address,
  Review,
  Banner,
  SupportTicket,
  ActivityLog,
  StoreSettings
} from '../types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DBData {
  users: User[];
  userPasswords: Record<string, string>; // userId -> hashedPassword
  products: Product[];
  categories: Category[];
  brands: Brand[];
  coupons: Coupon[];
  orders: Order[];
  addresses: Address[];
  reviews: Review[];
  banners: Banner[];
  tickets: SupportTicket[];
  logs: ActivityLog[];
  settings: StoreSettings;
  wishlists: Record<string, string[]>; // userId -> array of productId
  carts: Record<string, { productId: string; quantity: number; variantId?: string }[]>;
}

function getDefaultData(): DBData {
  const adminPasswordHash = bcrypt.hashSync('jatt4321', 10);

  const adminUser: User = {
    id: 'usr_admin_001',
    name: 'Vishvas Dhama',
    email: 'vishvasdhama25@gmail.com',
    phone: '+91 7302424139',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isVerified: true,
    createdAt: new Date().toISOString()
  };

  const categories: Category[] = [
    { id: 'cat_1', name: 'Smartphones & Mobile', slug: 'smartphones', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600', productCount: 4 },
    { id: 'cat_2', name: 'Laptops & Computers', slug: 'laptops', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600', productCount: 3 },
    { id: 'cat_3', name: 'Audio & Wireless', slug: 'audio', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', productCount: 4 },
    { id: 'cat_4', name: 'Wearable Tech', slug: 'wearables', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', productCount: 3 },
    { id: 'cat_5', name: 'Smart Home & Cameras', slug: 'smart-home', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600', productCount: 2 }
  ];

  const brands: Brand[] = [
    { id: 'brand_1', name: 'Apple', logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=100' },
    { id: 'brand_2', name: 'Sony', logo: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100' },
    { id: 'brand_3', name: 'Samsung', logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=100' },
    { id: 'brand_4', name: 'Bose', logo: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=100' },
    { id: 'brand_5', name: 'Logitech', logo: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=100' }
  ];

  const products: Product[] = [
    {
      id: 'prod_1',
      title: 'iPhone 15 Pro Max 256GB - Titanium Natural',
      slug: 'iphone-15-pro-max-256gb',
      description: 'Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever with 5x Optical Zoom.',
      price: 139900,
      discountPrice: 129900,
      images: [
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800',
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800'
      ],
      videoUrl: 'https://www.youtube.com/watch?v=xqyUdNxWazA',
      category: 'Smartphones & Mobile',
      brand: 'Apple',
      stock: 25,
      sku: 'IPH15PM-256-NAT',
      barcode: '194253102931',
      weight: '221g',
      tags: ['smartphone', 'apple', 'flagship', 'titanium', '5g'],
      specifications: [
        { key: 'Display', value: '6.7-inch Super Retina XDR OLED 120Hz' },
        { key: 'Processor', value: 'Apple A17 Pro (3nm)' },
        { key: 'Main Camera', value: '48MP + 12MP Periscope (5x Zoom) + 12MP Ultra-wide' },
        { key: 'Battery', value: '4422 mAh with 25W Fast Charge' },
        { key: 'OS', value: 'iOS 17' }
      ],
      variants: [
        { id: 'v1_1', storage: '256GB', color: 'Natural Titanium', price: 129900, stock: 10, sku: 'IPH15PM-256-NAT' },
        { id: 'v1_2', storage: '512GB', color: 'Black Titanium', price: 149900, stock: 8, sku: 'IPH15PM-512-BLK' },
        { id: 'v1_3', storage: '1TB', color: 'Blue Titanium', price: 179900, stock: 7, sku: 'IPH15PM-1TB-BLU' }
      ],
      isFeatured: true,
      isTrending: true,
      rating: 4.8,
      numReviews: 42,
      createdAt: new Date().toISOString(),
      metaTitle: 'Buy iPhone 15 Pro Max Online | Best Price & Offers',
      metaDescription: 'Shop the flagship iPhone 15 Pro Max with Titanium design and 5x Zoom camera at NexusStore.'
    },
    {
      id: 'prod_2',
      title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
      slug: 'sony-wh-1000xm5-wireless-headphones',
      description: 'Industry-leading noise cancellation optimized with two processors and 8 microphones. Magnificent sound quality engineered with the Auto NC Optimizer.',
      price: 34990,
      discountPrice: 28990,
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800'
      ],
      category: 'Audio & Wireless',
      brand: 'Sony',
      stock: 40,
      sku: 'SONY-XM5-BLK',
      weight: '250g',
      tags: ['audio', 'headphones', 'noise-canceling', 'wireless', 'bluetooth'],
      specifications: [
        { key: 'Noise Canceling', value: 'HD Noise Canceling Processor QN1 & V1' },
        { key: 'Battery Life', value: 'Up to 30 Hours with ANC On' },
        { key: 'Driver Size', value: '30mm High Performance' },
        { key: 'Connectivity', value: 'Bluetooth 5.2, 3.5mm AUX, Multipoint' }
      ],
      variants: [
        { id: 'v2_1', color: 'Black', price: 28990, stock: 20, sku: 'SONY-XM5-BLK' },
        { id: 'v2_2', color: 'Silver', price: 28990, stock: 12, sku: 'SONY-XM5-SLV' },
        { id: 'v2_3', color: 'Midnight Blue', price: 29990, stock: 8, sku: 'SONY-XM5-MBLU' }
      ],
      isFeatured: true,
      isTrending: true,
      rating: 4.9,
      numReviews: 88,
      createdAt: new Date().toISOString()
    },
    {
      id: 'prod_3',
      title: 'MacBook Pro 16-inch M3 Max (36GB RAM / 1TB SSD)',
      slug: 'macbook-pro-16-m3-max',
      description: 'The world’s best pro laptop packed with M3 Max silicon, 16-core CPU, 40-core GPU, stunning Liquid Retina XDR display, and up to 22 hours of battery life.',
      price: 349900,
      discountPrice: 329900,
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
        'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800'
      ],
      category: 'Laptops & Computers',
      brand: 'Apple',
      stock: 12,
      sku: 'MBP16-M3MAX-36-1TB',
      weight: '2.14kg',
      tags: ['laptop', 'apple', 'macbook', 'm3max', 'pro-workstation'],
      specifications: [
        { key: 'Processor', value: 'Apple M3 Max (16-core CPU, 40-core GPU)' },
        { key: 'RAM', value: '36GB Unified Memory' },
        { key: 'Storage', value: '1TB PCIe Gen4 NVMe SSD' },
        { key: 'Display', value: '16.2-inch Liquid Retina XDR (3456 x 2234) 120Hz ProMotion' }
      ],
      isFeatured: true,
      isTrending: false,
      rating: 5.0,
      numReviews: 19,
      createdAt: new Date().toISOString()
    },
    {
      id: 'prod_4',
      title: 'Samsung Galaxy Watch 6 Classic 47mm LTE',
      slug: 'samsung-galaxy-watch-6-classic',
      description: 'Sophisticated rotating bezel design, Advanced Sleep Tracking, ECG & Blood Pressure monitoring, customized HR zones, and sapphire crystal glass.',
      price: 43999,
      discountPrice: 36999,
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
        'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800'
      ],
      category: 'Wearable Tech',
      brand: 'Samsung',
      stock: 30,
      sku: 'GW6C-47-LTE-BLK',
      weight: '59g',
      tags: ['smartwatch', 'samsung', 'fitness', 'lte', 'health'],
      specifications: [
        { key: 'Display', value: '1.5-inch Super AMOLED Sapphire Crystal' },
        { key: 'Bezel', value: 'Physical Rotating Stainless Steel Bezel' },
        { key: 'Sensors', value: 'BioActive Sensor (ECG, BIA, Optical Heart Rate)' },
        { key: 'Water Resistance', value: '5ATM + IP68 / MIL-STD-810H' }
      ],
      isFeatured: false,
      isTrending: true,
      rating: 4.7,
      numReviews: 31,
      createdAt: new Date().toISOString()
    },
    {
      id: 'prod_5',
      title: 'Bose Smart Soundbar Ultra with Dolby Atmos',
      slug: 'bose-smart-soundbar-ultra',
      description: 'Immersive spatial audio experience with nine speakers and custom TrueSpace technology. Built-in Voice Control with Alexa and Google Assistant.',
      price: 99900,
      discountPrice: 89900,
      images: [
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'
      ],
      category: 'Audio & Wireless',
      brand: 'Bose',
      stock: 18,
      sku: 'BOSE-SND-ULTRA',
      weight: '5.8kg',
      tags: ['audio', 'home-theater', 'soundbar', 'bose', 'dolby-atmos'],
      specifications: [
        { key: 'Audio Decoding', value: 'Dolby Atmos, Dolby Digital, TrueSpace' },
        { key: 'Connectivity', value: 'eARC HDMI, Optical, Wi-Fi, Bluetooth 5.0, AirPlay 2' },
        { key: 'Microphone', value: 'Built-in noise-rejecting microphone array' }
      ],
      isFeatured: true,
      isTrending: true,
      rating: 4.8,
      numReviews: 24,
      createdAt: new Date().toISOString()
    }
  ];

  const coupons: Coupon[] = [
    { id: 'c1', code: 'NEXUS10', discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 2000, maxDiscount: 5000, expiresAt: '2026-12-31', isActive: true },
    { id: 'c2', code: 'WELCOME500', discountType: 'FLAT', discountValue: 500, minOrderAmount: 3000, expiresAt: '2026-12-31', isActive: true },
    { id: 'c3', code: 'FESTIVE20', discountType: 'PERCENTAGE', discountValue: 20, minOrderAmount: 10000, maxDiscount: 15000, expiresAt: '2026-12-31', isActive: true }
  ];

  const banners: Banner[] = [
    {
      id: 'b1',
      title: 'Titanium. So Strong. So Light. So Pro.',
      subtitle: 'Experience the new iPhone 15 Pro Max with A17 Pro Chip and instant cashback.',
      imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1600',
      linkUrl: '/product/prod_1',
      buttonText: 'Shop iPhone 15 Pro',
      isActive: true,
      order: 1
    },
    {
      id: 'b2',
      title: 'Pure Audio Perfection',
      subtitle: 'Sony WH-1000XM5 Noise Canceling Headphones at Flat ₹6,000 Off.',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600',
      linkUrl: '/product/prod_2',
      buttonText: 'Explore Headphones',
      isActive: true,
      order: 2
    }
  ];

  const reviews: Review[] = [
    {
      id: 'rev_1',
      productId: 'prod_1',
      userId: 'usr_demo_002',
      userName: 'Alex Johnson',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      rating: 5,
      comment: 'Incredible camera quality! The 5x periscope lens takes razor sharp portraits. Battery easily lasts 1.5 days of heavy use.',
      isVerifiedBuyer: true,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: 'rev_2',
      productId: 'prod_2',
      userId: 'usr_demo_002',
      userName: 'Alex Johnson',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      rating: 5,
      comment: 'Best noise cancellation for frequent flight travelers. Super lightweight and mic voice clarity on calls is unmatched.',
      isVerifiedBuyer: true,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
    }
  ];

  const defaultAddress: Address = {
    id: 'addr_1',
    userId: 'usr_demo_002',
    fullName: 'Alex Johnson',
    phone: '+91 9123456789',
    street: 'Flat 402, Green Park Heights, MG Road',
    landmark: 'Near Cyber City Metro Station',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    country: 'India',
    isDefault: true
  };

  const sampleOrder: Order = {
    id: 'ORD-2026-88492',
    userId: 'usr_demo_002',
    userEmail: 'user@nexusstore.com',
    userName: 'Alex Johnson',
    items: [
      {
        productId: 'prod_2',
        productTitle: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
        productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
        price: 28990,
        quantity: 1,
        selectedVariant: { color: 'Black' }
      }
    ],
    shippingAddress: defaultAddress,
    subtotal: 28990,
    discount: 2899,
    couponCode: 'NEXUS10',
    gstAmount: 4696,
    shippingFee: 0,
    totalAmount: 30787,
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'PAID',
    paymentDetails: {
      razorpayOrderId: 'order_NxRzp_991823',
      razorpayPaymentId: 'pay_NxRzp_771829',
      razorpaySignature: 'sig_valid_verified_hash_2026'
    },
    orderStatus: 'DELIVERED',
    trackingNumber: 'DEL-IN-9921820',
    carrier: 'BlueDart Express',
    estimatedDelivery: '2026-07-22',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  };

  const sampleReturnOrder: Order = {
    id: 'ORD-2026-90123',
    userId: 'usr_demo_003',
    userEmail: 'customer@nexusstore.com',
    userName: 'Rahul Sharma',
    items: [
      {
        productId: 'prod_1',
        productTitle: 'Apple iPhone 15 Pro Max (256GB, Natural Titanium)',
        productImage: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
        price: 139900,
        quantity: 1,
        selectedVariant: { color: 'Natural Titanium', storage: '256GB' }
      }
    ],
    shippingAddress: defaultAddress,
    subtotal: 139900,
    discount: 0,
    gstAmount: 25182,
    shippingFee: 0,
    totalAmount: 165082,
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'PAID',
    orderStatus: 'RETURN_REQUESTED',
    returnReason: 'Color preference changed / Size expectation mismatch.',
    returnStatus: 'PENDING',
    trackingNumber: 'DEL-IN-8812001',
    carrier: 'Delhivery Surface',
    estimatedDelivery: '2026-07-20',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  };

  const initialLogs: ActivityLog[] = [
    {
      id: 'log_1',
      userId: 'usr_admin_001',
      userName: 'Nexus Admin',
      action: 'SYSTEM_BOOT',
      details: 'NexusStore E-Commerce Engine initialized with secure database schema.',
      timestamp: new Date().toISOString()
    }
  ];

  const storeSettings: StoreSettings = {
    storeName: 'NexusStore E-Commerce',
    supportEmail: 'support@nexusstore.com',
    supportPhone: '+91 (800) 123-4567',
    address: 'Nexus Tech Park, 100 Feet Road, Indiranagar, Bengaluru - 560038',
    currency: 'INR',
    currencySymbol: '₹',
    gstRatePercent: 18,
    freeShippingThreshold: 1000,
    flatShippingFee: 99
  };

  return {
    users: [adminUser],
    userPasswords: {
      usr_admin_001: adminPasswordHash
    },
    products,
    categories,
    brands,
    coupons,
    orders: [sampleReturnOrder, sampleOrder],
    addresses: [defaultAddress],
    reviews,
    banners,
    tickets: [],
    logs: initialLogs,
    settings: storeSettings,
    wishlists: {},
    carts: {}
  };
}

class Database {
  private data: DBData;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadData();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DBData {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const loaded: DBData = JSON.parse(raw);

        // Auto-migration: Ensure vishvasdhama25@gmail.com is present with ADMIN role and jatt4321 password
        const adminPassHash = bcrypt.hashSync('jatt4321', 10);
        let admin = loaded.users.find((u) => u.email.toLowerCase() === 'vishvasdhama25@gmail.com');
        if (!admin) {
          admin = {
            id: 'usr_admin_001',
            name: 'Vishvas Dhama',
            email: 'vishvasdhama25@gmail.com',
            phone: '+91 7302424139',
            role: 'ADMIN',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            isVerified: true,
            createdAt: new Date().toISOString()
          };
          loaded.users.unshift(admin);
        } else {
          admin.role = 'ADMIN';
          admin.name = 'Vishvas Dhama';
          admin.phone = '+91 9900000000';
        }
        loaded.userPasswords[admin.id] = adminPassHash;

        // Clean out legacy demo users if present
        loaded.users = loaded.users.filter((u) => u.email !== 'admin@nexusstore.com' && u.email !== 'user@nexusstore.com');
        delete loaded.userPasswords['usr_demo_002'];

        // Clean up sample order emails to avoid personal email exposure
        if (loaded.orders && Array.isArray(loaded.orders)) {
          loaded.orders.forEach((o) => {
            if (o.userEmail === 'vishvasdhama25@gmail.com' || o.userEmail === 'vishvasdhama25@gmail.com') {
              o.userEmail = 'customer@nexusstore.com';
              o.userName = 'Rahul Sharma';
            }
          });
        }

        this.saveData(loaded);
        return loaded;
      }
    } catch (err) {
      console.error('Error loading DB file, re-initializing:', err);
    }
    const initial = getDefaultData();
    this.saveData(initial);
    return initial;
  }

  public saveData(data?: DBData) {
    if (data) {
      this.data = data;
    }
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing DB file:', err);
    }
  }

  public get<K extends keyof DBData>(key: K): DBData[K] {
    return this.data[key];
  }

  public set<K extends keyof DBData>(key: K, value: DBData[K]) {
    this.data[key] = value;
    this.saveData();
  }

  public addLog(userId: string, userName: string, action: string, details: string) {
    const log: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userName,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.logs.unshift(log);
    if (this.data.logs.length > 200) {
      this.data.logs = this.data.logs.slice(0, 200);
    }
    this.saveData();
  }

  public exportBackup(): DBData {
    return this.data;
  }

  public importBackup(newData: DBData) {
    this.data = newData;
    this.saveData();
  }
}

export const db = new Database();
