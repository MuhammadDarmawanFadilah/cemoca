"use client";

import { useState } from "react";
import BiografiFormStepper from "@/components/BiografiFormStepper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TestStepperNavigationPage() {
  const [testData, setTestData] = useState<any>(null);

  const handleSubmit = async (data: any) => {
    setTestData(data);
    toast.success("Form berhasil disubmit!");
    console.log("Submitted data:", data);
  };

  const clearTestData = () => {
    setTestData(null);
    sessionStorage.removeItem('biografiFormData');
    toast.info("Data test dihapus");
    window.location.reload();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Test Stepper Navigation</h1>
        <p className="text-muted-foreground mt-2">
          Test navigasi stepper dengan data wilayah - khususnya saat kembali ke step alamat
        </p>
        <div className="mt-4">
          <Button onClick={clearTestData} variant="outline">
            Clear Test Data & Reload
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stepper Form */}
        <div className="lg:col-span-2">
          <BiografiFormStepper
            onSubmit={handleSubmit}
            submitButtonText="Submit Test"
            redirectUrl=""
          />
        </div>

        {/* Debug Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Test Instructions:</h4>
                  <ol className="text-sm list-decimal list-inside space-y-1 mt-2">
                    <li>Fill in basic info (step 1)</li>
                    <li>Navigate to Location step (step 3)</li>
                    <li>Select Provinsi, Kota, Kecamatan, Kelurahan</li>
                    <li>Navigate to next step</li>
                    <li>Come back to Location step</li>
                    <li>Check if all wilayah data is preserved</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold">Expected Results:</h4>
                  <ul className="text-sm list-disc list-inside space-y-1 mt-2">
                    <li>Provinsi should be preserved</li>
                    <li>Kota options should load automatically</li>
                    <li>Selected Kota should be preserved</li>
                    <li>Kecamatan options should load automatically</li>
                    <li>Selected Kecamatan should be preserved</li>
                    <li>Kelurahan options should load automatically</li>
                    <li>Selected Kelurahan should be preserved</li>
                    <li>Kode Pos should be preserved</li>
                  </ul>
                </div>

                {testData && (
                  <div>
                    <h4 className="font-semibold">Last Submit Data:</h4>
                    <pre className="bg-green-50 p-3 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(testData, null, 2)}
                    </pre>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold">Session Storage:</h4>
                  <pre className="bg-blue-50 p-3 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(
                      sessionStorage.getItem('biografiFormData') 
                        ? JSON.parse(sessionStorage.getItem('biografiFormData')!) 
                        : null, 
                      null, 
                      2
                    )}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
