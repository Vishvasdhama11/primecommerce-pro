import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Package,
  Check,
  Zap,
  Tag,
  Star
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { MyOrdersModal } from './components/MyOrdersModal';
import { WishlistModal } from './components/WishlistModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AdminPanel } from './components/AdminPanel';
import { InvoiceModal } from './components/InvoiceModal';
import {
  User,
  Product,
  Category,
  Brand,
  CartItem,
  Address,
  Order,
  ProductVariant,
  Review
} from './types';

export default function App() {
  // Authentication & User State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('nexus_token'));

  // Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState(400000);
  const [minRatingFilter, setMinRatingFilter] = useState(0);
  const [sortBy, setSortBy] = useState('newest');

  // User Local Collections
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  // Modals Visibility
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductReviews, setSelectedProductReviews] = useState<Review[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [profileOpen, setProfileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Toast message
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Fetch Auth State
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            localStorage.removeItem('nexus_token');
            setToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('nexus_token');
          setToken(null);
        });
    }
  }, [token]);

  // 2. Fetch Initial Categories & Brands
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => d.success && setCategories(d.categories));

    fetch('/api/brands')
      .then((r) => r.json())
      .then((d) => d.success && setBrands(d.brands));
  }, []);

  useEffect(() => {
    if (!token || user?.role !== 'ADMIN') {
      setBanners([]);
      return;
    }

    fetch('/api/admin/banners', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setBanners(d.banners);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch admin banners:', err);
      });
  }, [token, user]);

  // 3. Fetch Products with Active Filters
  const fetchProducts = () => {
    setLoadingProducts(true);
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (selectedCategory) params.append('category', selectedCategory);
    if (selectedBrand) params.append('brand', selectedBrand);
    if (maxPriceFilter < 400000) params.append('maxPrice', String(maxPriceFilter));
    if (minRatingFilter > 0) params.append('minRating', String(minRatingFilter));
    if (sortBy) params.append('sortBy', sortBy);

    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.products);
        }
      })
      .finally(() => setLoadingProducts(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory, selectedBrand, maxPriceFilter, minRatingFilter, sortBy]);

  // 4. Fetch User Specific Data (Cart, Wishlist, Addresses, Orders)
  const fetchUserData = () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    // Cart
    fetch('/api/user/cart', { headers })
      .then((r) => r.json())
      .then((d) => d.success && setCartItems(d.items));

    // Wishlist
    fetch('/api/user/wishlist', { headers })
      .then((r) => r.json())
      .then((d) => d.success && setWishlistIds(d.wishlist.map((p: Product) => p.id)));

    // Addresses
    fetch('/api/user/addresses', { headers })
      .then((r) => r.json())
      .then((d) => d.success && setUserAddresses(d.addresses));

    // Orders
    fetch('/api/orders/my', { headers })
      .then((r) => r.json())
      .then((d) => d.success && setUserOrders(d.orders));
  };

  useEffect(() => {
    if (user && token) {
      fetchUserData();
    } else {
      setCartItems([]);
      setWishlistIds([]);
      setUserAddresses([]);
      setUserOrders([]);
    }
  }, [user, token]);

  // Auth Operations
  const handleLogin = async (email: string, pass: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    }).then((r) => r.json());

    if (res.success && res.token) {
      localStorage.setItem('nexus_token', res.token);
      setToken(res.token);
      setUser(res.user);
      showToast(`Welcome back, ${res.user.name}!`);
    }
    return res;
  };

  const handleRegister = async (data: { name: string; email: string; password: string; phone?: string }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then((r) => r.json());

    if (res.success && res.token) {
      localStorage.setItem('nexus_token', res.token);
      setToken(res.token);
      setUser(res.user);
      showToast(`Account created successfully!`);
    }
    return res;
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_token');
    setToken(null);
    setUser(null);
    setProfileOpen(false);
    showToast('Logged out successfully.');
  };

  // Profile & Address Operations
  const handleUpdateProfile = async (updated: { name?: string; phone?: string; avatar?: string }) => {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      }).then((r) => r.json());

      if (res.success && res.user) {
        setUser(res.user);
        return true;
      }
    } catch (err) {}
    return false;
  };

  const handleAddAddress = async (addr: Partial<Address>) => {
    try {
      const res = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(addr)
      }).then((r) => r.json());

      if (res.success) {
        fetchUserData();
        return true;
      }
    } catch (err) {}
    return false;
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/user/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }).then((r) => r.json());

      if (res.success) {
        fetchUserData();
        return true;
      }
    } catch (err) {}
    return false;
  };

  // Cart Operations
  const handleAddToCart = async (product: Product, quantity = 1, selectedVariant?: ProductVariant) => {
    if (!user) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/user/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          variantId: selectedVariant?.id
        })
      }).then((r) => r.json());

      if (res.success) {
        showToast(`Added '${product.title}' to cart!`);
        fetchUserData();
      }
    } catch (err) {
      showToast('Failed to add item to cart.');
    }
  };

  const handleUpdateCartQuantity = async (productId: string, quantity: number, variantId?: string) => {
    if (!token) return;
    await fetch('/api/user/cart/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ productId, quantity, variantId })
    });
    fetchUserData();
  };

  const handleRemoveCartItem = async (productId: string, variantId?: string) => {
    if (!token) return;
    await fetch('/api/user/cart/remove', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ productId, variantId })
    });
    fetchUserData();
  };

  // Wishlist Toggle
  const handleToggleWishlist = async (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }

    const res = await fetch('/api/user/wishlist/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ productId: product.id })
    }).then((r) => r.json());

    if (res.success) {
      showToast(res.message);
      fetchUserData();
    }
  };

  // Select Product Modal
  const handleSelectProduct = async (product: Product) => {
    setSelectedProduct(product);
    const res = await fetch(`/api/products/${product.id}`).then((r) => r.json());
    if (res.success) {
      setSelectedProductReviews(res.reviews || []);
    }
  };

  const handleSubmitReview = async (productId: string, rating: number, comment: string) => {
    if (!token) return;
    const res = await fetch('/api/user/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ productId, rating, comment })
    }).then((r) => r.json());

    if (res.success) {
      showToast('Review submitted successfully!');
      if (selectedProduct) handleSelectProduct(selectedProduct);
    }
  };

  // Checkout & Order Operations
  const handleSaveAddress = async (addrData: Omit<Address, 'id' | 'userId'>) => {
    const res = await fetch('/api/user/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(addrData)
    }).then((r) => r.json());

    fetchUserData();
    return res.address;
  };

  const handleCreateOrder = async (orderData: any) => {
    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    }).then((r) => r.json());

    if (!res.success) {
      alert(res.message);
      return null;
    }
    return res.order;
  };

  const handleVerifyPayment = async (paymentDetails: any) => {
    const res = await fetch('/api/razorpay/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(paymentDetails)
    }).then((r) => r.json());

    return res.success;
  };

  const handleOrderSuccess = (order: Order) => {
    setCheckoutOpen(false);
    fetchUserData();
    setInvoiceOrder(order);
    showToast(`Order #${order.id} placed successfully!`);
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reason })
    }).then((r) => r.json());

    if (res.success) {
      showToast('Order cancelled successfully.');
      fetchUserData();
    } else {
      alert(res.message);
    }
  };

  const handleRequestReturn = async (orderId: string, reason: string) => {
    const res = await fetch(`/api/orders/${orderId}/return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reason })
    }).then((r) => r.json());

    if (res.success) {
      showToast('Return request submitted.');
      fetchUserData();
    } else {
      alert(res.message);
    }
  };

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col justify-between">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-indigo-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      {/* Main Navbar Header */}
      <Navbar
        user={user}
        cartCount={cartItems.length}
        wishlistCount={wishlistIds.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        onOpenAuth={(m) => {
          setAuthMode(m || 'login');
          setAuthOpen(true);
        }}
        onOpenCart={() => setCartDrawerOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenOrders={() => setOrdersOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 flex-1 w-full">
        
        {/* Hero Promotion Banner */}
        {!searchQuery && !selectedCategory && banners.length > 0 && (
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 items-center p-8 sm:p-12 gap-8">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Flagship Launch 2026
                </span>
                <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                  {banners[0].title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
                  {banners[0].subtitle}
                </p>
                <button
                  onClick={() => {
                    const found = products.find((p) => p.id === 'prod_1');
                    if (found) handleSelectProduct(found);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/30 text-xs flex items-center gap-2 transition-all"
                >
                  {banners[0].buttonText} <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="relative aspect-video sm:aspect-square rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                <img
                  src={banners[0].imageUrl}
                  alt="Hero Banner"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" /> Filter Catalog:
            </span>

            {/* Brand Filter */}
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 font-semibold px-3 py-1.5 rounded-xl focus:outline-none"
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>

            {/* Price Filter */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 border border-slate-800 rounded-xl">
              <span className="text-slate-400 font-semibold">Max:</span>
              <span className="text-white font-bold">₹{maxPriceFilter.toLocaleString('en-IN')}</span>
              <input
                type="range"
                min="5000"
                max="400000"
                step="5000"
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                className="w-24 accent-indigo-500"
              />
            </div>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 font-semibold px-3 py-1.5 rounded-xl focus:outline-none"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="discount">Biggest Discount</option>
            </select>
          </div>
        </div>

        {/* Product Catalog Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>{selectedCategory ? categories.find(c => c.slug === selectedCategory)?.name || selectedCategory : 'Featured Products'}</span>
              <span className="text-xs bg-slate-800 text-slate-300 font-bold px-2.5 py-0.5 rounded-full">
                {products.length} Items
              </span>
            </h2>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="h-72 bg-slate-900 border border-slate-800 rounded-2xl"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
              <Package className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-200">No products match your filter criteria.</h3>
              <p className="text-xs text-slate-400">Try adjusting your price slider or clearing search keywords.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                  setSelectedBrand('');
                  setMaxPriceFilter(400000);
                }}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isInWishlist={wishlistIds.includes(product.id)}
                  onSelect={handleSelectProduct}
                  onAddToCart={(p, e) => {
                    e.stopPropagation();
                    handleAddToCart(p);
                  }}
                  onToggleWishlist={handleToggleWishlist}
                />
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Footer */}
      <Footer />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        reviews={selectedProductReviews}
        isInWishlist={selectedProduct ? wishlistIds.includes(selectedProduct.id) : false}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p, q, v) => {
          handleAddToCart(p, q, v);
          setSelectedProduct(null);
        }}
        onBuyNow={(p, q, v) => {
          handleAddToCart(p, q, v);
          setSelectedProduct(null);
          setCartDrawerOpen(true);
        }}
        onToggleWishlist={handleToggleWishlist}
        onSubmitReview={handleSubmitReview}
        userLoggedIn={Boolean(user)}
        onOpenAuth={() => {
          setSelectedProduct(null);
          setAuthMode('login');
          setAuthOpen(true);
        }}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={(couponCode, discount) => {
          setCheckoutOpen(true);
        }}
        onApplyCoupon={async (code, cartAmount) => {
          const res = await fetch('/api/user/coupons/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, cartAmount })
          }).then((r) => r.json());

          return {
            success: res.success,
            discountAmount: res.discountAmount,
            message: res.message
          };
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cartItems={cartItems}
        addresses={userAddresses}
        onSaveAddress={handleSaveAddress}
        onCreateOrder={handleCreateOrder}
        onVerifyPayment={handleVerifyPayment}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* My Orders Modal */}
      <MyOrdersModal
        isOpen={ordersOpen}
        onClose={() => setOrdersOpen(false)}
        orders={userOrders}
        onCancelOrder={handleCancelOrder}
        onRequestReturn={handleRequestReturn}
        onViewInvoice={(order) => setInvoiceOrder(order)}
      />

      {/* Wishlist Modal */}
      <WishlistModal
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        products={wishlistProducts}
        onMoveToCart={(p) => {
          handleAddToCart(p);
          handleToggleWishlist(p);
        }}
        onRemoveFromWishlist={handleToggleWishlist}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onGoogleLogin={async (data) => {
          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }).then((r) => r.json());

          if (res.success && res.token) {
            localStorage.setItem('nexus_token', res.token);
            setToken(res.token);
            setUser(res.user);
            showToast(`Welcome ${res.user.name}!`);
            setAuthOpen(false);
          }
          return res;
        }}
        onSendOTP={async (phoneOrEmail) => {
          return await fetch('/api/auth/otp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneOrEmail })
          }).then((r) => r.json());
        }}
        onVerifyOTP={async (phoneOrEmail, otp) => {
          const res = await fetch('/api/auth/otp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneOrEmail, otp })
          }).then((r) => r.json());

          if (res.success && res.token) {
            localStorage.setItem('nexus_token', res.token);
            setToken(res.token);
            setUser(res.user);
            showToast(`Welcome! Verified via OTP.`);
          }
          return res;
        }}
        onForgotPassword={async (phoneOrEmail) => {
          return await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneOrEmail, email: phoneOrEmail })
          }).then((r) => r.json());
        }}
        onResetPassword={async (phoneOrEmail, otp, newPassword) => {
          return await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneOrEmail, email: phoneOrEmail, otp, newPassword })
          }).then((r) => r.json());
        }}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileOpen}
        user={user}
        userAddresses={userAddresses}
        onClose={() => setProfileOpen(false)}
        onUpdateProfile={handleUpdateProfile}
        onAddAddress={handleAddAddress}
        onDeleteAddress={handleDeleteAddress}
        onOpenOrders={() => setOrdersOpen(true)}
        onLogout={handleLogout}
        showToast={showToast}
        token={token}
      />

      {/* Admin Operations Modal */}
      <AdminPanel
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        onRefreshData={fetchProducts}
      />

      {/* Tax Invoice Modal */}
      <InvoiceModal
        order={invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
      />

    </div>
  );
}
