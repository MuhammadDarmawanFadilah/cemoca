'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, History, Menu } from 'lucide-react';

import {
  ProductCatalog,
  CartSidebar,
  CheckoutModal,
  SuccessModal,
  OrderHistoryModal,
  Notification,
  type Barang,
  type Kategori,
  type CartItem,
  type Member,
  type Pesanan,
  type CatalogFilters,
  type Pagination,
  type CheckoutData
} from '@/components/pos';

import { KategoriService, BarangService } from '@/services/barangService';
import { memberService } from '@/services/memberService';
import { pesananService } from '@/services/pesananService';
import { cartService } from '@/services/cartService';
import { getApiUrl } from '@/lib/config';

export default function POSPage() {
  // State management
  const [barangs, setBarangs] = useState<Barang[]>([]);
  const [kategoris, setKategoris] = useState<Kategori[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [pesanans, setPesanans] = useState<Pesanan[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // UI State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedPesanan, setSelectedPesanan] = useState<Pesanan | null>(null);
  const [lastTransaction, setLastTransaction] = useState<Pesanan | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Form states
  const [selectedQuantities, setSelectedQuantities] = useState<{[key: number]: number}>({});
  const [notification, setNotification] = useState<{show: boolean, message: string}>({show: false, message: ''});
  const [cartAnimation, setCartAnimation] = useState(false);
  
  // Filter and pagination states
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilters>({
    searchTerm: '',
    kategoriId: null,
    sortBy: 'id',
    sortDir: 'desc',
    pageSize: 10,
    gridColumns: 4,
    minHarga: null,
    maxHarga: null
  });
  
  const getDefaultDateRange = () => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
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
  
  const [catalogPagination, setCatalogPagination] = useState<Pagination>({
    page: 0,
    totalPages: 0,
    totalElements: 0,
    loading: false
  });
  
  const [historyPagination, setHistoryPagination] = useState<Pagination>({
    page: 0,
    totalPages: 0,
    totalElements: 0,
    loading: false
  });

  const [currentUserId] = useState(1);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadData();
    loadCart();
  }, []);

  useEffect(() => {
    if (!isLoadingData) {
      loadCatalogData();
    }
  }, [catalogPagination.page]);

  useEffect(() => {
    if (!isLoadingData) {
      loadHistoryData();
    }
  }, [historyFilters, historyPagination.page]);

  // Data loading functions
  const loadData = async () => {
    try {
      setIsLoadingData(true);
      const [kategoriData, memberData] = await Promise.all([
        KategoriService.getAllKategori(),
        memberService.getAllMembers()
      ]);
      
      setKategoris(kategoriData);
      setMembers(memberData);
      
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
      
      const activeBarangs = response.content.filter((barang: any) => barang.isActive);
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
      const frontendCart: CartItem[] = cartData.map((item: any) => ({
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
    }
  };

  // Cart management functions
  const addToCart = async (barang: Barang, event?: React.MouseEvent) => {
    const quantity = selectedQuantities[barang.id] || 1;
    
    try {
      if (event) {
        createFlyingAnimation(event, barang);
      }
      
      await cartService.addToCart({
        userId: currentUserId,
        barangId: barang.id,
        jumlah: quantity
      });
      
      await loadCart();
      
      setCartAnimation(true);
      setTimeout(() => setCartAnimation(false), 300);
      
      setNotification({
        show: true,
        message: `${barang?.nama || 'Produk'} sejumlah ${quantity} sudah ditambahkan ke keranjang`
      });
      
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
      setCart([]);
    }
  };

  // Checkout functions
  const handleCheckout = async (checkoutData: CheckoutData) => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Keranjang kosong",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const pesananRequest = {
        pesanan: {
          memberId: checkoutData.isNonMember ? undefined : checkoutData.selectedMember?.id,
          karyawanId: currentUserId
        },
        details: cart.map(item => ({
          barangId: item.barang.id,
          jumlah: item.jumlah
        }))
      };

      const newTransaction = await pesananService.createPesanan(pesananRequest);
      
      await clearCart();
      setIsCheckoutOpen(false);
      
      setLastTransaction({
        ...newTransaction,
        member: checkoutData.isNonMember ? {
          id: 0,
          nama: checkoutData.buyerName || 'Pembeli Anonim',
          alamat: checkoutData.address
        } : checkoutData.selectedMember,
        details: cart.map(item => ({
          id: Date.now() + item.barang.id,
          barang: item.barang,
          jumlah: item.jumlah,
          hargaSatuan: item.barang.harga,
          subtotal: item.barang.harga * item.jumlah
        }))
      } as any);
      
      await loadData();
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

  // Flying animation for cart
  const createFlyingAnimation = (event: React.MouseEvent, barang: Barang) => {
    const button = event.currentTarget as HTMLElement;
    const buttonRect = button.getBoundingClientRect();
    
    const cartButton = document.getElementById('floating-cart-button') as HTMLElement;
    if (!cartButton) return;
    
    const cartRect = cartButton.getBoundingClientRect();
    const flyingElement = document.createElement('div');
    flyingElement.className = 'fly-to-cart';
    
    const startX = buttonRect.left + buttonRect.width / 2 - 20;
    const startY = buttonRect.top + buttonRect.height / 2 - 20;
    const endX = cartRect.left + cartRect.width / 2 - 20;
    const endY = cartRect.top + cartRect.height / 2 - 20;
    
    flyingElement.style.cssText = `
      position: fixed;
      z-index: 9999;
      left: ${startX}px;
      top: ${startY}px;
      width: 40px;
      height: 40px;
      background-color: #10b981;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      border: 2px solid #ffffff;
      transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      pointer-events: none;
    `;
    
    flyingElement.innerHTML = `
      <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    `;
    
    document.body.appendChild(flyingElement);
    
    setTimeout(() => {
      flyingElement.style.left = `${endX}px`;
      flyingElement.style.top = `${endY}px`;
      flyingElement.style.transform = 'scale(0.3)';
      flyingElement.style.opacity = '0';
    }, 10);
    
    setTimeout(() => {
      if (document.body.contains(flyingElement)) {
        document.body.removeChild(flyingElement);
      }
    }, 1000);
  };

  // Print receipt function
  const handlePrintReceipt = () => {
    if (!lastTransaction) return;

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

      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
      };

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Main Content */}
      <div className="h-screen overflow-hidden p-2 sm:p-4">
        <ProductCatalog
          barangs={barangs}
          kategoris={kategoris}
          catalogFilters={catalogFilters}
          catalogPagination={catalogPagination}
          selectedQuantities={selectedQuantities}
          isLoadingData={isLoadingData}
          onFiltersChange={(filters) => {
            setCatalogFilters(filters);
            setCatalogPagination(prev => ({ ...prev, page: 0 }));
          }}
          onSearch={loadCatalogData}
          onPageChange={(page) => setCatalogPagination(prev => ({ ...prev, page }))}
          onAddToCart={addToCart}
          onUpdateQuantity={updateQuantity}
          onHistoryClick={() => setIsHistoryOpen(true)}
          isCartOpen={isCartOpen}
        />
      </div>

      {/* Floating Cart Button - Hidden when cart is open */}
      {!isCartOpen && (
        <Button
          id="floating-cart-button"
          onClick={() => setIsCartOpen(!isCartOpen)}
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-[70] bg-green-600 hover:bg-green-700 ${
            cartAnimation ? 'animate-bounce scale-110' : ''
          }`}
          size="lg"
          title="Buka Keranjang"
        >
          <div className="relative">
            <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7" />
            {cart.length > 0 && (
              <Badge 
                className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold animate-pulse"
                variant="destructive"
              >
                {cart.reduce((sum, item) => sum + item.jumlah, 0)}
              </Badge>
            )}
          </div>
        </Button>
      )}

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        isLoading={isLoading}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        members={members}
        onCheckout={handleCheckout}
        isLoading={isLoading}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        transaction={lastTransaction}
        onPrintReceipt={handlePrintReceipt}
        onViewHistory={() => {
          setShowSuccessModal(false);
          setIsHistoryOpen(true);
        }}
      />

      {/* Order History Modal */}
      <OrderHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        pesanans={pesanans}
        kategoris={kategoris}
        historyFilters={historyFilters}
        historyPagination={historyPagination}
        onFiltersChange={(filters) => {
          setHistoryFilters(filters);
          setHistoryPagination(prev => ({ ...prev, page: 0 }));
        }}
        onSearch={loadHistoryData}
        onPageChange={(page) => setHistoryPagination(prev => ({ ...prev, page }))}
        onViewDetail={(pesanan) => {
          setSelectedPesanan(pesanan);
          setIsDetailOpen(true);
        }}
        onUpdateStatus={async (pesananId, status) => {
          try {
            const response = await fetch(getApiUrl(`/api/pesanan/${pesananId}/status`), {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ status })
            });

            if (!response.ok) {
              throw new Error('Failed to update status');
            }

            const updatedPesanan = await response.json();

            // Update local state
            setPesanans(prev =>
              prev.map(pesanan =>
                pesanan.id === pesananId
                  ? { ...pesanan, status: updatedPesanan.status }
                  : pesanan
              )
            );

            toast({
              title: "Berhasil",
              description: "Status pesanan berhasil diperbarui",
            });

            // Reload history data
            await loadHistoryData();

          } catch (error) {
            console.error('Error updating status:', error);
            toast({
              title: "Error",
              description: "Gagal memperbarui status pesanan",
              variant: "destructive"
            });
          }
        }}
      />

      {/* Notification */}
      <Notification
        show={notification.show}
        message={notification.message}
        onHide={() => setNotification({ show: false, message: '' })}
      />
    </div>
  );
}
