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
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Search, Package, AlertTriangle, Eye, Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast-simple';
import { getImageUrl } from '@/lib/imageUtils';
import Image from 'next/image';
import { BarangService, KategoriService } from '@/services/barangService';
import { config } from '@/lib/config';
import { FileUploadService } from '@/services/fileUploadService';
import { Barang, CreateBarangRequest } from '@/types/barang';
import { Kategori } from '@/types/kategori';

export default function BarangPage() {
  const [barangs, setBarangs] = useState<Barang[]>([]);
  const [filteredBarangs, setFilteredBarangs] = useState<Barang[]>([]);
  const [kategoris, setKategoris] = useState<Kategori[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string>('');
  const [editingBarang, setEditingBarang] = useState<Barang | null>(null);
  const [viewingBarang, setViewingBarang] = useState<Barang | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    kategoriId: '',
    berat: '',
    stock: '',
    harga: '',
    poin: '',
    gambar: '',
    isActive: true
  });

  const { toast } = useToast();

  // Helper functions for currency formatting
  const formatCurrency = (value: string | number): string => {
    const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9]/g, '')) : value;
    if (isNaN(numericValue) || numericValue === 0) return '';
    return numericValue.toLocaleString('id-ID');
  };

  const parseCurrency = (formattedValue: string): string => {
    return formattedValue.replace(/[^0-9]/g, '');
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter barang berdasarkan search term dan kategori
  useEffect(() => {
    let filtered = barangs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(barang =>
        barang.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barang.kategori.nama.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by kategori
    if (selectedKategori !== 'all') {
      filtered = filtered.filter(barang => barang.kategori.id.toString() === selectedKategori);
    }

    setFilteredBarangs(filtered);
  }, [searchTerm, selectedKategori, barangs]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [barangData, kategoriData] = await Promise.all([
        BarangService.getAllBarang(),
        KategoriService.getAllKategori()
      ]);
      
      setBarangs(barangData);
      setKategoris(kategoriData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Upload image if file is selected
      let imageUrl = formData.gambar;
      if (selectedFile) {
        setUploading(true);
        const uploadResult = await FileUploadService.uploadImage(selectedFile);
        if (uploadResult.success && uploadResult.url) {
          imageUrl = uploadResult.url;
        } else {
          throw new Error(uploadResult.message);
        }
        setUploading(false);
      }

      const barangData: CreateBarangRequest = {
        nama: formData.nama,
        kategoriId: parseInt(formData.kategoriId),
        berat: parseFloat(formData.berat),
        stock: parseInt(formData.stock),
        harga: parseInt(parseCurrency(formData.harga)),
        poin: parseInt(formData.poin),
        gambar: imageUrl,
      };

      if (editingBarang) {
        await BarangService.updateBarang(editingBarang.id, barangData);
        toast({
          title: "Berhasil",
          description: "Barang berhasil diperbarui",
        });
      } else {
        await BarangService.createBarang(barangData);
        toast({
          title: "Berhasil",
          description: "Barang berhasil ditambahkan",
        });
      }

      handleCloseDialog();
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error saving barang:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menyimpan barang",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setUploading(false);
    }
  };

  const handleEdit = (barang: Barang) => {
    setEditingBarang(barang);
    setFormData({
      nama: barang.nama,
      kategoriId: barang.kategori.id.toString(),
      berat: barang.berat.toString(),
      stock: barang.stock.toString(),
      harga: formatCurrency(barang.harga),
      poin: barang.poin.toString(),
      gambar: barang.gambar || '',
      isActive: barang.isActive
    });
    if (barang.gambar) {
      setPreviewUrl(`${config.baseUrl}${barang.gambar}`);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus barang ini?')) {
      try {
        await BarangService.deleteBarang(id);
        toast({
          title: "Berhasil",
          description: "Barang berhasil dihapus",
        });
        await loadData(); // Reload data
      } catch (error) {
        console.error('Error deleting barang:', error);
        toast({
          title: "Error",
          description: "Gagal menghapus barang",
          variant: "destructive"
        });
      }
    }
  };

  const handleCloseDialog = () => {
    // Cleanup object URLs to prevent memory leaks
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setIsDialogOpen(false);
    setEditingBarang(null);
    setSelectedFile(null);
    setPreviewUrl('');
    setImageDataUrl('');
    setFormData({
      nama: '',
      kategoriId: '',
      berat: '',
      stock: '',
      harga: '',
      poin: '',
      gambar: '',
      isActive: true
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        toast({
          title: "Error",
          description: "File harus berformat JPEG atau PNG",
          variant: "destructive"
        });
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Ukuran file maksimal 5MB",
          variant: "destructive"
        });
        return;
      }

      console.log('File selected:', file.name, file.type, file.size);
      setSelectedFile(file);
      
      // Create preview using createObjectURL for better performance
      try {
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        console.log('Object URL created:', objectUrl);
        
        // Also create data URL as backup
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setImageDataUrl(dataUrl);
          console.log('Data URL created, length:', dataUrl.length);
        };
        reader.onerror = (e) => {
          console.error('FileReader error:', e);
        };
        reader.readAsDataURL(file);
        
      } catch (error) {
        console.error('Error creating object URL:', error);
        // Fallback to FileReader
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setPreviewUrl(result);
          setImageDataUrl(result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleView = (barang: Barang) => {
    setViewingBarang(barang);
    setIsDetailOpen(true);
  };

  const handleImageClick = (imageUrl: string) => {
    setModalImageUrl(imageUrl);
    setIsImageModalOpen(true);
  };

  const handleStatusToggle = async (barang: Barang) => {
    try {
      await BarangService.toggleStatus(barang.id);
      toast({
        title: "Berhasil",
        description: `Barang ${!barang.isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      });
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah status barang",
        variant: "destructive"
      });
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Habis', variant: 'destructive' as const };
    if (stock < 10) return { label: 'Sedikit', variant: 'secondary' as const };
    return { label: 'Tersedia', variant: 'default' as const };
  };

  const stockKritis = barangs.filter(b => b.stock < 10).length;
  const totalNilaiStock = barangs.reduce((total, barang) => total + (barang.stock * barang.harga), 0);

  if (isLoading && barangs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Loading Data
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Mengambil data barang dari server...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Master Data Barang</h1>
        <p className="text-gray-600 dark:text-gray-400">Kelola inventory barang koperasi</p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4 flex-1">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari barang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="max-w-xs">
            <Select value={selectedKategori} onValueChange={setSelectedKategori}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {kategoris.map((kategori) => (
                  <SelectItem key={kategori.id} value={kategori.id.toString()}>
                    {kategori.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Barang
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingBarang ? 'Edit Barang' : 'Tambah Barang Baru'}
                </DialogTitle>
                <DialogDescription>
                  {editingBarang 
                    ? 'Perbarui informasi barang di bawah ini.' 
                    : 'Masukkan informasi barang baru di bawah ini.'
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="grid gap-3">
                  <Label htmlFor="nama" className="text-base font-medium">Nama Barang</Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                    placeholder="Masukkan nama barang"
                    className="text-base h-12"
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="kategori" className="text-base font-medium">Kategori</Label>
                  <Select value={formData.kategoriId} onValueChange={(value) => setFormData(prev => ({ ...prev, kategoriId: value }))}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {kategoris.map((kategori) => (
                        <SelectItem key={kategori.id} value={kategori.id.toString()}>
                          {kategori.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="berat" className="text-base font-medium">Berat (kg)</Label>
                    <Input
                      id="berat"
                      type="number"
                      step="0.1"
                      value={formData.berat}
                      onChange={(e) => setFormData(prev => ({ ...prev, berat: e.target.value }))}
                      placeholder="0.0"
                      className="text-base h-12"
                      required
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="stock" className="text-base font-medium">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                      placeholder="0"
                      className="text-base h-12"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="harga" className="text-base font-medium">Harga (Rp)</Label>
                    <Input
                      id="harga"
                      type="text"
                      value={formData.harga}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setFormData(prev => ({ ...prev, harga: formatCurrency(value) }));
                      }}
                      placeholder="1.000.000"
                      className="text-base h-12"
                      required
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="poin" className="text-base font-medium">Poin Reward</Label>
                    <Input
                      id="poin"
                      type="number"
                      value={formData.poin}
                      onChange={(e) => setFormData(prev => ({ ...prev, poin: e.target.value }))}
                      placeholder="0"
                      className="text-base h-12"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="gambar" className="text-base font-medium">Upload Gambar (JPEG/PNG)</Label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Input
                        id="gambar"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleFileChange}
                        className="flex-1 h-12"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => document.getElementById('gambar')?.click()}
                      >
                        <Camera className="h-5 w-5 mr-2" />
                        Pilih File
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Format: JPEG, JPG, PNG. Maksimal 5MB
                    </p>
                    
                    {/* Preview Area - Single Clean Preview */}
                    {(selectedFile || previewUrl || formData.gambar) && (
                      <div className="mt-4 space-y-3">
                        {/* New File Preview */}
                        {selectedFile && previewUrl && (
                          <div className="border-2 border-dashed border-blue-400 rounded-lg p-4 bg-blue-50">
                            <p className="text-sm font-medium text-blue-700 mb-3">Preview Gambar:</p>
                            <div className="w-48 h-48 border border-gray-300 rounded-lg overflow-hidden bg-white cursor-pointer hover:scale-105 transition-transform"
                                 onClick={() => handleImageClick(previewUrl)}>
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-full object-contain"
                                onLoad={() => console.log('Image preview loaded successfully')}
                                onError={(e) => {
                                  console.error('Image preview error:', e);
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                            <div className="mt-3 text-sm text-blue-600">
                              <p>📁 File: {selectedFile.name}</p>
                              <p>📊 Size: {(selectedFile.size / 1024).toFixed(1)} KB</p>
                              <p>🎯 Klik gambar untuk melihat ukuran penuh</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Existing File Preview */}
                        {!selectedFile && formData.gambar && (
                          <div className="border-2 border-dashed border-green-400 rounded-lg p-4 bg-green-50">
                            <p className="text-sm font-medium text-green-700 mb-3">Gambar Tersimpan:</p>
                            <div className="w-48 h-48 border border-gray-300 rounded-lg overflow-hidden bg-white cursor-pointer hover:scale-105 transition-transform"
                                 onClick={() => handleImageClick(`${config.baseUrl}${formData.gambar}`)}>
                              <img
                                src={`${config.baseUrl}${formData.gambar}`}
                                alt="Gambar Tersimpan"
                                className="w-full h-full object-contain"
                                onLoad={() => console.log('Existing image loaded successfully')}
                                onError={(e) => {
                                  console.error('Existing image error');
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                            <p className="mt-3 text-sm text-green-600">
                              🎯 Klik gambar untuk melihat ukuran penuh
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="status" className="text-base font-medium">Status Barang</Label>
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="status"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <span className={`text-base font-medium ${formData.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                      {formData.isActive ? 'Aktif' : 'Non-aktif'}
                    </span>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-3">
                <Button type="button" variant="outline" onClick={handleCloseDialog} size="lg">
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading || uploading} size="lg">
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Upload...
                    </>
                  ) : isLoading ? (
                    'Menyimpan...'
                  ) : (
                    editingBarang ? 'Perbarui' : 'Tambah'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Barang</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{barangs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Kritis</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stockKritis}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {barangs.reduce((sum, b) => sum + b.stock, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nilai Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {totalNilaiStock.toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barang Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Barang</CardTitle>
          <CardDescription>
            Menampilkan {filteredBarangs.length} dari {barangs.length} barang (Data dari Backend API)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gambar</TableHead>
                <TableHead>Nama Barang</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Poin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBarangs.map((barang) => {
                const stockStatus = getStockStatus(barang.stock);
                return (
                  <TableRow key={barang.id}>
                    <TableCell>
                      {barang.gambar ? (
                        <div className="w-12 h-12 relative cursor-pointer hover:scale-105 transition-transform bg-gray-50 rounded border"
                             onClick={() => handleImageClick(`${config.baseUrl}${barang.gambar}`)}>
                          <Image
                            src={`${config.baseUrl}${barang.gambar}`}
                            alt={barang.nama}
                            fill
                            className="object-contain rounded"
                            unoptimized={true}
                            onError={(e) => {
                              console.error('Table image error for:', `${config.baseUrl}${barang.gambar}`);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('Table image loaded:', `${config.baseUrl}${barang.gambar}`);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{barang.nama}</div>
                        <div className="text-sm text-gray-500">{barang.berat}kg</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{barang.kategori.nama}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          {barang.stock}
                        </span>
                        <Badge variant={stockStatus.variant} className="text-xs">
                          {stockStatus.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>Rp {barang.harga.toLocaleString('id-ID')}</TableCell>
                    <TableCell>{barang.poin} poin</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={barang.isActive}
                          onCheckedChange={() => handleStatusToggle(barang)}
                        />
                        <span className={`text-sm ${barang.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                          {barang.isActive ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(barang)}
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(barang)}
                          title="Edit Barang"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(barang.id)}
                          title="Hapus Barang"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredBarangs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-gray-500">
                      {searchTerm || selectedKategori !== 'all' 
                        ? 'Tidak ada barang yang ditemukan' 
                        : 'Belum ada data barang di database'
                      }
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail View Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Barang</DialogTitle>
            <DialogDescription>
              Informasi lengkap barang dari database
            </DialogDescription>
          </DialogHeader>
          {viewingBarang && (
            <div className="space-y-6">
              {/* Image */}
              {viewingBarang.gambar && (
                <div className="flex justify-center">
                  <div className="w-64 h-64 relative border rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                       onClick={() => handleImageClick(`${config.baseUrl}${viewingBarang.gambar}`)}>
                    <Image
                      src={`${config.baseUrl}${viewingBarang.gambar}`}
                      alt={viewingBarang.nama}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 flex items-center justify-center transition-all">
                      <Eye className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nama Barang</Label>
                  <p className="text-lg font-semibold">{viewingBarang.nama}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Kategori</Label>
                  <Badge variant="outline" className="mt-1">{viewingBarang.kategori.nama}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Berat</Label>
                  <p className="text-lg">{viewingBarang.berat} kg</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Stock</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {viewingBarang.stock}
                    </span>
                    <Badge variant={getStockStatus(viewingBarang.stock).variant}>
                      {getStockStatus(viewingBarang.stock).label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Harga</Label>
                  <p className="text-lg font-semibold">Rp {viewingBarang.harga.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Poin Reward</Label>
                  <p className="text-lg">{viewingBarang.poin} poin</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Switch
                      checked={viewingBarang.isActive}
                      onCheckedChange={() => handleStatusToggle(viewingBarang)}
                    />
                    <span className={`text-sm ${viewingBarang.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                      {viewingBarang.isActive ? 'Aktif' : 'Non-aktif'}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nilai Stock</Label>
                  <p className="text-lg font-semibold">
                    Rp {(viewingBarang.stock * viewingBarang.harga).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              
              {/* Timestamps */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Dibuat</Label>
                    <p>{new Date(viewingBarang.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Diperbarui</Label>
                    <p>{new Date(viewingBarang.updatedAt).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDetailOpen(false)}>
              Tutup
            </Button>
            {viewingBarang && (
              <Button onClick={() => {
                setIsDetailOpen(false);
                handleEdit(viewingBarang);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Barang
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Screen Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="sm:max-w-[95vw] sm:max-h-[95vh] p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Gambar Penuh</DialogTitle>
            <DialogDescription>Tampilan gambar dalam ukuran penuh</DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-[80vh] bg-black rounded-lg overflow-hidden">
            {modalImageUrl && (
              <Image
                src={modalImageUrl}
                alt="Gambar Penuh"
                fill
                className="object-contain"
                priority
              />
            )}
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 bg-white/80 hover:bg-white"
              onClick={() => setIsImageModalOpen(false)}
            >
              ✕
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}