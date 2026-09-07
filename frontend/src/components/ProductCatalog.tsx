import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { Product, useCart } from '../context/CartContext';
import { getProducts, searchProducts } from '../services/api';

/**
 * 🔴 COMPONENTE STATEFUL (Con Estado)
 * 
 * Este componente mantiene TRES ESTADOS INTERNOS:
 * - products: Lista de productos cargados (CAMBIA con datos de la API)
 * - searchTerm: Texto de búsqueda del usuario (CAMBIA con cada tecla)
 * - loading: Estado de carga (CAMBIA entre true/false)
 * 
 * Usa useState y useEffect para manejar datos dinámicos.
 * El estado MUTA según la interacción del usuario y respuestas de la API.
 */
const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  
  const { addToCart } = useCart();

  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let response;
        if (searchTerm.trim().length > 0) {
          response = await searchProducts(searchTerm);
        } else {
          response = await getProducts();
        }
        
        if (isMounted) {
          setProducts(response.data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      isMounted = false;
    };
  }, [searchTerm]);

  const handleAddToCart = (productId: number) => {
    addToCart(productId, 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="relative max-w-xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={handleAddToCart} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <p className="text-xl">No se encontraron productos para "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;
