'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserX, ArrowLeft } from 'lucide-react';

export default function BiografiNotFoundPage() {
    const router = useRouter();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-md mx-auto">
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <UserX className="w-8 h-8 text-gray-500" />
                        </div>
                        <CardTitle className="text-xl font-semibold text-gray-800">
                            Biografi Tidak Ditemukan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-gray-600">
                            Pengguna ini belum memiliki halaman biografi atau biografi tidak tersedia.
                        </p>
                        <div className="space-y-2">
                            <Button 
                                onClick={() => router.back()}
                                variant="outline"
                                className="w-full"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Kembali
                            </Button>
                            <Button 
                                onClick={() => router.push('/dashboard')}
                                className="w-full"
                            >
                                Ke Dashboard
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
