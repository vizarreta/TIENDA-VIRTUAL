import React from 'react';
import CartIcon from './CartIcon';

interface NavbarProps {
  onCartClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onCartClick }) => {
  return (
    <nav className="bg-indigo-600 text-white sticky top-0 shadow-md z-40 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-2 cursor-pointer">
        <span className="text-2xl font-bold tracking-tight">🛍️ Tienda Virtual</span>
      </div>
      <div>
        <CartIcon onClick={onCartClick} />
      </div>
    </nav>
  );
};

export default Navbar;
