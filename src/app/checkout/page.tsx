"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { post, API } from "../../lib/api";
import { getSession } from "../../lib/session";
import Navbar from "../components/Navbar"; 

export default function CheckoutPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState(null);

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
  }, []);

  async function fetchCart(sid: string) {
    try {
      const res = await fetch(`${API}/cart?sessionId=${sid}`);
      const data = await res.json();
      const cartItems = data.items || [];
      setItems(cartItems);
      setSubtotal(cartItems.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0));
      refreshOrders(sid);
    } catch (e) { console.error("Cart Error", e); }
  }

  async function updateQuantity(variantId: number, delta: number) {
    if (!sessionId) return;
    try {
        const item = items.find(i => i.variant_id === variantId);
        if (item.quantity === 1 && delta === -1) {
            handleRemoveItem(variantId);
            return;
        }
        await post("/cart/add", { sessionId, variantId, quantity: delta });
        fetchCart(sessionId);
    } catch (e) { console.error("Qty Update Error", e); }
  }

  async function refreshOrders(sid: string) {
    const orderRes = await fetch(`${API}/orders/all?sessionId=${sid}`);
    const orderData = await orderRes.json();
    setOrders(orderData);
  }

  async function handleRemoveItem(variantId: number) {
    if (!sessionId) return;
    try {
      const res = await post("/cart/remove", { sessionId, variantId });
      if (res.success) { fetchCart(sessionId); }
    } catch (e) { alert("Failed to remove"); }
  }

  async function handlePlaceOrder() {
    if (!sessionId || items.length === 0) return;
    try {
      const res = await post("/orders", { sessionId, paymentMethod: "COD", totalAmount: TOTAL });
      if (res.success) {
        setPlacedOrderId(res.orderId);
        setIsSuccess(true);
        setTimeout(() => { router.push("/whatsapp"); }, 3000);
      }
    } catch (err) { alert("Order failed."); }
  }

  async function handleCancelOrder(orderId: string) {
    if (!confirm("Cancel this order?")) return;
    try {
      await post("/orders/cancel", { orderId, sessionId });
      if(sessionId) refreshOrders(sessionId);
    } catch (e) { alert("Failed to cancel."); }
  }

  if (isSuccess) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', textAlign: 'center', maxWidth: '400px', width: '90%' }}>
          <div style={{ fontSize: '60px', marginBottom: '10px' }}>🎉</div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669', marginBottom: '10px' }}>Order Placed!</h2>
          <p style={{ color: '#4b5563', marginBottom: '20px' }}>Order #{String(placedOrderId).slice(0,8)}</p>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>Redirecting to WhatsApp in 3s...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar mode="mobile" showBack />
      <div style={{ padding: '40px 20px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 60px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', fontFamily: 'Segoe UI, sans-serif' }}>
        
        <div style={{ maxWidth: '1200px', width: '100%', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px' }}>
          
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
               <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <span style={{ fontSize: '20px' }}>🛒</span> Your Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
               </h2>

               {items.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '40px 0' }}>
                   <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '20px' }}>Your cart is empty</p>
                   {/* 🟢 NEW: Colored Continue Shopping Button */}
                   <button 
                      onClick={() => router.push("/mobile")} 
                      style={{ 
                        backgroundColor: '#000', 
                        color: '#fff', 
                        padding: '14px 28px', 
                        borderRadius: '12px', 
                        border: 'none', 
                        fontWeight: '700', 
                        fontSize: '15px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    >
                      Continue Shopping
                    </button>
                 </div>
               ) : (
                 <>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                     {items.map((item) => (
                       <div key={item.variant_id} style={{ display: 'flex', gap: '15px', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
                         {/* 🟢 NEW: Product Thumbnail on Left */}
                         <div style={{ width: '80px', height: '80px', backgroundColor: '#f8fafc', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <img 
                              src={item.image_url || 'https://via.placeholder.com/80'} 
                              alt={item.name} 
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                         </div>

                         {/* Info on Right of Image */}
                         <div style={{ flex: 1 }}>
                           <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '17px' }}>{item.name}</div>
                           <div style={{ fontWeight: '700', color: '#64748b', fontSize: '15px', marginTop: '4px' }}>₹{item.price}</div>
                         </div>
                         
                         <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f1f5f9', padding: '4px 12px', borderRadius: '8px' }}>
                               <button onClick={() => updateQuantity(item.variant_id, -1)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}>−</button>
                               <span style={{ fontWeight: '700', fontSize: '16px', minWidth: '15px', textAlign: 'center' }}>{item.quantity}</span>
                               <button onClick={() => updateQuantity(item.variant_id, 1)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#000', fontWeight: 'bold' }}>+</button>
                            </div>

                            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '18px', minWidth: '80px', textAlign: 'right' }}>₹{item.price * item.quantity}</div>
                            <button onClick={() => handleRemoveItem(item.variant_id)} style={{ background: '#fee2e2', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#dc2626', cursor: 'pointer' }}>✕</button>
                         </div>
                       </div>
                     ))}
                   </div>
                   {/* 🟢 NEW: Styled Add More Button */}
                   <div style={{ textAlign: 'center', marginTop: '25px' }}>
                      <button 
                        onClick={() => router.push("/mobile")} 
                        style={{ 
                          backgroundColor: '#000', 
                          color: '#fff', 
                          padding: '12px 24px', 
                          borderRadius: '12px', 
                          border: 'none', 
                          fontSize: '14px', 
                          fontWeight: '700', 
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span>+</span> Add more items
                      </button>
                   </div>
                 </>
               )}
            </div>

            {/* Order History */}
            {orders.length > 0 && (
              <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '25px' }}>📜 Order History</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {orders.map((order) => {
                    const isCancelled = order.status === 'cancelled';
                    return (
                      <div key={order.id} style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontWeight: 'bold', color: isCancelled ? '#dc2626' : '#059669' }}>{isCancelled ? '❌ Cancelled' : '✅ Order Placed'}</span>
                          <span style={{ fontSize: '14px', color: '#94a3b8' }}>ID: #{order.id.slice(0, 8)}</span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '15px' }}>
                          {order.items.map((i: any) => `${i.name} (x${i.qty})`).join(', ')}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                          <span style={{ fontWeight: '800', fontSize: '18px' }}>₹{order.total_amount}</span>
                          <div style={{ display: 'flex', gap: '10px' }}>
                             {!isCancelled && <button onClick={() => handleCancelOrder(order.id)} style={{ backgroundColor: '#dc2626', color: 'white', padding: '10px 18px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel Order</button>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ height: 'fit-content', position: 'sticky', top: '20px' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
               <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '25px' }}>
                 <span style={{ fontSize: '24px' }}>💳</span> 
                 <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>Summary</h3>
               </div>

               {items.length > 0 && (
                 <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: `1px dashed ${tierColor}`, marginBottom: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: 'bold' }}>Loyalty Status</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: tierColor }}>{tier} Member</div>
                    <div style={{ fontSize: '12px', color: '#059669', fontWeight: '600', marginTop: '4px' }}>✓ Free Delivery Applied</div>
                 </div>
               )}

               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#475569', fontSize: '16px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>₹{subtotal}</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>GST (10%)</span><span>₹{gstAmount}</span></div>
                 
                 {items.length > 0 && tierDiscount > 0 && (
                   <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: '600' }}>
                     <span>{tier} Tier Deduction</span>
                     <span>- ₹{tierDiscount}</span>
                   </div>
                 )}
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delivery</span><span style={{color: '#059669', fontWeight: '700'}}>FREE</span></div>
               </div>

               <div style={{ borderTop: '2px solid #f1f5f9', margin: '25px 0', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Total</span>
                 <span style={{ fontSize: '32px', fontWeight: '800', color: '#000' }}>₹{TOTAL}</span>
               </div>

               <button 
                 onClick={handlePlaceOrder} 
                 disabled={items.length === 0}
                 style={{ 
                   width: '100%', 
                   backgroundColor: items.length === 0 ? '#cbd5e1' : '#000', 
                   color: 'white', 
                   padding: '20px', 
                   borderRadius: '12px', 
                   fontWeight: '800', 
                   fontSize: '18px', 
                   border: 'none', 
                   cursor: items.length === 0 ? 'not-allowed' : 'pointer'
                 }}
               >
                 {items.length === 0 ? "Cart is Empty" : `Place ${tier} Order`}
               </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}