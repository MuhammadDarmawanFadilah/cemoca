"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox-enhanced";
import { Plus, X } from "lucide-react";
import { masterDataAPI } from "@/lib/api";
import { toast } from "sonner";

// Helper function to convert string arrays to combobox options
const convertToComboboxOptions = (items: string[]) => 
  items.map(item => ({ value: item, label: item }));

interface HobbyListProps {
  hobbies: string[];
  onChange: (hobbies: string[]) => void;
}

export default function HobbyList({ hobbies, onChange }: HobbyListProps) {
  // State for master data
  const [hobiOptions, setHobiOptions] = useState<{value: string, label: string}[]>([]);

  // Load hobi data from backend
  useEffect(() => {
    const loadHobiData = async () => {
      try {
        const hobiData = await masterDataAPI.hobi.getAllActive();
        const hobiOpts = hobiData.map(item => ({
          value: item.nama,
          label: item.nama
        }));
        setHobiOptions(hobiOpts);
      } catch (error) {
        console.error("Error loading hobi data:", error);
        toast.error("Gagal memuat data hobi");
      }
    };

    loadHobiData();
  }, []);
  const addHobby = () => {
    onChange([...hobbies, ""]);
  };

  const updateHobby = (index: number, value: string) => {
    const updated = hobbies.map((hobby, i) => 
      i === index ? value : hobby
    );
    onChange(updated);
  };

  const removeHobby = (index: number) => {
    const updated = hobbies.filter((_, i) => i !== index);
    onChange(updated);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          onClick={addHobby}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Tambah Hobi
        </Button>
      </div>

      <div className="space-y-2">
        {hobbies.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Belum ada hobi. Klik &quot;Tambah Hobi&quot; untuk menambah.</p>
          </div>        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {hobbies.map((hobby, index) => (              <div key={index} className="flex items-center space-x-2">
                <Combobox
                  options={hobiOptions}
                  value={hobby}
                  onValueChange={(value) => updateHobby(index, value)}
                  placeholder={`Pilih hobi ${index + 1}`}
                  searchPlaceholder="Cari hobi..."
                  emptyMessage="Hobi tidak ditemukan"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeHobby(index)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                  disabled={hobbies.length <= 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
