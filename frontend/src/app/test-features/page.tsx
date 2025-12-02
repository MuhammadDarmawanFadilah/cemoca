"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { WorkExperience } from "@/lib/api";
import WorkExperienceList from "@/components/WorkExperienceList";
import PhotoUpload from "@/components/PhotoUpload";

export default function TestNewFeatures() {  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([
    {
      posisi: "",
      perusahaan: "",
      tanggalMulai: "",
      tanggalSelesai: "",
      deskripsi: ""
    }
  ]);
  
  const [foto, setFoto] = useState<string>("");
  const [fotoPreview, setFotoPreview] = useState<string>("");  const [tanggalMasukKerja, setTanggalMasukKerja] = useState<Date>();
  const [tanggalKeluarKerja, setTanggalKeluarKerja] = useState<Date>();

  const handleSubmit = async () => {
    console.log("Work Experiences:", workExperiences);
    console.log("Photo:", foto);
    console.log("Career Start Date:", tanggalMasukKerja ? format(tanggalMasukKerja, "yyyy-MM-dd") : "");
    console.log("Career End Date:", tanggalKeluarKerja ? format(tanggalKeluarKerja, "yyyy-MM-dd") : "");
    
    // Here you would normally send this to the backend
    alert("Data logged to console. Check browser console for details.");
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Test New Alumni Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Photo Upload Test */}
            <div>
              <h3 className="text-lg font-semibold mb-4">1. Photo Upload with Preview</h3>
              <PhotoUpload 
                value={foto}
                onChange={setFoto}
                preview={fotoPreview}
                onPreviewChange={setFotoPreview}
              />
            </div>

            <hr className="my-6" />            {/* Career Dates Test */}
            <div>
              <h3 className="text-lg font-semibold mb-4">2. Career Start/End Dates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Tanggal Masuk Kerja (Awal Masuk)
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !tanggalMasukKerja && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {tanggalMasukKerja ? (
                          format(tanggalMasukKerja, "dd MMMM yyyy", { locale: id })
                        ) : (
                          "Pilih tanggal masuk kerja"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={tanggalMasukKerja}
                        onSelect={setTanggalMasukKerja}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Tanggal Keluar Kerja
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !tanggalKeluarKerja && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {tanggalKeluarKerja ? (
                          format(tanggalKeluarKerja, "dd MMMM yyyy", { locale: id })
                        ) : (
                          "Masih bekerja / Pilih tanggal"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={tanggalKeluarKerja}
                        onSelect={setTanggalKeluarKerja}
                        disabled={(date) => {
                          return date > new Date() || (tanggalMasukKerja ? date < tanggalMasukKerja : false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Kosongkan jika masih bekerja
                  </p>
                </div>
              </div>
            </div>

            <hr className="my-6" />

            {/* Work Experience Test */}
            <div>
              <h3 className="text-lg font-semibold mb-4">3. Multiple Work Experiences</h3>
              <WorkExperienceList 
                workExperiences={workExperiences}
                onChange={setWorkExperiences}
              />
            </div>

            <hr className="my-6" />

            {/* Submit Test */}
            <div className="flex justify-center">
              <Button onClick={handleSubmit} className="px-8">
                Test Submit (Check Console)
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
