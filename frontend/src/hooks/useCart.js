import { useState, useMemo } from 'react';

/**
 * Hook para la gestión del carrito de compras POS
 * Incluye cálculo opcional de impuestos mediante toggle / checkbox
 */
export function useCart(defaultTaxRate = 0.19, initialApplyTax = false) {
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Cliente Mostrador');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [applyTax, setApplyTax] = useState(initialApplyTax);
  const [taxRate, setTaxRate] = useState(defaultTaxRate);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (product.stock && existing.qty >= product.stock) {
          return prev; // No superar stock disponible
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.qty + delta;
            if (newQty <= 0) return null;
            if (item.stock && newQty > item.stock) return item;
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('Cliente Mostrador');
    setPaymentMethod('Efectivo');
    // Mantenemos la preferencia de applyTax para agilizar cobros sucesivos
  };

  const { subtotal, impuestos, total, itemsCount } = useMemo(() => {
    const rawSubtotal = cart.reduce(
      (acc, item) => acc + (parseFloat(item.precio || item.price || 0) * item.qty),
      0
    );
    const rawTax = applyTax ? rawSubtotal * taxRate : 0;
    const rawTotal = rawSubtotal + rawTax;
    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);

    return {
      subtotal: parseFloat(rawSubtotal.toFixed(2)),
      impuestos: parseFloat(rawTax.toFixed(2)),
      total: parseFloat(rawTotal.toFixed(2)),
      itemsCount: totalCount
    };
  }, [cart, applyTax, taxRate]);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    subtotal,
    impuestos,
    total,
    itemsCount,
    customerName,
    setCustomerName,
    paymentMethod,
    setPaymentMethod,
    applyTax,
    setApplyTax,
    taxRate,
    setTaxRate
  };
}

export default useCart;
