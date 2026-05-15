import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Wheat, LogOut, Shield } from 'lucide-react';
import { useState } from 'react';
import { useCartStore, useAuthStore } from '../../store/index.js';
import toast from 'react-hot-toast';
import ErrorBoundary from '../ErrorBoundary';

const links = [
  { to: '/', label: 'Catalog' },
  { to: '/orders', label: 'My Orders' },
  { to: '/delivery', label: 'Delivery' },
  { to: '/admin', label: 'Admin' },
];

export default function NavbarWrapper() {
  return (
    <ErrorBoundary>
      <Navbar />
    </ErrorBoundary>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const count = useCartStore(s => (s.items?.length > 0 ? s.items.reduce((sum, i) => sum + (i.qty || 0), 0) : 0)) || 0;
  const { user, isAdmin, logout } = useAuthStore();
  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  }

  return (
    <nav className="bg-white border-b-2 border-amber sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 flex-shrink-0">
          <div className="relative w-10 h-10">
            <div className="w-10 h-10 bg-amber rounded-full flex items-center justify-center">
              <span className="font-display text-white text-xl font-semibold leading-none">V</span>
            </div>
            <div className="absolute top-1.5 left-3 w-4 h-3 bg-vuka-green rounded-[50%_10%_50%_10%] -rotate-12" />
          </div>
          <div>
            <p className="font-display text-vuka-green font-semibold text-base leading-tight">Vuka Technologies</p>
            <p className="text-[10px] text-gray-400 tracking-wide uppercase">Wholesale & Retail Cereals</p>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === l.to
                  ? 'text-vuka-green bg-vuka-green-pale'
                  : 'text-gray-500 hover:text-vuka-green hover:bg-gray-50'
              }`}
            >
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                location.pathname === '/admin'
                  ? 'text-vuka-green bg-vuka-green-pale'
                  : 'text-gray-500 hover:text-vuka-green hover:bg-gray-50'
              }`}>
              <Shield size={13} /> Admin
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative flex items-center gap-2 bg-amber-pale border border-amber rounded-lg px-3 py-2 text-sm font-medium text-vuka-green hover:bg-amber hover:text-white transition-colors">
            <ShoppingCart size={16} />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-vuka-green text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-semibold">{count}</span>
            )}
          </Link>
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-gray-500">Hi, {user.name?.split(' ')[0]}</span>
              <button onClick={handleLogout} className="btn-ghost flex items-center gap-1 text-sm py-2">
                <LogOut size={14} /> LogOut
              </button>
            </div>
          ) : (
            <Link to="/login" className="hidden md:block btn-outline text-sm py-2 px-4">Sign In</Link>
          )}
          <button className="md:hidden p-2 text-gray-500" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4">
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
              className={`block py-3 text-sm font-medium border-b border-gray-50 ${location.pathname === l.to ? 'text-vuka-green' : 'text-gray-600'}`}>
              {l.label}
            </Link>
          ))}
          {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="block py-3 text-sm font-medium text-vuka-green border-b border-gray-50">⚙ Admin</Link>}
          {user
            ? <button onClick={handleLogout} className="block py-3 text-sm text-red-500 font-medium">Sign Out</button>
            : <Link to="/login" onClick={() => setOpen(false)} className="block py-3 text-sm font-medium text-vuka-green">Sign In</Link>
          }
        </div>
      )}
    </nav>
  )
}