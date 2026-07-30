import { create } from 'zustand';
import { Product, Capture } from './types';

interface AppState {
  products: Product[];
  activeProduct: Product | null;
  wishlist: string[];
  captures: Capture[];
  searchQuery: string;
  categoryFilter: 'all' | 'floor' | 'tabletop';
  
  setProducts: (products: Product[]) => void;
  setActiveProduct: (product: Product | null) => void;
  toggleWishlist: (productId: string) => void;
  setCaptures: (captures: Capture[]) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (filter: 'all' | 'floor' | 'tabletop') => void;
}

export const useAppStore = create<AppState>((set) => ({
  products: [],
  activeProduct: null,
  wishlist: [],
  captures: [],
  searchQuery: '',
  categoryFilter: 'all',

  setProducts: (products) => set({ products }),
  setActiveProduct: (activeProduct) => set({ activeProduct }),
  toggleWishlist: (productId) =>
    set((state) => {
      const exists = state.wishlist.includes(productId);
      const newWishlist = exists
        ? state.wishlist.filter((id) => id !== productId)
        : [...state.wishlist, productId];
      return { wishlist: newWishlist };
    }),
  setCaptures: (captures) => set({ captures }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
}));
