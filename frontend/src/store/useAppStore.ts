import { create } from 'zustand';
import { Product, Capture, Category, User } from '@/types';
import { ApiService, setAuthToken } from '@/services/api';

interface AppState {
  user: User | null;
  token: string | null;
  products: Product[];
  categories: Category[];
  activeProduct: Product | null;
  wishlist: string[];
  captures: Capture[];
  searchQuery: string;
  categoryFilter: string;
  sortBy: string;
  
  setUser: (user: User | null, token?: string | null) => void;
  setProducts: (products: Product[]) => void;
  setCategories: (categories: Category[]) => void;
  setActiveProduct: (product: Product | null) => void;
  setWishlist: (wishlist: string[]) => void;
  toggleWishlist: (productId: string) => Promise<void>;
  setCaptures: (captures: Capture[]) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (filter: string) => void;
  setSortBy: (sort: string) => void;
  logout: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('arv_auth_token') : null,
  products: [],
  categories: [],
  activeProduct: null,
  wishlist: [],
  captures: [],
  searchQuery: '',
  categoryFilter: 'all',
  sortBy: 'featured',

  setUser: (user, token) => {
    if (token !== undefined) {
      setAuthToken(token);
      set({ user, token });
    } else {
      set({ user });
    }
  },
  setProducts: (products) => set({ products }),
  setCategories: (categories) => set({ categories }),
  setActiveProduct: (activeProduct) => set({ activeProduct }),
  setWishlist: (wishlist) => set({ wishlist }),
  toggleWishlist: async (productId: string) => {
    const current = get().wishlist;
    const exists = current.includes(productId);
    const updated = exists ? current.filter((id) => id !== productId) : [...current, productId];
    set({ wishlist: updated });
    try {
      await ApiService.toggleWishlist(productId);
    } catch (e) {
      console.warn('Wishlist API sync error:', e);
    }
  },
  setCaptures: (captures) => set({ captures }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setSortBy: (sortBy) => set({ sortBy }),
  logout: async () => {
    await ApiService.logout();
    set({ user: null, token: null, wishlist: [] });
  },
}));

