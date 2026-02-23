"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { post, API } from "../../lib/api";
import { getSession } from "../../lib/session";
import Navbar from "../components/Navbar"; 

export default function CheckoutPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [waSessionId, setWaSessionId] = useState<string | null>(null);
  
  const [items, setItems] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState(null);

  // 🟢 States for the Product Details Modal
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");

  // 1. Financial & Tier Logic
  const GST_RATE = 0.10; 
  const gstAmount = Math.round(subtotal * GST_RATE);
  
  let tier = "";
  let tierDiscount = 0;
  let tierColor = "#64748b";

  if (items.length > 0) {
    if (subtotal < 2000) {
      tier = "Bronze";
      tierDiscount = 0;
      tierColor = "#cd7f32";
    } else if (subtotal >= 2000 && subtotal < 5000) {
      tier = "Silver";
      tierDiscount = 200;
      tierColor = "#94a3b8";
    } else if (subtotal >= 5000) {
      tier = "Gold";
      tierDiscount = 500;
      tierColor = "#eab308";
    }
  }

  const TOTAL = subtotal + gstAmount - tierDiscount;

  useEffect(() => {
    getSession("mobile").then(async (sid) => {
      setSessionId(sid);
      fetchCart(sid);
    });
    getSession("whatsapp").then(sid => {
      setWaSessionId(sid);
    });
  }, []);

  async function fetchCart(sid: string) {
    try {
      const res = await fetch(`${API}/cart?sessionId=${sid}`);
      const data = await res.json();
      const cartItems = data.items || [];
      
      // Group Identical Items (Same Name & Size)
      const groupedItems = cartItems.reduce((acc: any, currentItem: any) => {
          if (!currentItem || !currentItem.name) return acc;
          
          // Ensure size is never empty/null in the logic
          const sizeKey = (currentItem.size && currentItem.size.trim() !== '' && currentItem.size !== 'null') ? currentItem.size : 'Universal';
          const uniqueKey = `${currentItem.variant_id}_${sizeKey}`;

          if (!acc[uniqueKey]) {
              acc[uniqueKey] = { ...currentItem, size: sizeKey, quantity: currentItem.quantity || 1 };
          } else {
              acc[uniqueKey].quantity += (currentItem.quantity || 1);
          }
          return acc;
      }, {});

      const consolidatedList = Object.values(groupedItems) as any[];
      setItems(consolidatedList);
      setSubtotal(consolidatedList.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0));
      
      if (consolidatedList.length > 0) {
          fetchRecommendations(consolidatedList);
      } else {
          setRecommendations([]);
      }
    } catch (e) { console.error("Cart Error", e); }
  }

  // Cross-Sell Recommendations
  async function fetchRecommendations(currentItems: any[]) {
      try {
          const names = currentItems.map(i => i.name.toLowerCase());
          let crossSellQuery = "";
          
          if (names.some(n => n.includes("blazer") || n.includes("suit") || n.includes("formal"))) {
              crossSellQuery = "formal shirt";
          } else if (names.some(n => n.includes("jeans") || n.includes("pant"))) {
              crossSellQuery = "tshirt";
          } else if (names.some(n => n.includes("shirt") || n.includes("tshirt"))) {
              crossSellQuery = "jeans";
          } else {
              crossSellQuery = "trending";
          }

          const res = await post("/chat/message", { 
              sessionId: "00000000-0000-0000-0000-000000000000", 
              message: `Find ${crossSellQuery} under 3000` 
          });
          
          if (res.products && res.products.length > 0) {
              setRecommendations(res.products.slice(0, 3)); 
          }
      } catch (e) {
          console.error("Recommender Error", e);
      }
  }

  async function updateQuantity(variantId: number, size: string, delta: number) {
    if (!sessionId) return;
    try {
        const item = items.find(i => i.variant_id === variantId && i.size === size);
        if (item && item.quantity === 1 && delta === -1) {
            handleRemoveItem(variantId, size);
            return;
        }
        await post("/cart/add", { sessionId, variantId, size, quantity: delta });
        fetchCart(sessionId);
    } catch (e) { console.error("Qty Update Error", e); }
  }

  async function handleRemoveItem(variantId: number, size: string) {
    if (!sessionId) return;
    try {
      const res = await post("/cart/remove", { sessionId, variantId, size });
      if (res.success) { fetchCart(sessionId); }
    } catch (e) { alert("Failed to remove"); }
  }

  // 🟢 OPEN DETAILS MODAL (MOBILE UI STYLE)
  const openProductDetails = (product: any) => {
      setSelectedProduct(product);
      
      let parsedSizes = [];
      try {
          parsedSizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
      } catch (e) { parsedSizes = []; }
      
      if (parsedSizes && parsedSizes.length > 0 && parsedSizes[0] !== 'Universal') {
          setSelectedSize(parsedSizes[0]); // Select first size by default
      } else {
          setSelectedSize("Universal");
      }
  };

  // 🟢 ADD TO CART FROM MODAL
  const handleModalAddToCart = async () => {
      if (!sessionId || !selectedProduct) return;
      
      let parsedSizes = [];
      try {
          parsedSizes = typeof selectedProduct.sizes === 'string' ? JSON.parse(selectedProduct.sizes) : selectedProduct.sizes;
      } catch (e) { parsedSizes = []; }
      
      const hasSizes = parsedSizes && parsedSizes.length > 0 && parsedSizes[0] !== 'Universal';

      if (hasSizes && (!selectedSize || selectedSize === 'Universal')) {
          alert("Please select a size first!");
          return;
      }

      try {
          await post("/cart/add", { 
              sessionId, 
              variantId: selectedProduct.variant_id, 
              size: selectedSize || "Universal", 
              quantity: 1 
          });
          fetchCart(sessionId);
          setSelectedProduct(null); // Close modal
      } catch (e) {
          console.error(e);
      }
  };

  async function handlePlaceOrder() {
    if (!sessionId || items.length === 0) return;
    try {
      const res = await post("/orders", { 
          sessionId, 
          waSessionId, 
          paymentMethod: "COD", 
          totalAmount: TOTAL 
      });
      
      if (res.success) {
        setPlacedOrderId(res.orderId);
        setIsSuccess(true);
        setTimeout(() => { router.push("/orders"); }, 3000); 
      }
    } catch (err) { alert("Order failed."); }
  }

  if (isSuccess) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', textAlign: 'center', maxWidth: '400px', width: '90%' }}>
          <div style={{ fontSize: '60px', marginBottom: '10px' }}>🎉</div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669', marginBottom: '10px' }}>Order Placed!</h2>
          <p style={{ color: '#4b5563', marginBottom: '20px' }}>Order #{String(placedOrderId).slice(0,8)}</p>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>Routing to timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar mode="mobile" showBack />
      <div style={{ padding: '40px 20px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 60px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', fontFamily: 'Segoe UI, sans-serif' }}>
        
        <div style={{ maxWidth: '1200px', width: '100%', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px' }}>
          
          {/* LEFT COLUMN: Cart & Recommendations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
               <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <span style={{ fontSize: '20px' }}>🛒</span> Your Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
               </h2>

               {items.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '40px 0' }}>
                   <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '20px' }}>Your cart is empty</p>
                   <button 
                      onClick={() => router.push("/mobile")} 
                      style={{ backgroundColor: '#0f172a', color: '#fff', padding: '14px 28px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    >
                      Continue Shopping
                    </button>
                 </div>
               ) : (
                 <>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                     {items.map((item, index) => {
                       const uniqueKey = `${item.variant_id}-${item.size}`;
                       
                       return (
                       <div key={uniqueKey} style={{ display: 'flex', gap: '20px', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
                         {/* Product Image */}
                         <div style={{ width: '80px', height: '80px', backgroundColor: '#f8fafc', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                           {item.image_url ? (
                               <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                           ) : (
                               <span style={{ fontSize: '24px' }}>👕</span>
                           )}
                         </div>

                         {/* Info */}
                         <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                           <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '16px', lineHeight: '1.2' }}>{item.name}</div>
                           
                           {/* 🟢 DYNAMIC SIZE DISPLAY (Highly Visible Pill) */}
                           {item.size && item.size !== 'Universal' && (
                             <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: '6px', fontSize: '12px', fontWeight: '800', backgroundColor: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                               Size: {item.size}
                             </div>
                           )}

                           <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px', marginTop: '6px' }}>₹{item.price}</div>
                         </div>
                         
                         {/* Controls */}
                         <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                               <button onClick={() => updateQuantity(item.variant_id, item.size, -1)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}>−</button>
                               <span style={{ fontWeight: '800', fontSize: '16px', minWidth: '15px', textAlign: 'center', color: '#0f172a' }}>{item.quantity}</span>
                               <button onClick={() => updateQuantity(item.variant_id, item.size, 1)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#000', fontWeight: 'bold' }}>+</button>
                            </div>
                            <button onClick={() => handleRemoveItem(item.variant_id, item.size)} style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '50%', width: '32px', height: '32px', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                         </div>
                       </div>
                     )})}
                   </div>
                   
                   {/* 🟢 Styled Dark "Add More Items" Button */}
                   <div style={{ textAlign: 'left', marginTop: '20px' }}>
                      <button 
                        onClick={() => router.push("/mobile")} 
                        style={{ backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: '0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                      >
                        <span style={{ fontSize: '16px' }}>+</span> Add more items
                      </button>
                   </div>
                 </>
               )}
            </div>

            {/* DYNAMIC RECOMMENDATIONS */}
            {recommendations.length > 0 && (
                <div style={{ backgroundColor: 'transparent' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>✨</span> Complete the Look
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                        {recommendations.map(rec => (
                            <div key={rec.id} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: '0.2s' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <img src={rec.image_url || 'https://via.placeholder.com/80'} alt={rec.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{rec.name}</div>
                                <div style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', marginBottom: '10px' }}>₹{rec.price}</div>
                                
                                <button 
                                  onClick={() => openProductDetails(rec)} 
                                  style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: '0.2s' }}
                                >
                                  More Info
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>

          {/* RIGHT COLUMN: Summary */}
          <div style={{ height: 'fit-content', position: 'sticky', top: '20px' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
               <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '25px' }}>
                 <span style={{ fontSize: '24px' }}>💳</span> 
                 <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>Summary</h3>
               </div>

               {items.length > 0 && (
                 <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: `1px dashed ${tierColor}`, marginBottom: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: '800' }}>Loyalty Status</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: tierColor }}>{tier} Member</div>
                    <div style={{ fontSize: '12px', color: '#059669', fontWeight: '800', marginTop: '4px' }}>✓ Free Delivery Applied</div>
                 </div>
               )}

               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#475569', fontSize: '15px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}><span>Subtotal</span><span style={{color: '#0f172a'}}>₹{subtotal}</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}><span>GST (10%)</span><span style={{color: '#0f172a'}}>₹{gstAmount}</span></div>
                 
                 {items.length > 0 && tierDiscount > 0 && (
                   <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: '800' }}>
                     <span>{tier} Tier Deduction</span>
                     <span>- ₹{tierDiscount}</span>
                   </div>
                 )}
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}><span>Delivery</span><span style={{color: '#059669', fontWeight: '800'}}>FREE</span></div>
               </div>

               <div style={{ borderTop: '2px solid #e2e8f0', margin: '25px 0', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>Total</span>
                 <span style={{ fontSize: '32px', fontWeight: '900', color: '#000', letterSpacing: '-1px' }}>₹{TOTAL}</span>
               </div>

               <button 
                 onClick={handlePlaceOrder} 
                 disabled={items.length === 0}
                 style={{ 
                   width: '100%', 
                   backgroundColor: items.length === 0 ? '#cbd5e1' : '#0f172a', 
                   color: 'white', 
                   padding: '20px', 
                   borderRadius: '12px', 
                   fontWeight: '800', 
                   fontSize: '18px', 
                   border: 'none', 
                   cursor: items.length === 0 ? 'not-allowed' : 'pointer',
                   boxShadow: items.length > 0 ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                   transition: '0.2s'
                 }}
               >
                 {items.length === 0 ? "Cart is Empty" : `Place ${tier} Order`}
               </button>
            </div>
          </div>

        </div>
      </div>

      {/* 🟢 FULL PRODUCT DETAILS MODAL (Mobile Bottom-Sheet Style) */}
      {selectedProduct && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '500px', borderRadius: '24px 24px 0 0', padding: '30px', animation: 'slideUp 0.3s ease-out', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                
                <button onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontWeight: 'bold', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>✕</button>
                
                <div style={{ width: '100%', height: '280px', borderRadius: '16px', backgroundColor: '#f8fafc', marginBottom: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    {selectedProduct.image_url ? (
                        <img src={selectedProduct.image_url} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                        <span style={{ fontSize: '50px' }}>👕</span>
                    )}
                </div>

                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>{selectedProduct.brand}</div>
                <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', marginBottom: '12px', lineHeight: '1.2' }}>{selectedProduct.name}</h2>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginBottom: '20px' }}>₹{selectedProduct.price}</div>

                <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6', marginBottom: '25px' }}>
                    {selectedProduct.description || "A premium quality piece crafted for comfort, durability, and a perfect fit. Ideal for both everyday wear and special occasions."}
                </p>

                {/* Size Selector */}
                {selectedProduct.sizes && (typeof selectedProduct.sizes === 'string' ? JSON.parse(selectedProduct.sizes) : selectedProduct.sizes)[0] !== 'Universal' && (
                    <div style={{ marginBottom: '30px' }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>Select Size</div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {(typeof selectedProduct.sizes === 'string' ? JSON.parse(selectedProduct.sizes) : selectedProduct.sizes).map((sz: string) => (
                                <button 
                                    key={sz} 
                                    onClick={() => setSelectedSize(sz)}
                                    style={{
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        border: selectedSize === sz ? '2px solid #0f172a' : '1px solid #cbd5e1',
                                        backgroundColor: selectedSize === sz ? '#0f172a' : 'white',
                                        color: selectedSize === sz ? 'white' : '#0f172a',
                                        fontWeight: '800',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {sz}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <button 
                    onClick={handleModalAddToCart}
                    style={{ width: '100%', padding: '18px', borderRadius: '12px', backgroundColor: '#0f172a', color: 'white', border: 'none', fontWeight: '800', fontSize: '18px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                >
                    Add to Cart
                </button>

            </div>
          </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}