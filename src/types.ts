export interface Product {
  id: string;
  name: string;
  price: number;
  originalWholesalePrice?: number; // Price suggested by wholesaler before admin edit
  description: string;
  category: string;
  image: string;
  wholesalerId?: string;
  wholesalerName?: string;
  isApproved: boolean; // true if live, false if pending admin approval
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  priceAtOrder: number;
  image: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerWhatsApp?: string; // WhatsApp number
  customerAddress?: string;  // Current address
  customerEmail?: string;    // Email address
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export type UserRole = 'guest' | 'wholesaler' | 'admin';

export interface WholesalerSession {
  id: string;
  name: string;
  companyName: string;
  loginCode: string;
}

export interface WholesalerCode {
  code: string;
  companyName: string;
  createdAt: string;
  isActive: boolean;
}
