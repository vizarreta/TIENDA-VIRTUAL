import React from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { Product } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: number) => void;
}

/**
 * 🔵 COMPONENTE STATELESS (Sin Estado)
 * 
 * Este componente es una FUNCIÓN PURA que:
 * - Recibe datos por props (producto)
 * - Renderiza siempre el mismo JSX para los mismos props
 * - NO usa useState ni useEffect
 * - NO tiene estado interno ni efectos secundarios
 * 
 * f(props) → JSX (siempre el mismo resultado)
 */
const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const isOutOfStock = product.stock === 0;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col h-full">
      <div className="relative">
        <img 
          src={product.image || 'https://via.placeholder.com/400x300?text=No+Image'} 
          alt={product.name} 
          className="w-full h-48 object-cover"
        />
        <span className="absolute top-2 right-2 bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded">
          {product.category}
        </span>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate" title={product.name}>{product.name}</h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">{product.description}</p>
        
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-bold text-gray-900">{formatCurrency(product.price)}</span>
          <span className={`text-sm font-medium ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
            {isOutOfStock ? 'Agotado' : `Stock: ${product.stock}`}
          </span>
        </div>
        
        <button
          onClick={() => onAddToCart(product.id)}
          disabled={isOutOfStock}
          className={`w-full py-2.5 px-4 rounded-lg font-medium text-white transition-colors
            ${isOutOfStock 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
            }`}
        >
          Agregar al Carrito
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
