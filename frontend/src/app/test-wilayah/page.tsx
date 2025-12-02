"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { wilayahAPI, WilayahProvince, WilayahRegency, WilayahDistrict, WilayahVillage } from "@/lib/wilayah-api";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Building, Home, Mail } from "lucide-react";
import { toast } from "sonner";

export default function WilayahTestPage() {
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState<WilayahProvince[]>([]);
  const [regencies, setRegencies] = useState<WilayahRegency[]>([]);
  const [districts, setDistricts] = useState<WilayahDistrict[]>([]);
  const [villages, setVillages] = useState<WilayahVillage[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedRegency, setSelectedRegency] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");

  const testProvinces = async () => {
    setLoading(true);
    try {
      const data = await wilayahAPI.getProvinces();
      setProvinces(data);
      toast.success(`Berhasil memuat ${data.length} provinsi`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal memuat data provinsi");
    } finally {
      setLoading(false);
    }
  };

  const testRegencies = async (provinceCode: string) => {
    setLoading(true);
    try {
      const data = await wilayahAPI.getRegencies(provinceCode);
      setRegencies(data);
      setSelectedProvince(provinceCode);
      toast.success(`Berhasil memuat ${data.length} kota/kabupaten`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal memuat data kota/kabupaten");
    } finally {
      setLoading(false);
    }
  };

  const testDistricts = async (regencyCode: string) => {
    setLoading(true);
    try {
      const data = await wilayahAPI.getDistricts(regencyCode);
      setDistricts(data);
      setSelectedRegency(regencyCode);
      toast.success(`Berhasil memuat ${data.length} kecamatan`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal memuat data kecamatan");
    } finally {
      setLoading(false);
    }
  };

  const testVillages = async (districtCode: string) => {
    setLoading(true);
    try {
      const data = await wilayahAPI.getVillages(districtCode);
      setVillages(data);
      setSelectedDistrict(districtCode);
      toast.success(`Berhasil memuat ${data.length} kelurahan/desa`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal memuat data kelurahan/desa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Test API Wilayah.id</h1>
        <p className="text-muted-foreground">
          Halaman untuk menguji integrasi dengan API wilayah.id
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Provinsi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Provinsi
            </CardTitle>
            <CardDescription>
              {provinces.length} provinsi dimuat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testProvinces} 
              disabled={loading}
              className="mb-4"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Muat Provinsi
            </Button>
            
            <div className="max-h-60 overflow-y-auto space-y-2">
              {provinces.map((province) => (
                <div 
                  key={province.code}
                  className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted"
                  onClick={() => testRegencies(province.code)}
                >
                  <span className="text-sm">{province.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {province.code}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Kota/Kabupaten */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Kota/Kabupaten
            </CardTitle>
            <CardDescription>
              {regencies.length} kota/kabupaten dimuat
              {selectedProvince && ` (Provinsi: ${selectedProvince})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {regencies.map((regency) => (
                <div 
                  key={regency.code}
                  className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted"
                  onClick={() => testDistricts(regency.code)}
                >
                  <span className="text-sm">{regency.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {regency.code}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Kecamatan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Kecamatan
            </CardTitle>
            <CardDescription>
              {districts.length} kecamatan dimuat
              {selectedRegency && ` (Kota: ${selectedRegency})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {districts.map((district) => (
                <div 
                  key={district.code}
                  className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted"
                  onClick={() => testVillages(district.code)}
                >
                  <span className="text-sm">{district.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {district.code}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Kelurahan/Desa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Kelurahan/Desa
            </CardTitle>
            <CardDescription>
              {villages.length} kelurahan/desa dimuat
              {selectedDistrict && ` (Kecamatan: ${selectedDistrict})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {villages.map((village) => (
                <div 
                  key={village.code}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex-1">
                    <span className="text-sm block">{village.name}</span>
                    {village.postal_code && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        Kode Pos: {village.postal_code}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {village.code}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Petunjuk Penggunaan</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Klik tombol "Muat Provinsi" untuk mengambil data provinsi dari wilayah.id</li>
            <li>Klik pada salah satu provinsi untuk memuat kota/kabupaten</li>
            <li>Klik pada salah satu kota/kabupaten untuk memuat kecamatan</li>
            <li>Klik pada salah satu kecamatan untuk memuat kelurahan/desa beserta kode pos</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
