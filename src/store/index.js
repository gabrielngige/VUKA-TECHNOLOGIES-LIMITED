import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// ─── Cart Store ───────────────────────────────────────────────
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      mode: 'retail', // 'retail' | 'wholesale'

      setMode: (mode) => set({ mode, items: [] }),

      addItem: (product) => {
        const { items, mode } = get();
        const price = mode === 'wholesale' ? product.wholesalePrice : product.retailPrice;
        const existing = items.find((i) => i.id === product.id);
        if (existing) {
          set({ items: items.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i) });
        } else {
          set({ items: [...items, { ...product, qty: 1, price }] });
        }
      },

      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),

      updateQty: (id, qty) => {
        if (qty < 1) return get().removeItem(id);
        set({ items: get().items.map((i) => i.id === id ? { ...i, qty } : i) });
      },

      clearCart: () => set({ items: [] }),

      get total() {
        return get().items.reduce((sum, i) => sum + i.price * i.qty, 0);
      },

      get count() {
        return get().items.reduce((sum, i) => sum + i.qty, 0);
      },
    }),
    { name: 'vuka-cart' }
  )
);

// ─── Product Store ────────────────────────────────────────────
export const useProductStore = create((set, get) => ({
  products: [],
  categories: ['All'],
  search: '',
  activeCategory: 'All',
  loading: false,

  setSearch: (search) => set({ search }),
  setCategory: (cat) => set({ activeCategory: cat }),

  fetchProducts: async () => {
    set({ loading: true });
    try {
      const { data } = await axios.get('/api/products');
      const products = data.products || [];
      const uniqueCats = [...new Set(products.map(p => p.category))];
      set({ products, categories: ['All', ...uniqueCats], loading: false });
    } catch (err) {
      console.error('Failed to fetch products', err);
      set({ loading: false });
    }
  },
}));

// ─── Auth Store ───────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAdmin: false,
      login: (user, token) => set({ user, token, isAdmin: user.role === 'admin' }),
      logout: () => set({ user: null, token: null, isAdmin: false }),
    }),
    { name: 'vuka-auth' }
  )
);

// ─── Delivery Store ───────────────────────────────────────────
export const useDeliveryStore = create((set) => ({
  orders: [],
  setOrders: (orders) => set({ orders }),
  updateStatus: (id, status) =>
    set((s) => ({
      orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    })),
}));
