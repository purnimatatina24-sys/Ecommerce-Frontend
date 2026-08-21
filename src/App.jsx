import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'https://ecommerce-backend-zh5y.onrender.com';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showVipModal, setShowVipModal] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState('');

  // Coupon Form State
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponDiscountInput, setCouponDiscountInput] = useState('');
  const [couponDescInput, setCouponDescInput] = useState('');

  const [reviews, setReviews] = useState(() => {
    const savedReviews = localStorage.getItem('store_reviews');
    return savedReviews ? JSON.parse(savedReviews) : [];
  });

  useEffect(() => {
    localStorage.setItem('store_reviews', JSON.stringify(reviews));
  }, [reviews]);

  const [coupons, setCoupons] = useState(() => {
    const savedCoupons = localStorage.getItem('store_coupons');
    if (savedCoupons) {
      return JSON.parse(savedCoupons);
    }
    return [
      { id: 1, code: 'BLUSH20', discount: '20% OFF', description: 'Applicable on all cute accessories', status: 'Active 🌸' },
      { id: 2, code: 'KAWAII10', discount: '₹100 OFF', description: 'Save big on electronics', status: 'Active ✨' },
      { id: 3, code: 'FREESHIP', discount: 'Free Delivery', description: 'On orders above ₹500', status: 'Active 🎀' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('store_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error('Error fetching products:', err));

    fetch(`${API_BASE_URL}/api/orders`)
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.error('Error fetching orders:', err));
  }, []);

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, price, stock, image })
      });
      
      const savedProduct = await response.json();
      if (response.ok) {
        setProducts([...products, savedProduct]);
        setName(''); setCategory(''); setPrice(''); setStock(''); setImage('');
        alert('💖 Product saved permanently to your database!');
      }
    } catch (err) {
      console.error('Error saving product:', err);
    }
  };

  const handleAddCoupon = (e) => {
    e.preventDefault();
    if (!couponCodeInput || !couponDiscountInput) return;

    const newCoupon = {
      id: Date.now(),
      code: couponCodeInput.toUpperCase().trim(),
      discount: couponDiscountInput,
      description: couponDescInput || 'Special store discount 🎀',
      status: 'Active 🌸'
    };

    setCoupons([...coupons, newCoupon]);
    setCouponCodeInput('');
    setCouponDiscountInput('');
    setCouponDescInput('');
    alert('✨ New coupon created and saved successfully!');
  };

  const handleDeleteCoupon = (id) => {
    if (!window.confirm('Delete this coupon? 🥺')) return;
    setCoupons(coupons.filter(c => c.id !== id));
  };

  const handleBuyProduct = async (product) => {
    const customerName = prompt('Enter customer name for this order 🌸:', 'Lovely Shopper ✨');
    if (!customerName) return;

    let finalPrice = Number(product.price);
    
    const enteredCoupon = prompt('Got a coupon code? Type it here (or leave blank):', '');
    if (enteredCoupon) {
      const foundCoupon = coupons.find(c => c.code.toUpperCase() === enteredCoupon.toUpperCase().trim());
      if (foundCoupon) {
        if (foundCoupon.discount.includes('%')) {
          const percent = parseFloat(foundCoupon.discount);
          finalPrice = finalPrice - (finalPrice * (percent / 100));
          alert(`🎉 Coupon ${foundCoupon.code} applied! You got ${percent}% OFF.`);
        } else if (foundCoupon.discount.includes('₹')) {
          const amountOff = parseFloat(foundCoupon.discount.replace(/[^0-9.]/g, ''));
          finalPrice = Math.max(0, finalPrice - amountOff);
          alert(`🎉 Coupon ${foundCoupon.code} applied! You got ₹${amountOff} OFF.`);
        } else {
          alert(`🎉 Coupon ${foundCoupon.code} applied successfully!`);
        }
      } else {
        alert('⚠️ Invalid coupon code. Proceeding with regular price.');
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          total: Math.round(finalPrice * 100) / 100,
          status: 'Processing 🌸'
        })
      });

      const newOrder = await response.json();
      if (response.ok) {
        setOrders([...orders, newOrder]);
        alert(`🎉 Order placed successfully for ${product.name || product.title} at ₹${Math.round(finalPrice)}!`);
      }
    } catch (err) {
      console.error('Error placing order:', err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? 🥺')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setProducts(products.filter(p => (p.id || p._id) !== id));
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const handleUpdateStatus = async (orderId, currentStatus) => {
    let nextStatus = 'Processing 🌸';
    if (currentStatus === 'Processing 🌸') nextStatus = '📦 Shipped';
    else if (currentStatus === '📦 Shipped') nextStatus = '✨ Delivered';
    else nextStatus = 'Processing 🌸';

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });

      const updatedOrder = await response.json();
      if (response.ok) {
        setOrders(orders.map(o => (o.id || o._id) === orderId ? updatedOrder : o));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleAddReview = (order) => {
    const ratingNum = prompt('Rate your experience from 1 to 5 stars ⭐:', '5');
    if (!ratingNum) return;
    
    const comment = prompt('Write a sweet review comment 💖:', 'Absolute highest quality item!');
    if (!comment) return;

    const stars = '⭐'.repeat(Math.min(Math.max(parseInt(ratingNum) || 5, 1), 5));
    
    const newReview = {
      id: reviews.length + 1,
      product: 'Store Item',
      customer: order.customerName,
      rating: stars,
      comment: comment,
      date: new Date().toISOString().split('T')[0]
    };

    setReviews([newReview, ...reviews]);
    alert('✨ Thank you! Your verified review has been published to the Reviews tab.');
  };

  const uniqueCustomers = orders.reduce((acc, order) => {
    const existing = acc.find(c => c.name === order.customerName);
    if (existing) {
      existing.totalOrders += 1;
      existing.totalSpent += order.total;
    } else {
      acc.push({
        id: `CUST-0${acc.length + 1}`,
        name: order.customerName,
        totalOrders: 1,
        totalSpent: order.total
      });
    }
    return acc;
  }, []);

  const categoriesList = ['All', ...new Set(products.map(p => p.category || 'General'))];
  
  const searchedProducts = products.filter(p => {
    const productName = (p.name || p.title || '').toLowerCase();
    const productCategory = (p.category || 'general').toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch = productName.includes(query) || productCategory.includes(query);
    const matchesCategory = selectedCategory === 'All' || productCategory === selectedCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="cute-app-container">
      <div className="floating-sparkles-bg">
        <span>🌸</span><span>✨</span><span>🎀</span><span>🩰</span><span>🍓</span><span>🌷</span><span>🤍</span><span>✨</span>
      </div>

      <header className="cute-navbar">
        <div className="cute-brand-box" onClick={() => setActiveTab('dashboard')}>
          <span className="brand-icon">🩰</span>
          <h1>Blush & Bows <span className="sparkle-emoji">✨</span></h1>
        </div>

        <div className="cute-search-bar">
          <span>🔍</span>
          <input 
            type="text" 
            placeholder="Search lovely products, orders..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeTab !== 'products' && activeTab !== 'dashboard') {
                setActiveTab('products');
              }
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#ff3366' }}
            >
              ✕
            </button>
          )}
        </div>

        <div className="cute-nav-right">
          <div 
            className="cute-badge-pill vip-glow-btn" 
            onClick={() => setShowVipModal(true)}
            style={{ cursor: 'pointer' }}
          >
            🌸 Admin Suite
          </div>

          <div 
            className="cute-cart-bubble" 
            onClick={() => setActiveTab('orders')}
            style={{ cursor: 'pointer' }}
          >
            🛍️ Cart <b>{orders.length}</b>
          </div>
        </div>
      </header>

      <nav className="cute-subnav">
        <div className="subnav-title-tag">✨ Dreamy E-Commerce Suite</div>
        <div className="subnav-links-group">
          <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'tab-btn active' : 'tab-btn'}>📊 Dashboard</button>
          <button onClick={() => setActiveTab('products')} className={activeTab === 'products' ? 'tab-btn active' : 'tab-btn'}>🍓 Products</button>
          <button onClick={() => setActiveTab('orders')} className={activeTab === 'orders' ? 'tab-btn active' : 'tab-btn'}>📦 Orders</button>
          <button onClick={() => setActiveTab('customers')} className={activeTab === 'customers' ? 'tab-btn active' : 'tab-btn'}>🤍 Customers</button>
          <button onClick={() => setActiveTab('categories')} className={activeTab === 'categories' ? 'tab-btn active' : 'tab-btn'}>🏷️ Categories</button>
          <button onClick={() => setActiveTab('coupons')} className={activeTab === 'coupons' ? 'tab-btn active' : 'tab-btn'}>🎟️ Coupons</button>
          <button onClick={() => setActiveTab('reviews')} className={activeTab === 'reviews' ? 'tab-btn active' : 'tab-btn'}>⭐ Reviews</button>
          <button onClick={() => setActiveTab('reports')} className={activeTab === 'reports' ? 'tab-btn active' : 'tab-btn'}>📈 Reports</button>
        </div>
      </nav>

      {showVipModal && (
        <div className="vip-modal-backdrop" onClick={() => setShowVipModal(false)}>
          <div className="vip-modal-content" onClick={e => e.stopPropagation()}>
            <div className="vip-modal-header">
              <h2 style={{ color: '#2d3748' }}>👑 Admin VIP Suite</h2>
              <button className="vip-close-btn" onClick={() => setShowVipModal(false)}>✕</button>
            </div>
            <p className="vip-subtitle">Welcome back, Master Administrator! ✨ Here is your store overview:</p>
            <div className="vip-stats-grid">
              <div className="vip-stat-box">
                <span>Total Revenue</span>
                <h3>₹{totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="vip-stat-box">
                <span>Total Products</span>
                <h3>{products.length} Items</h3>
              </div>
              <div className="vip-stat-box">
                <span>Total Orders</span>
                <h3>{orders.length} Placed</h3>
              </div>
              <div className="vip-stat-box">
                <span>Active Coupons</span>
                <h3>{coupons.length} Active</h3>
              </div>
            </div>
            <button className="cute-submit-btn" style={{ width: '100%', marginTop: '20px' }} onClick={() => setShowVipModal(false)}>
              ✨ Continue Managing Store
            </button>
          </div>
        </div>
      )}

      <main className="cute-main-content">
        {activeTab === 'dashboard' && (
          <>
            <div className="hero-banner-box">
              <div className="hero-content">
                <span className="hero-badge">🌸 Special Season Event</span>
                <h2>Manage your magical store with absolute ease!</h2>
                <p>Track live inventory, delight customers, and watch your revenue sparkle.</p>
                <button className="hero-explore-btn" onClick={() => setActiveTab('products')}>
                  ✨ Explore Inventory
                </button>
              </div>
              <div className="hero-illustration">
                <span className="floating-gift">🎀</span>
                <span className="floating-cart">🛍️</span>
                <span className="floating-sparkle">✨</span>
              </div>
            </div>

            <div className="cute-metrics-grid">
              <div className="cute-metric-card pink-glow">
                <span>Total Revenue</span>
                <h2>₹{totalRevenue.toLocaleString()}</h2>
                <small className="sparkle-text">🌸 +16.3% growth this month</small>
              </div>
              <div className="cute-metric-card mint-glow">
                <span>Total Store Orders</span>
                <h2>{orders.length}</h2>
                <small className="sparkle-text">📦 Real-time synced</small>
              </div>
              <div className="cute-metric-card peach-glow">
                <span>Total Live Products</span>
                <h2>{products.length}</h2>
                <small className="sparkle-text">✨ Active database items</small>
              </div>
            </div>

            <div className="cute-card-box">
              <div className="box-header">
                <h3 style={{ color: '#2d3748' }}>🍓 Store Catalog & Instant Checkout</h3>
                <button className="cute-text-btn" onClick={() => setActiveTab('products')}>View All →</button>
              </div>
              <div className="cute-product-grid">
                {searchedProducts.map(p => {
                  const productId = p.id || p._id;
                  const productName = p.name || p.title || 'Untitled';
                  const productCategory = p.category || 'General';
                  return (
                    <div className="cute-product-card" key={productId}>
                      <div className="card-image-wrapper">
                        <img src={p.image} alt={productName} />
                        <div className="rating-pill">⭐ 4.8</div>
                      </div>
                      <div className="card-info">
                        <div className="card-title"><strong>{productCategory}:</strong> {productName}</div>
                        <div className="price-row">
                          <span className="discounted-price">₹{p.price}</span>
                        </div>
                      </div>
                      <div style={{ padding: '0 16px 16px 16px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleBuyProduct(p)} className="cute-submit-btn" style={{ flex: 1, padding: '8px' }}>
                          🛍️ Buy Now
                        </button>
                        <button onClick={() => handleDeleteProduct(productId)} className="card-delete-btn" style={{ margin: 0, padding: '8px' }}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="cute-card-box form-card-box">
              <h3 style={{ color: '#2d3748' }}>✨ Add New Product</h3>
              <form onSubmit={handleAddProduct} className="cute-form">
                <input type="text" placeholder="Title" value={name} onChange={e => setName(e.target.value)} required />
                <input type="text" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} required />
                <input type="number" placeholder="Price (₹)" value={price} onChange={e => setPrice(e.target.value)} required />
                <input type="number" placeholder="Stock" value={stock} onChange={e => setStock(e.target.value)} required />
                <input type="text" placeholder="Image URL" value={image} onChange={e => setImage(e.target.value)} />
                <button type="submit" className="cute-submit-btn">💖 Save</button>
              </form>
            </div>
          </>
        )}

        {activeTab === 'products' && (
          <div className="cute-card-box">
            <h2 style={{ color: '#2d3748' }}>🍓 Complete Product Catalog {searchQuery && `(Filtered by "${searchQuery}")`}</h2>
            <div className="cute-product-grid" style={{marginTop: '20px'}}>
              {searchedProducts.length === 0 ? (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#718096' }}>No products found matching "{searchQuery}" 🥺</p>
              ) : (
                searchedProducts.map(p => {
                  const productId = p.id || p._id;
                  const productName = p.name || p.title || 'Untitled';
                  const productCategory = p.category || 'General';
                  return (
                    <div className="cute-product-card" key={productId}>
                      <div className="card-image-wrapper">
                        <img src={p.image} alt={productName} />
                        <div className="rating-pill">⭐ 4.8</div>
                      </div>
                      <div className="card-info">
                        <div className="card-title"><strong>{productCategory}:</strong> {productName}</div>
                        <div className="price-row">
                          <span className="discounted-price">₹{p.price}</span>
                        </div>
                      </div>
                      <div style={{ padding: '0 16px 16px 16px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleBuyProduct(p)} className="cute-submit-btn" style={{ flex: 1, padding: '8px' }}>
                          🛍️ Buy Now
                        </button>
                        <button onClick={() => handleDeleteProduct(productId)} className="card-delete-btn" style={{ margin: 0, padding: '8px' }}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="cute-card-box">
            <h2 style={{ color: '#2d3748' }}>📦 Real Database Orders Tracker</h2>
            {orders.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>No orders placed yet! Click <b>"🛍️ Buy Now"</b> on any product.</p>
            ) : (
              <table className="cute-table" style={{marginTop: '10px'}}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Name</th>
                    <th>Total Amount</th>
                    <th>Status & Review Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => {
                    const orderId = o.id || o._id;
                    return (
                      <tr key={orderId}>
                        <td><code>{orderId.slice(0, 8)}...</code></td>
                        <td><strong>{o.customerName}</strong></td>
                        <td className="price-tag">₹{o.total}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span 
                              className="status-pill" 
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleUpdateStatus(orderId, o.status)}
                            >
                              {o.status} 🔄
                            </span>

                            {o.status === '✨ Delivered' && (
                              <button 
                                onClick={() => handleAddReview(o)}
                                style={{
                                  background: '#ff3366',
                                  color: 'white',
                                  border: 'none',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  fontWeight: 'bold'
                                }}
                              >
                                ⭐ Rate Item
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="cute-card-box">
            <h2 style={{ color: '#2d3748' }}>🏷️ Product Categories Directory</h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', marginTop: '15px', flexWrap: 'wrap' }}>
              {categoriesList.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)}
                  className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="cute-product-grid">
              {searchedProducts.map(p => {
                const productId = p.id || p._id;
                const productName = p.name || p.title || 'Untitled';
                const productCategory = p.category || 'General';
                return (
                  <div className="cute-product-card" key={productId}>
                    <div className="card-image-wrapper"><img src={p.image} alt={productName} /></div>
                    <div className="card-info">
                      <div className="card-title"><strong>{productCategory}:</strong> {productName}</div>
                      <span className="discounted-price">₹{p.price}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="cute-card-box">
            <h2 style={{ color: '#2d3748' }}>🤍 Real Customers Directory</h2>
            {uniqueCustomers.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>No customers yet. Place an order to see real customer data here!</p>
            ) : (
              <table className="cute-table" style={{marginTop: '10px'}}>
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Name</th>
                    <th>Total Orders</th>
                    <th>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueCustomers.map(c => (
                    <tr key={c.id}>
                      <td><code>{c.id}</code></td>
                      <td><strong>{c.name}</strong></td>
                      <td>{c.totalOrders}</td>
                      <td className="price-tag">₹{c.totalSpent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'coupons' && (
          <>
            <div className="cute-card-box">
              <h2 style={{ color: '#2d3748' }}>🎟️ Active Promotional Coupons</h2>
              <div className="cute-product-grid" style={{marginTop: '20px'}}>
                {coupons.map((coup) => (
                  <div className="cute-product-card" key={coup.id} style={{ padding: '20px', textAlign: 'center', background: '#fff0f3' }}>
                    <h3 style={{ color: '#ff3366', fontSize: '20px', marginBottom: '8px' }}><code>{coup.code}</code></h3>
                    <p style={{ fontWeight: 'bold', fontSize: '16px', color: '#059669' }}>{coup.discount}</p>
                    <p style={{ fontSize: '13px', color: '#718096', margin: '8px 0' }}>{coup.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                      <span className="status-pill">{coup.status}</span>
                      <button 
                        onClick={() => handleDeleteCoupon(coup.id)} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cute-card-box form-card-box" style={{marginTop: '25px'}}>
              <h3 style={{ color: '#2d3748' }}>✨ Create New Coupon</h3>
              <form onSubmit={handleAddCoupon} className="coupon-form">
                <input 
                  type="text" 
                  placeholder="Coupon Code (e.g. SUMMER50)" 
                  value={couponCodeInput} 
                  onChange={e => setCouponCodeInput(e.target.value)} 
                  required 
                />
                <input 
                  type="text" 
                  placeholder="Discount Value (e.g. 15% OFF)" 
                  value={couponDiscountInput} 
                  onChange={e => setCouponDiscountInput(e.target.value)} 
                  required 
                />
                <input 
                  type="text" 
                  placeholder="Description (e.g. Valid on all dresses)" 
                  value={couponDescInput} 
                  onChange={e => setCouponDescInput(e.target.value)} 
                />
                <button type="submit" className="cute-submit-btn">💖 Create Coupon</button>
              </form>
            </div>
          </>
        )}

        {activeTab === 'reviews' && (
          <div className="cute-card-box">
            <h2 style={{ color: '#2d3748' }}>⭐ Verified Customer Reviews</h2>
            {reviews.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>No reviews yet! Mark an order as delivered and click "Rate Item" to add one.</p>
            ) : (
              <table className="cute-table" style={{marginTop: '10px'}}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Customer</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.product}</strong></td>
                      <td>{r.customer}</td>
                      <td>{r.rating}</td>
                      <td><em>"{r.comment}"</em></td>
                      <td>{r.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="cute-card-box">
            <h2 style={{ color: '#2d3748' }}>📈 Business Analytics & Reports</h2>
            <div className="cute-metrics-grid" style={{marginTop: '20px'}}>
              <div className="cute-metric-card pink-glow">
                <span>Average Order Value</span>
                <h2>₹{orders.length ? Math.round(totalRevenue / orders.length) : 0}</h2>
                <small className="sparkle-text">📊 Per transaction average</small>
              </div>
              <div className="cute-metric-card mint-glow">
                <span>Store Conversion Rate</span>
                <h2>4.8%</h2>
                <small className="sparkle-text">📈 Visitor-to-buyer metric</small>
              </div>
              <div className="cute-metric-card peach-glow">
                <span>Active Inventory Value</span>
                <h2>₹{products.reduce((acc, p) => acc + (Number(p.price || 0) * Number(p.stock || 0)), 0).toLocaleString()}</h2>
                <small className="sparkle-text">📦 Total stock capital</small>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
