import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProductCatalog from './components/ProductCatalog';
import CartDrawer from './components/CartDrawer';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import AuthCallback from './components/AuthCallback';
import ProductDetail from './components/ProductDetail';
import Checkout from './components/Checkout';
import Orders from './components/Orders';
import CurrencyConverter from './components/CurrencyConverter';

function PrivateRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  if (loading)
    return (
      <div role="status" className="p-8 text-center">
        {t('loading')}
      </div>
    );
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const closeCart = () => setIsCartOpen(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onCartClick={toggleCart} />
      <main className="flex-grow">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={<ProductCatalog />} />
          <Route path="/currency" element={<CurrencyConverter />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route
            path="/checkout"
            element={
              <PrivateRoute>
                <Checkout />
              </PrivateRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <PrivateRoute>
                <Orders />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute adminOnly>
                <AdminPanel />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
