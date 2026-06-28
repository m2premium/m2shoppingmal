import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  Edit, 
  Save, 
  Trash2, 
  ShoppingBag, 
  DollarSign, 
  User, 
  TrendingUp, 
  X,
  Plus,
  Package,
  FileCheck,
  Key,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import { Product, Order, WholesalerCode } from '../types';

// Beautiful stock photo presets for easy listing
const IMAGE_PRESETS = [
  { name: 'Rolex Watch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80' },
  { name: 'Leather Bag', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80' },
  { name: 'AirPods Max', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80' },
  { name: 'Leather Shoes', url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80' }
];

interface AdminControlProps {
  products: Product[];
  orders: Order[];
  wholesalerCodes: WholesalerCode[];
  onApproveProduct: (productId: string, finalPrice: number) => void;
  onRejectProduct: (productId: string) => void;
  onApproveOrder: (orderId: string) => void;
  onRejectOrder: (orderId: string) => void;
  onDeleteProduct: (productId: string) => void;
  onCreateCode: (companyName: string, code?: string) => void;
  onDeleteCode: (code: string) => void;
  onToggleCodeActive: (code: string) => void;
  onAddProductDirect: (product: Omit<Product, 'id' | 'isApproved' | 'createdAt'>) => void;
  onRefresh?: () => void;
}

export default function AdminControl({
  products,
  orders,
  wholesalerCodes,
  onApproveProduct,
  onRejectProduct,
  onApproveOrder,
  onRejectOrder,
  onDeleteProduct,
  onCreateCode,
  onDeleteCode,
  onToggleCodeActive,
  onAddProductDirect,
  onRefresh
}: AdminControlProps) {
  // Admin tabs
  const [activeSubTab, setActiveSubTab] = useState<'supplies' | 'orders' | 'inventory' | 'codes'>('supplies');

  // Refresh feedback states
  const [isSpinning, setIsSpinning] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(false);

  const handleRefreshClick = () => {
    setIsSpinning(true);
    if (onRefresh) {
      onRefresh();
    }
    setTimeout(() => {
      setIsSpinning(false);
      setSyncFeedback(true);
      setTimeout(() => setSyncFeedback(false), 2000);
    }, 600);
  };

  // Admin direct product creation state
  const [adminProdName, setAdminProdName] = useState('');
  const [adminProdPrice, setAdminProdPrice] = useState('');
  const [adminProdCategory, setAdminProdCategory] = useState('Fashion');
  const [adminProdDesc, setAdminProdDesc] = useState('');
  const [adminImageUrl, setAdminImageUrl] = useState('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80');
  const [adminCustomImage, setAdminCustomImage] = useState('');
  const [adminSuccessMsg, setAdminSuccessMsg] = useState('');

  const handleAdminAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProdName.trim() || !adminProdPrice.trim() || !adminProdDesc.trim()) {
      alert('Please fill out all product fields.');
      return;
    }

    const priceNum = parseFloat(adminProdPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please specify a valid selling price.');
      return;
    }

    onAddProductDirect({
      name: adminProdName.trim(),
      price: priceNum,
      category: adminProdCategory,
      description: adminProdDesc.trim(),
      image: adminCustomImage.trim() || adminImageUrl,
      wholesalerId: 'admin',
      wholesalerName: 'Platform Administrator'
    });

    // Reset Form
    setAdminProdName('');
    setAdminProdPrice('');
    setAdminProdCategory('Fashion');
    setAdminProdDesc('');
    setAdminCustomImage('');
    setAdminSuccessMsg('Product successfully published directly to the live storefront!');
    setTimeout(() => {
      setAdminSuccessMsg('');
    }, 4000);
  };

  // Interactive price edits
  // Key: productId, Value: edited price string
  const [editedPrices, setEditedPrices] = useState<{ [id: string]: string }>({});

  const handlePriceChange = (productId: string, val: string) => {
    setEditedPrices((prev) => ({
      ...prev,
      [productId]: val
    }));
  };

  // Memoized stats
  const stats = useMemo(() => {
    const liveCount = products.filter(p => p.isApproved).length;
    const pendingCount = products.filter(p => !p.isApproved).length;
    
    const approvedOrders = orders.filter(o => o.status === 'approved');
    const totalEarnings = approvedOrders.reduce((acc, o) => acc + o.totalPrice, 0);
    
    const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

    // List of active wholesalers based on listed products
    const wholesalersMap = new Map<string, string>();
    products.forEach((p) => {
      if (p.wholesalerId && p.wholesalerName) {
        wholesalersMap.set(p.wholesalerId, p.wholesalerName);
      }
    });

    return {
      liveCount,
      pendingCount,
      totalEarnings,
      pendingOrdersCount,
      wholesalersCount: wholesalersMap.size,
      wholesalersList: Array.from(wholesalersMap.entries()).map(([id, name]) => ({ id, name }))
    };
  }, [products, orders]);

  // List of pending wholesaler supplies
  const pendingProducts = useMemo(() => {
    return products.filter((p) => !p.isApproved);
  }, [products]);

  // List of approved live products
  const liveProducts = useMemo(() => {
    return products.filter((p) => p.isApproved);
  }, [products]);

  // List of pending client bookings
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'pending');
  }, [orders]);

  // List of resolved client bookings (approved or rejected)
  const resolvedOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'pending');
  }, [orders]);

  // Handle valuation & publishing
  const triggerPublish = (product: Product) => {
    // Determine the price to submit (edited price or original wholesale price)
    const customPriceStr = editedPrices[product.id];
    let finalPrice = product.price;

    if (customPriceStr !== undefined && customPriceStr !== '') {
      const parsed = parseFloat(customPriceStr);
      if (!isNaN(parsed) && parsed > 0) {
        finalPrice = parsed;
      } else {
        alert('Please specify a positive numerical price.');
        return;
      }
    }

    onApproveProduct(product.id, finalPrice);
    
    // Clear price edits state for this product
    setEditedPrices((prev) => {
      const copy = { ...prev };
      delete copy[product.id];
      return copy;
    });
  };

  return (
    <div id="admin-control-panel" className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      
      {/* Admin Title Banner */}
      <div id="admin-header" className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl border border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-full text-red-400 font-semibold text-xs tracking-wider uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure System Admin Shell</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Management & Supervision Dashboard</h2>
          <p className="text-slate-300 text-sm max-w-xl">
            Authorize supply pipelines, audit pricing structures, dispatch customer cart bookings, and supervise wholesalers.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex flex-col font-mono text-xs text-slate-400 text-left md:text-right">
            <span>Access Code: <strong className="text-emerald-400">m2-admin-001</strong></span>
            <span>Status: <span className="text-emerald-400 font-bold">● Live Active Connection</span></span>
          </div>

          <button
            id="btn-refresh-admin"
            onClick={handleRefreshClick}
            className="p-3.5 rounded-2xl border border-slate-800 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-sm relative shrink-0"
            title="Sync Admin Console"
          >
            <RefreshCw className={`w-5 h-5 ${isSpinning ? 'animate-spin text-red-400' : ''}`} />
            {syncFeedback && (
              <span className="absolute -bottom-8 right-0 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow whitespace-nowrap z-50 animate-fade-in">
                Admin Refreshed!
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Analytics Bento Grid */}
      <div id="admin-stats-grid" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Sales (Approved)</div>
            <div className="font-mono text-xl font-bold text-slate-900">${stats.totalEarnings.toFixed(2)}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Awaiting Valuation</div>
            <div className="font-mono text-xl font-bold text-amber-600">{stats.pendingCount} supplies</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Booked Orders (Awaiting)</div>
            <div className="font-mono text-xl font-bold text-slate-900">{stats.pendingOrdersCount} orders</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Live Approved Items</div>
            <div className="font-mono text-xl font-bold text-emerald-600">{stats.liveCount} active</div>
          </div>
        </div>

      </div>

      {/* Admin Operations Sub-Navigation */}
      <div className="space-y-6">
        <div className="flex border-b border-slate-200">
          <button
            id="subtab-supplies-btn"
            onClick={() => setActiveSubTab('supplies')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'supplies'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Wholesaler Supplies Approvals</span>
            {stats.pendingCount > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {stats.pendingCount}
              </span>
            )}
          </button>

          <button
            id="subtab-orders-btn"
            onClick={() => setActiveSubTab('orders')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'orders'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Booked Shopping Orders</span>
            {stats.pendingOrdersCount > 0 && (
              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                {stats.pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            id="subtab-inventory-btn"
            onClick={() => setActiveSubTab('inventory')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'inventory'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Live Products Directory</span>
          </button>

          <button
            id="subtab-codes-btn"
            onClick={() => setActiveSubTab('codes')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'codes'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Wholesaler Codes</span>
            {wholesalerCodes.length > 0 && (
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {wholesalerCodes.length}
              </span>
            )}
          </button>
        </div>

        {/* --- Subtab: Supplies (Wholesaler Approvals and price editing) --- */}
        {activeSubTab === 'supplies' && (
          <div id="supplies-deck" className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Wholesale Valuation Deck</h3>
              <p className="text-sm text-slate-500">
                Wholesale suppliers post drafts here. Adjust the list price freely to ensure fair market rate, then click Approve to authorize live listing.
              </p>
            </div>

            {pendingProducts.length === 0 ? (
              <div id="empty-valuations" className="bg-white text-center py-16 rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
                <FileCheck className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">No Pending Wholesaler Approvals</p>
                <p className="text-xs text-slate-400">All wholesaler batches are currently approved or resolved.</p>
              </div>
            ) : (
              <div id="pending-products-list" className="grid gap-6">
                {pendingProducts.map((product) => {
                  const currentPriceValue = editedPrices[product.id] !== undefined 
                    ? editedPrices[product.id] 
                    : product.price.toString();

                  return (
                    <div 
                      id={`pending-card-${product.id}`}
                      key={product.id}
                      className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
                    >
                      {/* Image and Meta */}
                      <div className="flex gap-4 items-center">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          referrerPolicy="no-referrer"
                          className="w-20 h-20 object-cover rounded-xl border border-slate-100 shrink-0" 
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-base">{product.name}</h4>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold uppercase">
                              {product.category}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-500 max-w-md mt-1 line-clamp-2">
                            {product.description}
                          </p>

                          <div className="mt-2 text-xs text-indigo-950 font-medium">
                            Supplier: <strong className="text-slate-800">{product.wholesalerName}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Pricing Valuation and Action Box */}
                      <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                        
                        {/* Price Edit Control */}
                        <div className="space-y-1.5 shrink-0">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Market Price Valuation ($)
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              id={`input-price-edit-${product.id}`}
                              type="number"
                              step="0.01"
                              value={currentPriceValue}
                              onChange={(e) => handlePriceChange(product.id, e.target.value)}
                              className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold font-mono text-indigo-700 bg-slate-50 focus:ring-1 focus:ring-indigo-500"
                            />
                            {product.price.toString() !== currentPriceValue && (
                              <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-1 rounded">
                                Edited
                              </span>
                            )}
                          </div>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            Wholesaler Ask: ${product.price.toFixed(2)}
                          </span>
                        </div>

                        {/* Approval actions */}
                        <div className="flex items-center gap-2">
                          <button
                            id={`btn-approve-supply-${product.id}`}
                            onClick={() => triggerPublish(product)}
                            className="flex-grow sm:flex-grow-0 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Valuate & Approve Live</span>
                          </button>

                          <button
                            id={`btn-reject-supply-${product.id}`}
                            onClick={() => onRejectProduct(product.id)}
                            className="p-2.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-600 transition-all cursor-pointer"
                            title="Reject/Decline supply request"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- Subtab: Booked Shopping Orders --- */}
        {activeSubTab === 'orders' && (
          <div id="orders-deck" className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Booked Orders Dispatching</h3>
              <p className="text-sm text-slate-500">
                View orders booked by Guest Users. Check details, verify products, and approve them for physical dispatch or reject.
              </p>
            </div>

            {/* Pending Orders Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Awaiting Action ({pendingOrders.length})</h4>
              
              {pendingOrders.length === 0 ? (
                <div id="empty-pending-orders" className="bg-white text-center py-10 rounded-2xl border border-slate-100 p-6">
                  <p className="text-sm text-slate-500 font-medium">No pending shopper orders at this moment.</p>
                </div>
              ) : (
                <div id="pending-orders-list" className="space-y-4">
                  {pendingOrders.map((order) => (
                    <div 
                      id={`admin-pending-order-${order.id}`}
                      key={order.id}
                      className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm flex flex-col gap-4"
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-50 pb-3 gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                              {order.id}
                            </span>
                            <span className="text-xs text-slate-500">
                              Booked {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <div className="mt-1 text-xs font-semibold text-slate-700 flex items-center gap-2">
                            <span className="text-slate-400">Customer:</span>
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{order.customerName} {order.customerPhone ? `(${order.customerPhone})` : ''}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Total Value</span>
                          <span className="font-mono font-bold text-indigo-700 text-base">${order.totalPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Items Row */}
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 items-center">
                            <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg" />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                              <div className="font-mono text-[10px] text-slate-500">
                                {item.quantity} x ${item.priceAtOrder.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-50">
                        <button
                          id={`btn-reject-order-${order.id}`}
                          onClick={() => onRejectOrder(order.id)}
                          className="px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-600 font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline Order</span>
                        </button>

                        <button
                          id={`btn-approve-order-${order.id}`}
                          onClick={() => onApproveOrder(order.id)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve & Dispatch</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resolved Orders Log */}
            <div className="pt-4 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resolved Bookings Log ({resolvedOrders.length})</h4>
              
              {resolvedOrders.length === 0 ? (
                <p className="text-xs text-slate-400">No historically resolved orders yet.</p>
              ) : (
                <div id="resolved-orders-list" className="space-y-3">
                  {resolvedOrders.map((order) => (
                    <div 
                      id={`resolved-order-row-${order.id}`}
                      key={order.id}
                      className="bg-white px-4 py-3 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 text-[11px]">
                            {order.id}
                          </span>
                          <span className="font-medium text-slate-700">{order.customerName}</span>
                          <span className="text-slate-400">({order.items.length} items)</span>
                        </div>
                        <div className="text-slate-400 font-mono text-[10px]">
                          ${order.totalPrice.toFixed(2)} • Resolved {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div>
                        {order.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-100">
                            <CheckCircle className="w-3 h-3" />
                            <span>Dispatched & Approved</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full border border-slate-100">
                            <X className="w-3 h-3" />
                            <span>Declined</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* --- Subtab: Live Products Directory --- */}
        {activeSubTab === 'inventory' && (
          <div id="inventory-deck" className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Live Approved Inventory</h3>
              <p className="text-sm text-slate-500">
                Active catalog items displaying directly to guest customers on the live storefront, or created directly by you.
              </p>
            </div>

            {adminSuccessMsg && (
              <div id="admin-success-toast" className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 flex items-center gap-3 animate-fade-in shadow-sm">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-sm font-medium">{adminSuccessMsg}</span>
              </div>
            )}

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              
              {/* Form to directly add & upload product: 5 Cols */}
              <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Directly Add & Publish Product</h3>
                  <p className="text-xs text-slate-500">
                    Upload new items directly to the market. These go live immediately with no draft review stage required.
                  </p>
                </div>

                <form id="admin-add-product-form" onSubmit={handleAdminAddProduct} className="space-y-5">
                  <div>
                    <label htmlFor="admin-prod-name" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Product Title
                    </label>
                    <input
                      id="admin-prod-name"
                      type="text"
                      required
                      value={adminProdName}
                      onChange={(e) => setAdminProdName(e.target.value)}
                      placeholder="e.g. Designer Wool Coat"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-slate-50/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="admin-prod-price" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                        Retail Price ($)
                      </label>
                      <input
                        id="admin-prod-price"
                        type="number"
                        step="0.01"
                        required
                        value={adminProdPrice}
                        onChange={(e) => setAdminProdPrice(e.target.value)}
                        placeholder="e.g. 199.99"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-slate-50/50 font-mono"
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-prod-category" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                        Category
                      </label>
                      <select
                        id="admin-prod-category"
                        value={adminProdCategory}
                        onChange={(e) => setAdminProdCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-slate-50/50"
                      >
                        <option value="Fashion">Fashion</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Home & Kitchen">Home & Kitchen</option>
                        <option value="Health & Beauty">Health & Beauty</option>
                        <option value="Sports & Leisure">Sports & Leisure</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="admin-prod-desc" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Item Description
                    </label>
                    <textarea
                      id="admin-prod-desc"
                      rows={3}
                      required
                      value={adminProdDesc}
                      onChange={(e) => setAdminProdDesc(e.target.value)}
                      placeholder="Provide specs, fit details, or brand features..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-slate-50/50"
                    />
                  </div>

                  {/* Image Selection Presets */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Cover Photo Preset
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {IMAGE_PRESETS.map((preset) => (
                        <button
                          id={`admin-preset-img-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setAdminImageUrl(preset.url);
                            setAdminCustomImage('');
                          }}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                            adminImageUrl === preset.url && !adminCustomImage
                              ? 'border-indigo-600 ring-2 ring-indigo-100'
                              : 'border-transparent hover:border-slate-300'
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-[8px] text-white text-center py-0.5 font-medium truncate">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="admin-custom-image-url" className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          Or Paste Custom Image URL
                        </label>
                        {adminCustomImage && (
                          <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">Custom active</span>
                        )}
                      </div>
                      <input
                        id="admin-custom-image-url"
                        type="url"
                        value={adminCustomImage}
                        onChange={(e) => setAdminCustomImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <button
                    id="admin-submit-product-btn"
                    type="submit"
                    className="w-full py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload & Publish to Market</span>
                  </button>
                </form>
              </div>

              {/* List of live items: 7 Cols */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-800" />
                  <h4 className="font-bold text-slate-900 text-sm">Active Live Catalog ({liveProducts.length})</h4>
                </div>

                {liveProducts.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-12 bg-white rounded-3xl border border-dashed border-slate-100 p-6">
                    No active products. Use the left form or approve pending wholesaler drafts to publish live items.
                  </p>
                ) : (
                  <div id="inventory-table-container" className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold">
                          <th className="p-4">Item Details</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Supplier Source</th>
                          <th className="p-4 text-right">Selling Price</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {liveProducts.map((p) => (
                          <tr id={`inventory-row-${p.id}`} key={p.id} className="text-slate-700 hover:bg-slate-50/50 transition-all">
                            <td className="p-4">
                              <div className="flex gap-3 items-center">
                                <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-lg border shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate text-xs">{p.name}</div>
                                  <div className="font-mono text-[10px] text-slate-400">ID: {p.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-xs font-medium text-slate-600">
                              {p.category}
                            </td>
                            <td className="p-4 text-xs text-slate-500">
                              {p.wholesalerName ? (
                                <span className="font-semibold text-slate-700">{p.wholesalerName}</span>
                              ) : (
                                <span className="italic">In-house Catalog</span>
                              )}
                            </td>
                            <td className="p-4 text-right font-mono font-bold text-indigo-700 text-xs">
                              ${p.price.toFixed(2)}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                id={`btn-delete-live-${p.id}`}
                                onClick={() => onDeleteProduct(p.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove item from live display"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* --- Subtab: Wholesaler Codes (Code Generator and Manager) --- */}
        {activeSubTab === 'codes' && (
          <div id="codes-deck" className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">Wholesaler Login Access Codes</h3>
                <p className="text-sm text-slate-500">
                  Generate and distribute secure login authorization codes. Only wholesalers with active codes can log in and submit product catalogs.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-12 gap-6 items-start">
              {/* Generator Form */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm md:col-span-4 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Key className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-slate-900 text-sm">Code Generator Engine</h4>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const company = (target.elements.namedItem('companyName') as HTMLInputElement).value.trim();
                  const custom = (target.elements.namedItem('customCode') as HTMLInputElement).value.trim();
                  if (!company) return;
                  onCreateCode(company, custom || undefined);
                  target.reset();
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Wholesaler Brand / Company
                    </label>
                    <input
                      name="companyName"
                      type="text"
                      required
                      placeholder="e.g. Acme Electronics Inc"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Custom Access Code (Optional)
                    </label>
                    <input
                      name="customCode"
                      type="text"
                      placeholder="Leave empty to auto-generate"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs bg-slate-50/50 font-mono uppercase"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Auto-generated codes will be formatted like <strong>M2-WS-XXXX</strong>
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Generate Access Code</span>
                  </button>
                </form>
              </div>

              {/* Codes Directory */}
              <div className="md:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Active System Access Keys</span>
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                    {wholesalerCodes.length} Registered
                  </span>
                </div>

                {wholesalerCodes.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <Key className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold">No wholesaler login codes registered.</p>
                    <p className="text-[10px]">Generate a code on the left to allow partner logins.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/30 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                          <th className="p-4">Access Code</th>
                          <th className="p-4">Authorized Brand</th>
                          <th className="p-4">Created On</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {wholesalerCodes.map((c) => (
                          <tr key={c.code} className="text-slate-700 hover:bg-slate-50/30 text-xs transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <code className="bg-slate-100 hover:bg-slate-200 text-indigo-700 font-mono font-semibold px-2 py-1 rounded select-all cursor-pointer text-xs animate-pulse-once" title="Click to select">
                                  {c.code}
                                </code>
                                <CopyButton code={c.code} />
                              </div>
                            </td>
                            <td className="p-4 font-semibold text-slate-900">
                              {c.companyName}
                            </td>
                            <td className="p-4 text-slate-400 text-[11px]">
                              {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => onToggleCodeActive(c.code)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                  c.isActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                              >
                                {c.isActive ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => onDeleteCode(c.code)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Revoke code access"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer flex items-center justify-center"
      title="Copy access code to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 animate-scale-in" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}
