"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiUrl } from "@/lib/config";
import { Badge } from "@/components/ui/badge";

interface ReminderHistory {
  id: number;
  user: { fullName: string; phoneNumber: string };
  reminderDate: string;
  reminderCount: number;
  lastReminderAt: string;
  status: string;
  message: string;
}

export default function HistoriPengingatPage() {
  const [history, setHistory] = useState<ReminderHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(getApiUrl("/reminder-history?page=0&size=100"), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.content || []);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PENDING: "outline",
      SENT: "default",
      COMPLETED: "secondary",
      EXPIRED: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Histori Pengingat</h1>
        <p className="text-base text-muted-foreground">Riwayat pengingat WhatsApp yang dikirim ke pasien</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Daftar Pengingat</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Memuat data...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Belum ada histori pengingat</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-5 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.user.fullName}</h3>
                      <p className="text-sm text-muted-foreground">{item.user.phoneNumber}</p>
                      <p className="text-sm mt-2">
                        <span className="font-medium">Tanggal:</span> {item.reminderDate} |{" "}
                        <span className="font-medium">Jumlah Pengingat:</span> {item.reminderCount}x
                      </p>
                      {item.lastReminderAt && (
                        <p className="text-sm text-muted-foreground">
                          Terakhir: {new Date(item.lastReminderAt).toLocaleString("id-ID")}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  {item.message && (
                    <p className="text-sm mt-2 p-2 bg-muted rounded">{item.message}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
