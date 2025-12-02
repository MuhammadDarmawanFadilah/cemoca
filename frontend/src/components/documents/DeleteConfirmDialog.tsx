import React from "react";
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
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  documentTitle: string;
}

export function DeleteConfirmDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  documentTitle 
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus dokumen ini?
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        
        <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800 mb-2">Dokumen yang akan dihapus:</p>
          <p className="text-sm text-red-700 font-medium">&ldquo;{documentTitle}&rdquo;</p>
        </div>

        <div className="text-sm text-gray-600 space-y-2">
          <p className="font-medium">⚠️ Peringatan:</p>
          <ul className="space-y-1 text-sm text-gray-600 ml-4">
            <li>• Dokumen akan dipindahkan ke status tidak aktif</li>
            <li>• File fisik masih tersimpan di server</li>
            <li>• Dokumen dapat dikembalikan oleh administrator</li>
            <li>• Riwayat download akan tetap tersimpan</li>
          </ul>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Ya, Hapus Dokumen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
