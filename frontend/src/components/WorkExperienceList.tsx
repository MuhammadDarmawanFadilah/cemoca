"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { WorkExperience, masterDataAPI } from "@/lib/api";
import { Combobox } from "@/components/ui/combobox-enhanced";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface WorkExperienceListProps {
  workExperiences: WorkExperience[];
  onChange: (workExperiences: WorkExperience[]) => void;
}

export default function WorkExperienceList({ workExperiences, onChange }: WorkExperienceListProps) {
  // State for master data
  const [posisiOptions, setPosisiOptions] = useState<{value: string, label: string}[]>([]);

  // Load posisi data from backend
  useEffect(() => {
    const loadPosisiData = async () => {
      try {
        const posisiData = await masterDataAPI.posisi.getAllActive();
        const posisiOpts = posisiData.map(item => ({
          value: item.nama,
          label: item.nama
        }));
        setPosisiOptions(posisiOpts);
      } catch (error) {
        console.error("Error loading posisi data:", error);
        toast.error("Gagal memuat data posisi");
      }
    };

    loadPosisiData();
  }, []);  const addWorkExperience = () => {
    const newWorkExperience: WorkExperience = {
      posisi: "",
      perusahaan: "",
      tanggalMulai: "",
      tanggalSelesai: "",
      deskripsi: "",
      masihBekerja: false
    };
    onChange([...workExperiences, newWorkExperience]);
  };  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: string | boolean) => {
    const updated = workExperiences.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        // Jika masih bekerja di-check, hapus tanggal selesai
        if (field === 'masihBekerja' && value === true) {
          updatedItem.tanggalSelesai = "";
        }
        return updatedItem;
      }
      return item;
    });
    onChange(updated);
  };

  const updateWorkExperienceWithMultipleFields = (index: number, updates: Partial<WorkExperience>) => {
    const updated = workExperiences.map((item, i) => {
      if (i === index) {
        return { ...item, ...updates };
      }
      return item;
    });
    onChange(updated);
  };

  const removeWorkExperience = (index: number) => {
    const updated = workExperiences.filter((_, i) => i !== index);
    onChange(updated);
  };

  const parseDate = (dateString?: string): Date | undefined => {
    if (!dateString || dateString.trim() === "") return undefined;
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  };

  const formatDisplayDate = (dateString?: string): string => {
    const date = parseDate(dateString);
    if (!date) return "";
    try {
      return format(date, "dd MMMM yyyy", { locale: id });
    } catch {
      return dateString || "";
    }
  };
  return (
    <div className="space-y-4">      <div className="flex items-center justify-between">
        <Button
          type="button"
          onClick={addWorkExperience}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Tambah Pekerjaan
        </Button>
      </div>

      <div className="space-y-3">
        {workExperiences.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Belum ada pengalaman kerja. Klik &quot;Tambah Pekerjaan&quot; untuk menambah.</p>
          </div>
        ) : (
          workExperiences.map((experience, index) => (
            <Card key={index} className="relative">              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Pekerjaan {index + 1}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWorkExperience(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">                {/* Position and Company */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">                  <div className="space-y-1">
                    <Label htmlFor={`posisi-${index}`} className="text-sm">
                      Jabatan <span className="text-red-500">*</span>
                    </Label>
                    <Combobox
                      options={posisiOptions}
                      value={experience.posisi}
                      onValueChange={(value) => updateWorkExperience(index, "posisi", value)}
                      placeholder="Pilih jabatan"
                      searchPlaceholder="Cari jabatan..."
                      emptyMessage="Jabatan tidak ditemukan"
                      name={`posisi-${index}`}
                    />
                    {!experience.posisi && (
                      <p className="text-xs text-red-500 mt-1">Jabatan wajib diisi</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`perusahaan-${index}`} className="text-sm">
                      Nama Tempat Praktek <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`perusahaan-${index}`}
                      value={experience.perusahaan}
                      onChange={(e) => updateWorkExperience(index, "perusahaan", e.target.value)}
                      placeholder="Contoh: RS. Cipto Mangunkusumo"
                      className="w-full"
                    />
                    {!experience.perusahaan && (
                      <p className="text-xs text-red-500 mt-1">Nama tempat praktek wajib diisi</p>
                    )}
                  </div>
                </div>                {/* Start and End Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-sm">
                      Tanggal Mulai
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !experience.tanggalMulai && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />                          {experience.tanggalMulai ? 
                            formatDisplayDate(experience.tanggalMulai) : 
                            "Pilih tanggal mulai"
                          }
                        </Button>
                      </PopoverTrigger>                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={parseDate(experience.tanggalMulai)}
                          onSelect={(date) => {
                            updateWorkExperience(index, "tanggalMulai", date ? format(date, "yyyy-MM-dd") : "");
                          }}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                          captionLayout="dropdown-buttons"
                          fromYear={1900}
                          toYear={new Date().getFullYear()}
                          classNames={{
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                            month: "space-y-4",
                            caption: "flex justify-center pt-1 relative items-center",
                            caption_label: "text-sm font-medium",
                            caption_dropdowns: "flex justify-center gap-1",
                            vhidden: "hidden",
                            nav: "space-x-1 flex items-center",
                            nav_button: cn(
                              "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7"
                            ),
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                            row: "flex w-full mt-2",
                            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: cn(
                              "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md"
                            ),
                            day_range_end: "day-range-end",
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                            day_today: "bg-accent text-accent-foreground",
                            day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                            day_disabled: "text-muted-foreground opacity-50",
                            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                            day_hidden: "invisible",
                            dropdown: "absolute inset-0 w-full appearance-none opacity-0 z-10 cursor-pointer",
                            dropdown_month: "relative inline-flex h-8 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[120px] [&>select]:text-foreground [&>select]:bg-background",
                            dropdown_year: "relative inline-flex h-8 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[80px] [&>select]:text-foreground [&>select]:bg-background"
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>                  <div className="space-y-1">
                    <Label className="text-sm">
                      Tanggal Selesai
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            (!experience.tanggalSelesai || experience.masihBekerja) && "text-muted-foreground"
                          )}
                          disabled={experience.masihBekerja}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />                          {experience.masihBekerja ? 
                            "Masih bekerja" :
                            experience.tanggalSelesai ? 
                            formatDisplayDate(experience.tanggalSelesai) : 
                            "Pilih tanggal selesai"
                          }
                        </Button>
                      </PopoverTrigger>                      {!experience.masihBekerja && (
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={parseDate(experience.tanggalSelesai)}
                            onSelect={(date) => {
                              updateWorkExperience(index, "tanggalSelesai", date ? format(date, "yyyy-MM-dd") : "");
                            }}                          disabled={(date) => {
                              const startDate = parseDate(experience.tanggalMulai);
                              return date > new Date() || date < new Date("1900-01-01") || (startDate ? date < startDate : false);
                            }}
                            initialFocus
                            captionLayout="dropdown-buttons"
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                            classNames={{
                              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                              month: "space-y-4",
                              caption: "flex justify-center pt-1 relative items-center",
                              caption_label: "text-sm font-medium",
                              caption_dropdowns: "flex justify-center gap-1",
                              vhidden: "hidden",
                              nav: "space-x-1 flex items-center",
                              nav_button: cn(
                                "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7"
                              ),
                              nav_button_previous: "absolute left-1",
                              nav_button_next: "absolute right-1",
                              table: "w-full border-collapse space-y-1",
                              head_row: "flex",
                              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                              row: "flex w-full mt-2",
                              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                              day: cn(
                                "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md"
                              ),
                              day_range_end: "day-range-end",
                              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                              day_today: "bg-accent text-accent-foreground",
                              day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                              day_disabled: "text-muted-foreground opacity-50",
                              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                              day_hidden: "invisible",
                              dropdown: "absolute inset-0 w-full appearance-none opacity-0 z-10 cursor-pointer",
                              dropdown_month: "relative inline-flex h-8 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[120px] [&>select]:text-foreground [&>select]:bg-background",
                              dropdown_year: "relative inline-flex h-8 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[80px] [&>select]:text-foreground [&>select]:bg-background"
                            }}
                          />
                        </PopoverContent>
                      )}
                    </Popover>
                  </div>
                </div>                {/* Still Working Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`masih-bekerja-${index}`}
                    checked={experience.masihBekerja || false}
                    onCheckedChange={(checked) => {
                      const isChecked = checked === true;
                      if (isChecked) {
                        // Jika masih bekerja, set masihBekerja true dan hapus tanggal selesai
                        updateWorkExperienceWithMultipleFields(index, {
                          masihBekerja: true,
                          tanggalSelesai: ""
                        });
                      } else {
                        // Jika tidak masih bekerja, set masihBekerja false
                        updateWorkExperience(index, "masihBekerja", false);
                      }
                    }}
                  />
                  <Label htmlFor={`masih-bekerja-${index}`} className="text-sm font-normal cursor-pointer">
                    Masih bekerja di tempat ini
                  </Label>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <Label htmlFor={`deskripsi-${index}`} className="text-sm">
                    Alamat Praktek
                  </Label>
                  <Textarea
                    id={`deskripsi-${index}`}
                    value={experience.deskripsi || ""}
                    onChange={(e) => updateWorkExperience(index, "deskripsi", e.target.value)}
                    placeholder="Masukkan alamat tempat praktek..."
                    rows={3}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {workExperiences.length > 0 && (        <div className="flex justify-center pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={addWorkExperience}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Tambah Pekerjaan Lainnya
          </Button>
        </div>
      )}
    </div>
  );
}
