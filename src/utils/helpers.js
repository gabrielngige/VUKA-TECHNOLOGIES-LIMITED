/**
 * Format currency for display (Kenyan Shilling)
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date for display
 */
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Kenya phone number (07XX or +254XX)
 */
export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^(\+254|0)[17][0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Format phone number to standard M-Pesa format (+254...)
 */
export const formatPhoneForMpesa = (phone) => {
  let formatted = phone.replace(/\s/g, '');
  if (formatted.startsWith('0')) {
    formatted = '+254' + formatted.slice(1);
  }
  return formatted;
};

/**
 * Generate order number
 */
export const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

/**
 * Calculate order summary
 */
export const calculateOrderSummary = (items) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shippingFee = 200; // Fixed shipping fee
  const tax = Math.round(subtotal * 0.16); // 16% VAT
  const total = subtotal + shippingFee + tax;

  return {
    subtotal,
    shippingFee,
    tax,
    total,
  };
};

/**
 * Format cart items for API
 */
export const formatCartForOrder = (items, mode) => {
  return items.map((item) => ({
    productId: item.id,
    productName: item.name,
    quantity: item.qty,
    unitPrice: item.price,
    totalPrice: item.price * item.qty,
    category: item.category,
    mode,
  }));
};

/**
 * Get order status badge color
 */
export const getOrderStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colors[status] || colors.pending;
};

/**
 * Safe JSON parse with fallback
 */
export const safeParse = (json, fallback = null) => {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};

export default {
  formatCurrency,
  formatDate,
  isValidEmail,
  isValidPhoneNumber,
  formatPhoneForMpesa,
  generateOrderNumber,
  calculateOrderSummary,
  formatCartForOrder,
  getOrderStatusColor,
  safeParse,
};
