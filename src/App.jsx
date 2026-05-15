import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar.jsx';
import HomePage from './pages/HomePage.jsx';
import OrderPage from './pages/OrderPage.jsx';
import CartPage from './pages/CartPage.jsx';
import DeliveryPage from './pages/DeliveryPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import { useAuthStore, useProductStore } from './store/index.js';

function AdminGuard({ children }) {
  const isAdmin = useAuthStore(s => s.isAdmin);
  return isAdmin ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const fetchProducts = useProductStore(s => s.fetchProducts);

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'DM Sans, sans-serif', fontSize: '14px' } }} />
      <Navbar />
      <main>
        <Routes>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/"         element={<HomePage />} />
          <Route path="/orders"   element={<OrderPage />} />
          <Route path="/cart"     element={<CartPage />} />
          <Route path="/delivery" element={<DeliveryPage />} />
          <Route path="/admin"    element={<AdminGuard><AdminPage /></AdminGuard>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
