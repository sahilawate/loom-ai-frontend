"use client";

import { useEffect, useState } from "react";
import { API } from "../../lib/api";
import Navbar from "../components/Navbar";

export default function StaffPage() {
  const [orders, setOrders] = useState<any[]>([]);

  // Poll for Orders (Refresh every 5s)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API}/orders/all`);
        const data = await res.json();
        setOrders(data);
      } catch (e) { console.error("Staff Load Error", e); }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Navbar mode="staff" showBack />
      <div style={{ padding: '40px 20px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f0f4f8', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '30px' }}>
            Store Associate Dashboard
          </h1>
          
          <div style={{ display: 'grid', gap: '30px' }}>
            {orders.map((order) => {
              const isCancelled = order.status === 'cancelled';
              // Logic for dynamic interests based on items
              const interests = order.items?.map((i: any) => i.name).join(", ") || "General Browsing";
              
              return (
                <div key={order.id} style={{ display: 'flex', gap: '25px', width: '100%' }}>
                  
                  {/* LEFT BLOCK: Customer Profile */}
                  <div style={{ 
                    flex: '1', 
                    backgroundColor: 'white', 
                    padding: '30px', 
                    borderRadius: '16px', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '18px', color: '#1e293b' }}>Guest User</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>Session: {order.session_id.slice(0, 8).toUpperCase()}</div>
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#fffbeb', padding: '15px', borderRadius: '8px', border: '1px solid #fef3c7' }}>
                      <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '4px' }}>Customer Tier</div>
                      <div style={{ fontWeight: 'bold', color: '#b45309', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '18px' }}>🏅</span> Gold
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#eff6ff', padding: '15px', borderRadius: '8px', border: '1px solid #dbeafe' }}>
                      <div style={{ fontSize: '12px', color: '#1e40af', marginBottom: '4px' }}>Customer Intent / Interests</div>
                      <div style={{ fontSize: '14px', color: '#1e3a8a', lineHeight: '1.5', fontWeight: '500' }}>
                        Interested in {interests}. Browsing for products under ₹{order.total_amount}.
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                      <div style={{ fontSize: '12px', color: '#166534', marginBottom: '4px' }}>Journey Stage</div>
                      <div style={{ fontWeight: 'bold', color: '#15803d' }}>
                        {isCancelled ? 'Checkout (Cancelled)' : 'Checkout (Completed)'}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT BLOCK: Reserved Items & Cart */}
                  <div style={{ 
                    flex: '1.2', 
                    backgroundColor: 'white', 
                    padding: '30px', 
                    borderRadius: '16px', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', color: '#059669' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                      <h3 style={{ margin: 0, fontWeight: '700', fontSize: '18px' }}>Reserved Items & Cart</h3>
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '15px', letterSpacing: '0.5px' }}>
                      ORDER #{order.id.slice(0, 8).toUpperCase()} ({order.items?.length || 0} ITEMS)
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {order.items && order.items.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontWeight: '600', color: '#334155' }}>{item.name}</div>
                          <div style={{ color: '#64748b', fontSize: '14px' }}>Qty: {item.qty}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Total Amount Paid</div>
                          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>₹{order.total_amount}</div>
                       </div>
                       <div style={{ 
                          padding: '8px 16px', 
                          borderRadius: '8px', 
                          fontSize: '12px', 
                          fontWeight: '800',
                          backgroundColor: isCancelled ? '#fee2e2' : '#dcfce7',
                          color: isCancelled ? '#dc2626' : '#166534',
                          border: isCancelled ? '1px solid #fca5a5' : '1px solid #86efac'
                        }}>
                          {order.status.toUpperCase()}
                        </div>
                    </div>
                  </div>

                </div>
              );
            })}

            {orders.length === 0 && (
              <div style={{ textAlign: 'center', padding: '100px', color: '#94a3b8', backgroundColor: 'white', borderRadius: '16px' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📥</div>
                <div>No active customer sessions or orders found.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}