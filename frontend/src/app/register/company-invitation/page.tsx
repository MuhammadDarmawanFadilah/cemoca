"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiCall, invitationAPI } from "@/lib/api";

export default function CompanyInvitationRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const token = searchParams?.get("token") || "";

  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const inv = await invitationAPI.getInvitationByToken(token);
        setInvitation(inv as any);
      } catch (e: any) {
        toast({ title: "Error", description: e?.message || "Token tidak valid", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const submit = async () => {
    try {
      if (!token) throw new Error("Token tidak valid");
      if (!username.trim()) throw new Error("Username wajib diisi");
      if (!email.trim()) throw new Error("Email wajib diisi");
      if (!password.trim()) throw new Error("Password wajib diisi");

      setLoading(true);
      await apiCall("/invitations/register-company", {
        method: "POST",
        body: JSON.stringify({
          invitationToken: token,
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      });

      toast({ title: "Sukses", description: "Registrasi company berhasil" });
      router.push("/login");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Registrasi gagal", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Registrasi Company</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!token ? (
            <div className="text-sm text-muted-foreground">Token tidak ditemukan</div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                {invitation?.companyName ? (
                  <div>
                    Company: <span className="font-medium">{invitation.companyName}</span>
                  </div>
                ) : null}
                {invitation?.expiresAt ? <div>Expired: {String(invitation.expiresAt)}</div> : null}
              </div>

              <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

              <Button disabled={loading} onClick={submit} className="w-full">
                {loading ? "Memproses..." : "Daftar"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
