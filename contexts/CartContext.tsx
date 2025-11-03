import React, { createContext, useContext, useState, useEffect } from 'react';

export type CartItemType = 'coffee' | 'pastry' | 'pairing';

export interface CartItem {
  id: string; // Unique cart item ID
  type: CartItemType;
  productId: string; // Coffee/Pastry ID or Pairing ID
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  // For pairings
  coffeeName?: string;
  pastryName?: string;
  coffeeId?: string;
  pastryId?: string;
  coffeePrice?: number;
  pastryPrice?: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  isInCart: (productId: string, type: CartItemType) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: React.ReactNode;
}

const CART_STORAGE_KEY = 'cafe_shopping_cart';

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart]);

  const addToCart = (item: Omit<CartItem, 'id' | 'quantity'>) => {
    setCart((prevCart) => {
      // Check if item already exists
      const existingItem = prevCart.find(
        (cartItem) => cartItem.productId === item.productId && cartItem.type === item.type
      );

      if (existingItem) {
        // Increase quantity
        return prevCart.map((cartItem) =>
          cartItem.id === existingItem.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      // Add new item
      const newItem: CartItem = {
        ...item,
        id: `${item.type}-${item.productId}-${Date.now()}`,
        quantity: 1,
      };
      return [...prevCart, newItem];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const isInCart = (productId: string, type: CartItemType) => {
    return cart.some((item) => item.productId === productId && item.type === type);
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

