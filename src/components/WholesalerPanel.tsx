import React, { useState, useMemo, useRef } from 'react';
import { Store, Plus, Clock, CheckCircle, Package, ArrowUpRight, HelpCircle, Eye, AlertCircle, ShoppingBag, RefreshCw, Upload, ImagePlus } from 'lucide-react';
import { Product, WholesalerSession, Order, OrderItem } from '../types';
import UserStorefront from './UserStorefront';

interface WholesalerPanelProps {
  wholesaler: WholesalerSession;
  products: Product[];
  orders: Order[];
  onAddProduct: (product: Omit<Product, 'id' | 'isApproved' | 'createdAt'>) => void;
  onBookOrder: (items: OrderItem[], name: string, phone: string) => void;
  onRefresh?: () => void;
}

// Beautiful stock photo presets for easy listing
const IMAGE_PRESETS = [
  { name: 'Sleek Watch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80' },
  { name: 'Smart Wallet', url: 'https://images.unsplash.com/photo-1627124712831-f7209859f996?w=600&auto=format&fit=crop&q=80' },
  { name: 'Desk Lamp', url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80' },
  { name: 'Leather Shoes', url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80' }
];

export default function WholesalerPanel({ wholesaler, products, orders, onAddProduct, onBookOrder, onRefresh }: WholesalerPanelProps) {
  const [activeTab, setActiveTab] = useState<'supply' | 'market'>('supply');

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

  // Product creation form inputs
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Fashion');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(IMAGE_PRESETS[0].url);
  const [customImage, setCustomImage] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setCustomImage(base64String);
    };
    reader.readAsDataURL(file);
  };

  // Filter products matching current wholesaler company/session
  const myProducts = useMemo(() => {
    return products.filter((p) => p.wholesalerId === wholesaler.id);
  }, [products, wholesaler.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPrice = parseFloat(price);
    if (isNaN(finalPrice) || finalPrice <= 0) {
      alert('Please enter a valid listing price.');
      return;
    }

    const finalImage = customImage.trim() || imageUrl;

    onAddProduct({
      name: name.trim(),
      price: finalPrice,
      originalWholesalePrice: finalPrice, // Save as original wholesale suggestion
      description: description.trim(),
      category,
      image: finalImage,
      wholesalerId: wholesaler.id,
      wholesalerName: wholesaler.companyName
    });

    // Reset fields
    setName('');
    setPrice('');
    setDescription('');
    setCustomImage('');
    setSuccessMsg('🎉 Product successfully submitted for Admin price evaluation and live publication!');
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  return (
    <div id="wholesaler-panel-wrapper" className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      
      {/* Upper Brand Badge Banner */}
      <div id="wholesaler-banner" className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl shadow-sky-100/40">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-sky-100 font-bold text-xs tracking-wider uppercase font-brand">
            <Store className="w-3.5 h-3.5" />
            <span>Official Wholesale Partner</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight font-brand">Welcome, {wholesaler.name}</h2>
          <p className="text-slate-100 text-sm max-w-xl">
            Representing <strong className="text-white underline decoration-sky-300 font-bold">{wholesaler.companyName}</strong>. Add your wholesale batch and monitor pricing valuations.
          </p>
        </div>

        {/* Rapid Stats & Refresh */}
        <div className="flex items-center gap-4">
          <div className="bg-white/15 border border-white/10 p-4 rounded-2xl text-center shrink-0 min-w-28">
            <div className="text-[10px] text-sky-100 uppercase tracking-widest font-bold">Total Listed</div>
            <div className="font-mono text-xl font-bold mt-1 text-white">{myProducts.length}</div>
          </div>
          <div className="bg-white/15 border border-white/10 p-4 rounded-2xl text-center shrink-0 min-w-28">
            <div className="text-[10px] text-sky-100 uppercase tracking-widest font-bold">Live Approved</div>
            <div className="font-mono text-xl font-bold text-emerald-300 mt-1">
              {myProducts.filter(p => p.isApproved).length}
            </div>
          </div>

          <button
            id="btn-refresh-wholesaler"
            onClick={handleRefreshClick}
            className="p-3.5 rounded-2xl border border-white/15 bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center cursor-pointer shadow-sm relative shrink-0 self-stretch"
            title="Sync Wholesaler Console"
          >
            <RefreshCw className={`w-5 h-5 ${isSpinning ? 'animate-spin text-sky-200' : ''}`} />
            {syncFeedback && (
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow whitespace-nowrap z-50 animate-fade-in">
                Synced!
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div id="wholesaler-navigation-subtabs" className="flex border-b border-slate-200 overflow-x-auto gap-2">
        <button
          id="wholesaler-tab-supply"
          onClick={() => setActiveTab('supply')}
          className={`py-3 px-5 font-bold text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 -mb-px ${
            activeTab === 'supply'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>My Supply Console</span>
        </button>

        <button
          id="wholesaler-tab-market"
          onClick={() => setActiveTab('market')}
          className={`py-3 px-5 font-bold text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 -mb-px ${
            activeTab === 'market'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Browse & Buy Market</span>
          <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Live Shop
          </span>
        </button>
      </div>

      {activeTab === 'supply' ? (
        <div id="wholesaler-supply-deck" className="space-y-10 animate-fade-in">
          {successMsg && (
            <div id="wholesaler-success-toast" className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 flex items-center gap-3 shadow-sm">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-sm font-medium">{successMsg}</span>
            </div>
          )}

          {/* Main Grid: Form Left, Product States Right */}
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Form to List Product: 5 Cols */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Add Wholesale Product</h3>
                <p className="text-xs text-slate-500">
                  Submit supply items. Product goes live immediately upon admin approval.
                </p>
              </div>

              <form id="wholesaler-add-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="prod-name" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Product Title
                  </label>
                  <input
                    id="prod-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ergonomic Office Chair"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 text-sm bg-slate-50/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="prod-price" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Requested Price ($)
                    </label>
                    <input
                      id="prod-price"
                      type="number"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 149.99"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 text-sm bg-slate-50/50 font-mono"
                    />
                  </div>

                  <div>
                    <label htmlFor="prod-category" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <select
                      id="prod-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 text-sm bg-slate-50/50"
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
                  <label htmlFor="prod-desc" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Item Description
                  </label>
                  <textarea
                    id="prod-desc"
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe material quality, warranty, packaging details..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 text-sm bg-slate-50/50"
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
                        id={`preset-img-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setImageUrl(preset.url);
                          setCustomImage('');
                        }}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                          imageUrl === preset.url && !customImage
                            ? 'border-sky-500 ring-2 ring-sky-100'
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

                  {/* File Upload / Image Selector */}
                  <div className="pt-2 space-y-2">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Or Upload Device Image
                    </label>
                    <div 
                      id="wholesaler-file-upload-zone"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-sky-500 rounded-xl p-4 text-center cursor-pointer hover:bg-sky-50/30 transition-all flex flex-col items-center justify-center gap-1.5"
                    >
                      <input 
                        id="wholesaler-image-file-input"
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      {customImage && customImage.startsWith('data:image') ? (
                        <div className="relative flex flex-col items-center gap-1">
                          <img src={customImage} alt="Uploaded preview" className="w-20 h-20 object-cover rounded-lg border shadow-sm" />
                          <span className="text-[10px] text-slate-500">Click to replace file</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="w-5 h-5 text-sky-500 mb-1" />
                          <span className="text-xs text-sky-600 font-bold font-brand">Click to upload image file</span>
                          <span className="text-[9px] text-slate-400">Supports PNG, JPG, WebP</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-1">
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="custom-image-url" className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          Or Paste Custom Image URL
                        </label>
                        {customImage && !customImage.startsWith('data:image') && (
                          <span className="text-[9px] text-sky-600 font-bold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">URL Active</span>
                        )}
                      </div>
                      <input
                        id="custom-image-url"
                        type="url"
                        value={customImage.startsWith('data:image') ? '' : customImage}
                        onChange={(e) => setCustomImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 text-xs bg-slate-50/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100/30 flex gap-2.5">
                  <AlertCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <p className="text-[10.5px] text-slate-600 leading-relaxed font-semibold">
                    Admin review required before the item goes to live market view. Admin holds authority to adjust list prices.
                  </p>
                </div>

                <button
                  id="wholesaler-submit-product-btn"
                  type="submit"
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all transform active:scale-[0.99] shadow-lg shadow-indigo-100 flex items-center justify-center gap-1.5 cursor-pointer font-brand"
                >
                  <Plus className="w-4 h-4" />
                  <span>Submit Batch Supply</span>
                </button>
              </form>
            </div>

            {/* List of listed products: 7 Cols */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-800" />
                <h3 className="text-lg font-bold text-slate-900">Listed Supply Batches</h3>
                <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-bold font-mono">
                  {myProducts.length}
                </span>
              </div>

              {myProducts.length === 0 ? (
                <div id="no-wholesaler-products" className="bg-white text-center py-20 px-4 rounded-3xl border border-dashed border-slate-200 space-y-3">
                  <Store className="w-10 h-10 text-slate-300 mx-auto animate-pulse" />
                  <p className="text-sm font-bold text-slate-700">No products listed by {wholesaler.companyName}</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Use the left form to add your stock. Listed items are held securely in draft pipeline awaiting administrator clearance.
                  </p>
                </div>
              ) : (
                <div id="wholesaler-product-list" className="space-y-4">
                  {myProducts.map((product) => (
                    <div 
                      id={`wholesaler-product-item-${product.id}`}
                      key={product.id} 
                      className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-start sm:items-center gap-4"
                    >
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 object-cover rounded-xl border border-slate-100 shrink-0" 
                      />

                      <div className="flex-grow min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{product.name}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                            {product.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500 font-medium">Proposed price:</span>
                          <strong className="font-mono text-slate-700">${product.originalWholesalePrice?.toFixed(2) || product.price.toFixed(2)}</strong>
                          
                          {/* Price adjustment indicator */}
                          {product.isApproved && product.originalWholesalePrice && product.price !== product.originalWholesalePrice && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-100">
                              Adjusted by Admin to <strong className="font-mono text-indigo-700">${product.price.toFixed(2)}</strong>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 font-mono">ID: {product.id}</p>
                      </div>

                      <div className="shrink-0 pt-1 sm:pt-0">
                        {product.isApproved ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-emerald-100">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Live in Mall</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-amber-100">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Awaiting Live Approval</span>
                          </span>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>
        </div>
      ) : (
        <div id="wholesaler-market-deck" className="animate-fade-in bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100/30 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-sky-600 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-800 text-sm font-brand">Wholesaler Partner Live Market View</h4>
                <p className="text-xs text-slate-500 leading-normal">
                  You are browsing the live marketplace. Feel free to place orders. They will be registered under your business brand.
                </p>
              </div>
            </div>
            <div className="text-right text-xs bg-white py-1 px-3 rounded-xl border border-indigo-100 font-medium text-slate-600">
              Purchasing as: <strong className="text-indigo-700">{wholesaler.companyName}</strong>
            </div>
          </div>

          <UserStorefront 
            products={products}
            orders={orders}
            onBookOrder={onBookOrder}
            defaultName={wholesaler.companyName}
            defaultPhone={wholesaler.loginCode}
          />
        </div>
      )}

    </div>
  );
}
