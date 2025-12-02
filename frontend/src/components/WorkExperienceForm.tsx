"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { WorkExperience } from "@/lib/api";

interface WorkExperienceFormProps {
  workExperience: WorkExperience;
  onChange: (workExperience: WorkExperience) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export default function WorkExperienceForm({
  workExperience,
  onChange,
  onRemove,
  canRemove
}: WorkExperienceFormProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(
    workExperience.tanggalMulai ? new Date(workExperience.tanggalMulai) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    workExperience.tanggalSelesai ? new Date(workExperience.tanggalSelesai) : undefined
  );

  const handleInputChange = (field: keyof WorkExperience, value: string) => {
    onChange({
      ...workExperience,
      [field]: value
    });
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    onChange({
      ...workExperience,
      tanggalMulai: date ? format(date, "yyyy-MM-dd") : undefined
    });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    onChange({
      ...workExperience,
      tanggalSelesai: date ? format(date, "yyyy-MM-dd") : undefined
    });
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 relative">
      {canRemove && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRemove}
          className="absolute top-2 right-2 h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`posisi-${workExperience.id || 'new'}`}>Posisi/Jabatan *</Label>
          <Input
            id={`posisi-${workExperience.id || 'new'}`}
            value={workExperience.posisi || ''}
            onChange={(e) => handleInputChange('posisi', e.target.value)}
            placeholder="Contoh: Software Developer"
            required
          />
        </div>
        
        <div>
          <Label htmlFor={`perusahaan-${workExperience.id || 'new'}`}>Perusahaan *</Label>
          <Input
            id={`perusahaan-${workExperience.id || 'new'}`}
            value={workExperience.perusahaan || ''}
            onChange={(e) => handleInputChange('perusahaan', e.target.value)}
            placeholder="Contoh: PT. Teknologi Nusantara"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col space-y-2">
          <Label>Tanggal Mulai</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                {startDate ? (
                  format(startDate, "PPP", { locale: id })
                ) : (
                  <span>Pilih tanggal mulai</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleStartDateChange}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                locale={id}
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
        </div>

        <div className="flex flex-col space-y-2">
          <Label>Tanggal Selesai</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                {endDate ? (
                  format(endDate, "PPP", { locale: id })
                ) : (
                  <span>Pilih tanggal selesai (opsional)</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleEndDateChange}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                locale={id}
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
                    "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7"
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
          <p className="text-xs text-muted-foreground">
            Kosongkan jika masih bekerja di tempat ini
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor={`deskripsi-${workExperience.id || 'new'}`}>Deskripsi Pekerjaan</Label>
        <Textarea
          id={`deskripsi-${workExperience.id || 'new'}`}
          value={workExperience.deskripsi || ''}
          onChange={(e) => handleInputChange('deskripsi', e.target.value)}
          placeholder="Deskripsikan tanggung jawab dan pencapaian Anda di posisi ini..."
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
}
