import React, { useState, useEffect } from 'react';
import { LogOut, ShieldCheck, User, Store, ShoppingBag, Terminal, Wifi, WifiOff } from 'lucide-react';
import { Product, Order, UserRole, WholesalerSession, OrderItem, WholesalerCode } from './types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS } from './data/initialProducts';
import LoginConsole from './components/LoginConsole';
import UserStorefront from './components/UserStorefront';
import WholesalerPanel from './components/WholesalerPanel';
import AdminControl from './components/AdminControl';
import { db } from './lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';

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

  // Connection State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Seeding function if Firestore collections are empty
  const seedDatabaseIfEmpty = async () => {
    try {
      // Products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      if (productsSnapshot.empty) {
        const batch = writeBatch(db);
        INITIAL_PRODUCTS.forEach((p) => {
          batch.set(doc(db, 'products', p.id), p);
        });
        await batch.commit();
      }

      // Orders
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      if (ordersSnapshot.empty) {
        const batch = writeBatch(db);
        INITIAL_ORDERS.forEach((o) => {
          batch.set(doc(db, 'orders', o.id), o);
        });
        await batch.commit();
      }

      // Codes
      const codesSnapshot = await getDocs(collection(db, 'wholesalerCodes'));
      if (codesSnapshot.empty) {
        const batch = writeBatch(db);
        INITIAL_CODES.forEach((c) => {
          batch.set(doc(db, 'wholesalerCodes', c.code), c);
        });
        await batch.commit();
      }
    } catch (err) {
      console.warn("Seeding or offline load check failed:", err);
    }
  };

  // Load, seed and listen in real-time
  useEffect(() => {
    // Online/Offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

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

    let unsubProducts: (() => void) | undefined;
    let unsubOrders: (() => void) | undefined;
    let unsubCodes: (() => void) | undefined;

    const initFirebase = async () => {
      // Run bootstrapping check (will use IndexedDB local Cache if offline)
      await seedDatabaseIfEmpty();

      // Setup offline-first listeners
      unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
        const list: Product[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Product);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setProducts(list);
      }, (err) => {
        console.warn("Products onSnapshot warning:", err);
      });

      unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Order);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(list);
      }, (err) => {
        console.warn("Orders onSnapshot warning:", err);
      });

      unsubCodes = onSnapshot(collection(db, 'wholesalerCodes'), (snapshot) => {
        const list: WholesalerCode[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as WholesalerCode);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setWholesalerCodes(list);
      }, (err) => {
        console.warn("Codes onSnapshot warning:", err);
      });
    };

    initFirebase();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (unsubProducts) unsubProducts();
      if (unsubOrders) unsubOrders();
      if (unsubCodes) unsubCodes();
    };
  }, []);

  // Automatic daily cloud backup snapshot trigger
  useEffect(() => {
    if (!isOnline) return;
    if (products.length === 0 && orders.length === 0 && wholesalerCodes.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const lastBackup = localStorage.getItem('m2_last_auto_backup_date');

    if (lastBackup === todayStr) {
      // Already backed up today
      return;
    }

    const runAutoBackup = async () => {
      try {
        const { encryptData } = await import('./lib/crypto');
        
        const ledgerData = {
          products,
          orders,
          wholesalerCodes,
          backedUpAt: new Date().toISOString()
        };

        const encryptedPayload = encryptData(ledgerData);
        const backupId = `auto-backup-${todayStr}`;
        const backupDoc = {
          id: backupId,
          timestamp: new Date().toISOString(),
          encryptedData: encryptedPayload,
          summary: `Products: ${products.length}, Orders: ${orders.length}, Codes: ${wholesalerCodes.length}`,
          isAuto: true
        };

        await setDoc(doc(db, 'auto_backups', backupId), backupDoc);
        localStorage.setItem('m2_last_auto_backup_date', todayStr);
        console.log(`[AutoBackup] Successfully uploaded daily snapshot: ${backupId}`);
      } catch (err) {
        console.warn("[AutoBackup] Failed to push daily snapshot:", err);
      }
    };

    // Debounce slightly to ensure all snapshot collections have fully loaded in state
    const timer = setTimeout(() => {
      runAutoBackup();
    }, 5000);

    return () => clearTimeout(timer);
  }, [isOnline, products.length, orders.length, wholesalerCodes.length]);

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

  // --- BUSINESS LOGIC ACTIONS (Real-time Firestore persistence) ---

  // Wholesaler: Add product for valuation
  const handleAddProduct = async (newProduct: Omit<Product, 'id' | 'isApproved' | 'createdAt'>) => {
    const product: Product = {
      ...newProduct,
      id: 'prod-' + Math.random().toString(36).substr(2, 9),
      isApproved: false, // Must be approved by Admin
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, "products", product.id), product);
    } catch (err) {
      console.error("Error adding product:", err);
    }
  };

  // Admin: Add product directly with immediate approval/publishing
  const handleAddProductDirect = async (newProduct: Omit<Product, 'id' | 'isApproved' | 'createdAt'>) => {
    const product: Product = {
      ...newProduct,
      id: 'prod-' + Math.random().toString(36).substr(2, 9),
      isApproved: true, // Approved immediately
      createdAt: new Date().toISOString(),
      originalWholesalePrice: newProduct.price
    };
    try {
      await setDoc(doc(db, "products", product.id), product);
    } catch (err) {
      console.error("Error adding product directly:", err);
    }
  };

  // Guest: Place/Book order
  const handleBookOrder = async (
    items: OrderItem[],
    name: string,
    phone: string,
    whatsapp?: string,
    address?: string,
    email?: string
  ) => {
    const total = items.reduce((sum, item) => sum + (item.priceAtOrder * item.quantity), 0);
    const order: Order = {
      id: 'ORD-' + Math.floor(1000 + Math.random() * 9000), // e.g. ORD-7492
      customerName: name,
      customerPhone: phone || undefined,
      customerWhatsApp: whatsapp || undefined,
      customerAddress: address || undefined,
      customerEmail: email || undefined,
      items,
      totalPrice: total,
      status: 'pending', // Pending Admin approval
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, "orders", order.id), order);
    } catch (err) {
      console.error("Error booking order:", err);
    }
  };

  // Admin: Approve Wholesaler product and apply custom valuation price
  const handleApproveProduct = async (productId: string, finalPrice: number) => {
    try {
      await setDoc(doc(db, "products", productId), {
        price: finalPrice,
        isApproved: true
      }, { merge: true });
    } catch (err) {
      console.error("Error approving product:", err);
    }
  };

  // Admin/Wholesaler: Update product fields
  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
      await setDoc(doc(db, "products", updatedProduct.id), updatedProduct);
    } catch (err) {
      console.error("Error updating product:", err);
    }
  };

  // Admin: Reject Wholesaler product before approval
  const handleRejectProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, "products", productId));
    } catch (err) {
      console.error("Error rejecting product:", err);
    }
  };

  // Admin: Delete/Remove product from active directory
  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, "products", productId));
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  // Admin: Approve Guest order
  const handleApproveOrder = async (orderId: string) => {
    try {
      await setDoc(doc(db, "orders", orderId), {
        status: 'approved'
      }, { merge: true });
    } catch (err) {
      console.error("Error approving order:", err);
    }
  };

  // Admin: Reject Guest order
  const handleRejectOrder = async (orderId: string) => {
    try {
      await setDoc(doc(db, "orders", orderId), {
        status: 'rejected'
      }, { merge: true });
    } catch (err) {
      console.error("Error rejecting order:", err);
    }
  };

  // Admin: Generate Wholesaler Code
  const handleCreateCode = async (companyName: string, customCode?: string) => {
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

    try {
      await setDoc(doc(db, "wholesalerCodes", formattedCode), newCodeItem);
    } catch (err) {
      console.error("Error creating code:", err);
    }
  };

  // Admin: Delete Wholesaler Code
  const handleDeleteCode = async (code: string) => {
    try {
      await deleteDoc(doc(db, "wholesalerCodes", code));
    } catch (err) {
      console.error("Error deleting code:", err);
    }
  };

  // Admin: Toggle Wholesaler Code Active Status
  const handleToggleCodeActive = async (code: string) => {
    const target = wholesalerCodes.find(c => c.code === code);
    if (!target) return;
    try {
      await setDoc(doc(db, "wholesalerCodes", code), {
        isActive: !target.isActive
      }, { merge: true });
    } catch (err) {
      console.error("Error toggling code active status:", err);
    }
  };

  // Synchronize state with latest records (force a cache/cloud reload)
  const handleRefresh = async () => {
    // Real-time listener already updates state automatically!
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-gradient-to-tr from-sky-50 via-slate-50 to-indigo-50 text-slate-800 flex flex-col justify-between selection:bg-sky-400 selection:text-white">
      
      {/* Dynamic Header */}
      {activeRole && (
        <header id="app-global-header" className="bg-white/80 backdrop-blur-md border-b border-sky-100/50 sticky top-0 z-40 transition-all shadow-sm">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            
            {/* Branding */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-extrabold flex items-center justify-center rounded-xl shadow-md font-brand text-sm">
                M2
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-700 uppercase tracking-wider font-brand text-xs">
                  M2 Shopping Mall
                </span>
                
                {/* Sync Status Badge */}
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                  <span className="text-[9px] font-bold tracking-wider uppercase text-slate-400 font-mono flex items-center gap-1">
                    {isOnline ? (
                      <>
                        <Wifi className="w-2.5 h-2.5 text-emerald-500 inline" /> Online
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-2.5 h-2.5 text-amber-500 inline" /> Offline
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Role & Context Badges */}
            <div className="flex items-center gap-2 sm:gap-3">
              {activeRole === 'admin' && (
                <div id="role-admin-badge" className="inline-flex items-center gap-1.5 bg-indigo-50/80 border border-indigo-100 px-3 py-1.5 rounded-full text-xs font-bold text-indigo-700 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-brand">Platform Admin</span>
                </div>
              )}

              {activeRole === 'wholesaler' && wholesalerSession && (
                <div id="role-wholesaler-badge" className="inline-flex items-center gap-2 bg-sky-50/80 border border-sky-100 px-3 py-1.5 rounded-full text-xs font-bold text-sky-700 shadow-xs">
                  <Store className="w-3.5 h-3.5 text-sky-600" />
                  <span className="truncate max-w-28 sm:max-w-none font-brand">
                    {wholesalerSession.companyName}
                  </span>
                </div>
              )}

              {activeRole === 'guest' && (
                <div id="role-guest-badge" className="inline-flex items-center gap-1.5 bg-slate-100/80 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 shadow-xs">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-brand">Guest Shopper</span>
                </div>
              )}

              {/* Sign out */}
              <button
                id="btn-signout"
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-600 bg-white hover:bg-red-50 p-2 rounded-xl transition-all cursor-pointer border border-slate-200 shadow-xs"
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
          <LoginConsole onLogin={handleLogin} wholesalerCodes={wholesalerCodes} isOnline={isOnline} />
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
