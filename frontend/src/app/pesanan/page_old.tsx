'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Package, 
  Users, 
  DollarSign,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast-simple';
import HistoryAdvancedFilter from '@/components/HistoryAdvancedFilter';
import CatalogAdvancedFilter from '@/components/CatalogAdvancedFilter';
import { BarangService, KategoriService } from '@/services/barangService';
import { cartService, CartItem as BackendCartItem } from '@/services/cartService';
import { pesananService, CreatePesananRequest, Pesanan as BackendPesanan, Member as BackendMember } from '@/services/pesananService';
import { memberService } from '@/services/memberService';
import { config } from '@/lib/config';

// Custom CSS for flying animation
const flyingAnimationCSS = `
  .fly-to-cart {
    position: fixed;
    z-index: 9999;
    pointer-events: none;
    transition: all 3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  
  .fly-to-cart.flying {
    transform: scale(0.3);
    opacity: 0;
  }
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = flyingAnimationCSS;
  document.head.appendChild(style);
}

interface Kategori {
  id: number;
  nama: string;
  deskripsi?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Barang {
  id: number;
  nama: string;
  harga: number;
  poin: number;
  stock: number;
  berat: number;
  kategori: Kategori;
  gambar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Member {
  id: number;
  nama: string;
  email?: string;
  telepon?: string;
  alamat?: string;
}

interface CartItem {
  barang: Barang;
  jumlah: number;
}

interface DetailPesanan {
  id: number;
  barang: Barang;
  jumlah: number;
  hargaSatuan: number;
  subtotal: number;
}

interface Pesanan {
  id: number;
  member: Member;
  karyawan: string | { id: number; username: string; fullName?: string };
  totalHarga: number;
  totalPoin: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  tanggalPesanan: string;
  details: DetailPesanan[];
}

// Mock data for members (to be replaced with real member API later)
const mockMembers: Member[] = [];

// Mock data for pesanans (to be replaced with real pesanan API later)
const mockPesanans: Pesanan[] = [];

export default function PesananPage() {
  const [barangs, setBarangs] = useState<Barang[]>([]);
  const [kategoris, setKategoris] = useState<Kategori[]>([]);
  const [members] = useState<Member[]>(mockMembers); // Remove this - use allMembers instead
  const [pesanans, setPesanans] = useState<Pesanan[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPesanan, setSelectedPesanan] = useState<Pesanan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedQuantities, setSelectedQuantities] = useState<{[key: number]: number}>({});
  const [notification, setNotification] = useState<{show: boolean, message: string}>({show: false, message: ''});
  const [cartAnimation, setCartAnimation] = useState(false);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [isNonMember, setIsNonMember] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    employeeName: 'Admin', // This should come from logged in user
    buyerName: '',
    address: '',
    paymentMethod: 'CASH'
  });
  
  // Pagination and filtering states
  const [catalogFilters, setCatalogFilters] = useState({
    searchTerm: '',
    kategoriId: null as number | null,
    sortBy: 'id',
    sortDir: 'desc',
    pageSize: 10,
    gridColumns: 4,
    minHarga: null as number | null,
    maxHarga: null as number | null
  });
  
  // Helper function to get date strings
  const getDefaultDateRange = () => {
    const endDate = new Date().toISOString().split('T')[0]; // Today
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
    return { startDate, endDate };
  };

  const [historyFilters, setHistoryFilters] = useState(() => {
    const { startDate, endDate } = getDefaultDateRange();
    return {
      memberName: '',
      status: 'ALL',
      barangName: '',
      kategori: 'ALL',
      startDate,
      endDate,
      sortBy: 'tanggalPesanan',
      sortDir: 'desc',
      pageSize: 10
    };
  });
  
  const [catalogPagination, setCatalogPagination] = useState({
    page: 0,
    totalPages: 0,
    totalElements: 0,
    loading: false
  });
  
  const [historyPagination, setHistoryPagination] = useState({
    page: 0,
    totalPages: 0,
    totalElements: 0,
    loading: false
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('catalog');
  const [currentUserId] = useState(1); // This should come from auth context

  const { toast } = useToast();

  // Load real data from API
  useEffect(() => {
    loadData();
    loadCart();
  }, []);

  useEffect(() => {
    if (!isLoadingData) {
      // Only load on page change, not on filter change
      loadCatalogData();
    }
  }, [catalogPagination.page]);

  useEffect(() => {
    if (!isLoadingData) {
      loadHistoryData();
    }
  }, [historyFilters, historyPagination.page]);

  // Filter handlers
  const handleCatalogFiltersChange = (newFilters: typeof catalogFilters) => {
    setCatalogFilters(newFilters);
    setCatalogPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
  };

  const handleHistoryFiltersChange = (newFilters: typeof historyFilters) => {
    setHistoryFilters(newFilters);
    setHistoryPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
  };

  // Pagination handlers
  const handleCatalogPageChange = (newPage: number) => {
    setCatalogPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleHistoryPageChange = (newPage: number) => {
    setHistoryPagination(prev => ({ ...prev, page: newPage }));
  };

  // Pagination component
  const PaginationComponent = ({ 
    pagination, 
    onPageChange 
  }: { 
    pagination: { page: number, totalPages: number, totalElements: number, loading: boolean }, 
    onPageChange: (page: number) => void 
  }) => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(0, pagination.page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(pagination.totalPages - 1, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between px-2 py-3">
        <div className="text-sm text-gray-700">
          Showing {pagination.page * 10 + 1} to {Math.min((pagination.page + 1) * 10, pagination.totalElements)} of {pagination.totalElements} results
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 0 || pagination.loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {pages.map((page) => (
            <Button
              key={page}
              variant={page === pagination.page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              disabled={pagination.loading}
              className="min-w-[40px]"
            >
              {page + 1}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages - 1 || pagination.loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Keyboard event for member search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard input when on checkout tab and member dropdown is open
      if (activeTab === 'checkout' && isDropdownOpen && !isNonMember) {
        // Ignore if user is typing in an input field
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }
        
        // Handle alphanumeric keys for search
        if (e.key.length === 1 && /[a-zA-Z0-9\s]/.test(e.key)) {
          e.preventDefault();
          setMemberSearchTerm(prev => prev + e.key);
          
          // Focus the search input
          const searchInput = document.querySelector('[data-member-search-input]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }
        
        // Handle backspace
        if (e.key === 'Backspace') {
          e.preventDefault();
          setMemberSearchTerm(prev => prev.slice(0, -1));
          
          // Focus the search input
          const searchInput = document.querySelector('[data-member-search-input]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, isDropdownOpen, isNonMember]);

  const loadData = async () => {
    try {
      setIsLoadingData(true);
      const [kategoriData, memberData] = await Promise.all([
        KategoriService.getAllKategori(),
        memberService.getAllMembers()
      ]);
      
      setKategoris(kategoriData);
      setAllMembers(memberData);
      
      // Load paginated data based on current filters
      await loadCatalogData();
      await loadHistoryData();
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive"
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadCatalogData = async () => {
    try {
      setCatalogPagination(prev => ({ ...prev, loading: true }));
      
      const response = await BarangService.searchBarangPaginated({
        page: catalogPagination.page,
        size: catalogFilters.pageSize,
        nama: catalogFilters.searchTerm || undefined,
        kategoriId: catalogFilters.kategoriId || undefined,
        sortBy: catalogFilters.sortBy,
        sortDir: catalogFilters.sortDir,
        minHarga: catalogFilters.minHarga || undefined,
        maxHarga: catalogFilters.maxHarga || undefined
      });
      
      // Filter only active barang for sales
      const activeBarangs = response.content.filter(barang => barang.isActive);
      setBarangs(activeBarangs);
      
      setCatalogPagination({
        page: response.number,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
        loading: false
      });
      
    } catch (error) {
      console.error('Error loading catalog data:', error);
      setCatalogPagination(prev => ({ ...prev, loading: false }));
      toast({
        title: "Error",
        description: "Gagal memuat data katalog",
        variant: "destructive"
      });
    }
  };

  const loadHistoryData = async () => {
    try {
      setHistoryPagination(prev => ({ ...prev, loading: true }));
      
      const response = await pesananService.searchPesananPaginated({
        page: historyPagination.page,
        size: historyFilters.pageSize,
        memberName: historyFilters.memberName || undefined,
        status: historyFilters.status === 'ALL' ? undefined : historyFilters.status || undefined,
        barangName: historyFilters.barangName || undefined,
        kategori: historyFilters.kategori === 'ALL' ? undefined : historyFilters.kategori || undefined,
        startDate: historyFilters.startDate || undefined,
        endDate: historyFilters.endDate || undefined,
        sortBy: historyFilters.sortBy,
        sortDir: historyFilters.sortDir
      });
      
      // Convert backend pesanan to frontend format
      const frontendPesanans = response.content.map((p: any) => ({
        ...p,
        karyawan: typeof p.karyawan === 'string' ? p.karyawan : p.karyawan.username
      }));
      setPesanans(frontendPesanans as any);
      
      setHistoryPagination({
        page: response.number,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
        loading: false
      });
      
    } catch (error) {
      console.error('Error loading history data:', error);
      setHistoryPagination(prev => ({ ...prev, loading: false }));
      toast({
        title: "Error",
        description: "Gagal memuat data histori",
        variant: "destructive"
      });
    }
  };

  const loadCart = async () => {
    try {
      const cartData = await cartService.getCartByUser(currentUserId);
      // Convert backend cart items to frontend format
      const frontendCart: CartItem[] = cartData.map(item => ({
        barang: {
          ...item.barang,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        jumlah: item.jumlah
      }));
      setCart(frontendCart);
    } catch (error) {
      console.error('Error loading cart:', error);
      // Continue without cart data - cart starts empty
    }
  };

  // Helper function for dynamic grid classes
  const getGridClasses = (columns: number) => {
    const baseClasses = "grid gap-2 sm:gap-4";
    switch (columns) {
      case 1: return `${baseClasses} grid-cols-1 max-w-md mx-auto`;
      case 2: return `${baseClasses} grid-cols-2`;
      case 3: return `${baseClasses} grid-cols-2 md:grid-cols-3`;
      case 4: return `${baseClasses} grid-cols-2 md:grid-cols-3 lg:grid-cols-4`;
      case 5: return `${baseClasses} grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`;
      default: return `${baseClasses} grid-cols-2 md:grid-cols-3 lg:grid-cols-4`;
    }
  };

  // Filter pesanan - keep this for now as it's still used in some places
  const filteredPesanans = pesanans.filter(pesanan => {
    if (selectedStatus === 'all') return true;
    return pesanan.status === selectedStatus;
  });

  // Cart functions
  const addToCart = async (barang: Barang, event?: React.MouseEvent) => {
    const quantity = selectedQuantities[barang.id] || 1;
    
    try {
      // Trigger flying animation if event is provided
      if (event) {
        createFlyingAnimation(event, barang);
      }
      
      await cartService.addToCart({
        userId: currentUserId,
        barangId: barang.id,
        jumlah: quantity
      });
      
      // Reload cart from backend
      await loadCart();
      
      // Add cart animation
      setCartAnimation(true);
      setTimeout(() => setCartAnimation(false), 300);
      
      // Show notification
      setNotification({
        show: true,
        message: `${barang?.nama || 'Produk'} sejumlah ${quantity} sudah ditambahkan ke keranjang`
      });
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setNotification({show: false, message: ''});
      }, 3000);
      
      // Reset quantity for this item
      setSelectedQuantities(prev => ({ ...prev, [barang.id]: 1 }));
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan ke keranjang",
        variant: "destructive"
      });
    }
  };

  const updateQuantity = (barangId: number, quantity: number) => {
    if (quantity >= 1) {
      setSelectedQuantities(prev => ({ ...prev, [barangId]: quantity }));
    }
  };

  // Flying animation for cart
  const createFlyingAnimation = (event: React.MouseEvent, barang: Barang) => {
    const button = event.currentTarget as HTMLElement;
    const buttonRect = button.getBoundingClientRect();
    
    // Find the cart button by ID
    const cartButton = document.getElementById('floating-cart-button') as HTMLElement;
    if (!cartButton) {
      console.warn('Cart button not found for animation');
      return;
    }
    
    const cartRect = cartButton.getBoundingClientRect();
    
    // Create flying element that looks like the product
    const flyingElement = document.createElement('div');
    flyingElement.className = 'fly-to-cart';
    
    // Start position (center of the clicked button)
    const startX = buttonRect.left + buttonRect.width / 2 - 20;
    const startY = buttonRect.top + buttonRect.height / 2 - 20;
    
    // End position (center of cart button)
    const endX = cartRect.left + cartRect.width / 2 - 20;
    const endY = cartRect.top + cartRect.height / 2 - 20;
    
    // Set initial position and styles
    flyingElement.style.left = `${startX}px`;
    flyingElement.style.top = `${startY}px`;
    flyingElement.style.width = '40px';
    flyingElement.style.height = '40px';
    flyingElement.style.backgroundColor = '#10b981';
    flyingElement.style.borderRadius = '50%';
    flyingElement.style.display = 'flex';
    flyingElement.style.alignItems = 'center';
    flyingElement.style.justifyContent = 'center';
    flyingElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    flyingElement.style.border = '2px solid #ffffff';
    flyingElement.style.transform = 'scale(1)';
    flyingElement.style.opacity = '1';
    
    // Add shopping cart icon
    flyingElement.innerHTML = `
      <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    `;
    
    document.body.appendChild(flyingElement);
    
    // Trigger animation after a small delay to ensure element is rendered
    setTimeout(() => {
      flyingElement.style.left = `${endX}px`;
      flyingElement.style.top = `${endY}px`;
      flyingElement.style.transform = 'scale(0.3)';
      flyingElement.style.opacity = '0';
    }, 10);
    
    // Remove element after animation (3.2 seconds to ensure animation completes)
    setTimeout(() => {
      if (document.body.contains(flyingElement)) {
        document.body.removeChild(flyingElement);
      }
    }, 3200);
  };

  const updateCartQuantity = async (barangId: number, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        await cartService.removeFromCart({ userId: currentUserId, barangId });
      } else {
        await cartService.updateCartItemQuantity({
          userId: currentUserId,
          barangId,
          quantity: newQuantity
        });
      }
      
      // Reload cart from backend
      await loadCart();
    } catch (error) {
      console.error('Error updating cart:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui keranjang",
        variant: "destructive"
      });
    }
  };

  const removeFromCart = async (barangId: number) => {
    try {
      await cartService.removeFromCart({ userId: currentUserId, barangId });
      
      // Reload cart from backend
      await loadCart();
      
      toast({
        title: "Berhasil",
        description: "Item dihapus dari keranjang"
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus dari keranjang",
        variant: "destructive"
      });
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart(currentUserId);
      setCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Continue anyway - clear local cart
      setCart([]);
    }
  };

  const getTotalHarga = () => {
    return cart.reduce((total, item) => total + (item.barang.harga * item.jumlah), 0);
  };

  const getTotalPoin = () => {
    return cart.reduce((total, item) => total + (item.barang.poin * item.jumlah), 0);
  };

  // Payment function for new checkout
  const handlePayment = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Keranjang kosong",
        variant: "destructive"
      });
      return;
    }

    if (!isNonMember && !selectedMember) {
      toast({
        title: "Error",
        description: "Pilih member terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    if (isNonMember && !checkoutData.buyerName.trim()) {
      setCheckoutData(prev => ({ ...prev, buyerName: 'Pembeli Anonim' }));
    }

    setIsLoading(true);

    try {
      // Create new transaction using backend API
      const pesananRequest = {
        pesanan: {
          memberId: isNonMember ? undefined : selectedMember?.id,
          karyawanId: currentUserId // This should be the actual logged-in user ID
        },
        details: cart.map(item => ({
          barangId: item.barang.id,
          jumlah: item.jumlah
        }))
      };

      const newTransaction = await pesananService.createPesanan(pesananRequest);
      
      // Clear cart
      await clearCart();
      
      // Reset form
      setSelectedMember(null);
      setCheckoutData({
        employeeName: 'Admin',
        buyerName: '',
        address: '',
        paymentMethod: 'CASH'
      });
      setIsNonMember(false);
      
      // Set transaction for success modal
      setLastTransaction({
        ...newTransaction,
        member: isNonMember ? {
          id: 0,
          nama: checkoutData.buyerName || 'Pembeli Anonim',
          alamat: checkoutData.address
        } : selectedMember,
        details: cart.map(item => ({
          id: Date.now() + item.barang.id,
          barang: item.barang,
          jumlah: item.jumlah,
          hargaSatuan: item.barang.harga,
          subtotal: item.barang.harga * item.jumlah
        }))
      });
      
      // Reload pesanan data
      await loadData();
      
      // Show success modal
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: "Gagal memproses pembayaran",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Checkout function
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Keranjang masih kosong",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare request data
      const request: CreatePesananRequest = {
        pesanan: {
          memberId: selectedMember?.id || undefined, // null for non-member
          karyawanId: 1 // Default karyawan, should get from auth context
        },
        details: cart.map(item => ({
          barangId: item.barang.id,
          jumlah: item.jumlah
        }))
      };

      // Call API to create pesanan
      const newPesanan = await pesananService.createPesanan(request);

      // Update local state
      setPesanans(prev => [newPesanan as any, ...prev]);
      clearCart();
      setSelectedMember(null);
      setIsCheckoutOpen(false);

      // Reload history data to show new pesanan
      loadHistoryData();

      toast({
        title: "Berhasil",
        description: `Pesanan berhasil dibuat dengan ID: ${newPesanan.id}`,
      });
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuat pesanan",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePesananStatus = async (pesananId: number, newStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED') => {
    try {
      // Call backend API to update status
      const response = await fetch(`http://localhost:8080/api/pesanan/${pesananId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updatedPesanan = await response.json();

      // Update local state with the response from backend
      setPesanans(prev =>
        prev.map(pesanan =>
          pesanan.id === pesananId
            ? { ...pesanan, status: updatedPesanan.status }
            : pesanan
        )
      );

      toast({
        title: "Status Updated",
        description: "Status pesanan berhasil diperbarui",
      });

    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui status pesanan",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Menunggu', variant: 'secondary' as const };
      case 'PROCESSING':
        return { label: 'Diproses', variant: 'default' as const };
      case 'COMPLETED':
        return { label: 'Selesai', variant: 'default' as const };
      case 'CANCELLED':
        return { label: 'Dibatalkan', variant: 'destructive' as const };
      default:
        return { label: status, variant: 'outline' as const };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  // Print receipt function
  const handlePrintReceipt = () => {
    if (!lastTransaction) {
      toast({
        title: "Error",
        description: "Data transaksi tidak ditemukan",
        variant: "destructive"
      });
      return;
    }

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Error",
          description: "Pop-up diblokir! Silakan izinkan pop-up untuk mencetak struk.",
          variant: "destructive"
        });
        return;
      }

      const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Struk Pembayaran - Koperasi Desa</title>
          <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  line-height: 1.4;
                  color: #000;
                  background: white;
                  padding: 10px;
              }
              .receipt {
                  width: 300px;
                  margin: 0 auto;
                  background: white;
                  border: 1px solid #ddd;
                  padding: 15px;
              }
              .header {
                  text-align: center;
                  border-bottom: 2px solid #000;
                  padding-bottom: 10px;
                  margin-bottom: 15px;
              }
              .title {
                  font-size: 18px;
                  font-weight: bold;
                  margin-bottom: 5px;
                  letter-spacing: 1px;
              }
              .subtitle {
                  font-size: 10px;
                  color: #666;
                  margin-bottom: 2px;
              }
              .info-section {
                  margin-bottom: 15px;
                  padding-bottom: 10px;
                  border-bottom: 1px dashed #999;
              }
              .info-row {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 3px;
                  font-size: 11px;
              }
              .items-header {
                  font-weight: bold;
                  border-bottom: 1px solid #999;
                  padding-bottom: 5px;
                  margin-bottom: 8px;
                  display: flex;
                  justify-content: space-between;
              }
              .item-row {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 5px;
                  font-size: 11px;
              }
              .item-name {
                  flex: 1;
                  max-width: 150px;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
              }
              .item-qty {
                  width: 30px;
                  text-align: center;
              }
              .item-price {
                  width: 80px;
                  text-align: right;
                  font-weight: bold;
              }
              .total-section {
                  border-top: 2px solid #000;
                  padding-top: 10px;
                  margin-top: 15px;
              }
              .total-row {
                  display: flex;
                  justify-content: space-between;
                  font-weight: bold;
                  font-size: 14px;
                  margin-bottom: 5px;
              }
              .points-row {
                  display: flex;
                  justify-content: space-between;
                  font-size: 10px;
                  color: #666;
                  margin-bottom: 5px;
              }
              .footer {
                  text-align: center;
                  margin-top: 20px;
                  padding-top: 15px;
                  border-top: 1px dashed #999;
                  font-size: 9px;
                  color: #666;
              }
              .footer-line {
                  margin-bottom: 5px;
              }
              @media print {
                  body { padding: 0; margin: 0; }
                  .receipt { width: 100%; border: none; margin: 0; }
              }
          </style>
      </head>
      <body>
          <div class="receipt">
              <div class="header">
                  <div class="title">KOPERASI DESA</div>
                  <div class="subtitle">Jl. Desa Sejahtera No. 123</div>
                  <div class="subtitle">Telp: (021) 1234-5678</div>
                  <div class="subtitle">Email: info@koperasidesa.com</div>
              </div>
              
              <div class="info-section">
                  <div class="info-row">
                      <span>No. Transaksi</span>
                      <span>#${lastTransaction.id}</span>
                  </div>
                  <div class="info-row">
                      <span>Tanggal</span>
                      <span>${new Date(lastTransaction.tanggalPesanan).toLocaleString('id-ID', {
                        year: 'numeric',
                        month: '2-digit', 
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                  </div>
                  <div class="info-row">
                      <span>Kasir</span>
                      <span>${typeof lastTransaction.karyawan === 'string' ? lastTransaction.karyawan : (lastTransaction.karyawan.fullName || lastTransaction.karyawan.username)}</span>
                  </div>
                  <div class="info-row">
                      <span>Pembeli</span>
                      <span>${lastTransaction.member?.nama || 'Non-Member'}</span>
                  </div>
              </div>
              
              <div class="items-section">
                  <div class="items-header">
                      <span>ITEM</span>
                      <span>QTY</span>
                      <span>HARGA</span>
                  </div>
                  ${lastTransaction.details.map((detail: any) => `
                  <div class="item-row">
                      <span class="item-name">${detail.barang?.nama || 'Produk'}</span>
                      <span class="item-qty">${detail.jumlah}</span>
                      <span class="item-price">${formatCurrency(detail.subtotal)}</span>
                  </div>
                  `).join('')}
              </div>
              
              <div class="total-section">
                  <div class="total-row">
                      <span>TOTAL PEMBAYARAN</span>
                      <span>${formatCurrency(lastTransaction.totalHarga)}</span>
                  </div>
                  ${lastTransaction.totalPoin ? `
                  <div class="points-row">
                      <span>Poin Diperoleh</span>
                      <span>+${lastTransaction.totalPoin} poin</span>
                  </div>
                  ` : ''}
              </div>
              
              <div class="footer">
                  <div class="footer-line">Terima kasih atas kunjungan Anda!</div>
                  <div class="footer-line">Barang yang sudah dibeli tidak dapat dikembalikan</div>
                  <div class="footer-line" style="margin-top: 10px; font-weight: bold;">
                      --- STRUK INI ADALAH BUKTI PEMBAYARAN YANG SAH ---
                  </div>
                  <div class="footer-line" style="margin-top: 15px; font-size: 8px;">
                      Dicetak pada: ${new Date().toLocaleString('id-ID')}
                  </div>
              </div>
          </div>
      </body>
      </html>
      `;

      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      
      // Wait for content to load before printing
      setTimeout(() => {
        printWindow.print();
        toast({
          title: "Berhasil",
          description: "Struk pembayaran telah dicetak",
        });
        printWindow.close();
      }, 100);

    } catch (error) {
      console.error('Error printing receipt:', error);
      toast({
        title: "Error",
        description: "Gagal mencetak struk pembayaran",
        variant: "destructive"
      });
    }
  };

  const totalPesananHariIni = pesanans.filter(p => p.tanggalPesanan === new Date().toISOString().split('T')[0]).length;
  const totalPendapatan = pesanans.filter(p => p.status === 'COMPLETED').reduce((total, p) => total + p.totalHarga, 0);
  const totalPending = pesanans.filter(p => p.status === 'PENDING').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manajemen Pesanan</h1>
        <p className="text-gray-600 dark:text-gray-400">Kelola pesanan dan penjualan barang</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="w-full overflow-x-auto">
          <TabsList className="grid w-full grid-cols-4 min-w-full md:min-w-0">
            <TabsTrigger value="catalog" className="text-xs sm:text-sm whitespace-nowrap">Katalog</TabsTrigger>
            <TabsTrigger value="cart" className="relative text-xs sm:text-sm whitespace-nowrap">
              Keranjang
              {cart.length > 0 && (
                <Badge className="ml-1 sm:ml-2 px-1 py-0 text-xs">{cart.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="checkout" disabled={cart.length === 0} className="text-xs sm:text-sm whitespace-nowrap">Checkout</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs sm:text-sm whitespace-nowrap">Histori</TabsTrigger>
          </TabsList>
        </div>

        {/* Catalog Tab */}
        <TabsContent value="catalog" className="space-y-6">
          {/* Advanced Filter */}
          <CatalogAdvancedFilter
            filters={catalogFilters}
            onFiltersChange={handleCatalogFiltersChange}
            onSearch={loadCatalogData}
            kategoris={kategoris}
            isLoading={catalogPagination.loading}
            totalItems={catalogPagination.totalElements}
          />

          {/* Product Grid */}
          {isLoadingData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="aspect-square bg-gray-200 rounded-md mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className={getGridClasses(catalogFilters.gridColumns)}>
              {barangs.map((barang) => (
                <Card key={barang.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="aspect-square bg-gray-100 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                      {barang.gambar ? (
                        <img 
                          src={`${config.baseUrl}${barang.gambar}`}
                          alt={barang?.nama || 'Produk'}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4.5-8-4.5m16 0v10l-8 4.5-8-4.5V7" /></svg></div>';
                          }}
                        />
                      ) : (
                        <Package className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <CardTitle className="text-sm sm:text-lg line-clamp-2">{barang?.nama || 'Produk'}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      <Badge variant="outline" className="text-xs">{barang.kategori?.nama || 'Tanpa Kategori'}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                        <span className="text-sm sm:text-lg font-bold text-green-600">
                          {formatCurrency(barang.harga)}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500">
                          {barang.poin} poin
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span>Stok: {barang.stock}</span>
                        <Badge variant={barang.stock > 10 ? "default" : barang.stock > 0 ? "secondary" : "destructive"} className="text-xs">
                          {barang.stock > 10 ? "Tersedia" : barang.stock > 0 ? "Terbatas" : "Habis"}
                        </Badge>
                      </div>
                      {barang.stock > 0 && (
                        <div className="flex items-center space-x-1 sm:space-x-2 mb-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(barang.id, (selectedQuantities[barang.id] || 1) - 1)}
                            disabled={(selectedQuantities[barang.id] || 1) <= 1}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <span className="flex-1 text-center font-medium text-sm sm:text-base">
                            {selectedQuantities[barang.id] || 1}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(barang.id, (selectedQuantities[barang.id] || 1) + 1)}
                            disabled={(selectedQuantities[barang.id] || 1) >= barang.stock}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      )}
                      <Button
                        onClick={(e) => addToCart(barang, e)}
                        disabled={barang.stock === 0}
                        className="w-full text-xs sm:text-sm"
                        size="sm"
                      >
                        <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        {barang.stock === 0 ? "Habis" : "Tambah"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {barangs.length === 0 && !isLoadingData && (
                <div className="col-span-full text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    {searchTerm || selectedKategori !== 'all' 
                      ? 'Tidak ada barang yang ditemukan' 
                      : 'Belum ada barang tersedia'
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {catalogPagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCatalogPageChange(catalogPagination.page - 1)}
                  disabled={catalogPagination.page === 0 || catalogPagination.loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCatalogPageChange(catalogPagination.page + 1)}
                  disabled={catalogPagination.page >= catalogPagination.totalPages - 1 || catalogPagination.loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                Halaman {catalogPagination.page + 1} dari {catalogPagination.totalPages} 
                ({catalogPagination.totalElements} total barang)
              </div>
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pesanan Hari Ini</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPesananHariIni}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalPendapatan)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pesanan Pending</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pesanans.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Filter */}
          <HistoryAdvancedFilter
            filters={historyFilters}
            onFiltersChange={handleHistoryFiltersChange}
            onSearch={loadHistoryData}
            kategoris={kategoris}
            isLoading={historyPagination.loading}
            totalItems={historyPagination.totalElements}
          />

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Pesanan</CardTitle>
              <CardDescription>
                Menampilkan {filteredPesanans.length} dari {pesanans.length} pesanan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">ID Pesanan</TableHead>
                      <TableHead className="whitespace-nowrap">Member</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Karyawan</TableHead>
                      <TableHead className="whitespace-nowrap">Total</TableHead>
                      <TableHead className="whitespace-nowrap hidden md:table-cell">Tanggal</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {filteredPesanans.map((pesanan) => {
                    const statusBadge = getStatusBadge(pesanan.status);
                    return (
                      <TableRow key={pesanan.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">#{pesanan.id}</TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div>
                            <div className="font-medium">{pesanan.member?.nama || 'Non-Member'}</div>
                            <div className="text-xs text-gray-500 sm:hidden">
                              {typeof pesanan.karyawan === 'string' ? pesanan.karyawan : (pesanan.karyawan.fullName || pesanan.karyawan.username)}
                            </div>
                            <div className="text-xs text-gray-500 md:hidden">
                              {pesanan.tanggalPesanan}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{typeof pesanan.karyawan === 'string' ? pesanan.karyawan : (pesanan.karyawan.fullName || pesanan.karyawan.username)}</TableCell>
                        <TableCell className="text-xs sm:text-sm font-medium">{formatCurrency(pesanan.totalHarga)}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs sm:text-sm">{pesanan.tanggalPesanan}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadge.variant} className="text-xs">
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPesanan(pesanan);
                                setIsDetailOpen(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            {pesanan.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => updatePesananStatus(pesanan.id, 'PROCESSING')}
                                  className="h-8 w-8 p-0"
                                >
                                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => updatePesananStatus(pesanan.id, 'CANCELLED')}
                                  className="h-8 w-8 p-0"
                                >
                                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </>
                            )}
                            {pesanan.status === 'PROCESSING' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => updatePesananStatus(pesanan.id, 'COMPLETED')}
                                className="h-8 w-8 p-0"
                              >
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>

              {/* Pagination Controls */}
              {historyPagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleHistoryPageChange(historyPagination.page - 1)}
                      disabled={historyPagination.page === 0 || historyPagination.loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleHistoryPageChange(historyPagination.page + 1)}
                      disabled={historyPagination.page >= historyPagination.totalPages - 1 || historyPagination.loading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600">
                    Halaman {historyPagination.page + 1} dari {historyPagination.totalPages} 
                    ({historyPagination.totalElements} total pesanan)
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cart Tab */}
        <TabsContent value="cart" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Keranjang Belanja</CardTitle>
              <CardDescription>
                {cart.length} barang dalam keranjang
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">Keranjang masih kosong</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.barang.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
                      <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.barang.gambar ? (
                            <img 
                              src={`${config.baseUrl}${item.barang.gambar}`}
                              alt={item.barang?.nama || 'Produk'}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4.5-8-4.5m16 0v10l-8 4.5-8-4.5V7" /></svg></div>';
                              }}
                            />
                          ) : (
                            <Package className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{item.barang?.nama || 'Produk'}</h3>
                          <p className="text-sm text-gray-500">{formatCurrency(item.barang.harga)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-2 min-w-0">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartQuantity(item.barang.id, item.jumlah - 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.jumlah}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartQuantity(item.barang.id, item.jumlah + 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeFromCart(item.barang.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Total: {formatCurrency(getTotalHarga())}</span>
                      <span className="text-sm text-gray-500">Poin: {getTotalPoin()}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" onClick={clearCart} className="order-2 sm:order-1">
                        Kosongkan Keranjang
                      </Button>
                      <Button 
                        className="flex-1 order-1 sm:order-2" 
                        onClick={() => setActiveTab('checkout')}
                      >
                        Lanjut ke Checkout
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checkout Tab */}
        <TabsContent value="checkout" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Checkout Pesanan</CardTitle>
              <CardDescription>
                Lengkapi informasi pembeli dan konfirmasi pesanan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">Tidak ada barang di keranjang</p>
                  <p className="text-sm text-gray-400">Silakan tambahkan barang dari katalog terlebih dahulu</p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
                  {/* Form Section */}
                  <div className="space-y-4 order-2 lg:order-1">
                    <div>
                      <Label htmlFor="employeeName">Nama Pembuat Transaksi</Label>
                      <Input
                        id="employeeName"
                        value={checkoutData.employeeName}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>

                    <div>
                      <Label>Tipe Pembeli</Label>
                      <div className="flex space-x-4 mt-2">
                        <Button
                          variant={!isNonMember ? "default" : "outline"}
                          onClick={() => {
                            setIsNonMember(false);
                            setSelectedMember(null);
                            setCheckoutData(prev => ({ ...prev, buyerName: '', address: '' }));
                          }}
                        >
                          Member
                        </Button>
                        <Button
                          variant={isNonMember ? "default" : "outline"}
                          onClick={() => {
                            setIsNonMember(true);
                            setSelectedMember(null);
                            setCheckoutData(prev => ({ ...prev, buyerName: 'Pembeli Anonim', address: '' }));
                          }}
                        >
                          Non Member
                        </Button>
                      </div>
                    </div>

                    {!isNonMember ? (
                      <div>
                        <Label htmlFor="member">Pilih Member {selectedMember && '✓'}</Label>
                        <Select 
                          value={selectedMember?.id.toString() || ''}
                          onValueChange={(value) => {
                            const member = allMembers.find(m => m.id.toString() === value);
                            setSelectedMember(member || null);
                            if (member) {
                              setCheckoutData(prev => ({
                                ...prev,
                                buyerName: member?.nama || '',
                                address: member?.alamat || ''
                              }));
                            }
                          }}
                          onOpenChange={(open) => {
                            setIsDropdownOpen(open);
                            if (open) {
                              // Clear search when opening
                              setMemberSearchTerm('');
                              // Focus search input after dropdown opens
                              setTimeout(() => {
                                const searchInput = document.querySelector('[data-member-search-input]') as HTMLInputElement;
                                if (searchInput) {
                                  searchInput.focus();
                                }
                              }, 100);
                            }
                          }}
                        >
                          <SelectTrigger className={`${selectedMember ? 'border-green-500 bg-green-50' : ''}`}>
                            <SelectValue placeholder="🔍 Cari dan pilih member...">
                              {selectedMember ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-green-600">✓</span>
                                  <span>{selectedMember.nama}</span>
                                  <span className="text-gray-500 text-sm">({selectedMember.telepon})</span>
                                </div>
                              ) : (
                                "🔍 Ketik untuk mencari member..."
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            <div className="sticky top-0 bg-white p-2 border-b">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                  data-member-search-input
                                  placeholder="Ketik nama atau nomor telepon..."
                                  value={memberSearchTerm}
                                  onChange={(e) => setMemberSearchTerm(e.target.value)}
                                  className="pl-10"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    // Prevent the Select from closing when typing
                                    e.stopPropagation();
                                    
                                    // Handle Enter key to select first result
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const filteredMembers = allMembers.filter(member => 
                                        member?.nama?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                                        (member?.telepon && member.telepon.includes(memberSearchTerm)) ||
                                        (member?.email && member.email.toLowerCase().includes(memberSearchTerm.toLowerCase()))
                                      );
                                      if (filteredMembers.length > 0) {
                                        const firstMember = filteredMembers[0];
                                        setSelectedMember(firstMember);
                                        setCheckoutData(prev => ({
                                          ...prev,
                                          buyerName: firstMember?.nama || '',
                                          address: firstMember.alamat || ''
                                        }));
                                        // Close dropdown
                                        const selectTrigger = document.querySelector('[data-state="open"]') as HTMLElement;
                                        if (selectTrigger) {
                                          selectTrigger.click();
                                        }
                                      }
                                    }
                                  }}
                                />
                              </div>
                              {memberSearchTerm && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {allMembers.filter(member => 
                                    member.nama.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                                    (member.telepon && member.telepon.includes(memberSearchTerm)) ||
                                    (member.email && member.email.toLowerCase().includes(memberSearchTerm.toLowerCase()))
                                  ).length} member ditemukan
                                </p>
                              )}
                              {!memberSearchTerm && (
                                <p className="text-xs text-blue-600 mt-1">
                                  💡 Tip: Langsung ketik untuk mencari member
                                </p>
                              )}
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {allMembers
                                .filter(member => 
                                  member?.nama?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                                  (member?.telepon && member.telepon.includes(memberSearchTerm)) ||
                                  (member?.email && member.email.toLowerCase().includes(memberSearchTerm.toLowerCase()))
                                )
                                .slice(0, 50) // Limit to 50 results for performance
                                .map((member) => (
                                  <SelectItem key={member.id} value={member.id.toString()} className="cursor-pointer">
                                    <div className="flex flex-col gap-1 py-1">
                                      <div className="font-medium">{member?.nama || 'Nama tidak tersedia'}</div>
                                      <div className="text-sm text-gray-500 flex gap-2">
                                        {member.telepon && <span>📞 {member.telepon}</span>}
                                        {member.email && <span>✉️ {member.email}</span>}
                                      </div>
                                      {member.alamat && (
                                        <div className="text-xs text-gray-400 truncate max-w-xs">
                                          📍 {member.alamat}
                                        </div>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              {allMembers.filter(member => 
                                member?.nama?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                                (member?.telepon && member.telepon.includes(memberSearchTerm)) ||
                                (member?.email && member.email.toLowerCase().includes(memberSearchTerm.toLowerCase()))
                              ).length === 0 && memberSearchTerm && (
                                <div className="p-4 text-center text-gray-500">
                                  <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                  <p>Tidak ada member ditemukan</p>
                                  <p className="text-xs">Coba kata kunci lain atau daftar member baru</p>
                                </div>
                              )}
                            </div>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="buyerName">Nama Pembeli</Label>
                        <Input
                          id="buyerName"
                          value={checkoutData.buyerName}
                          onChange={(e) => setCheckoutData(prev => ({ ...prev, buyerName: e.target.value }))}
                          placeholder="Masukkan nama pembeli atau kosongkan untuk anonim"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="address">Alamat</Label>
                      <textarea
                        id="address"
                        value={checkoutData.address}
                        onChange={(e) => setCheckoutData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder={isNonMember ? "Masukkan alamat (opsional)" : "Alamat dari data member"}
                        className="w-full p-2 border rounded-md resize-none h-20"
                        disabled={!isNonMember && !!selectedMember}
                      />
                    </div>

                    <div>
                      <Label>Metode Pembayaran</Label>
                      <Select value={checkoutData.paymentMethod} onValueChange={(value) => setCheckoutData(prev => ({ ...prev, paymentMethod: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">Cash (Tunai)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="space-y-4 order-1 lg:order-2">
                    <h3 className="font-semibold text-lg">Ringkasan Pesanan</h3>
                    <div className="border rounded-lg p-4 space-y-3">
                      {cart.map((item) => (
                        <div key={item.barang.id} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{item.barang?.nama || 'Produk'}</p>
                            <p className="text-sm text-gray-500">{item.jumlah}x {formatCurrency(item.barang.harga)}</p>
                          </div>
                          <p className="font-medium">{formatCurrency(item.barang.harga * item.jumlah)}</p>
                        </div>
                      ))}
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex justify-between">
                          <span>Total Item:</span>
                          <span>{cart.reduce((total, item) => total + item.jumlah, 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Poin:</span>
                          <span>{cart.reduce((total, item) => total + (item.barang.poin * item.jumlah), 0)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total Harga:</span>
                          <span>{formatCurrency(getTotalHarga())}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handlePayment}
                      disabled={isLoading || (!selectedMember && !isNonMember) || (!checkoutData.buyerName.trim() && isNonMember)}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? 'Memproses Pembayaran...' : `Bayar ${formatCurrency(getTotalHarga())}`}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Pesanan Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pesanan #{selectedPesanan?.id}</DialogTitle>
            <DialogDescription>
              Informasi lengkap pesanan
            </DialogDescription>
          </DialogHeader>
          {selectedPesanan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Member</Label>
                  <p className="font-medium">{selectedPesanan.member?.nama || 'Non-Member'}</p>
                  <p className="text-sm text-gray-500">{selectedPesanan.member?.telepon || '-'}</p>
                </div>
                <div>
                  <Label>Karyawan</Label>
                  <p className="font-medium">{typeof selectedPesanan.karyawan === 'string' ? selectedPesanan.karyawan : (selectedPesanan.karyawan.fullName || selectedPesanan.karyawan.username)}</p>
                </div>
                <div>
                  <Label>Tanggal Pesanan</Label>
                  <p className="font-medium">{selectedPesanan.tanggalPesanan}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={getStatusBadge(selectedPesanan.status).variant}>
                    {getStatusBadge(selectedPesanan.status).label}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label>Detail Barang</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Barang</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPesanan.details.map((detail) => (
                      <TableRow key={detail.id}>
                        <TableCell>{detail.barang?.nama || 'Produk'}</TableCell>
                        <TableCell>{detail.jumlah}</TableCell>
                        <TableCell>{formatCurrency(detail.hargaSatuan)}</TableCell>
                        <TableCell>{formatCurrency(detail.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">
                    Total: {formatCurrency(selectedPesanan.totalHarga)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Poin: {selectedPesanan.totalPoin}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cart Dialog */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Keranjang Belanja</DialogTitle>
            <DialogDescription>
              Item yang akan dibeli
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Keranjang kosong</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.barang.id} className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                      {item.barang.gambar ? (
                        <img 
                          src={`${config.baseUrl}${item.barang.gambar}`}
                          alt={item.barang?.nama || 'Produk'}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4.5-8-4.5m16 0v10l-8 4.5-8-4.5V7" /></svg></div>';
                          }}
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{item.barang?.nama || 'Produk'}</h3>
                      <p className="text-sm text-gray-500">{formatCurrency(item.barang.harga)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCartQuantity(item.barang.id, item.jumlah - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.jumlah}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCartQuantity(item.barang.id, item.jumlah + 1)}
                      disabled={item.jumlah >= item.barang.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromCart(item.barang.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          {cart.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">
                  Total: {formatCurrency(cart.reduce((sum, item) => sum + (item.barang.harga * item.jumlah), 0))}
                </span>
                <span className="text-sm text-gray-500">
                  Poin: {cart.reduce((sum, item) => sum + (item.barang.poin * item.jumlah), 0)}
                </span>
              </div>
              <Button 
                onClick={() => {
                  setIsCartOpen(false);
                  setActiveTab('checkout');
                }}
                className="w-full"
              >
                Checkout
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCartOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Cart Button */}
      <Button
        id="floating-cart-button"
        onClick={() => setActiveTab('cart')}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 ${
          cartAnimation ? 'animate-bounce scale-110' : ''
        }`}
        size="lg"
      >
        <div className="relative">
          <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
          {cart.length > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-xs animate-bounce"
              variant="destructive"
            >
              {cart.reduce((sum, item) => sum + item.jumlah, 0)}
            </Badge>
          )}
        </div>
      </Button>

      {/* Bottom Notification */}
      {notification.show && (
        <div className="fixed bottom-16 sm:bottom-20 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 bg-green-600 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Success Payment Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-3 text-green-600 text-xl">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              Pembayaran Berhasil!
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Terima kasih sudah berbelanja di koperasi kami
            </DialogDescription>
          </DialogHeader>
          {lastTransaction && (
            <div className="space-y-6">
              {/* Transaction Summary */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg text-gray-800 mb-3 text-center">
                  Ringkasan Pembelian
                </h3>
                
                <div className="space-y-3">
                  {lastTransaction.details.map((detail: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">{detail.barang?.nama || 'Produk'}</span>
                        <span className="text-gray-500 ml-2">x{detail.jumlah}</span>
                      </div>
                      <span className="font-semibold text-gray-800">
                        {formatCurrency(detail.subtotal)}
                      </span>
                    </div>
                  ))}
                  
                  <div className="border-t-2 border-green-200 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-800">Total Pembayaran:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(lastTransaction.totalHarga)}
                      </span>
                    </div>
                    {lastTransaction.totalPoin && (
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">Poin Diperoleh:</span>
                        <span className="text-sm font-semibold text-blue-600">
                          +{lastTransaction.totalPoin} poin
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500 block mb-1">Pembeli:</span>
                  <span className="font-medium text-gray-800">{lastTransaction.member?.nama || 'Non-Member'}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500 block mb-1">Kasir:</span>
                  <span className="font-medium text-gray-800">
                    {typeof lastTransaction.karyawan === 'string' ? lastTransaction.karyawan : (lastTransaction.karyawan.fullName || lastTransaction.karyawan.username)}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500 block mb-1">Tanggal:</span>
                  <span className="font-medium text-gray-800">
                    {new Date(lastTransaction.tanggalPesanan).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500 block mb-1">ID Transaksi:</span>
                  <span className="font-medium text-gray-800">#{lastTransaction.id}</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handlePrintReceipt}
              className="flex-1 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
            >
              <span className="mr-2">�️</span>
              Cetak Struk
            </Button>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                setActiveTab('orders');
              }}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <span className="mr-2">📄</span>
              Lihat Histori
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}