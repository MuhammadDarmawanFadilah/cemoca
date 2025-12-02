'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Minus, ShoppingCart, Trash2, CreditCard, ChevronRight } from 'lucide-react';
import { CartItem } from './types';
import './pos-styles.css';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (barangId: number, quantity: number) => void;
  onRemoveItem: (barangId: number) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  isLoading?: boolean;
}

export function CartSidebar({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  isLoading = false
}: CartSidebarProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const getTotalHarga = () => {
    return cart.reduce((total, item) => total + (item.barang.harga * item.jumlah), 0);
  };

  const getTotalPoin = () => {
    return cart.reduce((total, item) => total + (item.barang.poin * item.jumlah), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.jumlah, 0);
  };

  if (!isAnimating && !isOpen) return null;

  return (
    <>
      {/* Mobile backdrop only */}
      <div 
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 sm:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-80 lg:w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 transition-transform duration-300 ease-in-out border-l-2 border-gray-300 dark:border-gray-600 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Close Arrow Button on Left Edge */}
        <Button
          onClick={onClose}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-3 w-10 h-16 rounded-l-lg bg-green-600 hover:bg-green-700 text-white shadow-xl z-20 flex items-center justify-center p-0 transition-all duration-300 hover:scale-105"
          title="Tutup Keranjang"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
        
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Keranjang Belanja</h2>
              {cart.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {getTotalItems()} item
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-2">Keranjang masih kosong</p>
                  <p className="text-sm text-gray-400">Pilih barang untuk mulai berbelanja</p>
                </div>
              </div>
            ) : (
              <>
                {/* Cart Items with proper scroll */}
                <div className="flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto px-4 cart-scroll">
                    <div className="space-y-4 py-4">
                      {cart.map((item) => (
                        <Card key={item.barang.id} className="relative">
                          <CardContent className="p-4">
                            <div className="flex gap-3">
                              <img
                                src={item.barang.gambar || '/api/placeholder/60/60'}
                                alt={item.barang.nama}
                                className="w-16 h-16 object-cover rounded-md"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/api/placeholder/60/60';
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-2 mb-1">
                                  {item.barang.nama}
                                </h4>
                                <p className="text-xs text-gray-500 mb-2">
                                  {item.barang.kategori.nama}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-green-600">
                                    {formatCurrency(item.barang.harga)}
                                  </span>
                                  <span className="text-xs text-blue-600">
                                    +{item.barang.poin} poin
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center border rounded-md">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => onUpdateQuantity(item.barang.id, item.jumlah - 1)}
                                  disabled={isLoading}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-12 text-center text-sm">
                                  {item.jumlah}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => onUpdateQuantity(item.barang.id, item.jumlah + 1)}
                                  disabled={isLoading || item.jumlah >= item.barang.stock}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">
                                  {formatCurrency(item.barang.harga * item.jumlah)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onRemoveItem(item.barang.id)}
                                  disabled={isLoading}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t p-4 space-y-4 bg-white dark:bg-gray-900">
                  {/* Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Item:</span>
                      <span>{getTotalItems()} barang</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Poin:</span>
                      <span className="text-blue-600">+{getTotalPoin()} poin</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total Bayar:</span>
                      <span className="text-green-600">{formatCurrency(getTotalHarga())}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={onCheckout}
                      disabled={isLoading}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Checkout
                    </Button>
                    <Button
                      variant="outline"
                      onClick={onClearCart}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Kosongkan Keranjang
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}