"use client";

import { useEffect, useState } from "react";

export default function Shop() {
  const [products, setProducts] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    fetch("http://localhost:4000/session/create", { method: "POST" })
      .then(res => res.json())
      .then(s => {
        setSessionId(s.id);
        localStorage.setItem("sessionId", s.id);
      });

    fetch("http://localhost:4000/products")
      .then(res => res.json())
      .then(setProducts);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 grid grid-cols-12 gap-6 p-6">
      {/* Chat */}
      <aside className="col-span-3 bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold mb-2">AI Assistant</h2>
        <textarea
          className="w-full border rounded p-2 text-sm"
          placeholder="Ask for recommendations…"
        />
        <button className="mt-3 w-full bg-black text-white py-2 rounded">
          Ask AI
        </button>
      </aside>

      {/* Products */}
      <section className="col-span-6">
        <h1 className="text-xl font-bold mb-4">Recommended Products</h1>
        <div className="grid grid-cols-2 gap-4">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow p-4">
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-sm text-gray-600">{p.description}</p>
              <p className="font-bold mt-2">₹{p.price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Agent Timeline */}
      <aside
        id="agents"
        className="col-span-3 bg-white rounded-xl shadow p-4"
      >
        <h2 className="font-semibold mb-2">Agent Timeline</h2>
        <p className="text-sm text-gray-500">AI actions appear here</p>
      </aside>
    </div>
  );
}
