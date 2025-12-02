'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast-simple';
import { KategoriService, Kategori, CreateKategoriRequest } from '@/services/barangService';

export default function KategoriPage() {
  const [kategoris, setKategoris] = useState<Kategori[]>([]);
  const [filteredKategoris, setFilteredKategoris] = useState<Kategori[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKategori, setEditingKategori] = useState<Kategori | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: ''
  });

  const { toast } = useToast();

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter kategoris berdasarkan search term
  useEffect(() => {
    let filtered = kategoris;

    if (searchTerm) {
      filtered = kategoris.filter(kategori =>
        kategori.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (kategori.deskripsi && kategori.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredKategoris(filtered);
  }, [searchTerm, kategoris]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await KategoriService.getAllKategori();
      setKategoris(data);
    } catch (error) {
      console.error('Error loading kategori:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data kategori",
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
      const kategoriData: CreateKategoriRequest = {
        nama: formData.nama,
        deskripsi: formData.deskripsi
      };

      if (editingKategori) {
        await KategoriService.updateKategori(editingKategori.id, kategoriData);
        toast({
          title: "Berhasil",
          description: "Kategori berhasil diperbarui",
        });
      } else {
        await KategoriService.createKategori(kategoriData);
        toast({
          title: "Berhasil",
          description: "Kategori berhasil ditambahkan",
        });
      }

      handleCloseDialog();
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error saving kategori:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menyimpan kategori",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (kategori: Kategori) => {
    setEditingKategori(kategori);
    setFormData({
      nama: kategori.nama,
      deskripsi: kategori.deskripsi || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      try {
        await KategoriService.deleteKategori(id);
        toast({
          title: "Berhasil",
          description: "Kategori berhasil dihapus",
        });
        await loadData(); // Reload data
      } catch (error) {
        console.error('Error deleting kategori:', error);
        toast({
          title: "Error",
          description: "Gagal menghapus kategori",
          variant: "destructive"
        });
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingKategori(null);
    setFormData({ nama: '', deskripsi: '' });
  };

  if (isLoading && kategoris.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Loading Data
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Mengambil data kategori dari server...
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Master Data Kategori</h1>
        <p className="text-gray-600 dark:text-gray-400">Kelola kategori barang koperasi</p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Kategori
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingKategori ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                </DialogTitle>
                <DialogDescription>
                  {editingKategori 
                    ? 'Perbarui informasi kategori di bawah ini.' 
                    : 'Masukkan informasi kategori baru di bawah ini.'
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nama">Nama Kategori</Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                    placeholder="Masukkan nama kategori"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <Textarea
                    id="deskripsi"
                    value={formData.deskripsi}
                    onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                    placeholder="Masukkan deskripsi kategori"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Menyimpan...' : (editingKategori ? 'Perbarui' : 'Tambah')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kategoris.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Barang</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kategoris.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Barang/Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kategoris.length > 0 ? 1 : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kategori Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kategori</CardTitle>
          <CardDescription>
            Menampilkan {filteredKategoris.length} dari {kategoris.length} kategori (Data dari Backend API)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Kategori</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Total Barang</TableHead>
                <TableHead>Tanggal Dibuat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKategoris.map((kategori) => (
                <TableRow key={kategori.id}>
                  <TableCell className="font-medium">{kategori.nama}</TableCell>
                  <TableCell className="max-w-xs">
                    {kategori.deskripsi ? (
                      <span className="text-sm text-gray-600">{kategori.deskripsi}</span>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Tidak ada deskripsi</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">-</Badge>
                  </TableCell>
                  <TableCell>
                    {kategori.createdAt 
                      ? new Date(kategori.createdAt).toLocaleDateString('id-ID')
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(kategori)}
                        title="Edit Kategori"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(kategori.id)}
                        title="Hapus Kategori"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredKategoris.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-gray-500">
                      {searchTerm 
                        ? 'Tidak ada kategori yang ditemukan' 
                        : 'Belum ada data kategori di database'
                      }
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}