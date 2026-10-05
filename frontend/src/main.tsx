import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { CartProvider } from './context/CartContext.tsx';
import { QueryProvider } from './providers/QueryProvider.tsx';
import './i18n';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </QueryProvider>
  </React.StrictMode>
);
