import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ProductCatalog from './components/ProductCatalog';
import CartDrawer from './components/CartDrawer';

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onCartClick={toggleCart} />
      <main className="flex-grow">
        <ProductCatalog />
      </main>
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
    </div>
  );
}

export default App;
