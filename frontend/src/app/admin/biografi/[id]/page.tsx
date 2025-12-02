"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { biografiAPI, imageAPI, Biografi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Award,
  Heart,
  Users,
  MessageSquare,
  Instagram,
  Youtube,
  Linkedin,
  Facebook
} from "lucide-react";
import Link from "next/link";

export default function BiografiDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [biografi, setBiografi] = useState<Biografi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBiografi = async () => {
      try {
        setLoading(true);
        const data = await biografiAPI.getBiografiById(parseInt(id));
        setBiografi(data);
      } catch (error) {
        console.error("Error fetching biografi:", error);
        setError("Gagal memuat data biografi");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBiografi();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!biografi) return;
    
    if (confirm(`Hapus biografi ${biografi.namaLengkap}?`)) {
      try {
        await biografiAPI.deleteBiografi(biografi.biografiId);
        router.push("/biografi");
        router.refresh();
      } catch (error) {
        console.error("Error deleting biografi:", error);
        // TODO: Show error toast
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Memuat data biografi...</div>
      </div>
    );
  }

  if (error || !biografi) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-destructive">
            {error || "Biografi tidak ditemukan"}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        
        <div className="flex space-x-2">          <Button asChild>
            <Link href={`/admin/biografi/${biografi.biografiId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">            <Avatar className="h-24 w-24">
              <AvatarImage 
                src={biografi.foto ? imageAPI.getImageUrl(biografi.foto) : ''} 
                alt={biografi.namaLengkap} 
              />
              <AvatarFallback className="text-2xl">
                {biografi.namaLengkap.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold">{biografi.namaLengkap}</h1>
                <Badge variant={
                  biografi.status === "AKTIF" 
                    ? "default" 
                    : biografi.status === "DRAFT" 
                    ? "secondary" 
                    : "destructive"
                }>
                  {biografi.status === "AKTIF" ? "Aktif" : biografi.status === "DRAFT" ? "Draft" : "Tidak Aktif"}
                </Badge>
              </div>
              
              <div className="text-xl text-muted-foreground">
                {biografi.nim} - {biografi.programStudi}
              </div>              
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4" />
                  {biografi.email}
                </div>
                <div className="flex items-center">
                  <Phone className="mr-2 h-4 w-4" />
                  {biografi.nomorTelepon}
                </div>
                {biografi.kota && (
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    {biografi.kota}{biografi.provinsi && `, ${biografi.provinsi}`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Akademik */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="mr-2 h-5 w-5" />
              Data Akademik
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Jurusan</label>
              <p className="text-lg">{biografi.programStudi}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tanggal Lulus</label>              <p className="text-lg">
                {biografi.tanggalLulus ? new Date(biografi.tanggalLulus).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }) : "Tidak tersedia"}
              </p>
            </div>
            
            {biografi.ipk && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">IPK</label>                <p className="text-lg">{biografi.ipk}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kontak */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="mr-2 h-5 w-5" />
              Informasi Kontak
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-lg">{biografi.email}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nomor HP</label>
              <p className="text-lg">{biografi.nomorTelepon}</p>            </div>
            
            {biografi.alamat && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Alamat</label>
                <p className="text-lg whitespace-pre-wrap">{biografi.alamat}</p>
              </div>
            )}
            
            <div className="flex space-x-4">
              {biografi.kota && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Kota</label>
                  <p className="text-lg">{biografi.kota}</p>
                </div>
              )}
              
              {biografi.provinsi && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Provinsi</label>
                  <p className="text-lg">{biografi.provinsi}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>        {/* Pengalaman Kerja */}
        {biografi.workExperiences && biografi.workExperiences.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5" />
                Pengalaman Kerja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {biografi.workExperiences.map((experience, index) => (
                <div key={index} className="border-l-2 border-primary pl-4">
                  <h4 className="font-semibold text-lg">{experience.posisi}</h4>
                  <p className="text-muted-foreground">{experience.perusahaan}</p>
                  {(experience.tanggalMulai || experience.tanggalSelesai) && (
                    <p className="text-sm text-muted-foreground">
                      {experience.tanggalMulai} {experience.tanggalSelesai ? `- ${experience.tanggalSelesai}` : '- Sekarang'}
                    </p>
                  )}
                  {experience.deskripsi && (
                    <p className="mt-2 text-sm whitespace-pre-wrap">{experience.deskripsi}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Prestasi */}
        {biografi.prestasi && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-5 w-5" />
                Prestasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg whitespace-pre-wrap">{biografi.prestasi}</p>
            </CardContent>
          </Card>
        )}

        {/* Hobi */}
        {biografi.hobi && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="mr-2 h-5 w-5" />
                Hobi & Minat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg whitespace-pre-wrap">{biografi.hobi}</p>
            </CardContent>
          </Card>
        )}        {/* Media Sosial */}
        {(biografi.instagram || biografi.youtube || biografi.linkedin || biografi.facebook) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Media Sosial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {biografi.instagram && (
                  <div className="flex items-center space-x-3">
                    <Instagram className="h-5 w-5 text-pink-600" />
                    <a 
                      href={biografi.instagram.startsWith('http') ? biografi.instagram : `https://instagram.com/${biografi.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {biografi.instagram}
                    </a>
                  </div>
                )}
                {biografi.youtube && (
                  <div className="flex items-center space-x-3">
                    <Youtube className="h-5 w-5 text-red-600" />
                    <a 
                      href={biografi.youtube.startsWith('http') ? biografi.youtube : `https://youtube.com/${biografi.youtube.replace('@', '').replace('/', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {biografi.youtube}
                    </a>
                  </div>
                )}
                {biografi.linkedin && (
                  <div className="flex items-center space-x-3">
                    <Linkedin className="h-5 w-5 text-blue-600" />
                    <a 
                      href={biografi.linkedin.startsWith('http') ? biografi.linkedin : `https://linkedin.com/in/${biografi.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {biografi.linkedin}
                    </a>
                  </div>
                )}
                {biografi.facebook && (
                  <div className="flex items-center space-x-3">
                    <Facebook className="h-5 w-5 text-blue-800" />
                    <a 
                      href={biografi.facebook.startsWith('http') ? biografi.facebook : `https://facebook.com/${biografi.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {biografi.facebook}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Catatan */}
      {biografi.catatan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Catatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg whitespace-pre-wrap">{biografi.catatan}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between text-sm text-muted-foreground">
            <div>
              Dibuat: {new Date(biografi.createdAt).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long", 
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </div>
            <div>
              Diperbarui: {new Date(biografi.updatedAt).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric", 
                hour: "2-digit",
                minute: "2-digit"
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
