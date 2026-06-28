import { Product } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Minimalist Leather Backpack',
    price: 89.99,
    description: 'Sleek, water-resistant full-grain leather backpack featuring a 15-inch laptop sleeve and premium hardware.',
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80',
    isApproved: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
  },
  {
    id: 'prod-2',
    name: 'Wireless Noise-Cancelling Headphones',
    price: 249.99,
    description: 'Immersive sound experience with industry-leading active noise cancelling and up to 40 hours of battery life.',
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    isApproved: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-3',
    name: 'Ceramic Matte Coffee Dripper Set',
    price: 42.50,
    description: 'Artisan hand-poured coffee dripper with heat-resistant borosilicate glass server and 40-pack paper filters.',
    category: 'Home & Kitchen',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    isApproved: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-4',
    name: 'Vaporwave Mechanical Keyboard',
    price: 135.00,
    description: 'Hot-swappable mechanical keyboard featuring Gateron brown switches and dual-tone PBT keycaps with RGB backlighting.',
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
    isApproved: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-5',
    name: 'Organic Bamboo Bedding Set',
    price: 110.00,
    description: 'Hypoallergenic, ultra-breathable sheets crafted from 100% sustainable organic bamboo fibers.',
    category: 'Home & Kitchen',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80',
    isApproved: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-6',
    name: 'Nordic Wooden Desk Organizer',
    price: 28.00,
    description: 'Handcrafted premium oak wood holder for pens, smartphone, business cards, and sticky notes.',
    category: 'Home & Kitchen',
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80',
    isApproved: true,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const INITIAL_ORDERS = [
  {
    id: 'ORD-8402',
    customerName: 'Amani Joseph',
    customerPhone: '0812345678',
    items: [
      {
        productId: 'prod-1',
        name: 'Minimalist Leather Backpack',
        quantity: 1,
        priceAtOrder: 89.99,
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80'
      }
    ],
    totalPrice: 89.99,
    status: 'approved' as const,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ORD-9124',
    customerName: 'Guest Shopper',
    customerPhone: '0908882233',
    items: [
      {
        productId: 'prod-3',
        name: 'Ceramic Matte Coffee Dripper Set',
        quantity: 2,
        priceAtOrder: 42.50,
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
      }
    ],
    totalPrice: 85.00,
    status: 'pending' as const,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  }
];
