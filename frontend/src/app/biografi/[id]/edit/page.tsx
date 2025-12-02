"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { biografiAPI, userAPI, Biografi } from "@/lib/api";
import BiografiForm from "@/components/BiografiForm";
import { useAuth } from "@/contexts/AuthContext";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SecurityLog, SECURITY_ACTIONS, RESOURCE_TYPES, SECURITY_RESULTS } from "@/components/SecurityLog";

export default function BiografiEditPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isMobile, isSmallMobile } = useMobileDetection();
  const [loading, setLoading] = useState(true);
  const [biografi, setBiografi] = useState<Biografi | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  const biografiId = params?.id as string;  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) return;
    
    const fetchUserAndBiografi = async () => {
      if (!isAuthenticated || !user) {
        setError("Anda harus login untuk mengedit biografi");
        setLoading(false);
        setIsValidating(false);
        
        setTimeout(() => {
          router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
        }, 1000);
        return;
      }

      try {
        setLoading(true);
        setIsValidating(true);
        
        const requestedBiografiId = parseInt(biografiId);
        
        if (isNaN(requestedBiografiId)) {
          setError("ID biografi tidak valid");
          setLoading(false);
          setIsValidating(false);
          return;
        }
        
        // First, get current user data with their biography info
        const currentUserId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
        const userData = await userAPI.getUserById(currentUserId);
        setUserData(userData);
        
        // Check if user is admin or if they're editing their own biography
        const isAdmin = userData.role && (userData.role.roleName === 'ADMIN' || userData.role.roleName === 'MODERATOR');
        const isOwnBiografi = userData.biografi && userData.biografi.biografiId === requestedBiografiId;
        
        if (isAdmin) {
          // Admin can edit any biography, fetch the requested biography directly
          try {
            const biografiData = await biografiAPI.getBiografiForEdit(requestedBiografiId);
            setBiografi(biografiData);
          } catch (error) {
            console.error("Error fetching biography for admin:", error);
            setError("Biografi tidak ditemukan atau tidak dapat diakses");
            setLoading(false);
            setIsValidating(false);
            return;
          }
        } else if (isOwnBiografi) {
          // Regular user editing their own biography
          try {
            const biografiData = await biografiAPI.getBiografiForEdit(requestedBiografiId);
            setBiografi(biografiData);
          } catch (error) {
            console.error("Error fetching own biography:", error);
            setError("Tidak dapat memuat data biografi Anda");
            setLoading(false);
            setIsValidating(false);
            return;
          }
        } else if (userData.biografi && userData.biografi.biografiId !== requestedBiografiId) {
          // Regular user trying to edit someone else's biography - redirect to their own
          setError("Anda tidak memiliki izin untuk mengedit biografi ini. Mengalihkan ke biografi Anda...");
            setTimeout(() => {
            router.replace(`/biografi/${userData.biografi!.biografiId}/edit`);
          }, 2000);
          setLoading(false);
          setIsValidating(false);
          return;
        } else {
          // User has no biography and is not admin
          setError("Anda belum memiliki biografi untuk diedit. Silakan buat biografi terlebih dahulu.");
          setLoading(false);
          setIsValidating(false);
          return;
        }
      } catch (error: any) {
        console.error("Error fetching user/biografi:", error);
        
        // Check if it's an authentication error
        if (error.message && error.message.includes('Token')) {
          setError("Sesi Anda telah berakhir. Silakan login kembali.");
          setTimeout(() => {
            router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
          }, 2000);
        } else {
          setError("Gagal memuat data biografi. Silakan coba lagi.");
        }
      } finally {
        setLoading(false);
        setIsValidating(false);
      }
    };

    fetchUserAndBiografi();
  }, [biografiId, user, isAuthenticated, router, authLoading]);
  const handleSubmit = async (data: any) => {
    if (!biografi) return;
    
    try {
      const userBiografiId = biografi.biografiId;
      
      // Update biography using the correct biography ID
      await biografiAPI.updateBiografi(userBiografiId, data);
      router.push(`/biografi/${userBiografiId}`);
    } catch (error: any) {
      console.error("Error saving biografi:", error);
      
      // Handle validation errors from backend
      if (error?.response?.data) {
        const errorData = error.response.data;
        
        // Check if it's a validation error
        if (typeof errorData === 'string' && errorData.includes('Validation failed')) {
          // Parse validation error message
          const errorMessage = errorData.replace(/.*List of constraint violations:\[/, '').replace(/\]$/, '');
          const violations = errorMessage.split('}, ').map((violation: string) => {
            const match = violation.match(/interpolatedMessage='([^']+)'/);
            return match ? match[1] : violation;
          });
          
          // Create a user-friendly error message
          const validationMessages = violations.join(', ');
          throw new Error(`Validasi gagal: ${validationMessages}`);
        } else if (errorData.error) {
          throw new Error(errorData.error);
        }
      }
      
      throw error;
    }
  };  if (loading || authLoading || isValidating) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 ${isMobile ? 'p-3' : 'p-6'}`}>
        <div className={`${isMobile ? 'max-w-full' : 'max-w-4xl'} mx-auto`}>
          <Card className="overflow-hidden">
            <CardContent className={`flex items-center justify-center ${isMobile ? 'py-8' : 'py-12'}`}>
              <div className={`flex items-center ${isMobile ? 'flex-col space-y-2 text-center' : 'space-x-3'}`}>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className={isMobile ? 'text-sm' : ''}>
                  {authLoading ? "Memverifikasi login..." : 
                   isValidating ? "Memvalidasi izin akses..." : 
                   "Memuat data biografi..."}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 ${isMobile ? 'p-3' : 'p-6'}`}>
        <div className={`${isMobile ? 'max-w-full' : 'max-w-4xl'} mx-auto`}>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className={isMobile ? 'text-sm' : ''}>{error}</AlertDescription>
          </Alert>
          
          <div className="flex justify-center mt-6">
            <Button 
              onClick={() => router.back()}
              className={`${isMobile ? 'w-full' : ''} touch-manipulation`}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isMobile ? 'Kembali' : 'Back to Profile'}
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 ${isMobile ? 'p-3 pb-6' : 'p-6'}`}>
      {/* Security Logging */}
      {user && (
        <SecurityLog
          userId={user.id}
          userName={user.fullName || user.username}
          action={SECURITY_ACTIONS.EDIT_ATTEMPT}
          targetResource={RESOURCE_TYPES.BIOGRAFI}
          targetId={biografiId}
          result={biografi ? SECURITY_RESULTS.SUCCESS : SECURITY_RESULTS.DENIED}
          reason={biografi ? undefined : error || "Access denied"}
        />
      )}
      
      <div className={`${isMobile ? 'max-w-full' : 'max-w-4xl'} mx-auto`}>
        <div className={`mb-${isMobile ? '4' : '6'}`}>
          <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-gray-900 dark:text-white mb-2`}>
            {isMobile ? 'Edit Profil' : 'Edit Profil Biografi'}
          </h1>
          <p className={`text-gray-600 dark:text-gray-400 ${isMobile ? 'text-sm' : ''}`}>
            {isMobile ? 'Perbarui informasi biografi' : 'Perbarui informasi biografi Anda'}
          </p>
        </div>
        
        <BiografiForm
          initialData={biografi || (userData ? {
            namaLengkap: userData.fullName,
            email: userData.email,
            nomorHp: userData.phoneNumber
          } : undefined)}
          isEdit={!!biografi}
          onSubmit={handleSubmit}
          submitButtonText={biografi ? "Update Biografi" : "Buat Biografi"}
          showBackButton={true}
          onBack={() => biografi ? router.push(`/biografi/${biografi.biografiId}`) : router.back()}
          redirectUrl={biografi ? `/biografi/${biografi.biografiId}` : undefined}
          hideStatusField={true}
          disableUserFields={true}
        />
      </div>
    </div>
  );
}
