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

  // GST and Pricing Logic
  const GST_RATE = 0.18;
  const gstAmount = Math.round(subtotal * GST_RATE);
  const DELIVERY_CHARGE = subtotal > 0 ? 100 : 0; // Only charge delivery if items exist
  const TOTAL = subtotal + gstAmount + DELIVERY_CHARGE;

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

      if (cartItems.length > 0) {
          await post("/chat/log", {
              sessionId: sid,
              agentName: "Loyalty & Offers Agent",
              action: "CHECK_OFFERS",
              message: "Scanning for user coupons and loyalty points..."
          });
      }
    } catch (e) { console.error("Cart Error", e); }
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
    } catch (e) { alert("Failed to remove item."); }
  }

  async function handlePlaceOrder() {
    if (!sessionId || items.length === 0) return;
    try {
      const res = await post("/orders", { sessionId, paymentMethod: "COD", totalAmount: TOTAL });
      if (res.success) {
        setPlacedOrderId(res.orderId);
        setIsSuccess(true);
        // 🟢 UPDATED: Redirect time changed from 5000 to 3000 (3 seconds)
        setTimeout(() => { router.push("/whatsapp"); }, 3000);
      }
    } catch (err) { alert("Order failed. Please try again."); }
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
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'sans-serif' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', textAlign: 'center', maxWidth: '400px', width: '90%' }}>
          <div style={{ fontSize: '60px', marginBottom: '10px' }}>🎉</div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669', marginBottom: '10px' }}>Order Placed!</h2>
          <p style={{ color: '#4b5563', marginBottom: '20px' }}>Order #{String(placedOrderId).slice(0,8)}</p>
          {/* 🟢 UPDATED: UI text changed to show 3s instead of 5s */}
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
          
          {/* LEFT COLUMN: Cart & History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* 🛒 Your Cart */}
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
               <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <span style={{ fontSize: '20px' }}>🛒</span> Your Cart ({items.length} items)
               </h2>

               {items.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '40px 0' }}>
                   <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '15px' }}>Your cart is empty</p>
                   <button onClick={() => router.push("/mobile")} style={{ color: '#000', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Continue Shopping</button>
                 </div>
               ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   {items.map((item) => (
                     <div key={item.variant_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
                       <div>
                         <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '17px' }}>{item.name}</div>
                         <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>Quantity: {item.quantity}</div>
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                         <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '18px' }}>₹{item.price * item.quantity}</div>
                         <button onClick={() => handleRemoveItem(item.variant_id)} style={{ background: '#fee2e2', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                       </div>
                     </div>
                   ))}
                   <div style={{ textAlign: 'center', marginTop: '10px' }}>
                      <button onClick={() => router.push("/mobile")} style={{ color: '#000', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add more items</button>
                   </div>
                 </div>
               )}
            </div>

            {/* 📜 Order History */}
            {orders.length > 0 && (
              <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '25px' }}>📜 Order History</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {orders.map((order) => {
                    const isCancelled = order.status === 'cancelled';
                    return (
                      <div key={order.id} style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontWeight: 'bold', color: isCancelled ? '#dc2626' : '#059669' }}>
                            {isCancelled ? '❌ Cancelled' : '✅ Order Placed'}
                          </span>
                          <span style={{ fontSize: '14px', color: '#94a3b8' }}>ID: #{order.id.slice(0, 8)}</span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '15px' }}>
                          {order.items.map((i: any) => `${i.name} (x${i.qty})`).join(', ')}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                          <span style={{ fontWeight: '800', fontSize: '18px' }}>₹{order.total_amount}</span>
                          <div style={{ display: 'flex', gap: '10px' }}>
                             <button onClick={() => router.push("/mobile")} style={{ backgroundColor: '#000', color: 'white', padding: '10px 18px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>Shop More</button>
                             {!isCancelled && (
                               <button onClick={() => handleCancelOrder(order.id)} style={{ backgroundColor: '#dc2626', color: 'white', padding: '10px 18px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel Order</button>
                             )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Payment Summary */}
          <div style={{ height: 'fit-content', position: 'sticky', top: '20px' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
               <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '25px' }}>
                 <span style={{ fontSize: '24px' }}>💳</span> 
                 <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>Summary</h3>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#475569', fontSize: '16px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>₹{subtotal}</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>GST (18%)</span><span>₹{gstAmount}</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delivery</span><span style={{color: '#059669', fontWeight: '600'}}>₹{DELIVERY_CHARGE}</span></div>
               </div>

               <div style={{ borderTop: '2px solid #f1f5f9', margin: '25px 0', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Total</span>
                 <span style={{ fontSize: '32px', fontWeight: '800', color: '#000' }}>₹{TOTAL}</span>
               </div>

               <div style={{ backgroundColor: '#fffbeb', color: '#854d0e', padding: '15px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', marginBottom: '25px', textAlign: 'center', border: '1px solid #fef3c7' }}>
                 ✨ Gold Member: You earn {Math.floor(TOTAL / 100)} points
               </div>

               <div style={{ marginBottom: '25px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>Payment Method</div>
                  <div style={{ padding: '14px', border: '2px solid #000', borderRadius: '10px', backgroundColor: '#fafafa', color: '#000', fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="radio" checked readOnly style={{ accentColor: '#000', width: '18px', height: '18px' }} /> Cash on Delivery (COD)
                  </div>
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
                   cursor: items.length === 0 ? 'not-allowed' : 'pointer',
                   transition: 'transform 0.1s'
                 }}
               >
                 Complete Purchase
               </button>
               
               <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#94a3b8' }}>
                 Session Active: {sessionId?.slice(0, 8)}
               </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}