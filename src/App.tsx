import React, { useState, useEffect } from 'react';
import { LogOut, ShieldCheck, User, Store, ShoppingBag, Terminal } from 'lucide-react';
import { Product, Order, UserRole, WholesalerSession, OrderItem, WholesalerCode } from './types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS } from './data/initialProducts';
import LoginConsole from './components/LoginConsole';
import UserStorefront from './components/UserStorefront';
import WholesalerPanel from './components/WholesalerPanel';
import AdminControl from './components/AdminControl';

const INITIAL_CODES: WholesalerCode[] = [
  { code: 'M2-WS-PREMIUM', companyName: 'M2 Premium Supplies', createdAt: new Date().toISOString(), isActive: true },
  { code: 'M2-WS-APEX', companyName: 'Apex Wholesale', createdAt: new Date().toISOString(), isActive: true }
];

export default function App() {
  // Roles and Sessions
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [wholesalerSession, setWholesalerSession] = useState<WholesalerSession | null>(null);

  // Core Persistent State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wholesalerCodes, setWholesalerCodes] = useState<WholesalerCode[]>([]);

  // Load and seed initial states
  useEffect(() => {
    const storedProducts = localStorage.getItem('m2_market_products');
    const storedOrders = localStorage.getItem('m2_market_orders');
    const storedCodes = localStorage.getItem('m2_wholesaler_codes');

    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
    } else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem('m2_market_products', JSON.stringify(INITIAL_PRODUCTS));
    }

    if (storedOrders) {
      setOrders(JSON.parse(storedOrders));
    } else {
      setOrders(INITIAL_ORDERS);
      localStorage.setItem('m2_market_orders', JSON.stringify(INITIAL_ORDERS));
    }

    if (storedCodes) {
      setWholesalerCodes(JSON.parse(storedCodes));
    } else {
      setWholesalerCodes(INITIAL_CODES);
      localStorage.setItem('m2_wholesaler_codes', JSON.stringify(INITIAL_CODES));
    }

    // Recover session role if user refreshed
    const savedRole = sessionStorage.getItem('m2_market_role') as UserRole;
    if (savedRole) {
      setActiveRole(savedRole);
      if (savedRole === 'wholesaler') {
        const savedWs = sessionStorage.getItem('m2_market_wholesaler');
        if (savedWs) {
          setWholesalerSession(JSON.parse(savedWs));
        }
      }
    }
  }, []);

  // Sync helpers
  const syncProducts = (updated: Product[]) => {
    setProducts(updated);
    localStorage.setItem('m2_market_products', JSON.stringify(updated));
  };

  const syncOrders = (updated: Order[]) => {
    setOrders(updated);
    localStorage.setItem('m2_market_orders', JSON.stringify(updated));
  };

  const syncCodes = (updated: WholesalerCode[]) => {
    setWholesalerCodes(updated);
    localStorage.setItem('m2_wholesaler_codes', JSON.stringify(updated));
  };

  // Login event
  const handleLogin = (role: UserRole, wholesalerData?: WholesalerSession) => {
    setActiveRole(role);
    sessionStorage.setItem('m2_market_role', role);
    if (role === 'wholesaler' && wholesalerData) {
      setWholesalerSession(wholesalerData);
      sessionStorage.setItem('m2_market_wholesaler', JSON.stringify(wholesalerData));
    }
  };

  // Logout event
  const handleLogout = () => {
    setActiveRole(null);
    setWholesalerSession(null);
    sessionStorage.removeItem('m2_market_role');
    sessionStorage.removeItem('m2_market_wholesaler');
  };

  // --- BUSINESS LOGIC ACTIONS ---

  // Wholesaler: Add product for valuation
  const handleAddProduct = (newProduct: Omit<Product, 'id' | 'isApproved' | 'createdAt'>) => {
    const product: Product = {
      ...newProduct,
      id: 'prod-' + Math.random().toString(36).substr(2, 9),
      isApproved: false, // Must be approved by Admin
      createdAt: new Date().toISOString()
    };
    const updated = [product, ...products];
    syncProducts(updated);
  };

  // Admin: Add product directly with immediate approval/publishing
  const handleAddProductDirect = (newProduct: Omit<Product, 'id' | 'isApproved' | 'createdAt'>) => {
    const product: Product = {
      ...newProduct,
      id: 'prod-' + Math.random().toString(36).substr(2, 9),
      isApproved: true, // Approved immediately
      createdAt: new Date().toISOString(),
      originalWholesalePrice: newProduct.price
    };
    const updated = [product, ...products];
    syncProducts(updated);
  };

  // Guest: Place/Book order
  const handleBookOrder = (items: OrderItem[], name: string, phone: string) => {
    const total = items.reduce((sum, item) => sum + (item.priceAtOrder * item.quantity), 0);
    const order: Order = {
      id: 'ORD-' + Math.floor(1000 + Math.random() * 9000), // e.g. ORD-7492
      customerName: name,
      customerPhone: phone || undefined,
      items,
      totalPrice: total,
      status: 'pending', // Pending Admin approval
      createdAt: new Date().toISOString()
    };
    const updated = [order, ...orders];
    syncOrders(updated);
  };

  // Admin: Approve Wholesaler product and apply custom valuation price
  const handleApproveProduct = (productId: string, finalPrice: number) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          price: finalPrice,
          isApproved: true
        };
      }
      return p;
    });
    syncProducts(updated);
  };

  // Admin/Wholesaler: Update product fields
  const handleUpdateProduct = (updatedProduct: Product) => {
    const updated = products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
    syncProducts(updated);
  };

  // Admin: Reject Wholesaler product before approval
  const handleRejectProduct = (productId: string) => {
    const updated = products.filter((p) => p.id !== productId);
    syncProducts(updated);
  };

  // Admin: Delete/Remove product from active directory
  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter((p) => p.id !== productId);
    syncProducts(updated);
  };

  // Admin: Approve Guest order
  const handleApproveOrder = (orderId: string) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'approved' as const
        };
      }
      return o;
    });
    syncOrders(updated);
  };

  // Admin: Reject Guest order
  const handleRejectOrder = (orderId: string) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'rejected' as const
        };
      }
      return o;
    });
    syncOrders(updated);
  };

  // Admin: Generate Wholesaler Code
  const handleCreateCode = (companyName: string, customCode?: string) => {
    const formattedCode = customCode 
      ? customCode.trim().toUpperCase() 
      : 'M2-WS-' + Math.floor(1000 + Math.random() * 9000);

    // Ensure uniqueness
    const codeExists = wholesalerCodes.some(c => c.code.toUpperCase() === formattedCode);
    if (codeExists) {
      alert(`The access code "${formattedCode}" is already in use by another brand. Please use a unique code.`);
      return;
    }

    const newCodeItem: WholesalerCode = {
      code: formattedCode,
      companyName: companyName.trim(),
      createdAt: new Date().toISOString(),
      isActive: true
    };

    syncCodes([newCodeItem, ...wholesalerCodes]);
  };

  // Admin: Delete Wholesaler Code
  const handleDeleteCode = (code: string) => {
    const updated = wholesalerCodes.filter(c => c.code !== code);
    syncCodes(updated);
  };

  // Admin: Toggle Wholesaler Code Active Status
  const handleToggleCodeActive = (code: string) => {
    const updated = wholesalerCodes.map(c => {
      if (c.code === code) {
        return { ...c, isActive: !c.isActive };
      }
      return c;
    });
    syncCodes(updated);
  };

  // Synchronize state with latest localStorage records
  const handleRefresh = () => {
    const storedProducts = localStorage.getItem('m2_market_products');
    const storedOrders = localStorage.getItem('m2_market_orders');
    const storedCodes = localStorage.getItem('m2_wholesaler_codes');

    if (storedProducts) setProducts(JSON.parse(storedProducts));
    if (storedOrders) setOrders(JSON.parse(storedOrders));
    if (storedCodes) setWholesalerCodes(JSON.parse(storedCodes));
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-50 flex flex-col justify-between">
      
      {/* Dynamic Header */}
      {activeRole && (
        <header id="app-global-header" className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40 transition-all">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            
            {/* Branding */}
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 text-white p-1.5 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight text-sm hidden sm:inline-block">
                m2-Shopping-Mall
              </span>
            </div>

            {/* Role & Context Badges */}
            <div className="flex items-center gap-3">
              {activeRole === 'admin' && (
                <div id="role-admin-badge" className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Platform Admin</span>
                </div>
              )}

              {activeRole === 'wholesaler' && wholesalerSession && (
                <div id="role-wholesaler-badge" className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full text-xs font-bold">
                  <Store className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="truncate max-w-28 sm:max-w-none">
                    Wholesaler ({wholesalerSession.companyName})
                  </span>
                </div>
              )}

              {activeRole === 'guest' && (
                <div id="role-guest-badge" className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold">
                  <User className="w-3.5 h-3.5 text-slate-600" />
                  <span>Guest Shopper</span>
                </div>
              )}

              {/* Sign out */}
              <button
                id="btn-signout"
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 p-2 rounded-xl transition-all cursor-pointer border border-slate-100"
                title="Log out session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </header>
      )}

      {/* Main Container */}
      <main id="app-main-view" className="flex-grow">
        {!activeRole ? (
          <LoginConsole onLogin={handleLogin} wholesalerCodes={wholesalerCodes} />
        ) : (
          <div id="active-context-frame" className="animate-fade-in">
            {activeRole === 'guest' && (
              <UserStorefront 
                products={products} 
                orders={orders} 
                onBookOrder={handleBookOrder} 
                onRefresh={handleRefresh}
              />
            )}

            {activeRole === 'wholesaler' && wholesalerSession && (
              <WholesalerPanel 
                wholesaler={wholesalerSession} 
                products={products} 
                orders={orders}
                onAddProduct={handleAddProduct} 
                onBookOrder={handleBookOrder}
                onRefresh={handleRefresh}
              />
            )}

            {activeRole === 'admin' && (
              <AdminControl 
                products={products} 
                orders={orders} 
                wholesalerCodes={wholesalerCodes}
                onApproveProduct={handleApproveProduct} 
                onRejectProduct={handleRejectProduct} 
                onApproveOrder={handleApproveOrder} 
                onRejectOrder={handleRejectOrder}
                onDeleteProduct={handleDeleteProduct}
                onCreateCode={handleCreateCode}
                onDeleteCode={handleDeleteCode}
                onToggleCodeActive={handleToggleCodeActive}
                onAddProductDirect={handleAddProductDirect}
                onRefresh={handleRefresh}
                onUpdateProduct={handleUpdateProduct}
              />
            )}
          </div>
        )}
      </main>

      {/* Global Compact Footer */}
      <footer id="app-global-footer" className="bg-white border-t border-slate-100 py-6 text-center text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 M2-Premium. Shopping Mall Market Center. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-300">
            <Terminal className="w-3.5 h-3.5" />
            <span className="font-mono text-[10px]">v1.4.0 • Node React Platform</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
