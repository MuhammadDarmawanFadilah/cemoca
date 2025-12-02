'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, KeyRound, Smartphone, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { getApiUrl } from '@/lib/config';

const forgotPasswordSchema = z.object({
  identifier: z.string()
    .min(1, 'Username atau nomor telepon harus diisi')
    .refine((value) => {
      // Check if it's a phone number (starts with 08 or +62) or username
      const phoneRegex = /^(08\d{8,11}|\+62\d{9,12}|62\d{9,12})$/;
      const usernameRegex = /^[a-zA-Z0-9._-]{3,20}$/;
      return phoneRegex.test(value) || usernameRegex.test(value);
    }, 'Masukkan username yang valid atau nomor telepon (08xxxxxxxxx)')
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  const [form, setForm] = useState<ForgotPasswordForm>({
    identifier: ''
  });
  const [errors, setErrors] = useState<Partial<ForgotPasswordForm>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    try {
      forgotPasswordSchema.parse(form);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<ForgotPasswordForm> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof ForgotPasswordForm] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(getApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: form.identifier.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setMessage(data.message || 'Link reset password telah dikirim ke WhatsApp Anda.');
      } else {
        setMessage(data.message || 'Terjadi kesalahan. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error submitting forgot password:', error);
      setMessage('Terjadi kesalahan sistem. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ForgotPasswordForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    setMessage('');
    setSuccess(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h1 className="text-xl font-semibold text-gray-900 mb-3">
                Link Terkirim!
              </h1>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                {message}
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Smartphone className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">Cek WhatsApp Anda</p>
                    <p>Link reset password telah dikirim ke nomor telepon yang terdaftar. Link berlaku selama 1 jam.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => setSuccess(false)}
                  variant="outline" 
                  className="w-full"
                >
                  Kirim Ulang
                </Button>
                
                <Button 
                  onClick={() => router.push('/login')} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Kembali ke Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="h-8 w-8 text-blue-600" />
          </div>
          
          <CardTitle className="text-2xl font-semibold text-gray-900">
            Lupa Password?
          </CardTitle>
          
          <CardDescription className="text-gray-600 mt-2">
            Masukkan username atau nomor telepon untuk mendapatkan link reset password
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-medium text-gray-700">
                Username atau Nomor Telepon
              </Label>
              <Input
                id="identifier"
                type="text"
                value={form.identifier}
                onChange={(e) => handleInputChange('identifier', e.target.value)}
                placeholder="contoh: tika atau 081234567890"
                className={`h-12 ${errors.identifier ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                disabled={isLoading}
              />
              {errors.identifier && (
                <p className="text-sm text-red-600">{errors.identifier}</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Smartphone className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Link akan dikirim via WhatsApp</p>
                  <p>Pastikan nomor telepon yang terdaftar dapat menerima WhatsApp</p>
                </div>
              </div>
            </div>

            {message && !success && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Mengirim Link...
                  </>
                ) : (
                  'Kirim Link Reset Password'
                )}
              </Button>
              
              <Button 
                type="button"
                variant="ghost" 
                onClick={() => router.push('/login')}
                className="w-full h-12 text-gray-600 hover:text-gray-800"
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}