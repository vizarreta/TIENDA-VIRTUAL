import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CartIcon from './CartIcon';
import LanguageSelector from './LanguageSelector';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onCartClick }: { onCartClick: () => void }) {
  const { t } = useTranslation();
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  return (
    <nav className="bg-indigo-600 text-white sticky top-0 shadow-md z-40 px-4 sm:px-6 py-3 flex flex-wrap justify-between items-center gap-3">
      <Link to="/" className="text-xl font-bold">
        {t('navbar:storeName')}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/currency" className="text-sm underline-offset-4 hover:underline">
          {t('currency:nav')}
        </Link>
        <LanguageSelector />
        {user ? (
          <>
            <span className="hidden lg:block text-sm max-w-48 truncate" title={user.email}>
              {user.fullName || user.email}
            </span>
            <Link to="/orders" className="text-sm underline-offset-4 hover:underline">
              {t('auth:orders')}
            </Link>
            {isAdmin && (
              <Link to="/admin" className="text-sm underline-offset-4 hover:underline">
                {t('auth:admin')}
              </Link>
            )}
            <button onClick={() => void logout().catch(() => {})} className="text-sm px-2 py-2">
              {t('auth:logout')}
            </button>
          </>
        ) : (
          <Link
            to="/login"
            state={{ from: location }}
            className="text-sm bg-white text-indigo-700 px-3 py-2 rounded font-medium"
          >
            {t('auth:login')}
          </Link>
        )}
        <CartIcon onClick={onCartClick} />
      </div>
    </nav>
  );
}
