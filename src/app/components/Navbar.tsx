"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession, resetSession } from "../../lib/session";

interface NavbarProps {
  mode: string;
  showBack?: boolean;
  isHome?: boolean; // 🟢 Only shows session controls on Home
}

export default function Navbar({ mode, showBack, isHome }: NavbarProps) {
  const router = useRouter();
  const [sid, setSid] = useState<string>("");

  useEffect(() => {
    // We pass "mobile" or use a default; getSession handles the storage
    getSession("mobile").then(setSid);
  }, []);

  const handleNewSession = () => {
    resetSession();
    window.location.reload(); // Refresh to ensure all components grab the new ID
  };

  return (
    <div className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', height: '60px', backgroundColor: '#0f172a', color: 'white' }}>
      <div className="nav-left">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' }}>
          Loom AI
        </Link>
      </div>

      <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        
        {/* 🟢 DEMO CONTROLS: Only visible on Home Page */}
        {isHome && (
          <>
            <div style={{ fontSize: '12px', color: '#94a3b8', backgroundColor: '#1e293b', padding: '5px 10px', borderRadius: '4px', border: '1px solid #334155' }}>
              <span style={{ color: '#64748b' }}>Session:</span> {sid.slice(0, 8)}
            </div>
            
            <button 
              onClick={handleNewSession}
              style={{ 
                backgroundColor: '#334155', 
                color: '#fff', 
                border: 'none', 
                padding: '6px 12px', 
                borderRadius: '4px', 
                fontSize: '11px', 
                fontWeight: '600', 
                cursor: 'pointer'
              }}
            >
              🔄 New Session
            </button>
          </>
        )}

        <span className="badge" style={{ backgroundColor: '#10b981', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
          {mode}
        </span>
      </div>
    </div>
  );
}