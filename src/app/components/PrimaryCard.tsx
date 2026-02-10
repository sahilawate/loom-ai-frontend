"use client";

import { getSession } from "../../lib/session";
import { post } from "../../lib/api";

export default function PrimaryCard({ product }: any) {
  const handleSelect = async () => {
    try {
      // 🟢 Uses the async getSession helper to get the active ID
      const sid = await getSession("mobile");
      
      // 🟢 Uses the post helper instead of a hardcoded localhost URL
      await post("/cart/add", { 
        sessionId: sid, 
        variantId: product.variant_id, 
        quantity: 1 
      });

      alert("Item reserved! You can view it in the Store Dashboard or Checkout.");
    } catch (err) {
      console.error("Reservation failed:", err);
      alert("Failed to reserve item.");
    }
  };

  return (
    <div className="product-card" style={{ 
      padding: '15px', 
      border: '1px solid #e2e8f0', 
      borderRadius: '12px',
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <img 
        src={product.image_url || 'https://via.placeholder.com/150'} 
        alt={product.name} 
        style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} 
      />
      <h4 style={{ marginTop: '10px', fontSize: '16px', fontWeight: 'bold' }}>{product.name}</h4>
      <p style={{ color: '#64748b' }}>₹{product.price}</p>
      <button 
        onClick={handleSelect}
        style={{ 
          width: '100%', 
          marginTop: '10px',
          padding: '10px', 
          backgroundColor: '#0f172a', 
          color: '#fff', 
          border: 'none', 
          borderRadius: '30px', 
          fontWeight: '700',
          cursor: 'pointer' 
        }}
      >
        Select Item
      </button>
    </div>
  );
}