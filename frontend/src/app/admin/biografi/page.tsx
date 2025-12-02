"use client";

import { useState, useEffect } from "react";
import { BiografiDisplay, getColumns } from "./columns";
import { DataTable } from "./data-table";
import { biografiAPI, BiografiFilterRequest, PagedResponse, Biografi } from "@/lib/api";
import BiografiFilters from "@/components/BiografiFilters";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload, Link2, Users, UserPlus } from "lucide-react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { PageLoading, TableLoading } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invitationAPI, publicInvitationLinkAPI } from "@/lib/api";
import { toast } from "sonner";

const BiografiPage = () => {
  const [pagedData, setPagedData] = useState<PagedResponse<BiografiDisplay> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BiografiFilterRequest>({
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDirection: 'desc'
  });  const [showPublicLinkDialog, setShowPublicLinkDialog] = useState(false);
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  const [invitationData, setInvitationData] = useState({
    namaLengkap: "",
    nomorHp: ""
  });
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(false);
  const [publicLinkDescription, setPublicLinkDescription] = useState("");
  const [publicLinkMaxUses, setPublicLinkMaxUses] = useState<number | undefined>();
  const [generatedLink, setGeneratedLink] = useState<string>("");

  const handleDataRefresh = () => {
    fetchBiografi(filters);
  };

  const columns = getColumns(handleDataRefresh);

  const fetchBiografi = async (currentFilters: BiografiFilterRequest) => {
    setLoading(true);
    setError(null);
    try {
      console.log('=== BIOGRAFI FILTER DEBUG ===');
      console.log('Filters being sent to backend:', JSON.stringify(currentFilters, null, 2));
      
      const backendResponse = await biografiAPI.getBiografiWithFilters(currentFilters);
      
      console.log('Backend response summary:', {
        totalElements: backendResponse.totalElements,
        returnedRecords: backendResponse.content.length,
        currentPage: backendResponse.page,
        pageSize: backendResponse.size
      });      console.log('=== END DEBUG ===');
        // Convert backend format to frontend format
      const convertedBiografi: BiografiDisplay[] = backendResponse.content.map((biografi: any) => ({
        biografiId: biografi.biografiId || biografi.id,
        namaLengkap: biografi.namaLengkap,
        nim: biografi.nim,
        email: biografi.email,
        nomorHp: biografi.nomorHp || biografi.nomorTelepon,
        jurusan: biografi.jurusan || biografi.programStudi,
        alumniTahun: biografi.alumniTahun,
        pekerjaanSaatIni: biografi.pekerjaanSaatIni || (biografi.workExperiences && biografi.workExperiences.length > 0 ? biografi.workExperiences[0].posisi : ''),
        kota: biografi.kota,
        provinsi: biografi.provinsi,
        kecamatan: biografi.kecamatan,
        kelurahan: biografi.kelurahan,
        fotoProfil: biografi.fotoProfil || biografi.foto,
        status: biografi.status, // Keep the backend format (AKTIF, TIDAK_AKTIF, DRAFT)
      }));

      // Map backend paging structure to frontend format
      setPagedData({
        content: convertedBiografi,
        page: backendResponse.number || 0, // Backend uses 'number' for current page
        size: backendResponse.size || 10,
        totalElements: backendResponse.totalElements || 0,
        totalPages: backendResponse.totalPages || 0,
        first: backendResponse.first || false,
        last: backendResponse.last || false,
        empty: backendResponse.empty || false
      });
    } catch (error) {
      console.error('Error fetching biografi:', error);
      setError('Gagal memuat data biografi member');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch biografi on initial mount with default filters
    const initialFilters: BiografiFilterRequest = {
      page: 0,
      size: 10,
      sortBy: 'createdAt',
      sortDirection: 'desc'
    };
    setFilters(initialFilters);
    fetchBiografi(initialFilters);
  }, []); // Only run on mount

  const handleFilterChange = (newFilters: BiografiFilterRequest) => {
    setFilters(newFilters);
    fetchBiografi(newFilters);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    fetchBiografi(newFilters);
  };

  const handlePageSizeChange = (size: number) => {
    const newFilters = { ...filters, page: 0, size };
    setFilters(newFilters);
    fetchBiografi(newFilters);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export biografi data');
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Import biografi data');
  };
  const handleGeneratePublicLink = async () => {
    try {
      const response = await publicInvitationLinkAPI.generatePublicLink(
        publicLinkDescription || undefined,
        undefined, // no expiration for now
        publicLinkMaxUses
      );
      setGeneratedLink(response.registrationUrl);
      toast.success("Link undangan publik berhasil dibuat");
      
      // Reset form
      setPublicLinkDescription("");
      setPublicLinkMaxUses(undefined);
    } catch (error: any) {
      console.error("Error generating public link:", error);
      toast.error(error.message || "Gagal membuat link undangan publik");
    }
  };

  const handleSendInvitation = async () => {
    if (!invitationData.namaLengkap || !invitationData.nomorHp) {
      toast.error("Nama lengkap dan nomor HP harus diisi");
      return;
    }

    setIsLoadingInvitation(true);
    try {
      await invitationAPI.sendInvitation({
        namaLengkap: invitationData.namaLengkap,
        nomorHp: invitationData.nomorHp
      });
      
      toast.success("Undangan berhasil dikirim!");
      setInvitationData({ namaLengkap: "", nomorHp: "" });
      setShowInvitationDialog(false);
      handleDataRefresh();
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast.error(error.message || "Gagal mengirim undangan");
    } finally {
      setIsLoadingInvitation(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link berhasil disalin ke clipboard");
  };  if (loading) {
    return (
      <div>
        <AdminPageHeader 
          title="Data Biografi Member"
          description="Kelola profil dan data lengkap member"
          icon={Users}
          stats={[
            { label: "Total Member", value: "...", variant: "default" },
            { label: "Member Aktif", value: "...", variant: "default" },
            { label: "Profil Lengkap", value: "...", variant: "default" }
          ]}
        />
        <div className="container mx-auto p-6">
          <PageLoading text="Memuat data biografi member..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="">
        <div className="mb-8 px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-md">
          <h1 className="font-semibold text-destructive">Error Memuat Data</h1>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
        <DataTable columns={columns} data={[]} />
      </div>
    );
  }  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        title="Biografi Member"
        description="Kelola dan pantau data biografi member sistem informasi"
        icon={Users}
        primaryAction={{
          label: "Tambah Biografi",
          onClick: () => window.location.href = "/admin/biografi/add",
          icon: Plus
        }}        secondaryActions={[
          {
            label: "Link Undangan",
            onClick: () => setShowPublicLinkDialog(true),
            icon: Link2,
            variant: "outline"
          },
          {
            label: "Undang Alumni",
            onClick: () => setShowInvitationDialog(true),
            icon: UserPlus,
            variant: "outline"
          }
        ]}
        stats={[
          {
            label: "Total Member",
            value: pagedData?.totalElements || 0,
            variant: "secondary"
          },
          {
            label: "Halaman",
            value: `${(pagedData?.page || 0) + 1} dari ${pagedData?.totalPages || 1}`,
            variant: "outline"
          }
        ]}      />      <div className="container mx-auto p-6 space-y-6">
        {/* Filters Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all">
          <BiografiFilters 
            onFilterChange={handleFilterChange}
            currentFilters={filters}
          />
        </div>

        {/* Data Table Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all overflow-hidden">
          <DataTable 
            columns={columns} 
            data={pagedData?.content || []}
            serverPagination={pagedData ? {
              page: pagedData.page ?? pagedData.number ?? 0,
              size: pagedData.size,
              totalElements: pagedData.totalElements,
              totalPages: pagedData.totalPages,
              onPageChange: handlePageChange,
              onPageSizeChange: handlePageSizeChange
            } : undefined}
          />
        </div>        {/* Dialogs */}
        <Dialog open={showPublicLinkDialog} onOpenChange={setShowPublicLinkDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Buat Link Undangan Publik</DialogTitle>
              <DialogDescription>
                Link ini dapat digunakan siapa saja untuk mendaftar sebagai alumni. 
                Pendaftar akan menunggu persetujuan admin.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Deskripsi (opsional)</Label>
                <Input
                  id="description"
                  placeholder="Misal: Undangan Member Batch 2024"
                  value={publicLinkDescription}
                  onChange={(e) => setPublicLinkDescription(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="maxUses">Batas Penggunaan (opsional)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  placeholder="Misal: 100"
                  value={publicLinkMaxUses || ""}
                  onChange={(e) => setPublicLinkMaxUses(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
              {generatedLink && (
                <div className="space-y-2">
                  <Label>Link yang dibuat:</Label>
                  <div className="flex items-center space-x-2">
                    <Input value={generatedLink} readOnly className="text-sm" />
                    <Button 
                      size="sm" 
                      onClick={() => copyToClipboard(generatedLink)}
                    >
                      Salin
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleGeneratePublicLink}>
                Buat Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>        <Dialog open={showInvitationDialog} onOpenChange={setShowInvitationDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Undang Alumni Baru</DialogTitle>
              <DialogDescription>
                Kirim undangan WhatsApp kepada alumni untuk bergabung dengan aplikasi.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="namaLengkap">Nama Lengkap</Label>
                <Input
                  id="namaLengkap"
                  placeholder="Masukkan nama lengkap alumni"
                  value={invitationData.namaLengkap}
                  onChange={(e) => setInvitationData(prev => ({ ...prev, namaLengkap: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="nomorHp">Nomor HP</Label>
                <Input
                  id="nomorHp"
                  placeholder="Contoh: +62812345678"
                  value={invitationData.nomorHp}
                  onChange={(e) => setInvitationData(prev => ({ ...prev, nomorHp: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowInvitationDialog(false)}
                disabled={isLoadingInvitation}
              >
                Batal
              </Button>
              <Button 
                onClick={handleSendInvitation}
                disabled={isLoadingInvitation}
              >
                {isLoadingInvitation ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Kirim Undangan
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BiografiPage;
