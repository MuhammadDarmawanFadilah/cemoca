"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SpesialisasiKedokteran } from "@/lib/api";
import { Combobox } from "@/components/ui/combobox-enhanced";

// Medical specialization options
const SPESIALISASI_KEDOKTERAN_OPTIONS = [
  "Dokter Umum",
  "Spesialis Anak (Sp.A)",
  "Spesialis Penyakit Dalam (Sp.PD)",
  "Spesialis Bedah (Sp.B)",
  "Spesialis Jantung dan Pembuluh Darah (Sp.JP)",
  "Spesialis Mata (Sp.M)",
  "Spesialis THT-KL (Sp.THT-KL)",
  "Spesialis Kulit dan Kelamin (Sp.KK)",
  "Spesialis Kandungan (Sp.OG)",
  "Spesialis Saraf (Sp.S)",
  "Spesialis Psikiatri (Sp.KJ)",
  "Spesialis Radiologi (Sp.Rad)",
  "Spesialis Anestesiologi (Sp.An)",
  "Spesialis Patologi Anatomi (Sp.PA)",
  "Spesialis Patologi Klinik (Sp.PK)",
  "Spesialis Mikrobiologi Klinik (Sp.MK)",
  "Spesialis Forensik (Sp.F)",
  "Spesialis Rehabilitasi Medik (Sp.RM)",
  "Spesialis Kedokteran Nuklir (Sp.KN)",
  "Spesialis Kedokteran Jiwa (Sp.KJ)",
  "Spesialis Bedah Saraf (Sp.BS)",
  "Spesialis Bedah Plastik (Sp.BP)",
  "Spesialis Bedah Anak (Sp.BA)",
  "Spesialis Bedah Toraks dan Kardiovaskular (Sp.BTKV)",
  "Spesialis Urologi (Sp.U)",
  "Spesialis Ortopedi dan Traumatologi (Sp.OT)",
  "Spesialis Kedokteran Fisik dan Rehabilitasi (Sp.KFR)",
  "Spesialis Onkologi Radiasi (Sp.OnkRad)",
  "Spesialis Gizi Klinik (Sp.GK)",
  "Spesialis Kedokteran Okupasi (Sp.OK)",
  "Spesialis Kedokteran Olahraga (Sp.KO)",
  "Spesialis Parasitologi (Sp.ParK)",
  "Spesialis Farmakologi Klinik (Sp.FK)",
  "Dokter Gigi Umum",
  "Spesialis Bedah Mulut (Sp.BM)",
  "Spesialis Konservasi Gigi (Sp.KG)",
  "Spesialis Periodonsia (Sp.Perio)",
  "Spesialis Prosthodonsia (Sp.Pros)",
  "Spesialis Ortodonsia (Sp.Ort)",
  "Spesialis Kedokteran Gigi Anak (Sp.KGA)",
  "Spesialis Penyakit Mulut (Sp.PM)",
  "Spesialis Radiologi Kedokteran Gigi (Sp.RKG)",
  "Tenaga Kesehatan Lainnya",
  "Peneliti Medis",
  "Dosen Kedokteran",
  "Tidak Praktik (Non-Medis)"
];

interface SpesialisasiKedokteranListProps {
  spesialisasiList: SpesialisasiKedokteran[];
  onChange: (spesialisasiList: SpesialisasiKedokteran[]) => void;
}

export default function SpesialisasiKedokteranList({ 
  spesialisasiList, 
  onChange 
}: SpesialisasiKedokteranListProps) {
  const [openPopovers, setOpenPopovers] = useState<{ [key: string]: boolean }>({});

  const setPopoverOpen = (key: string, open: boolean) => {
    setOpenPopovers(prev => ({
      ...prev,
      [key]: open
    }));
  };

  const addSpesialisasi = () => {
    const newSpesialisasi: SpesialisasiKedokteran = {
      spesialisasi: "",
      lokasiPenempatan: "",
      tanggalMulai: "",
      tanggalAkhir: "",
      masihBekerja: false
    };
    onChange([...spesialisasiList, newSpesialisasi]);
  };

  const removeSpesialisasi = (index: number) => {
    const updated = spesialisasiList.filter((_, i) => i !== index);
    onChange(updated);
  };
  const updateSpesialisasi = (index: number, field: keyof SpesialisasiKedokteran, value: string | boolean) => {
    const updated = spesialisasiList.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        // Jika masih bekerja di-check, hapus tanggal akhir
        if (field === 'masihBekerja' && value === true) {
          updatedItem.tanggalAkhir = "";
        }
        return updatedItem;
      }
      return item;
    });
    onChange(updated);
  };

  const updateSpesialisasiWithMultipleFields = (index: number, updates: Partial<SpesialisasiKedokteran>) => {
    const updated = spesialisasiList.map((item, i) => {
      if (i === index) {
        return { ...item, ...updates };
      }
      return item;
    });
    onChange(updated);
  };
  const handleDateSelect = (index: number, field: 'tanggalMulai' | 'tanggalAkhir', date: Date | undefined) => {
    if (date) {
      updateSpesialisasi(index, field, format(date, "yyyy-MM-dd"));
      setPopoverOpen(`${index}-${field}`, false); // Auto-close after date selection
    } else {
      updateSpesialisasi(index, field, "");
    }
  };

  const parseDate = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    try {
      return new Date(dateString);
    } catch {
      return undefined;
    }
  };  return (
    <div className="space-y-4">
      <div className="flex justify-start">
        <Button type="button" onClick={addSpesialisasi} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Spesialisasi
        </Button>
      </div>

      <div className="space-y-3">
        {spesialisasiList.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Belum ada spesialisasi kedokteran. Klik &quot;Tambah Spesialisasi&quot; untuk menambah.</p>
          </div>
        ) : (
          spesialisasiList.map((item, index) => (
            <Card key={index} className="relative">
              <CardContent className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-sm text-gray-600">Spesialisasi #{index + 1}</h4>                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSpesialisasi(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                    title="Hapus spesialisasi"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">                  {/* Spesialisasi */}
                  <div className="space-y-2">
                    <Label htmlFor={`spesialisasi-${index}`}>Spesialisasi</Label>
                    <Combobox
                      options={SPESIALISASI_KEDOKTERAN_OPTIONS.map(s => ({ value: s, label: s }))}
                      value={item.spesialisasi}
                      placeholder="Pilih spesialisasi..."
                      searchPlaceholder="Cari spesialisasi..."
                      emptyMessage="Tidak ada spesialisasi ditemukan"
                      onValueChange={(value) => updateSpesialisasi(index, "spesialisasi", value)}
                    />
                  </div>

                  {/* Lokasi Penempatan */}
                  <div className="space-y-2">
                    <Label htmlFor={`lokasi-${index}`}>Lokasi Penempatan</Label>
                    <Input
                      id={`lokasi-${index}`}
                      placeholder="Contoh: RS. Cipto Mangunkusumo"
                      value={item.lokasiPenempatan}
                      onChange={(e) => updateSpesialisasi(index, "lokasiPenempatan", e.target.value)}
                    />
                  </div>                  {/* Tanggal Mulai */}
                  <div className="space-y-2">
                    <Label>Tanggal Mulai</Label>
                    <Popover 
                      open={openPopovers[`${index}-tanggalMulai`] || false} 
                      onOpenChange={(open) => setPopoverOpen(`${index}-tanggalMulai`, open)}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !item.tanggalMulai && "text-muted-foreground"
                          )}
                        >
                          {item.tanggalMulai ? (
                            format(parseDate(item.tanggalMulai) || new Date(), "dd MMMM yyyy", { locale: id })
                          ) : (
                            <span>Pilih tanggal mulai</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={parseDate(item.tanggalMulai)}
                          onSelect={(date) => handleDateSelect(index, 'tanggalMulai', date)}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
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
                            dropdown_month: "relative inline-flex h-8 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[120px] [&>select]:text-foreground [&>select]:bg-background",
                            dropdown_year: "relative inline-flex h-8 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[80px] [&>select]:text-foreground [&>select]:bg-background"
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>                  {/* Tanggal Akhir */}
                  <div className="space-y-2">
                    <Label>Tanggal Akhir</Label>
                    <Popover 
                      open={openPopovers[`${index}-tanggalAkhir`] || false} 
                      onOpenChange={(open) => setPopoverOpen(`${index}-tanggalAkhir`, open)}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            (!item.tanggalAkhir || item.masihBekerja) && "text-muted-foreground"
                          )}
                          disabled={item.masihBekerja}
                        >                          {item.masihBekerja ? (
                            <span>Masih spesialisasi</span>
                          ) : item.tanggalAkhir ? (
                            format(parseDate(item.tanggalAkhir) || new Date(), "dd MMMM yyyy", { locale: id })
                          ) : (
                            <span>Pilih tanggal akhir</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      {!item.masihBekerja && (
                        <PopoverContent className="w-auto p-0" align="start">                          <Calendar
                            mode="single"
                            selected={item.tanggalAkhir ? parseDate(item.tanggalAkhir) : undefined}
                            onSelect={(date) => handleDateSelect(index, 'tanggalAkhir', date)}
                            disabled={(date) =>
                              date > new Date() || 
                              date < new Date("1900-01-01") ||
                              (item.tanggalMulai ? date < (parseDate(item.tanggalMulai) || new Date()) : false)
                            }
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
                </div>                {/* Checkbox Masih Spesialisasi */}
                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox
                    id={`masih-bekerja-${index}`}
                    checked={item.masihBekerja || false}
                    onCheckedChange={(checked) => {
                      const isChecked = checked === true;
                      if (isChecked) {
                        // Jika masih spesialisasi, set masihBekerja true dan hapus tanggal akhir
                        updateSpesialisasiWithMultipleFields(index, {
                          masihBekerja: true,
                          tanggalAkhir: ""
                        });
                      } else {
                        // Jika tidak masih spesialisasi, set masihBekerja false
                        updateSpesialisasi(index, "masihBekerja", false);
                      }
                    }}
                  />
                  <Label htmlFor={`masih-bekerja-${index}`} className="text-sm">
                    Masih spesialisasi di tempat ini
                  </Label>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {spesialisasiList.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={addSpesialisasi}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Tambah Spesialisasi Lainnya
          </Button>
        </div>
      )}
    </div>
  );
}
