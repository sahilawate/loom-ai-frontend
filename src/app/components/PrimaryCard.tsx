// frontend/src/app/components/PrimaryCard.tsx (Updated)
const handleSelect = async () => {
  await fetch('http://localhost:5000/api/cart', {
    method: 'POST',
    body: JSON.stringify({ 
      sessionId: getSession(), 
      variantId: product.variant_id, 
      quantity: 1 
    })
  });
  alert("Item reserved! You can view it in the Store Dashboard or Checkout.");
};