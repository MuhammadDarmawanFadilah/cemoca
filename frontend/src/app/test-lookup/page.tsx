"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function TestLookupSystemPage() {
  const [testResults, setTestResults] = useState<Array<{
    step: string;
    timestamp: string;
    data: TestFormData;
    status: 'success' | 'error';
  }>>([]);

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

  const watchValues = form.watch();

  // Simulate filling form data (like coming back from next step)
  const simulateDataFromCache = () => {
    const testData = {
      alamat: "Jl. Test No. 123",
      provinsi: "33", // Jawa Tengah
      kota: "3374", // Kota Semarang
      kecamatan: "337404", // Semarang Timur
      kelurahan: "3374040003", // Gayamsari
      kodePos: "50161",
    };

    Object.entries(testData).forEach(([key, value]) => {
      form.setValue(key as keyof TestFormData, value);
    });

    addTestResult("Data Loaded from Cache", testData, 'success');
    toast.success("Data simulasi dimuat dari cache!");
  };

  const simulatePartialData = () => {
    const partialData = {
      alamat: "Jl. Partial Test",
      provinsi: "32", // Jawa Barat  
      kota: "3273", // Kota Bandung
      kecamatan: "",
      kelurahan: "",
      kodePos: "",
    };

    form.reset();
    setTimeout(() => {
      Object.entries(partialData).forEach(([key, value]) => {
        form.setValue(key as keyof TestFormData, value);
      });
      
      addTestResult("Partial Data Loaded", partialData, 'success');
      toast.info("Data parsial dimuat - sistem akan lookup otomatis!");
    }, 100);
  };

  const addTestResult = (step: string, data: TestFormData, status: 'success' | 'error') => {
    setTestResults(prev => [...prev, {
      step,
      timestamp: new Date().toLocaleTimeString(),
      data: { ...data },
      status
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
    toast.info("Test results dibersihkan");
  };

  const resetForm = () => {
    form.reset();
    sessionStorage.removeItem('biografiFormData');
    toast.info("Form direset");
  };

  const onSubmit = (data: TestFormData) => {
    addTestResult("Form Submitted", data, 'success');
    toast.success("Form berhasil disubmit!");
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Test Auto-Lookup System</h1>
        <p className="text-muted-foreground mt-2">
          Test sistem lookup otomatis untuk data wilayah saat navigasi kembali
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Test Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={simulateDataFromCache} 
                className="w-full"
                variant="default"
              >
                🔄 Simulate Cache Load
              </Button>
              
              <Button 
                onClick={simulatePartialData} 
                className="w-full"
                variant="secondary"
              >
                📊 Simulate Partial Data
              </Button>
              
              <Button 
                onClick={resetForm} 
                className="w-full"
                variant="outline"
              >
                🗑️ Reset Form
              </Button>
              
              <Button 
                onClick={clearResults} 
                className="w-full"
                variant="destructive"
              >
                🧹 Clear Results
              </Button>
            </CardContent>
          </Card>

          {/* Current Form Values */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Current Values</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(watchValues, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Wilayah Form</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <WilayahForm 
                    control={form.control as any}
                    setValue={form.setValue}
                    watch={form.watch}
                    onDataLoad={() => {
                      addTestResult("Data Load Complete", form.getValues(), 'success');
                    }}
                  />
                  
                  <Button type="submit" className="w-full">
                    Submit Test
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No test results yet...</p>
                ) : (
                  testResults.map((result, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                          {result.step}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {result.timestamp}
                        </span>
                      </div>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                        {JSON.stringify(result.data, null, 1)}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Test Instructions */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Test Scenarios</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="border-l-4 border-blue-500 pl-3">
                <strong>Scenario 1: Full Cache Load</strong>
                <p>Simulate coming back from next step with all wilayah data</p>
              </div>
              <div className="border-l-4 border-yellow-500 pl-3">
                <strong>Scenario 2: Partial Data</strong>
                <p>Simulate having only provinsi & kota, system should auto-lookup</p>
              </div>
              <div className="border-l-4 border-green-500 pl-3">
                <strong>Expected Result</strong>
                <p>All dropdown options should load automatically based on saved values</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
