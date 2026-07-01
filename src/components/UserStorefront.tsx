import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Package, 
  ArrowRight,
  Info,
  RefreshCw
} from 'lucide-react';
import { Product, Order, OrderItem } from '../types';

interface UserStorefrontProps {
  products: Product[];
  orders: Order[];
  onBookOrder: (items: OrderItem[], name: string, phone: string) => void;
  defaultName?: string;
  defaultPhone?: string;
  onRefresh?: () => void;
}

export default function UserStorefront({ products, orders, onBookOrder, defaultName = '', defaultPhone = '', onRefresh }: UserStorefrontProps) {
  // Refresh feedback states
  const [isSpinning, setIsSpinning] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(false);

  const handleRefreshClick = () => {
    setIsSpinning(true);
    if (onRefresh) {
      onRefresh();
    }
    setSearchQuery('');
    setSelectedCategory('All');
    
    setTimeout(() => {
      setIsSpinning(false);
      setSyncFeedback(true);
      setTimeout(() => setSyncFeedback(false), 2000);
    }, 600);
  };

  // Storefront search & category states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Cart state
  const [cart, setCart] = useState<{ [id: string]: { product: Product; quantity: number } }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Booking details (prefill from guest session or defaults)
  const [bookingName, setBookingName] = useState(() => defaultName || sessionStorage.getItem('guest_name') || '');
  const [bookingPhone, setBookingPhone] = useState(() => defaultPhone || sessionStorage.getItem('guest_phone') || '');
  const [bookingMessage, setBookingMessage] = useState('');

  // Get active categories
  const categories = useMemo(() => {
    const cats = new Set(products.filter(p => p.isApproved).map(p => p.category));
    return ['All', ...Array.from(cats)];
  }, [products]);

  // Filter approved products only
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesApproval = product.isApproved;
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesApproval && matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart helper quantities
  const totalCartItems = useMemo(() => {
    const items = Object.values(cart) as Array<{ product: Product; quantity: number }>;
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const totalCartPrice = useMemo(() => {
    const items = Object.values(cart) as Array<{ product: Product; quantity: number }>;
    return items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }, [cart]);

  // Handle cart adjustments
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev[product.id];
      return {
        ...prev,
        [product.id]: {
          product,
          quantity: existing ? existing.quantity + 1 : 1
        }
      };
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      
      const nextQty = existing.quantity + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return {
        ...prev,
        [productId]: {
          ...existing,
          quantity: nextQty
        }
      };
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalCartItems === 0) return;
    if (!bookingName.trim()) {
      alert('Please enter your name to book the order.');
      return;
    }

    const items = Object.values(cart) as Array<{ product: Product; quantity: number }>;
    const orderItems: OrderItem[] = items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      priceAtOrder: item.product.price,
      image: item.product.image
    }));

    onBookOrder(orderItems, bookingName, bookingPhone);
    setCart({}); // clear cart
    setIsCartOpen(false);
    setBookingMessage('🎉 Your order was successfully booked! Admin will review it shortly.');
    setTimeout(() => setBookingMessage(''), 8000);
  };

  // Only show orders submitted during this session (simulating "My Orders")
  const myOrders = useMemo(() => {
    return orders.filter(
      (order) => order.customerName.toLowerCase() === bookingName.toLowerCase() || 
                 order.customerPhone === bookingPhone
    );
  }, [orders, bookingName, bookingPhone]);

  return (
    <div id="user-storefront-wrapper" className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Upper Promo Banner */}
      <div id="storefront-banner" className="bg-gradient-to-r from-indigo-950 to-indigo-900 text-white p-8 rounded-3xl mb-10 flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg shadow-indigo-100/50">
        <div className="space-y-2">
          <div className="inline-block bg-indigo-500/20 px-3 py-1 rounded-full text-indigo-300 font-semibold text-xs tracking-wider uppercase">
            Guest Shopper View
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Browse & Book Direct</h2>
          <p className="text-slate-200 text-sm max-w-xl">
            Welcome to the public retail deck. Add premium products to your cart and place a pending booking. Our administrators review and greenlight all order dispatches.
          </p>
        </div>
        <button
          id="trigger-cart-sidebar"
          onClick={() => setIsCartOpen(true)}
          className="bg-white hover:bg-slate-50 text-indigo-900 px-6 py-3.5 rounded-2xl font-semibold text-sm transition-all flex items-center gap-2.5 shadow-md relative shrink-0 cursor-pointer"
        >
          <ShoppingCart className="w-5 h-5 text-indigo-600" />
          <span>My Cart</span>
          {totalCartItems > 0 && (
            <span className="absolute -top-2.5 -right-2.5 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-md animate-pulse">
              {totalCartItems}
            </span>
          )}
        </button>
      </div>

      {bookingMessage && (
        <div id="booking-success-toast" className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl mb-8 text-emerald-800 flex items-center gap-3 animate-fade-in shadow-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{bookingMessage}</span>
        </div>
      )}

      {/* Main Grid Layout: Products Left, Cart Sidebar if open, History Bottom */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 9-Cols: Filters & Products */}
        <div className="lg:col-span-12 space-y-6">
          
          {/* Controls Bar */}
          <div id="storefront-controls" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between gap-4 items-center">
            
            {/* Search & Refresh Row */}
            <div className="flex items-center gap-3 w-full md:w-auto flex-grow max-w-lg">
              <div className="relative flex-grow">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  id="product-search-input"
                  type="text"
                  placeholder="Search products by name or info..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <button
                id="btn-refresh-storefront"
                onClick={handleRefreshClick}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-indigo-600 transition-all flex items-center justify-center cursor-pointer shadow-sm relative shrink-0"
                title="Refresh storefront products and orders"
              >
                <RefreshCw className={`w-5 h-5 ${isSpinning ? 'animate-spin text-indigo-600' : ''}`} />
                {syncFeedback && (
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow whitespace-nowrap z-50 animate-fade-in">
                    Refreshed!
                  </span>
                )}
              </button>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
              {categories.map((cat) => (
                <button
                  id={`cat-filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>

          {/* Products Bento-Grid */}
          {filteredProducts.length === 0 ? (
            <div id="no-products-view" className="bg-white text-center py-16 px-4 rounded-3xl border border-dashed border-slate-200 space-y-4">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Package className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-lg font-bold text-slate-900">No Approved Products Live</h3>
                <p className="text-sm text-slate-500">
                  There are either no products currently verified or your search/filter parameters returned no records.
                </p>
              </div>
            </div>
          ) : (
            <div id="products-grid" className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div 
                  id={`product-card-${product.id}`}
                  key={product.id} 
                  className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col group h-full"
                >
                  <div className="relative aspect-video bg-slate-100 overflow-hidden shrink-0">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-350"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-indigo-900 uppercase tracking-wider shadow-sm border border-slate-100">
                      {product.category}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col justify-between flex-grow space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {product.name}
                        </h4>
                        <span className="font-mono font-bold text-lg text-indigo-600 shrink-0">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                      <div className="text-[10px] text-slate-400">
                        {product.wholesalerName ? (
                          <span>Supply: <strong className="font-medium text-slate-600">{product.wholesalerName}</strong></span>
                        ) : (
                          <span>In-house Brand</span>
                        )}
                      </div>
                      
                      <button
                        id={`btn-add-cart-${product.id}`}
                        onClick={() => addToCart(product)}
                        className="bg-slate-50 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 p-2 rounded-xl transition-all font-semibold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-100"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add To Cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Floating Sliding Sidebar for Shopping Cart & Booking */}
      {isCartOpen && (
        <div id="cart-drawer-backdrop" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end">
          <div 
            id="cart-drawer-content" 
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in p-6 overflow-y-auto"
          >
            {/* Drawer Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-lg">My Cart</h3>
                <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold font-mono">
                  {totalCartItems}
                </span>
              </div>
              <button 
                id="close-cart-btn"
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-all"
              >
                Close
              </button>
            </div>

            {/* Cart Items List */}
            {totalCartItems === 0 ? (
              <div id="cart-empty-state" className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-700">Your cart is empty</p>
                  <p className="text-xs text-slate-400">Discover incredible products in our marketplace and add them to get started.</p>
                </div>
              </div>
            ) : (
              <div className="flex-grow overflow-y-auto space-y-4 pr-1">
                {Object.values(cart).map(({ product, quantity }) => (
                  <div 
                    id={`cart-item-${product.id}`}
                    key={product.id} 
                    className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 items-center justify-between"
                  >
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-cover rounded-lg shrink-0" 
                    />
                    
                    <div className="flex-grow min-w-0">
                      <h5 className="font-bold text-slate-900 text-xs truncate">{product.name}</h5>
                      <span className="font-mono text-[11px] text-slate-500">${product.price.toFixed(2)} each</span>
                    </div>

                    {/* Adjust Quantities */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        id={`cart-dec-${product.id}`}
                        onClick={() => updateQuantity(product.id, -1)}
                        className="p-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono font-bold text-sm text-slate-800 w-4 text-center">{quantity}</span>
                      <button 
                        id={`cart-inc-${product.id}`}
                        onClick={() => updateQuantity(product.id, 1)}
                        className="p-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      id={`cart-remove-${product.id}`}
                      onClick={() => removeFromCart(product.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Total price and Booking Form */}
            {totalCartItems > 0 && (
              <div className="border-t border-slate-100 pt-5 mt-5 space-y-5">
                <div className="flex justify-between items-center bg-indigo-50/50 p-3 rounded-xl">
                  <span className="text-sm font-semibold text-indigo-900">Total Order Value</span>
                  <span className="font-mono font-bold text-lg text-indigo-700">${totalCartPrice.toFixed(2)}</span>
                </div>

                <form id="booking-submit-form" onSubmit={handleCheckout} className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Book Order Details</h4>
                  
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Customer Name</label>
                    <input 
                      id="cart-customer-name"
                      type="text"
                      required
                      placeholder="Your name for the booking"
                      value={bookingName}
                      onChange={(e) => setBookingName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Contact Phone</label>
                    <input 
                      id="cart-customer-phone"
                      type="tel"
                      placeholder="Phone number"
                      value={bookingPhone}
                      onChange={(e) => setBookingPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <button
                    id="book-order-submit-btn"
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Submit Booking to Admin</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Bottom Segment: My Booked Orders History (Specific to current guest Name) */}
      <div id="my-orders-history" className="mt-14 pt-8 border-t border-slate-200/80">
        <div className="flex items-center gap-2.5 mb-6">
          <Package className="w-6 h-6 text-slate-800" />
          <h3 className="text-xl font-bold text-slate-900">My Booked Orders</h3>
          {bookingName && (
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-medium">
              Filter: {bookingName}
            </span>
          )}
        </div>

        {myOrders.length === 0 ? (
          <div id="no-orders-history" className="bg-slate-50 text-center py-10 px-4 rounded-2xl border border-slate-100 space-y-2">
            <Info className="w-5 h-5 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No bookings placed under this name yet.</p>
            <p className="text-xs text-slate-400">Put items in the cart and complete a booking to monitor admin responses.</p>
          </div>
        ) : (
          <div id="orders-list" className="space-y-4">
            {myOrders.map((order) => (
              <div 
                id={`order-status-card-${order.id}`}
                key={order.id} 
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-slate-900 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                      {order.id}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Booked {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Items Summary */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {order.items.map((item, index) => (
                      <span key={index} className="text-xs bg-slate-50 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-100">
                        {item.name} <strong className="font-semibold text-slate-800">x{item.quantity}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-50">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Value</div>
                    <div className="font-mono font-bold text-slate-800 text-base">${order.totalPrice.toFixed(2)}</div>
                  </div>

                  {/* Status Badges */}
                  <div>
                    {order.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-1.5 rounded-full font-semibold">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        <span>Awaiting Admin Dispatch Approval</span>
                      </span>
                    )}
                    {order.status === 'approved' && (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3 py-1.5 rounded-full font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Dispatched & Approved</span>
                      </span>
                    )}
                    {order.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-1.5 rounded-full font-semibold">
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Declined by Administration</span>
                      </span>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
