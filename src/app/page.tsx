"use client";

import Navbar from "./components/Navbar";
import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* 🟢 Session ID and Reset button will now show here */}
      <Navbar mode="mobile" isHome={true} />
      
      <div style={{ 
        height: 'calc(100vh - 60px)', 
        backgroundColor: '#f8fafc', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'flex-start', 
        paddingTop: '30px',
        fontFamily: 'Segoe UI, sans-serif'
      }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '42px', 
            fontWeight: '800', 
            color: '#0f172a', 
            marginBottom: '10px',
            letterSpacing: '-1px'
          }}>
            Loom AI – Unified Retail Assistant
          </h1>
          <p style={{ 
            fontSize: '18px', 
            color: '#64748b', 
            fontWeight: '500',
            margin: 0
          }}>
            One AI brain across mobile, WhatsApp and store
          </p>
        </div>

        {/* Main Grid (Top 3) */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '25px', 
          maxWidth: '1000px', 
          width: '90%',
          marginBottom: '25px'
        }}>
          <LaunchCard href="/mobile" title="Mobile" desc="Browse products via app" icon={<MobileIcon />} />
          <LaunchCard href="/whatsapp" title="WhatsApp" desc="Chat & order via Whatsapp" icon={<WhatsAppIcon />} />
          <LaunchCard href="/staff" title="Staff View" desc="Store associate dashboard" icon={<StoreIcon />} />
        </div>

        {/* Secondary Grid (Bottom 2) */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '25px', 
          maxWidth: '660px', 
          width: '90%' 
        }}>
          <LaunchCard href="/checkout" title="Checkout" desc="Complete purchase" icon={<CartIcon />} />
          <LaunchCard href="/agents" title="Agents Debug" desc="View AI timeline" icon={<PulseIcon />} />
        </div>

      </div>
    </>
  );
}


// 🎨 Card Component
function LaunchCard({ href, icon, title, desc }: any) {
  return (
    <Link href={href} style={{ textDecoration: 'none', width: '100%' }}>
      <div 
        className="card-hover"
        style={{ 
          backgroundColor: 'white', 
          padding: '30px 25px', 
          borderRadius: '16px', 
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
          textAlign: 'center', 
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          border: '1px solid #e2e8f0',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ 
          width: '60px', 
          height: '60px', 
          backgroundColor: '#0f172a', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '18px',
          color: 'white'
        }}>
          {icon}
        </div>
        
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: '700', 
          color: '#1e293b', 
          marginBottom: '6px' 
        }}>
          {title}
        </h3>
        <p style={{ 
          fontSize: '15px', 
          color: '#64748b', 
          margin: 0,
          lineHeight: '1.5'
        }}>
          {desc}
        </p>
      </div>
      
      <style jsx>{`
        .card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 20px -5px rgba(0,0,0,0.1) !important;
          border-color: #94a3b8 !important;
        }
      `}</style>
    </Link>
  );
}

// 🖼️ Icons
const MobileIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
);
const WhatsAppIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
);

// 🟢 REVERTED TO OLD STORE ICON (Simple Building)
const StoreIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const CartIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
);
const PulseIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);