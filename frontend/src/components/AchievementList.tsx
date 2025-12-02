"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface Achievement {
  judul: string;
  penyelenggara: string;
  tahun: string;
  deskripsi: string;
}

interface AchievementListProps {
  achievements: Achievement[];
  onChange: (achievements: Achievement[]) => void;
}

export default function AchievementList({ achievements, onChange }: AchievementListProps) {
  const [openPopovers, setOpenPopovers] = useState<{ [key: number]: boolean }>({});

  const setPopoverOpen = (index: number, open: boolean) => {
    setOpenPopovers(prev => ({
      ...prev,
      [index]: open
    }));
  };

  const addAchievement = () => {
    const newAchievement: Achievement = {
      judul: "",
      penyelenggara: "",
      tahun: "",
      deskripsi: ""
    };
    onChange([...achievements, newAchievement]);
  };

  const removeAchievement = (index: number) => {
    const updated = achievements.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateAchievement = (index: number, field: keyof Achievement, value: string) => {
    const updated = achievements.map((achievement, i) => 
      i === index ? { ...achievement, [field]: value } : achievement
    );
    onChange(updated);
  };  const handleDateSelect = (index: number, date: Date | undefined) => {
    if (date) {
      // Format sebagai "MM/yyyy" (bulan dan tahun saja)
      updateAchievement(index, "tahun", format(date, "MM/yyyy"));
      setPopoverOpen(index, false); // Auto-close after date selection
    } else {
      updateAchievement(index, "tahun", "");
    }
  };

  const parseMonthYear = (monthYearString: string): Date | undefined => {
    if (!monthYearString) return undefined;
    try {
      // Parse format "MM/yyyy" atau "yyyy" untuk backward compatibility
      if (monthYearString.includes('/')) {
        const [month, year] = monthYearString.split('/');
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        if (monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= new Date().getFullYear()) {
          return new Date(yearNum, monthNum - 1, 1);
        }
      } else {
        // Backward compatibility untuk format tahun saja
        const year = parseInt(monthYearString);
        if (year >= 1900 && year <= new Date().getFullYear()) {
          return new Date(year, 0, 1);
        }
      }
    } catch {
      return undefined;
    }
    return undefined;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button type="button" onClick={addAchievement} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Prestasi
        </Button>
      </div>

      <div className="space-y-3">
        {achievements.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Belum ada prestasi & penghargaan. Klik &quot;Tambah Prestasi&quot; untuk menambah.</p>
          </div>
        ) : (
          achievements.map((achievement, index) => (
            <Card key={index} className="relative">
              <CardContent className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-sm text-gray-600">Prestasi #{index + 1}</h4>                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAchievement(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                    title="Hapus prestasi"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Judul Prestasi */}
                  <div className="space-y-2">
                    <Label htmlFor={`judul-${index}`}>Judul Prestasi/Penghargaan</Label>
                    <Input
                      id={`judul-${index}`}
                      placeholder="Contoh: Juara 1 Olimpiade Matematika"
                      value={achievement.judul}
                      onChange={(e) => updateAchievement(index, "judul", e.target.value)}
                    />
                  </div>

                  {/* Penyelenggara */}
                  <div className="space-y-2">
                    <Label htmlFor={`penyelenggara-${index}`}>Penyelenggara</Label>
                    <Input
                      id={`penyelenggara-${index}`}
                      placeholder="Contoh: Universitas Indonesia"
                      value={achievement.penyelenggara}
                      onChange={(e) => updateAchievement(index, "penyelenggara", e.target.value)}
                    />
                  </div>                  {/* Tanggal Prestasi */}
                  <div className="space-y-2">
                    <Label>Tanggal Prestasi</Label>
                    <Popover 
                      open={openPopovers[index] || false} 
                      onOpenChange={(open) => setPopoverOpen(index, open)}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !achievement.tahun && "text-muted-foreground"
                          )}
                        >
                          {achievement.tahun ? (
                            achievement.tahun.includes('/') ? 
                              format(parseMonthYear(achievement.tahun) || new Date(), "MMMM yyyy", { locale: id }) :
                              achievement.tahun
                          ) : (
                            <span>Pilih bulan dan tahun</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={parseMonthYear(achievement.tahun)}
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
                  </div>
                </div>

                {/* Deskripsi */}
                <div className="space-y-2">
                  <Label htmlFor={`deskripsi-${index}`}>Deskripsi</Label>
                  <Textarea
                    id={`deskripsi-${index}`}
                    placeholder="Deskripsikan prestasi dan penghargaan yang diraih..."
                    value={achievement.deskripsi}
                    onChange={(e) => updateAchievement(index, "deskripsi", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {achievements.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={addAchievement}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Tambah Prestasi Lainnya
          </Button>
        </div>
      )}
    </div>
  );
}
