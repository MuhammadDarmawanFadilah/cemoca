'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Smartphone, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { getApiUrl } from '@/lib/config';
import Image from 'next/image';

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
      <div className="min-h-[calc(100svh-64px)] flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md rounded-2xl shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-5">
                <div className="h-12 w-12 rounded-2xl border bg-background flex items-center justify-center">
                  <Image src="/logo.svg" alt="CAMOCA" width={26} height={26} />
                </div>
              </div>

              <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="h-7 w-7 text-green-600" />
              </div>
              
              <h1 className="text-xl font-semibold mb-2">
                Link Terkirim!
              </h1>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {message}
              </p>
              
              <div className="bg-muted/40 border rounded-lg p-4 mb-6 text-left">
                <div className="flex items-start">
                  <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Cek WhatsApp Anda</p>
                    <p className="text-muted-foreground">Link reset password telah dikirim ke nomor telepon yang terdaftar. Link berlaku selama 1 jam.</p>
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
                  className="w-full"
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
    <div className="min-h-[calc(100svh-64px)] flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md rounded-2xl shadow-sm">
        <CardHeader className="text-center space-y-3">
          <div className="flex items-center justify-center">
            <div className="h-12 w-12 rounded-2xl border bg-background flex items-center justify-center">
              <Image src="/logo.svg" alt="CAMOCA" width={26} height={26} />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold">Lupa Kata Sandi</CardTitle>
            <CardDescription>Masukkan username atau nomor telepon untuk menerima link reset password</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-medium">
                Username atau Nomor Telepon
              </Label>
              <Input
                id="identifier"
                type="text"
                value={form.identifier}
                onChange={(e) => handleInputChange('identifier', e.target.value)}
                placeholder="contoh: tika atau 081234567890"
                className="h-11"
                disabled={isLoading}
              />
              {errors.identifier && (
                <p className="text-sm text-destructive">{errors.identifier}</p>
              )}
            </div>

            <div className="bg-muted/40 border rounded-lg p-4">
              <div className="flex items-start">
                <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Link akan dikirim via WhatsApp</p>
                  <p className="text-muted-foreground">Pastikan nomor telepon yang terdaftar dapat menerima WhatsApp</p>
                </div>
              </div>
            </div>

            {message && !success && (
              <Alert variant="destructive">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full h-11" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim Link...
                  </>
                ) : (
                  'Kirim Link Reset Password'
                )}
              </Button>
              
              <Button 
                type="button"
                variant="outline" 
                onClick={() => router.push('/login')}
                className="w-full h-11"
                disabled={isLoading}
              >
                Kembali ke Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}