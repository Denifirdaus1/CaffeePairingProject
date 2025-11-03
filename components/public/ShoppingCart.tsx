import React from 'react';
import { useCart } from '../../contexts/CartContext';
import { OptimizedImage } from '../OptimizedImage';

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, getTotalPrice, getTotalItems, clearCart } = useCart();

  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return `€${price.toFixed(2)}`;
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Cart Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-brand-primary shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="bg-brand-surface/60 px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <div>
              <h2 className="text-xl font-bold text-white">Shopping Cart</h2>
              <p className="text-xs text-brand-text-muted">{getTotalItems()} items</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close cart"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg className="w-16 h-16 text-brand-text-muted/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-brand-text-muted mb-2">Your cart is empty</p>
              <p className="text-sm text-brand-text-muted/70">Add some items to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-brand-surface/40 rounded-xl p-4 border border-white/5"
                >
                  <div className="flex gap-3">
                    {/* Image */}
                    {item.image_url ? (
                      <OptimizedImage
                        src={item.image_url}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-brand-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 text-brand-accent/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate mb-1">{item.name}</h3>
                      
                      {/* Pairing Details */}
                      {item.type === 'pairing' && (
                        <p className="text-xs text-brand-text-muted mb-2">
                          {item.coffeeName} + {item.pastryName}
                        </p>
                      )}

                      {/* Type Badge */}
                      <div className="inline-flex items-center bg-brand-accent/10 px-2 py-0.5 rounded text-xs text-brand-accent mb-2">
                        {item.type === 'pairing' ? '🎯 Pairing' : item.type === 'coffee' ? '☕ Coffee' : '🥐 Pastry'}
                      </div>

                      {/* Price & Quantity Controls */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 bg-brand-bg/50 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded text-white transition-colors"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="text-white w-6 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded text-white transition-colors"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-brand-accent font-bold">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-red-400"
                            aria-label="Remove item"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="bg-brand-surface/60 px-6 py-4 border-t border-white/10 space-y-4">
            {/* Clear Cart Button */}
            <button
              onClick={clearCart}
              className="w-full text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Clear Cart
            </button>

            {/* Total */}
            <div className="flex items-center justify-between text-xl font-bold">
              <span className="text-white">Total:</span>
              <span className="text-brand-accent">{formatPrice(getTotalPrice())}</span>
            </div>

            {/* Checkout Button */}
            <button className="w-full bg-gradient-to-r from-brand-accent via-brand-accent/90 to-amber-400/70 text-white py-3 rounded-xl font-semibold hover:brightness-110 transition-all">
              Checkout
            </button>

            {/* On Development Notice */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 rounded-lg text-xs text-yellow-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Payment feature coming soon</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

