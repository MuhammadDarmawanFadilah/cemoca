"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Filter, X, Users, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Biografi, biografiAPI, BiografiFilterRequest, getRecipientsForSelection, RecipientSummary } from "@/lib/api";

// Remove the duplicate interface since it's now in api.ts
import { toast } from "sonner";

interface SelectedRecipient {
  id: number;
  namaLengkap: string;
  nomorTelepon: string;
}

interface NotificationFilter {
  nama?: string;
  jurusan?: string;
  nomorTelepon?: string;
  pekerjaanSaatIni?: string;
  kota?: string;
}

interface RecipientSelectorProps {
  selectedRecipients: SelectedRecipient[];
  onRecipientsChange: (recipients: SelectedRecipient[]) => void;
  maxRecipients?: number;
}

export const RecipientSelector = ({ 
  selectedRecipients, 
  onRecipientsChange, 
  maxRecipients = 10000 
}: RecipientSelectorProps) => {
  const [alumni, setAlumni] = useState<RecipientSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [filters, setFilters] = useState<NotificationFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Enhanced pagination for large datasets
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(50); // Increased to 50 for efficiency with large datasets
  
  // Load alumni data with pagination
  const loadAlumni = async (page: number = 0, resetData: boolean = false) => {
    if (resetData) {
      setLoading(true);
    } else {
      setSearchLoading(true);
    }
      try {
      const filterRequest: BiografiFilterRequest = {
        page: page,
        size: pageSize,        sortBy: 'namaLengkap',
        sortDirection: 'asc',
        nama: filters.nama || undefined,
        jurusan: filters.jurusan || undefined,
        nomorTelepon: filters.nomorTelepon || undefined,
        kota: filters.kota || undefined,
      };
      
      // Use optimized endpoint for recipient selection
      const response = await getRecipientsForSelection(filterRequest);
      
      if (resetData) {
        setAlumni(response.content);
      } else {
        setAlumni(response.content);
      }
        setCurrentPage(response.number || 0);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
      
    } catch (error) {
      console.error('Error loading member:', error);
      toast.error('Gagal memuat data member');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadAlumni(0, true);
  }, []);

  // Handle filter changes
  const handleFilterChange = (key: keyof NotificationFilter, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(0);
    loadAlumni(0, true);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setCurrentPage(0);
    loadAlumni(0, true);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (page >= 0 && page < totalPages) {
      loadAlumni(page, false);
    }
  };
  // Handle recipient selection
  const handleRecipientToggle = (alumni: RecipientSummary) => {
    const isSelected = selectedRecipients.some(r => r.id === alumni.biografiId);
    
    if (isSelected) {
      const updatedRecipients = selectedRecipients.filter(r => r.id !== alumni.biografiId);
      onRecipientsChange(updatedRecipients);
    } else {
      if (selectedRecipients.length >= maxRecipients) {
        toast.error(`Maksimal ${maxRecipients} penerima dapat dipilih`);
        return;
      }
      
      // Use nomorTelepon from RecipientSummary
      const phoneNumber = alumni.nomorTelepon;
      if (phoneNumber) {
        const newRecipient: SelectedRecipient = {
          id: alumni.biografiId,
          namaLengkap: alumni.namaLengkap,
          nomorTelepon: phoneNumber
        };
        onRecipientsChange([...selectedRecipients, newRecipient]);
      } else {
        toast.error(`${alumni.namaLengkap} tidak memiliki nomor telepon`);
      }
    }
  };
  // Select all current page
  const selectAllCurrentPage = () => {
    const newRecipients = alumni
      .filter(alumni => {
        const phoneNumber = alumni.nomorTelepon;
        return phoneNumber && !selectedRecipients.some(r => r.id === alumni.biografiId);
      })
      .slice(0, maxRecipients - selectedRecipients.length)
      .map(alumni => ({
        id: alumni.biografiId,
        namaLengkap: alumni.namaLengkap,
        nomorTelepon: alumni.nomorTelepon
      }));

    if (selectedRecipients.length + newRecipients.length > maxRecipients) {
      toast.error(`Maksimal ${maxRecipients} penerima dapat dipilih`);
      return;
    }

    onRecipientsChange([...selectedRecipients, ...newRecipients]);
  };

  // Remove recipient
  const removeRecipient = (id: number) => {
    const updatedRecipients = selectedRecipients.filter(r => r.id !== id);
    onRecipientsChange(updatedRecipients);
  };

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pilih Penerima Notifikasi
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="filter-nama">Nama Member</Label>
                <Input
                  id="filter-nama"
                  placeholder="Cari nama..."
                  value={filters.nama || ""}
                  onChange={(e) => handleFilterChange("nama", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filter-jurusan">Jurusan</Label>
                <Input
                  id="filter-jurusan"
                  placeholder="Cari jurusan..."
                  value={filters.jurusan || ""}
                  onChange={(e) => handleFilterChange("jurusan", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filter-telepon">Nomor Telepon</Label>
                <Input
                  id="filter-telepon"
                  placeholder="Cari nomor..."
                  value={filters.nomorTelepon || ""}
                  onChange={(e) => handleFilterChange("nomorTelepon", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filter-pekerjaan">Pekerjaan</Label>
                <Input
                  id="filter-pekerjaan"
                  placeholder="Cari pekerjaan..."
                  value={filters.pekerjaanSaatIni || ""}
                  onChange={(e) => handleFilterChange("pekerjaanSaatIni", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filter-kota">Kota</Label>
                <Input
                  id="filter-kota"
                  placeholder="Cari kota..."
                  value={filters.kota || ""}
                  onChange={(e) => handleFilterChange("kota", e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={applyFilters} disabled={searchLoading}>
                <Search className="h-4 w-4 mr-2" />
                {searchLoading ? "Mencari..." : "Terapkan Filter"}
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Reset Filter
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Selected Recipients Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {selectedRecipients.length} / {maxRecipients} Dipilih
              </Badge>
              <span className="text-sm text-muted-foreground">
                Total Member: {totalElements}
              </span>
            </div>
            {alumni.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllCurrentPage}
                disabled={selectedRecipients.length >= maxRecipients}
              >
                Pilih Semua Halaman Ini
              </Button>
            )}
          </div>
          
          {selectedRecipients.length > 0 && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              <Separator />
              <div className="text-sm font-medium">Penerima Terpilih:</div>
              <div className="flex flex-wrap gap-2">
                {selectedRecipients.map((recipient) => (
                  <Badge
                    key={recipient.id}
                    variant="secondary"
                    className="pr-1"
                  >
                    {recipient.namaLengkap}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeRecipient(recipient.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alumni List */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <div className="text-sm text-muted-foreground">Memuat data member...</div>
              </div>
            </div>
          ) : alumni.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <div>Tidak ada member yang ditemukan</div>
              <div className="text-sm">Coba ubah filter pencarian Anda</div>
            </div>
          ) : (            <div className="space-y-3">
              {alumni.map((alumni) => {
                const isSelected = selectedRecipients.some(r => r.id === alumni.biografiId);
                const phoneNumber = alumni.nomorTelepon;
                
                return (
                  <div
                    key={alumni.biografiId}
                    className={`border rounded-lg p-4 transition-all ${
                      isSelected 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleRecipientToggle(alumni)}
                          disabled={!phoneNumber || (!isSelected && selectedRecipients.length >= maxRecipients)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{alumni.namaLengkap}</div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>📞 {phoneNumber || "Tidak ada nomor"}</div>
                            <div>📧 {alumni.email}</div>                            <div>🎓 {alumni.jurusan} ({alumni.alumniTahun})</div>
                            {alumni.spesialisasi && <div>🏥 {alumni.spesialisasi}</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Halaman {currentPage + 1} dari {totalPages} 
                ({totalElements} total member)
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0 || searchLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (currentPage < 3) {
                      pageNum = i;
                    } else if (currentPage > totalPages - 4) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={searchLoading}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1 || searchLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
