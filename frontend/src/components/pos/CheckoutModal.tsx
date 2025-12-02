'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Search, CreditCard, DollarSign } from 'lucide-react';
import { CartItem, Member } from './types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  members: Member[];
  onCheckout: (data: CheckoutData) => void;
  isLoading?: boolean;
}

export interface CheckoutData {
  selectedMember: Member | null;
  isNonMember: boolean;
  buyerName: string;
  address: string;
  paymentMethod: string;
}

export function CheckoutModal({
  isOpen,
  onClose,
  cart,
  members,
  onCheckout,
  isLoading = false
}: CheckoutModalProps) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isNonMember, setIsNonMember] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  const filteredMembers = members.filter(member =>
    member.nama.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    (member.email && member.email.toLowerCase().includes(memberSearchTerm.toLowerCase())) ||
    (member.telepon && member.telepon.includes(memberSearchTerm))
  );

  const handleSubmit = () => {
    const checkoutData: CheckoutData = {
      selectedMember,
      isNonMember,
      buyerName: isNonMember ? (buyerName || 'Pembeli Anonim') : selectedMember?.nama || '',
      address,
      paymentMethod
    };
    
    onCheckout(checkoutData);
  };

  const handleClose = () => {
    // Reset form
    setSelectedMember(null);
    setIsNonMember(false);
    setBuyerName('');
    setAddress('');
    setPaymentMethod('CASH');
    setMemberSearchTerm('');
    setIsDropdownOpen(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[1200px] lg:max-w-[1400px] xl:max-w-[1600px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Checkout Pesanan
          </DialogTitle>
          <DialogDescription>
            Lengkapi informasi pembeli dan konfirmasi pesanan
          </DialogDescription>
        </DialogHeader>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Form Section - Left Column */}
          <div className="space-y-6 order-2 lg:order-1">
            {/* Customer Selection */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="text-xl font-semibold">Tipe Pembeli</Label>
              </div>
              
              {/* Member/Non-Member Toggle - Larger */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={!isNonMember ? "default" : "outline"}
                  onClick={() => {
                    setIsNonMember(false);
                    setSelectedMember(null);
                    setBuyerName('');
                    setAddress('');
                  }}
                  className="h-16 text-lg font-medium"
                  size="lg"
                >
                  <User className="h-6 w-6 mr-3" />
                  Member
                </Button>
                <Button
                  type="button"
                  variant={isNonMember ? "default" : "outline"}
                  onClick={() => {
                    setIsNonMember(true);
                    setSelectedMember(null);
                    setBuyerName('');
                    setAddress('');
                  }}
                  className="h-16 text-lg font-medium"
                  size="lg"
                >
                  <User className="h-6 w-6 mr-3" />
                  Non Member
                </Button>
              </div>

              {!isNonMember ? (
                <div className="space-y-4">
                  <Label className="text-lg font-medium">Pilih Member</Label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        placeholder="Cari member..."
                        value={memberSearchTerm}
                        onChange={(e) => {
                          setMemberSearchTerm(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className="pl-12 h-12 text-lg"
                      />
                    </div>
                    
                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                        {filteredMembers.length > 0 ? (
                          filteredMembers.map((member) => (
                            <button
                              key={member.id}
                              type="button"
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b last:border-b-0"
                              onClick={() => {
                                setSelectedMember(member);
                                setMemberSearchTerm(member.nama);
                                setAddress(member.alamat || ''); // Auto-fill address
                                setIsDropdownOpen(false);
                              }}
                            >
                              <div className="font-medium">{member.nama}</div>
                              {member.email && (
                                <div className="text-sm text-gray-600">{member.email}</div>
                              )}
                              {member.telepon && (
                                <div className="text-sm text-gray-600">{member.telepon}</div>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">
                            Tidak ada member ditemukan
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {selectedMember && (
                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800 dark:text-green-200">
                          Member Terpilih
                        </span>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{selectedMember.nama}</div>
                        {selectedMember.email && (
                          <div className="text-gray-600">{selectedMember.email}</div>
                        )}
                        {selectedMember.telepon && (
                          <div className="text-gray-600">{selectedMember.telepon}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Label htmlFor="buyer-name" className="text-lg font-medium">Nama Pembeli</Label>
                  <Input
                    id="buyer-name"
                    placeholder="Masukkan nama pembeli (opsional)"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>
              )}

              {/* Address */}
              <div className="space-y-4">
                <Label htmlFor="address" className="text-lg font-medium">
                  Alamat {!isNonMember && selectedMember ? '(dari data member)' : '(Opsional)'}
                </Label>
                <textarea
                  id="address"
                  placeholder={isNonMember ? "Masukkan alamat (opsional)" : "Alamat akan terisi otomatis dari data member"}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-4 border rounded-md resize-none h-24 text-lg"
                  disabled={!isNonMember && !!selectedMember}
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-4">
                <Label className="text-lg font-medium">Metode Pembayaran</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('CASH')}
                    className="flex-1 h-16 text-lg font-medium"
                    size="lg"
                  >
                    <DollarSign className="h-6 w-6 mr-3" />
                    Cash (Tunai)
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary - Right Column */}
          <div className="space-y-6 order-1 lg:order-2">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Ringkasan Pesanan</h3>
              
              {/* Order Items */}
              <div className="border rounded-lg">
                <ScrollArea className="h-96 p-4">
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.barang.id} className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium">{item.barang.nama}</p>
                          <p className="text-sm text-gray-500">
                            {item.jumlah}x {formatCurrency(item.barang.harga)}
                          </p>
                        </div>
                        <p className="font-medium">
                          {formatCurrency(item.barang.harga * item.jumlah)}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Order Summary Totals */}
                <div className="border-t p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Total Item:</span>
                    <span>{getTotalItems()} barang</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Poin:</span>
                    <span className="text-blue-600">+{getTotalPoin()} poin</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Harga:</span>
                    <span className="text-green-600">{formatCurrency(getTotalHarga())}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleSubmit}
                disabled={isLoading || (!isNonMember && !selectedMember)}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isLoading ? 'Memproses...' : `Bayar ${formatCurrency(getTotalHarga())}`}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 lg:hidden">
          <Button variant="outline" onClick={handleClose}>
            Batal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
