"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WilayahForm from "@/components/WilayahForm";
import { toast } from "sonner";

const testSchema = z.object({
  alamat: z.string().optional(),
  provinsi: z.string().optional(),
  kota: z.string().optional(),
  kecamatan: z.string().optional(),
  kelurahan: z.string().optional(),
  kodePos: z.string().optional(),
});

type TestFormData = z.infer<typeof testSchema>;

export default function TestWilayahFormPage() {
  const [formData, setFormData] = useState<TestFormData | null>(null);

  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      alamat: "",
      provinsi: "",
      kota: "",
      kecamatan: "",
      kelurahan: "",
      kodePos: "",
    },
  });

  const onSubmit = (data: TestFormData) => {
    setFormData(data);
    toast.success("Form berhasil disubmit!");
    console.log("Form data:", data);
  };
  const resetForm = () => {
    form.reset();
    setFormData(null);
    sessionStorage.removeItem('biografiFormData');
    toast.info("Form direset dan cache dihapus");
  };

  const loadFromCache = () => {
    const savedData = sessionStorage.getItem('biografiFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        Object.keys(parsedData).forEach(key => {
          if (parsedData[key] !== undefined && parsedData[key] !== "") {
            form.setValue(key as any, parsedData[key]);
          }
        });
        toast.success("Data dimuat dari cache");
      } catch (error) {
        toast.error("Gagal memuat data dari cache");
      }
    } else {
      toast.info("Tidak ada data di cache");
    }
  };

  const watchValues = form.watch();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Test Wilayah Form</h1>
        <p className="text-muted-foreground mt-2">
          Test search dropdown dan data persistence untuk form wilayah
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Form Input Wilayah</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <WilayahForm 
                  control={form.control as any}
                  setValue={form.setValue}
                  watch={form.watch}
                />
                  <div className="flex gap-2">
                  <Button type="submit">Submit</Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Reset
                  </Button>
                  <Button type="button" variant="secondary" onClick={loadFromCache}>
                    Load Cache
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Debug Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Current Form Values:</h4>
                <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(watchValues, null, 2)}
                </pre>
              </div>
              
              {formData && (
                <div>
                  <h4 className="font-semibold">Last Submit Data:</h4>
                  <pre className="bg-green-50 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(formData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Checklist */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Test Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="test1" className="rounded" />
              <label htmlFor="test1">Search dropdown provinsi berfungsi</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="test2" className="rounded" />
              <label htmlFor="test2">Dropdown kota muncul setelah pilih provinsi</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="test3" className="rounded" />
              <label htmlFor="test3">Search dropdown kota berfungsi</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="test4" className="rounded" />
              <label htmlFor="test4">Dropdown kecamatan muncul setelah pilih kota</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="test5" className="rounded" />
              <label htmlFor="test5">Search dropdown kecamatan berfungsi</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="test6" className="rounded" />
              <label htmlFor="test6">Dropdown kelurahan muncul setelah pilih kecamatan</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="test7" className="rounded" />
              <label htmlFor="test7">Search dropdown kelurahan berfungsi</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="test8" className="rounded" />
              <label htmlFor="test8">Kode pos terisi otomatis setelah pilih kelurahan</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="test9" className="rounded" />
              <label htmlFor="test9">Data tidak hilang saat reload (sessionStorage)</label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
