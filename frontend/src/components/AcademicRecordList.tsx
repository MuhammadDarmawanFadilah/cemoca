"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface AcademicRecord {
  jenjangPendidikan: string;
  universitas: string;
  programStudi: string;
  ipk: string;
  tanggalLulus: string;
}

interface AcademicRecordListProps {
  academicRecords: AcademicRecord[];
  onChange: (academicRecords: AcademicRecord[]) => void;
}

const JENJANG_PENDIDIKAN_OPTIONS = [
  { value: "SD", label: "SD (Sekolah Dasar)" },
  { value: "SMP", label: "SMP (Sekolah Menengah Pertama)" },
  { value: "SMA", label: "SMA/SMK (Sekolah Menengah Atas)" },
  { value: "D1", label: "D1 (Diploma 1)" },
  { value: "D2", label: "D2 (Diploma 2)" },
  { value: "D3", label: "D3 (Diploma 3)" },
  { value: "D4", label: "D4 (Diploma 4)" },
  { value: "S1", label: "S1 (Sarjana)" },
  { value: "S2", label: "S2 (Magister)" },
  { value: "S3", label: "S3 (Doktor)" }
];

export default function AcademicRecordList({ academicRecords, onChange }: AcademicRecordListProps) {
  const [openPopovers, setOpenPopovers] = useState<{ [key: number]: boolean }>({});

  const setPopoverOpen = (index: number, open: boolean) => {
    setOpenPopovers(prev => ({
      ...prev,
      [index]: open
    }));
  };

  const addAcademicRecord = () => {
    const newRecord: AcademicRecord = {
      jenjangPendidikan: "",
      universitas: "",
      programStudi: "",
      ipk: "",
      tanggalLulus: ""
    };
    onChange([...academicRecords, newRecord]);
  };

  const removeAcademicRecord = (index: number) => {
    const updated = academicRecords.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateAcademicRecord = (index: number, field: keyof AcademicRecord, value: string) => {
    const updated = academicRecords.map((record, i) => 
      i === index ? { ...record, [field]: value } : record
    );
    onChange(updated);
  };
  const handleDateSelect = (index: number, date: Date | undefined) => {
    if (date) {
      updateAcademicRecord(index, "tanggalLulus", format(date, "yyyy-MM-dd"));
      setPopoverOpen(index, false); // Auto-close after date selection
    } else {
      updateAcademicRecord(index, "tanggalLulus", "");
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
      <div className="flex justify-between items-center">
        <Button type="button" onClick={addAcademicRecord} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Akademik
        </Button>
      </div>

      <div className="space-y-3">
        {academicRecords.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Belum ada riwayat pendidikan. Klik &quot;Tambah Akademik&quot; untuk menambah.</p>
          </div>
        ) : (
          academicRecords.map((record, index) => (
            <Card key={index} className="relative">
              <CardContent className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-sm text-gray-600">Pendidikan #{index + 1}</h4>                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAcademicRecord(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                    title="Hapus pendidikan"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">              {/* Jenjang Pendidikan */}
              <div className="space-y-2">
                <Label htmlFor={`jenjang-${index}`}>Jenjang Pendidikan</Label>
                <Select
                  value={record.jenjangPendidikan}
                  onValueChange={(value) => updateAcademicRecord(index, "jenjangPendidikan", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenjang" />
                  </SelectTrigger>
                  <SelectContent>
                    {JENJANG_PENDIDIKAN_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>              {/* Nama Institusi */}
              <div className="space-y-2">
                <Label htmlFor={`universitas-${index}`}>
                  {record.jenjangPendidikan === 'SD' || record.jenjangPendidikan === 'SMP' || record.jenjangPendidikan === 'SMA' 
                    ? 'Nama Sekolah' 
                    : 'Universitas/Institut'
                  }
                </Label>
                <Input
                  id={`universitas-${index}`}
                  placeholder={
                    record.jenjangPendidikan === 'SD' || record.jenjangPendidikan === 'SMP' || record.jenjangPendidikan === 'SMA' 
                      ? 'Nama sekolah' 
                      : 'Nama universitas/institut'
                  }
                  value={record.universitas}
                  onChange={(e) => updateAcademicRecord(index, "universitas", e.target.value)}
                />
              </div>

              {/* Program Studi */}
              <div className="space-y-2">
                <Label htmlFor={`program-studi-${index}`}>
                  {record.jenjangPendidikan === 'SD' || record.jenjangPendidikan === 'SMP' || record.jenjangPendidikan === 'SMA' 
                    ? 'Jurusan (opsional)' 
                    : 'Program Studi'
                  }
                </Label>
                <Input
                  id={`program-studi-${index}`}
                  placeholder={
                    record.jenjangPendidikan === 'SD' || record.jenjangPendidikan === 'SMP' || record.jenjangPendidikan === 'SMA' 
                      ? 'Jurusan (untuk SMA/SMK)' 
                      : 'Nama program studi'
                  }
                  value={record.programStudi}
                  onChange={(e) => updateAcademicRecord(index, "programStudi", e.target.value)}
                />
              </div>

              {/* IPK/Nilai */}
              <div className="space-y-2">
                <Label htmlFor={`ipk-${index}`}>
                  {record.jenjangPendidikan === 'SD' || record.jenjangPendidikan === 'SMP' || record.jenjangPendidikan === 'SMA' 
                    ? 'Rata-rata Nilai (opsional)' 
                    : 'IPK'
                  }
                </Label>
                <Input
                  id={`ipk-${index}`}
                  placeholder={
                    record.jenjangPendidikan === 'SD' || record.jenjangPendidikan === 'SMP' || record.jenjangPendidikan === 'SMA' 
                      ? 'Contoh: 85' 
                      : 'Contoh: 3.75'
                  }
                  value={record.ipk}
                  onChange={(e) => updateAcademicRecord(index, "ipk", e.target.value)}
                />
              </div>              {/* Tanggal Lulus */}
              <div className="space-y-2">
                <Label>
                  {record.jenjangPendidikan === 'SD' || record.jenjangPendidikan === 'SMP' || record.jenjangPendidikan === 'SMA' 
                    ? 'Tanggal Lulus/Tamat' 
                    : 'Tanggal Lulus'
                  }                </Label>
                <Popover 
                  open={openPopovers[index] || false} 
                  onOpenChange={(open) => setPopoverOpen(index, open)}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !record.tanggalLulus && "text-muted-foreground"
                      )}
                    >
                      {record.tanggalLulus ? (
                        format(parseDate(record.tanggalLulus) || new Date(), "dd MMMM yyyy", { locale: id })
                      ) : (
                        <span>
                          {record.jenjangPendidikan === 'SD' || record.jenjangPendidikan === 'SMP' || record.jenjangPendidikan === 'SMA' 
                            ? 'Pilih tanggal lulus/tamat' 
                            : 'Pilih tanggal lulus'
                          }
                        </span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseDate(record.tanggalLulus)}
                      onSelect={(date) => handleDateSelect(index, date)}
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
                        dropdown_month: "relative inline-flex h-8 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[120px] [&>select]:text-foreground [&>select]:bg-background",
                        dropdown_year: "relative inline-flex h-8 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[80px] [&>select]:text-foreground [&>select]:bg-background"
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>            </div>
          </CardContent>
        </Card>
          ))
        )}
      </div>

      {academicRecords.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={addAcademicRecord}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Tambah Akademik lainnya
          </Button>
        </div>
      )}
    </div>
  );
}
