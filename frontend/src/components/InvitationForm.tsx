"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Send, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { invitationAPI } from "@/lib/api";

// Validation schema
const invitationSchema = z.object({
  namaLengkap: z.string().min(1, "Nama lengkap harus diisi"),
  nomorHp: z.string()
    .min(10, "Nomor HP minimal 10 digit")
    .max(15, "Nomor HP maksimal 15 digit")
    .regex(/^[0-9+\-\s]+$/, "Nomor HP hanya boleh berisi angka, +, -, dan spasi"),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

interface InvitationFormProps {
  onSuccess?: () => void;
}

export default function InvitationForm({ onSuccess }: InvitationFormProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      namaLengkap: "",
      nomorHp: "",
    },
  });

  const onSubmit = async (data: InvitationFormData) => {
    setIsLoading(true);
    try {
      // Format phone number
      let formattedPhone = data.nomorHp.replace(/[\s\-]/g, "");
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "+62" + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+62" + formattedPhone;
      }

      const invitationData = {
        namaLengkap: data.namaLengkap,
        nomorHp: formattedPhone,
      };

      await invitationAPI.sendInvitation(invitationData);

      toast.success("Undangan berhasil dikirim!", {
        description: `Undangan telah dikirim ke ${data.namaLengkap} melalui WhatsApp`,
      });

      form.reset();
      setOpen(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast.error("Gagal mengirim undangan", {
        description: error.message || "Terjadi kesalahan saat mengirim undangan",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          Undang Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Undang Member Baru</DialogTitle>
          <DialogDescription>
            Kirim undangan WhatsApp kepada member untuk bergabung dengan aplikasi.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="namaLengkap"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Masukkan nama lengkap alumni" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="nomorHp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor WhatsApp</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Contoh: 08123456789 atau +6281234567890" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Kirim Undangan
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
