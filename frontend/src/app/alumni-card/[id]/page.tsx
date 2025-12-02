"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { biografiAPI, Biografi, imageAPI, userAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast-simple";
import {
  ArrowLeft,
  Download,
  RotateCcw,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Briefcase,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { parseId, encodeId } from "@/lib/crypto-utils";
import { useMigrateToEncodedIds } from "@/lib/migration-utils";
import { SecurityLog } from "@/components/SecurityLog";

export default function AlumniCardPage() {
  // Handle migration from old plain ID URLs to encoded URLs
  useMigrateToEncodedIds();
  const [biografi, setBiografi] = useState<Biografi | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const biografiId = params?.id as string;
  const actualBiografiId = parseId(biografiId);  const fetchBiografiDetail = useCallback(async () => {
    // Wait for auth to finish loading before checking
    if (authLoading) return;
    
    if (!isAuthenticated || !user) {
      setError("Anda harus login untuk mengakses kartu member");
      setLoading(false);
      setIsValidating(false);
      
      setTimeout(() => {
        router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
      }, 1000);
      return;
    }

    setLoading(true);
    setIsValidating(true);
    
    try {
      const requestedBiografiId = actualBiografiId;
      
      if (!requestedBiografiId) {
        setError("ID alumni tidak valid");
        setLoading(false);
        setIsValidating(false);
        return;
      }
      
      // Get current user data to check permissions
      const currentUserId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      const userData = await userAPI.getUserById(currentUserId);
      
      // Check if user is admin or if they're accessing their own card
      const isAdmin = userData.role && (userData.role.roleName === 'ADMIN' || userData.role.roleName === 'MODERATOR');
      const isOwnBiografi = userData.biografi && userData.biografi.biografiId === requestedBiografiId;
      
      console.log("Alumni card access check:", {
        isAdmin,
        isOwnBiografi,
        requestedBiografiId,
        userBiografiId: userData.biografi?.biografiId,
        userRole: userData.role?.roleName
      });
      
      if (isAdmin) {
        // Admin can access any alumni card
        console.log("Admin user accessing alumni card ID:", requestedBiografiId);
        try {
          const response = await biografiAPI.getBiografiById(requestedBiografiId);
          setBiografi(response);
        } catch (error) {
          console.error("Error fetching biography for admin:", error);
          setError("Kartu member tidak ditemukan atau tidak dapat diakses");
          setLoading(false);
          setIsValidating(false);
          return;
        }
      } else if (isOwnBiografi) {
        // Regular user accessing their own alumni card
        console.log("User accessing their own alumni card ID:", requestedBiografiId);
        try {
          const response = await biografiAPI.getBiografiById(requestedBiografiId);
          setBiografi(response);
        } catch (error) {
          console.error("Error fetching own alumni card:", error);
          setError("Tidak dapat memuat kartu member Anda");
          setLoading(false);
          setIsValidating(false);
          return;
        }
      } else if (userData.biografi && userData.biografi.biografiId !== requestedBiografiId) {
        // Regular user trying to access someone else's card - redirect to their own
        const encodedOwnId = encodeId(userData.biografi.biografiId);
        console.log(`Access denied: User ${currentUserId} tried to access alumni card ${requestedBiografiId}, redirecting to their own card ${userData.biografi.biografiId}`);
        setError("Anda tidak memiliki izin untuk mengakses kartu member ini. Mengalihkan ke kartu Anda...");
        
        setTimeout(() => {
          router.replace(`/alumni-card/${encodedOwnId}`);
        }, 2000);
        setLoading(false);
        setIsValidating(false);
        return;
      } else {
        // User has no biography
        setError("Anda belum memiliki biografi untuk kartu member. Silakan buat biografi terlebih dahulu.");
        setLoading(false);
        setIsValidating(false);
        return;
      }
    } catch (error: any) {
      console.error("Error fetching biografi detail:", error);
      
      // Check if it's an authentication error
      if (error.message && error.message.includes('Token')) {
        setError("Sesi Anda telah berakhir. Silakan login kembali.");
        setTimeout(() => {
          router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
        }, 2000);
      } else {
        setError("Gagal memuat data member. Silakan coba lagi.");
      }
      
      toast({
        title: "Error",
        description: "Failed to fetch alumni profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsValidating(false);
    }
  }, [biografiId, actualBiografiId, user, isAuthenticated, authLoading, router, toast]);const generateQRCode = useCallback(async () => {
    try {
      if (!actualBiografiId) return;
      
      const encodedId = encodeId(actualBiografiId);
      const publicUrl = `${window.location.origin}/public-biografi/${encodedId}`;
      const qrCodeDataUrl = await QRCode.toDataURL(publicUrl, {
        width: 150,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  }, [actualBiografiId]);

  // Helper function to convert SVG to base64
  const getSvgAsBase64 = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch('/logo.svg');
      const svgText = await response.text();
      
      // Create a clean SVG with proper dimensions
      const cleanSvg = svgText
        .replace(/width="[^"]*"/, 'width="32"')
        .replace(/height="[^"]*"/, 'height="32"')
        .replace(/viewBox="[^"]*"/, 'viewBox="0 0 602 610"');
      
      const base64 = btoa(unescape(encodeURIComponent(cleanSvg)));
      return `data:image/svg+xml;base64,${base64}`;
    } catch (error) {
      console.error("Error converting SVG to base64:", error);
      return "";
    }
  }, []);  useEffect(() => {
    if (biografiId && !authLoading && actualBiografiId) {
      fetchBiografiDetail();
      generateQRCode();
    }
  }, [biografiId, actualBiografiId, fetchBiografiDetail, generateQRCode, authLoading]);const downloadAsPDF = async () => {
    if (!biografi) {
      toast({
        title: "Error",
        description: "Kartu member tidak ditemukan atau belum siap",
        variant: "destructive",
      });
      return;
    }

    // Log the PDF download action
    if (user) {
      const logElement = document.createElement('div');
      document.body.appendChild(logElement);
      
      import('react-dom/client').then(({ createRoot }) => {
        const root = createRoot(logElement);
        root.render(
          <SecurityLog 
            userId={user.id}
            userName={user.fullName || user.username || 'Unknown'}
            action="DOWNLOAD_ALUMNI_CARD_PDF"
            targetResource="alumni-card"
            targetId={actualBiografiId || 0}
            result="SUCCESS"
            reason={`Downloaded PDF for alumni card: ${biografi.namaLengkap}`}
          />
        );
        setTimeout(() => {
          root.unmount();
          document.body.removeChild(logElement);
        }, 100);
      });
    }

    setIsGeneratingPDF(true);
    
    try {
      // Get logo as base64
      const logoBase64 = await getSvgAsBase64();
      
      // Create a temporary container for rendering cards without 3D transforms
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 400px;
        height: 250px;
        background: white;
        visibility: visible;
        z-index: 9999;
      `;
      
      document.body.appendChild(tempContainer);      // Helper function to create card HTML
      const createCardHTML = (isBack: boolean) => {
        if (isBack) {
          return `
            <div style="width: 400px; height: 250px; background: linear-gradient(to bottom right, #f9fafb, #f3f4f6); border-radius: 12px; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
              <div style="display: flex; height: 100%;">
                <div style="flex: 1; padding-right: 16px;">
                  <div style="margin-bottom: 12px;">
                    <h3 style="font-weight: bold; font-size: 14px; color: #1f2937; margin-bottom: 8px;">Informasi Kontak</h3>
                    <div style="font-size: 12px; line-height: 1.5;">
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <span style="color: #2563eb;">✉</span>
                        <span style="color: #374151;">${biografi.email}</span>
                      </div>
                      ${biografi.nomorTelepon ? `
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                          <span style="color: #16a34a;">📞</span>
                          <span style="color: #374151;">${biografi.nomorTelepon}</span>
                        </div>
                      ` : ''}                      ${(biografi.kotaNama || biografi.provinsiNama || biografi.alamat) ? `
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                          <span style="color: #dc2626;">📍</span>
                          <span style="color: #374151;">${[biografi.alamat, biografi.kotaNama, biografi.provinsiNama].filter(Boolean).join(", ")}</span>
                        </div>
                      ` : ''}
                      ${biografi.ipk ? `
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                          <span style="color: #7c3aed;">🎓</span>
                          <span style="color: #374151;">IPK: ${biografi.ipk}</span>
                        </div>
                      ` : ''}
                      ${biografi.spesialisasiKedokteran && biografi.spesialisasiKedokteran.length > 0 ? `
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span style="color: #ea580c;">💼</span>
                          <span style="color: #374151;">Sp. ${biografi.spesialisasiKedokteran[0].spesialisasi}</span>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                  <div style="margin-top: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                    <div style="font-size: 12px; color: #6b7280;">
                      <p style="font-weight: 600; color: #1e40af; margin: 0;">Cemoca</p>
                      <p style="margin: 0;">Indonesia</p>
                      <p style="color: #2563eb; margin: 0;">www.cemoca.id</p>
                    </div>
                  </div>
                </div>
                <div style="width: 96px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 1px solid #e5e7eb; padding-left: 12px;">
                  <div style="text-align: center; margin-bottom: 8px;">
                    <p style="font-size: 12px; color: #6b7280; font-weight: 500; margin: 0;">Profil Digital</p>
                  </div>
                  ${qrCodeUrl ? `
                    <div style="width: 64px; height: 64px; border: 1px solid #d1d5db; border-radius: 4px; overflow: hidden; background: white;">
                      <img src="${qrCodeUrl}" alt="QR Code" style="width: 100%; height: 100%; object-fit: contain;" />
                    </div>
                  ` : ''}
                  <p style="font-size: 10px; color: #9ca3af; margin-top: 4px; text-align: center; line-height: 1.2;">Scan untuk akses profil</p>
                </div>
              </div>
            </div>
          `;        } else {
          const currentJob = biografi.workExperiences?.find(we => we.masihBekerja) || biografi.workExperiences?.[0];
          return `
            <div style="width: 400px; height: 250px; background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1e3a8a 100%); color: white; border-radius: 12px; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; position: relative; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
              <!-- Background decorative elements -->
              <div style="position: absolute; top: 0; right: 0; width: 96px; height: 96px; background: rgba(255, 255, 255, 0.1); border-radius: 50%; transform: translate(48px, -48px);"></div>
              <div style="position: absolute; bottom: 0; left: 0; width: 80px; height: 80px; background: rgba(255, 255, 255, 0.1); border-radius: 50%; transform: translate(-40px, 40px);"></div>
                <!-- University Header -->              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; position: relative; z-index: 2;">
                <div style="width: 40px; height: 40px; background: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 6px;">
                  ${logoBase64 ? `<img src="${logoBase64}" alt="Cemoca Logo" style="width: 28px; height: 28px; object-fit: contain;" />` : `<div style="width: 28px; height: 28px; background: #e5e7eb; border-radius: 4px;"></div>`}
                </div>
                <div style="min-width: 0;">
                  <h3 style="font-weight: bold; font-size: 12px; line-height: 1.25; margin: 0; letter-spacing: 0.025em;">CEMOCA</h3>
                  <p style="font-size: 12px; opacity: 0.9; margin: 0;">KARTU TANDA MEMBER</p>
                </div>
              </div>

              <!-- Alumni Photo and Basic Info -->
              <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px; position: relative; z-index: 2;">
                <div style="width: 56px; height: 64px; background: white; border-radius: 8px; overflow: hidden; flex-shrink: 0;">
                  ${(biografi.fotoProfil || biografi.foto) ? 
                    `<img src="${imageAPI.getImageUrl(biografi.fotoProfil || biografi.foto || '')}" alt="${biografi.namaLengkap}" style="width: 100%; height: 100%; object-fit: cover;" />` :
                    `<div style="width: 100%; height: 100%; background: #d1d5db; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 12px; text-align: center;">No Photo</div>`
                  }
                </div>                <div style="flex: 1; min-width: 0;">                  <h2 style="font-weight: bold; font-size: 14px; line-height: 1.2; margin: 0 0 3px 0; word-wrap: break-word; overflow-wrap: break-word;">${biografi.namaLengkap}</h2>
                  <p style="font-size: 12px; opacity: 0.9; margin: 0 0 2px 0;">NIM: ${biografi.nim}</p>
                  <p style="font-size: 12px; opacity: 0.8; margin: 0 0 2px 0; word-wrap: break-word; overflow-wrap: break-word; line-height: 1.3;">${biografi.jurusan || 'Member'}</p>
                  <p style="font-size: 12px; opacity: 0.8; margin: 0;">Tahun ${biografi.alumniTahun}</p>
                </div>
              </div>              <!-- Current Position -->
              ${currentJob ? `
                <div style="margin-bottom: 16px; position: relative; z-index: 2;">
                  <p style="font-size: 12px; opacity: 0.8; margin: 0 0 2px 0;">Profesi:</p>
                  <p style="font-size: 12px; font-weight: 500; margin: 0; line-height: 1.3; word-wrap: break-word; overflow-wrap: break-word;">${currentJob.posisi}</p>
                  ${currentJob.perusahaan ? `<p style="font-size: 12px; opacity: 0.9; margin: 0; line-height: 1.3; word-wrap: break-word; overflow-wrap: break-word;">${currentJob.perusahaan}</p>` : ''}
                </div>
              ` : ''}

              <!-- Bottom Info -->
              <div style="position: absolute; bottom: 20px; left: 20px; right: 20px; display: flex; justify-content: space-between; align-items: end; z-index: 2;">
                <div>
                  ${biografi.tanggalLulus ? `
                    <p style="font-size: 12px; opacity: 0.8; margin: 0;">
                      Lulus: ${new Date(biografi.tanggalLulus).toLocaleDateString('id-ID', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })}
                    </p>
                  ` : ''}
                </div>
                <div>
                  <p style="font-size: 12px; opacity: 0.6; margin: 0;">
                    ALM-${biografi.biografiId.toString().padStart(6, '0')}
                  </p>
                </div>
              </div>
            </div>
          `;
        }
      };
      
      // Generate front side
      tempContainer.innerHTML = createCardHTML(false);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const frontCanvas = await html2canvas(tempContainer, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      
      // Generate back side
      tempContainer.innerHTML = createCardHTML(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const backCanvas = await html2canvas(tempContainer, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      
      // Clean up
      document.body.removeChild(tempContainer);
      
      // Create PDF
      const cardWidth = 85.6; // mm
      const cardHeight = 53.98; // mm
      
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [cardWidth, cardHeight],
      });

      // Add front side
      const frontImgData = frontCanvas.toDataURL("image/png", 1.0);
      pdf.addImage(frontImgData, "PNG", 0, 0, cardWidth, cardHeight);

      // Add new page for back side
      pdf.addPage();
      const backImgData = backCanvas.toDataURL("image/png", 1.0);
      pdf.addImage(backImgData, "PNG", 0, 0, cardWidth, cardHeight);

      // Generate filename
      const safeFileName = biografi.namaLengkap.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`kartu_member_${safeFileName}.pdf`);
      
      toast({
        title: "Berhasil",
        description: "Kartu member berhasil diunduh sebagai PDF",
      });
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Gagal mengunduh kartu member. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };  if (loading || authLoading || isValidating) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>
              {authLoading ? "Memverifikasi login..." : 
               isValidating ? "Memvalidasi izin akses..." : 
               "Memuat kartu member..."}
            </span>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Akses Ditolak</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Kembali
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!biografi) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Biografi tidak ditemukan
            </h1>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }  return (
    <ProtectedRoute>
      {/* Security Logging */}
      <SecurityLog 
        userId={user?.id || 0}
        userName={user?.fullName || user?.username || 'Unknown'}
        action="VIEW_ALUMNI_CARD"
        targetResource="alumni-card"
        targetId={actualBiografiId || 0}
        result="SUCCESS"
        reason={`Viewing alumni card for ${biografi?.namaLengkap}`}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-slate-800 py-4 sm:py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => router.back()} className="shadow-sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div>                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  Kartu Member Cemoca
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
                  {biografi.namaLengkap}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setIsFlipped(!isFlipped)}
                className="flex items-center gap-2 flex-1 sm:flex-none shadow-sm"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Flip</span>
                <span className="sm:hidden">Balik</span>
              </Button>
              <Button
                onClick={downloadAsPDF}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 flex-1 sm:flex-none shadow-sm"
              >
                {isGeneratingPDF ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
            </div>
          </div>

          {/* Card Container */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="relative w-full max-w-[90vw] sm:max-w-[500px] lg:max-w-[600px] aspect-[8/5] perspective-1000">
              <div
                ref={cardRef}
                className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              >
                {/* Front Side */}
                <Card className="card-front absolute inset-0 backface-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white shadow-2xl overflow-hidden">
                  <CardContent className="p-4 sm:p-6 lg:p-8 h-full relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-16 sm:w-24 lg:w-32 h-16 sm:h-24 lg:h-32 bg-white rounded-full -translate-y-8 sm:-translate-y-12 lg:-translate-y-16 translate-x-8 sm:translate-x-12 lg:translate-x-16"></div>
                      <div className="absolute bottom-0 left-0 w-12 sm:w-20 lg:w-24 h-12 sm:h-20 lg:h-24 bg-white rounded-full translate-y-6 sm:translate-y-10 lg:translate-y-12 -translate-x-6 sm:-translate-x-10 lg:-translate-x-12"></div>
                    </div>                    {/* University Header */}
                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 lg:mb-6 relative z-10">                      <div className="w-8 sm:w-9 lg:w-10 h-8 sm:h-9 lg:h-10 bg-white rounded-lg flex items-center justify-center p-1">
                        <Image
                          src="/logo.svg"
                          alt="Cemoca Logo"
                          width={28}
                          height={28}
                          className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-blue-900 object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs sm:text-sm lg:text-base leading-tight">CEMOCA</h3>
                        <p className="text-xs sm:text-sm lg:text-base opacity-90">KARTU TANDA MEMBER</p>
                      </div>
                    </div>

                    {/* Alumni Photo and Basic Info */}
                    <div className="flex gap-2 sm:gap-3 lg:gap-4 items-start mb-3 sm:mb-4 lg:mb-6 relative z-10">
                      <div className="w-12 sm:w-14 lg:w-16 h-14 sm:h-16 lg:h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
                        {(biografi.fotoProfil || biografi.foto) ? (
                          <Image
                            src={imageAPI.getImageUrl(biografi.fotoProfil || biografi.foto || '')}
                            alt={biografi.namaLengkap}
                            width={64}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 text-xs">No Photo</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-sm sm:text-base lg:text-lg leading-tight mb-1 break-words">
                          {biografi.namaLengkap}
                        </h2>
                        <p className="text-xs sm:text-sm lg:text-base opacity-90 mb-0.5">
                          NIM: {biografi.nim}
                        </p>                        <p className="text-xs sm:text-sm lg:text-base opacity-80 mb-0.5 break-words leading-tight">
                          {biografi.jurusan || 'Member'}
                        </p>
                        <p className="text-xs sm:text-sm lg:text-base opacity-80">
                          Tahun {biografi.alumniTahun}
                        </p>
                      </div>
                    </div>

                    {/* Current Position */}
                    {biografi.workExperiences && biografi.workExperiences.length > 0 && (
                      <div className="mb-3 sm:mb-4 lg:mb-6 relative z-10">
                        {(() => {
                          const currentJob = biografi.workExperiences.find(we => we.masihBekerja);
                          const recentJob = currentJob || biografi.workExperiences[0];
                          return (
                            <div>
                              <p className="text-xs sm:text-sm lg:text-base opacity-80 mb-0.5">Profesi:</p>
                              <p className="text-xs sm:text-sm lg:text-base font-medium break-words leading-tight">
                                {recentJob.posisi}
                              </p>
                              {recentJob.perusahaan && (
                                <p className="text-xs sm:text-sm lg:text-base opacity-90 break-words leading-tight">
                                  {recentJob.perusahaan}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Bottom Row */}
                    <div className="absolute bottom-3 sm:bottom-4 lg:bottom-6 left-4 sm:left-6 lg:left-8 right-4 sm:right-6 lg:right-8 flex justify-between items-end z-10">
                      <div>
                        {biografi.tanggalLulus && (
                          <p className="text-xs sm:text-sm lg:text-base opacity-80">
                            Lulus: {new Date(biografi.tanggalLulus).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: '2-digit', 
                              year: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-xs sm:text-sm lg:text-base opacity-60">
                           ALM-{biografi.biografiId.toString().padStart(6, '0')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Back Side */}
                <Card className="card-back absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-gray-50 to-gray-100 shadow-2xl">
                  <CardContent className="p-4 sm:p-6 lg:p-8 h-full">
                    <div className="flex h-full flex-col sm:flex-row">
                      {/* Contact Info */}
                      <div className="flex-1 sm:pr-4 mb-4 sm:mb-0">
                        <div className="mb-3 sm:mb-4">
                          <h3 className="font-bold text-sm sm:text-base lg:text-lg text-gray-800 mb-2 sm:mb-3">
                            Informasi Kontak
                          </h3>
                          
                          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm lg:text-base">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Mail className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-blue-600 flex-shrink-0" />
                              <span className="break-all">{biografi.email}</span>
                            </div>
                            
                            {biografi.nomorTelepon && (
                              <div className="flex items-center gap-2 sm:gap-3">
                                <Phone className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-green-600 flex-shrink-0" />
                                <span>{biografi.nomorTelepon}</span>
                              </div>
                            )}
                              {(biografi.kotaNama || biografi.provinsiNama || biografi.alamat) && (
                              <div className="flex items-center gap-2 sm:gap-3">
                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-red-600 flex-shrink-0" />
                                <span className="break-words">
                                  {[biografi.alamat, biografi.kotaNama, biografi.provinsiNama].filter(Boolean).join(", ")}
                                </span>
                              </div>
                            )}

                            {biografi.ipk && (
                              <div className="flex items-center gap-2 sm:gap-3">
                                <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-purple-600 flex-shrink-0" />
                                <span>IPK: {biografi.ipk}</span>
                              </div>
                            )}

                            {biografi.spesialisasiKedokteran && biografi.spesialisasiKedokteran.length > 0 && (
                              <div className="flex items-center gap-2 sm:gap-3">
                                <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-orange-600 flex-shrink-0" />
                                <span className="break-words">Sp. {biografi.spesialisasiKedokteran[0].spesialisasi}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* University Info */}
                        <div className="mt-auto">
                          <div className="text-xs sm:text-sm lg:text-base text-gray-600 border-t border-gray-200 pt-2 sm:pt-3">
                            <p className="font-semibold text-blue-800">Cemoca</p>
                            <p>Indonesia</p>
                            <p className="text-blue-600">www.cemoca.id</p>
                          </div>
                        </div>
                      </div>

                      {/* QR Code */}
                      <div className="w-full sm:w-24 lg:w-32 flex flex-row sm:flex-col items-center justify-center sm:border-l border-t sm:border-t-0 border-gray-200 pt-4 sm:pt-0 sm:pl-3 lg:pl-4">
                        <div className="text-center mb-2 sm:mb-3 mr-4 sm:mr-0">
                          <p className="text-xs sm:text-sm lg:text-base text-gray-600 font-medium">
                            Profil Digital
                          </p>
                        </div>
                        {qrCodeUrl && (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 border border-gray-300 rounded overflow-hidden bg-white">
                            <img
                              src={qrCodeUrl}
                              alt="QR Code"
                              width={96}
                              height={96}
                              className="w-full h-full object-contain"
                              crossOrigin="anonymous"
                            />
                          </div>
                        )}
                        <p className="text-xs sm:text-sm lg:text-base text-gray-500 mt-1 sm:mt-2 text-center leading-tight ml-4 sm:ml-0">
                          Scan untuk akses profil
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center">            <div className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto shadow-sm">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3 sm:mb-4 text-base sm:text-lg">
                Petunjuk Penggunaan
              </h3>
              <div className="text-sm sm:text-base text-blue-800 dark:text-blue-300 space-y-2 sm:space-y-3">
                <p>• Klik "Flip" untuk melihat kedua sisi kartu</p>
                <p>• Klik "Download PDF" untuk unduh kartu siap cetak</p>
                <p>• QR Code dapat dipindai untuk akses profil digital</p>
                <p>• Kartu berlaku sebagai identitas resmi member Cemoca</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        
        @media (max-width: 640px) {
          .perspective-1000 {
            perspective: 800px;
          }
        }
      `}</style>
    </ProtectedRoute>
  );
}
