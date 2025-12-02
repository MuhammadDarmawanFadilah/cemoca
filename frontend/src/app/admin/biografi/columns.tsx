"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Eye, Edit, Trash2, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { biografiAPI, imageAPI, BiografiStatus } from "@/lib/api";
import { getWilayahNames } from "@/lib/wilayah-api";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface WilayahDisplayProps {
  provinsi?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
}

const WilayahDisplay = ({ provinsi, kota, kecamatan, kelurahan }: WilayahDisplayProps) => {
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWilayahNames = async () => {
      // Build kode map for batch lookup
      const kodeMap: Record<string, string> = {};
      
      if (provinsi) kodeMap[provinsi] = 'provinsi';
      if (kota) kodeMap[kota] = 'kota';
      if (kecamatan) kodeMap[kecamatan] = 'kecamatan';
      if (kelurahan) kodeMap[kelurahan] = 'kelurahan';

      if (Object.keys(kodeMap).length === 0) {
        setLoading(false);
        return;
      }

      try {
        const wilayahNames = await getWilayahNames(kodeMap);
        setNames(wilayahNames);
      } catch (error) {
        console.error('Error fetching wilayah names:', error);
        // Fallback to showing codes if API fails
        const fallbackNames = Object.keys(kodeMap).reduce((acc, code) => {
          acc[code] = code;
          return acc;
        }, {} as Record<string, string>);
        setNames(fallbackNames);
      } finally {
        setLoading(false);
      }
    };

    fetchWilayahNames();
  }, [provinsi, kota, kecamatan, kelurahan]);

  if (loading) {
    return <span className="text-muted-foreground">Loading...</span>;
  }

  // Build display string from available wilayah data
  const displayParts: string[] = [];
  if (kelurahan && names[kelurahan]) displayParts.push(names[kelurahan]);
  if (kecamatan && names[kecamatan]) displayParts.push(names[kecamatan]);
  if (kota && names[kota]) displayParts.push(names[kota]);
  if (provinsi && names[provinsi]) displayParts.push(names[provinsi]);

  return (
    <div className="max-w-[150px]">
      {displayParts.length > 0 ? (
        <div className="text-sm truncate" title={displayParts.join(', ')}>
          {displayParts.join(', ')}
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      )}
    </div>
  );
};

export type BiografiDisplay = {
  biografiId: number;
  namaLengkap: string;
  nim: string;
  email: string;
  nomorHp: string;
  jurusan: string;
  alumniTahun: string;
  pekerjaanSaatIni?: string;
  kota?: string;
  provinsi?: string;
  kecamatan?: string;
  kelurahan?: string;
  fotoProfil?: string;
  status: BiografiStatus; // Use the same type as API
};

interface ToggleStatusButtonProps {
  biografi: BiografiDisplay;
  onStatusChanged?: () => void;
}

const ToggleStatusButton = ({ biografi, onStatusChanged }: ToggleStatusButtonProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  const newStatus: BiografiStatus = biografi.status === "AKTIF" ? "TIDAK_AKTIF" : "AKTIF";
  const statusText = newStatus === "AKTIF" ? "mengaktifkan" : "menonaktifkan";
  const actionText = newStatus === "AKTIF" ? "Aktifkan" : "Nonaktifkan";

  const handleToggleStatus = async () => {
    setIsUpdating(true);    try {
      console.log('Updating biografi status:', {
        biografiId: biografi.biografiId,
        currentStatus: biografi.status,
        newStatus
      });
      await biografiAPI.updateBiografiStatus(biografi.biografiId, newStatus);
      toast.success(`Berhasil ${statusText} biografi ${biografi.namaLengkap}`);
      setShowStatusDialog(false);
      // Add slight delay to ensure UI state is properly reset
      setTimeout(() => {
        onStatusChanged?.();
      }, 100);
    } catch (error) {
      console.error('Error updating biografi status:', error);
      // Show more detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Gagal ${statusText} biografi: ${errorMessage}`);
      setShowStatusDialog(false);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          setShowStatusDialog(true);
        }}
      >
        {newStatus === "AKTIF" ? (
          <UserCheck className="mr-2 h-4 w-4" />
        ) : (
          <UserX className="mr-2 h-4 w-4" />
        )}
        {actionText}
      </DropdownMenuItem>
      
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{actionText} Biografi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin {statusText} biografi {biografi.namaLengkap}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isUpdating}
              onClick={() => setShowStatusDialog(false)}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              disabled={isUpdating}
            >
              {isUpdating ? `${statusText}...` : actionText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

interface DeleteBiografiButtonProps {
  biografi: BiografiDisplay;
  onDeleted?: () => void;
}

const DeleteBiografiButton = ({ biografi, onDeleted }: DeleteBiografiButtonProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await biografiAPI.hardDeleteBiografi(biografi.biografiId);
      toast.success(`Biografi ${biografi.namaLengkap} berhasil dihapus permanen`);
      setShowDeleteDialog(false);
      // Add slight delay to ensure UI state is properly reset
      setTimeout(() => {
        onDeleted?.();
      }, 100);
    } catch (error) {
      console.error('Error deleting biografi:', error);
      toast.error('Gagal menghapus biografi');
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenuItem
        className="text-destructive"
        onSelect={(e) => {
          e.preventDefault();
          setShowDeleteDialog(true);
        }}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Hapus
      </DropdownMenuItem>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Biografi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus biografi {biografi.namaLengkap}? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isDeleting}
              onClick={() => setShowDeleteDialog(false)}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const getColumns = (onRefresh?: () => void): ColumnDef<BiografiDisplay>[] => [  {
    id: "profile",
    accessorKey: "namaLengkap",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Profil
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const biografi = row.original;
      return (<div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={biografi.fotoProfil ? imageAPI.getImageUrl(biografi.fotoProfil) : ''} 
              alt={biografi.namaLengkap} 
            />
            <AvatarFallback>
              {biografi.namaLengkap.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{biografi.namaLengkap}</div>
            <div className="text-sm text-muted-foreground">{biografi.nim}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "jurusan",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Jurusan
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },  {
    accessorKey: "alumniTahun",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Alumni Tahun
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const tahun = row.getValue("alumniTahun") as string;
      return tahun || "-";
    },
  },  {
    accessorKey: "pekerjaanSaatIni",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Pekerjaan
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const pekerjaan = row.getValue("pekerjaanSaatIni") as string;
      return (
        <div className="max-w-[150px] truncate">
          {pekerjaan || "-"}
        </div>
      );
    },
  },  {
    accessorKey: "kota",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Wilayah
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const biografi = row.original;
      return (
        <WilayahDisplay
          provinsi={biografi.provinsi}
          kota={biografi.kota}
          kecamatan={biografi.kecamatan}
          kelurahan={biografi.kelurahan}
        />
      );
    },
  },
  {
    accessorKey: "status",    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as BiografiStatus;

      return (
        <Badge
          variant={
            status === "AKTIF" 
              ? "default" 
              : status === "DRAFT" 
              ? "secondary" 
              : "destructive"
          }
        >
          {status === "AKTIF" ? "Aktif" : status === "DRAFT" ? "Draft" : "Tidak Aktif"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const biografi = row.original;

      return (
        <>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Aksi</DropdownMenuLabel>              <DropdownMenuItem asChild>
                <Link href={`/biografi/${biografi.biografiId}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Lihat Detail
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/biografi/${biografi.biografiId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(biografi.nim)}
              >
                Copy NIM
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(biografi.email)}
              >
                Copy Email              </DropdownMenuItem>              <DropdownMenuSeparator />
              {/* Conditional rendering based on status */}
              {biografi.status === "TIDAK_AKTIF" ? (
                // Show "Aktifkan" button for inactive users
                <ToggleStatusButton 
                  biografi={biografi} 
                  onStatusChanged={onRefresh}
                />
              ) : (
                // Show both "Nonaktifkan" and "Hapus" buttons for active users
                <>
                  <ToggleStatusButton 
                    biografi={biografi} 
                    onStatusChanged={onRefresh}
                  />
                  <DeleteBiografiButton 
                    biografi={biografi} 
                    onDeleted={onRefresh}
                  />
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      );
    },
  },
];

// Default columns for backward compatibility
export const columns = getColumns();
