import { Product, User, UserInteraction, InteractionWeightsConfig } from '../types';

export const HERO_IMAGE = '/src/assets/images/hero_store_curation_1793688797740.jpg';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Apex Studio Monitor Headphones',
    category: 'Audio',
    price: 340,
    rating: 4.9,
    reviewCount: 142,
    image: '/src/assets/images/product_audio_headphones_1793688798179.jpg',
    description: 'Machined 7075 aluminum chassis with 50mm beryllium dynamic transducers. Tuned for neutral linear studio acoustics.',
    features: ['50mm Beryllium Drivers', 'Detachable Braided OFC Cable', 'Replaceable Italian Lambskin Cushions'],
    tags: ['Acoustic', 'Audiophile', 'Aluminum', 'Pro Studio'],
    stockStatus: 'In Stock'
  },
  {
    id: 'prod-2',
    name: 'Lumina Cantilever Task Lamp',
    category: 'Lighting',
    price: 280,
    rating: 4.8,
    reviewCount: 88,
    image: '/src/assets/images/product_brass_lamp_1793688798463.jpg',
    description: 'Solid brushed architectural brass with dual-pivot balance counterweight. High-CRI 97+ circadian LED engine with stepless rotary dimming.',
    features: ['Solid Architectural Brass', 'CRI 97+ Warm Circadian Light', 'Weighted Travertine Base Support'],
    tags: ['Brass', 'Architectural', 'Minimalist', 'Lighting'],
    stockStatus: 'In Stock'
  },
  {
    id: 'prod-3',
    name: 'Kanto Matte Pour-Over Ceramic Set',
    category: 'Living',
    price: 95,
    rating: 4.7,
    reviewCount: 215,
    image: '/src/assets/images/product_ceramic_carafe_1793688799413.jpg',
    description: 'Artisanal charcoal-glazed stoneware pour-over dripper and 600ml thermal server. Hand-thrown in Nagano with organic tactile ribbing.',
    features: ['Hand-thrown Stoneware', 'Thermal Retention Wall', '600ml Capacity with Dripper'],
    tags: ['Ceramics', 'Coffee', 'Artisanal', 'Living'],
    stockStatus: 'In Stock'
  },
  {
    id: 'prod-4',
    name: 'Monolith Milled Mechanical Keyboard',
    category: 'Hardware',
    price: 390,
    rating: 4.9,
    reviewCount: 176,
    image: '/src/assets/images/product_mechanical_keyboard_1793688799409.jpg',
    description: 'Bead-blasted CNC 6063 aluminum enclosure with gasket mount suspension, hotswap PCB, and oiled American walnut palm rest.',
    features: ['CNC 6063 Aluminum Chassis', 'Gasket Mount Isolation', 'Solid Walnut Palm Rest Included'],
    tags: ['Mechanical', 'CNC Aluminum', 'Workspace', 'Typing'],
    stockStatus: 'Low Stock'
  },
  {
    id: 'prod-5',
    name: 'Onyx Acoustic Baffle Panels (Pair)',
    category: 'Audio',
    price: 220,
    rating: 4.8,
    reviewCount: 64,
    image: '', // Will use high-craft SVG graphic fallback
    description: 'High-density recycled PET acoustic absorption tiles wrapped in textured Kvadrat wool. Tames flutter echoes and flutter reflections in creative studios.',
    features: ['NRC 0.85 Sound Absorption', 'Kvadrat Melange Wool Blend', 'Concealed Magnetic Wall Anchors'],
    tags: ['Acoustic', 'Sound Treatment', 'Studio', 'Audio'],
    stockStatus: 'In Stock'
  },
  {
    id: 'prod-6',
    name: 'Chronos Titanium Automatic Field Watch',
    category: 'Accessories',
    price: 520,
    rating: 4.9,
    reviewCount: 93,
    image: '',
    description: 'Grade 5 aerospace titanium case with matte sandblasted finish, sapphire crystal lens, and 24-jewel automatic movement with 42-hour reserve.',
    features: ['Grade 5 Titanium Case', 'Double-domed Sapphire Crystal', '100m Water Resistance'],
    tags: ['Horology', 'Titanium', 'Precision', 'Field Gear'],
    stockStatus: 'In Stock'
  },
  {
    id: 'prod-7',
    name: 'Strata Solid Walnut Monitor Riser',
    category: 'Hardware',
    price: 165,
    rating: 4.7,
    reviewCount: 189,
    image: '',
    description: 'Continuous grain single-slab Appalachian walnut with cork underlay feet. Elevates dual displays while stowing full-size keyboards underneath.',
    features: ['Single-slab Black Walnut', 'Supports up to 45kg', 'Integrated Aluminum Pen Tray'],
    tags: ['Walnut', 'Ergonomics', 'Desk Setup', 'Hardware'],
    stockStatus: 'In Stock'
  },
  {
    id: 'prod-8',
    name: 'Vessel Handblown Smoked Glass Decanter',
    category: 'Living',
    price: 120,
    rating: 4.6,
    reviewCount: 52,
    image: '',
    description: 'Mouth-blown Borosilicate smoked glass with geometric cold-cut rim. Aerates vintage wines and cold brew concentrates effortlessly.',
    features: ['Mouth-blown Borosilicate', 'Smoked Charcoal Gradient', 'Cold-cut Drip-free Spout'],
    tags: ['Glassware', 'Dining', 'Handblown', 'Living'],
    stockStatus: 'In Stock'
  },
  {
    id: 'prod-9',
    name: 'AeroDesk Merino Wool Desk Pad',
    category: 'Accessories',
    price: 85,
    rating: 4.8,
    reviewCount: 310,
    image: '',
    description: '5mm thick 100% natural Bavarian merino wool felt with natural rubber traction backing. Anti-static, water-repellent, and naturally tactile.',
    features: ['100% Bavarian Merino Wool', '5mm Cushioning Thickness', 'Natural Rubber Grip Base'],
    tags: ['Wool Felt', 'Desk Pad', 'Minimalist', 'Accessories'],
    stockStatus: 'In Stock'
  },
  {
    id: 'prod-10',
    name: 'Halo Ambient Linear Pendant',
    category: 'Lighting',
    price: 440,
    rating: 4.8,
    reviewCount: 41,
    image: '',
    description: 'Suspended extruded matte black aluminum profile with dual up-and-down LED diffusers. Designed for open kitchen islands and conference tables.',
    features: ['Dual Indirect/Direct Light', 'Ultra-slim 22mm Profile', 'Casambi Wireless Bluetooth Dimming'],
    tags: ['Pendant', 'Architectural', 'Linear', 'Lighting'],
    stockStatus: 'Pre-order'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Alex Rivera',
    avatar: 'AR',
    role: 'Music Producer & Audiophile',
    bio: 'Focuses on studio listening gear, high-grade acoustic treatment, and tactile mechanical hardware.',
    preferredCategories: ['Audio', 'Hardware']
  },
  {
    id: 'user-2',
    name: 'Elena Vance',
    avatar: 'EV',
    role: 'Architect & Interior Designer',
    bio: 'Passionate about architectural lighting, warm minimalism, artisanal ceramics, and natural materials.',
    preferredCategories: ['Lighting', 'Living']
  },
  {
    id: 'user-3',
    name: 'Marcus Chen',
    avatar: 'MC',
    role: 'Hardware Engineer & Collector',
    bio: 'Specializes in precision CNC machining, custom mechanical boards, and titanium horology.',
    preferredCategories: ['Hardware', 'Accessories']
  },
  {
    id: 'user-4',
    name: 'Sophia Laurent',
    avatar: 'SL',
    role: 'Specialty Coffee Roaster',
    bio: 'Pursues the perfect brew with precision stoneware, handcrafted glassware, and warm atmospheric lighting.',
    preferredCategories: ['Living', 'Lighting']
  },
  {
    id: 'user-5',
    name: 'Devon Miller',
    avatar: 'DM',
    role: 'Sound Designer & Creative Director',
    bio: 'Spans audio monitoring setups, acoustic dampening, ergonomics, and desk curation.',
    preferredCategories: ['Audio', 'Accessories']
  },
  {
    id: 'user-current',
    name: 'You (Active Shopper)',
    avatar: 'YOU',
    role: 'Interactive Live User',
    bio: 'Your real-time clicks, cart additions, ratings, and purchases dynamically retrain the collaborative filtering algorithms!',
    preferredCategories: ['Audio', 'Lighting', 'Living', 'Hardware', 'Accessories']
  }
];

export const DEFAULT_WEIGHTS: InteractionWeightsConfig = {
  view: 1.0,
  click_detail: 2.0,
  wishlist: 2.5,
  add_to_cart: 3.5,
  purchase: 5.0
};

// Seed realistic interaction logs with distinct user taste clusters:
// User 1 (Audio + Hardware): prod-1, prod-4, prod-5, prod-7
// User 2 (Lighting + Living): prod-2, prod-3, prod-8, prod-10
// User 3 (Hardware + Accessories): prod-4, prod-6, prod-7, prod-9
// User 4 (Living + Lighting): prod-3, prod-2, prod-8, prod-9
// User 5 (Audio + Accessories): prod-1, prod-5, prod-9, prod-6
// User Current: initial exploration on prod-1 and prod-4
const now = Date.now();
const h = 3600 * 1000;

export const INITIAL_INTERACTIONS: UserInteraction[] = [
  // User 1 (Alex Rivera)
  { id: 'int-101', userId: 'user-1', productId: 'prod-1', type: 'purchase', value: 5.0, normalizedScore: 5.0, timestamp: now - 48 * h },
  { id: 'int-102', userId: 'user-1', productId: 'prod-1', type: 'rating', value: 5.0, normalizedScore: 5.0, timestamp: now - 47 * h },
  { id: 'int-103', userId: 'user-1', productId: 'prod-5', type: 'purchase', value: 5.0, normalizedScore: 5.0, timestamp: now - 40 * h },
  { id: 'int-104', userId: 'user-1', productId: 'prod-4', type: 'add_to_cart', value: 3.5, normalizedScore: 4.2, timestamp: now - 35 * h },
  { id: 'int-105', userId: 'user-1', productId: 'prod-7', type: 'rating', value: 4.0, normalizedScore: 4.0, timestamp: now - 30 * h },
  { id: 'int-106', userId: 'user-1', productId: 'prod-9', type: 'view', value: 1.0, normalizedScore: 3.0, timestamp: now - 24 * h },

  // User 2 (Elena Vance)
  { id: 'int-201', userId: 'user-2', productId: 'prod-2', type: 'purchase', value: 5.0, normalizedScore: 5.0, timestamp: now - 52 * h },
  { id: 'int-202', userId: 'user-2', productId: 'prod-2', type: 'rating', value: 5.0, normalizedScore: 5.0, timestamp: now - 51 * h },
  { id: 'int-203', userId: 'user-2', productId: 'prod-3', type: 'purchase', value: 5.0, normalizedScore: 4.8, timestamp: now - 45 * h },
  { id: 'int-204', userId: 'user-2', productId: 'prod-8', type: 'wishlist', value: 2.5, normalizedScore: 3.8, timestamp: now - 38 * h },
  { id: 'int-205', userId: 'user-2', productId: 'prod-10', type: 'rating', value: 5.0, normalizedScore: 5.0, timestamp: now - 28 * h },
  { id: 'int-206', userId: 'user-2', productId: 'prod-7', type: 'view', value: 1.0, normalizedScore: 2.8, timestamp: now - 18 * h },

  // User 3 (Marcus Chen)
  { id: 'int-301', userId: 'user-3', productId: 'prod-4', type: 'purchase', value: 5.0, normalizedScore: 5.0, timestamp: now - 60 * h },
  { id: 'int-302', userId: 'user-3', productId: 'prod-4', type: 'rating', value: 5.0, normalizedScore: 5.0, timestamp: now - 58 * h },
  { id: 'int-303', userId: 'user-3', productId: 'prod-6', type: 'purchase', value: 5.0, normalizedScore: 4.9, timestamp: now - 42 * h },
  { id: 'int-304', userId: 'user-3', productId: 'prod-7', type: 'add_to_cart', value: 3.5, normalizedScore: 4.3, timestamp: now - 36 * h },
  { id: 'int-305', userId: 'user-3', productId: 'prod-9', type: 'rating', value: 4.5, normalizedScore: 4.5, timestamp: now - 25 * h },
  { id: 'int-306', userId: 'user-3', productId: 'prod-1', type: 'view', value: 1.0, normalizedScore: 3.2, timestamp: now - 15 * h },

  // User 4 (Sophia Laurent)
  { id: 'int-401', userId: 'user-4', productId: 'prod-3', type: 'purchase', value: 5.0, normalizedScore: 5.0, timestamp: now - 55 * h },
  { id: 'int-402', userId: 'user-4', productId: 'prod-3', type: 'rating', value: 5.0, normalizedScore: 5.0, timestamp: now - 54 * h },
  { id: 'int-403', userId: 'user-4', productId: 'prod-8', type: 'purchase', value: 5.0, normalizedScore: 4.7, timestamp: now - 44 * h },
  { id: 'int-404', userId: 'user-4', productId: 'prod-2', type: 'rating', value: 4.5, normalizedScore: 4.5, timestamp: now - 32 * h },
  { id: 'int-405', userId: 'user-4', productId: 'prod-9', type: 'wishlist', value: 2.5, normalizedScore: 3.5, timestamp: now - 22 * h },
  { id: 'int-406', userId: 'user-4', productId: 'prod-10', type: 'view', value: 1.0, normalizedScore: 3.0, timestamp: now - 12 * h },

  // User 5 (Devon Miller)
  { id: 'int-501', userId: 'user-5', productId: 'prod-1', type: 'purchase', value: 5.0, normalizedScore: 5.0, timestamp: now - 49 * h },
  { id: 'int-502', userId: 'user-5', productId: 'prod-5', type: 'purchase', value: 5.0, normalizedScore: 4.8, timestamp: now - 41 * h },
  { id: 'int-503', userId: 'user-5', productId: 'prod-9', type: 'rating', value: 4.0, normalizedScore: 4.0, timestamp: now - 33 * h },
  { id: 'int-504', userId: 'user-5', productId: 'prod-6', type: 'rating', value: 4.5, normalizedScore: 4.5, timestamp: now - 26 * h },
  { id: 'int-505', userId: 'user-5', productId: 'prod-4', type: 'view', value: 1.0, normalizedScore: 3.4, timestamp: now - 14 * h },

  // User Current (Initial Seed to get recommendations immediately)
  { id: 'int-curr-1', userId: 'user-current', productId: 'prod-1', type: 'click_detail', value: 2.0, normalizedScore: 4.0, timestamp: now - 8 * h },
  { id: 'int-curr-2', userId: 'user-current', productId: 'prod-4', type: 'wishlist', value: 2.5, normalizedScore: 4.2, timestamp: now - 4 * h },
  { id: 'int-curr-3', userId: 'user-current', productId: 'prod-5', type: 'view', value: 1.0, normalizedScore: 3.0, timestamp: now - 1 * h }
];
