"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Send, RefreshCw, Pencil, UserPlus, Users, Building, Trash2, Power, PowerOff, Edit } from "lucide-react";
import { companyAdminAPI, type CompanySummary } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { PhoneNumberField, toE164 } from "@/components/PhoneNumberField";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
const agencyRanges = [
  { value: "10", label: "10" },
  { value: "100", label: "100" },
  { value: "1000", label: "1,000" },
  { value: "10000", label: "10,000" },
  { value: "100000", label: "100,000" },
];
function parseNumber(value: string, fallback: number) {
  const n = Number(value);
  if (Number.isNaN(n) || n <= 0) return fallback;
  return Math.floor(n);
}

export default function CompanyPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanySummary | null>(null);

  const [inviteNama, setInviteNama] = useState("");
  const [invitePhoneCountryCode, setInvitePhoneCountryCode] = useState("+62");
  const [invitePhoneNumber, setInvitePhoneNumber] = useState("");
  const [inviteDays, setInviteDays] = useState("7");

  const [editCompanyName, setEditCompanyName] = useState("");
  const [editOwnerName, setEditOwnerName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editAgencyRange, setEditAgencyRange] = useState("");
  const [editReasonToUse, setEditReasonToUse] = useState("");
  const [editPassword, setEditPassword] = useState("");


  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyAdminAPI.listCompanies();
      setCompanies(data || []);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Gagal memuat company", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const activeCount = useMemo(() => companies.filter((c) => c.activeUsers > 0).length, [companies]);

  const sendInvitation = async () => {
    try {
      const durationDays = parseNumber(inviteDays, 7);
      const phoneE164 = toE164(invitePhoneCountryCode, invitePhoneNumber);
      if (!phoneE164) throw new Error("Phone number is required");
      if (!inviteNama.trim()) throw new Error("Nama wajib diisi");

      await companyAdminAPI.sendCompanyInvitation({
        namaLengkap: inviteNama.trim(),
        nomorHp: phoneE164,
        companyName: inviteNama.trim(),
        durationDays,
        invitationType: "COMPANY",
      });

      toast({ title: "Sukses", description: "Undangan WhatsApp berhasil dikirim" });
      setInviteNama("");
      setInvitePhoneNumber("");
      setInviteDays("7");
      setInviteDialogOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Gagal mengirim undangan", variant: "destructive" });
    }
  };

  const openEditDialog = async (company: CompanySummary) => {
    setSelectedCompany(company);
    setEditPassword("");

    try {
      const detail = await companyAdminAPI.getCompanyDetail(company.companyCode);
      setEditCompanyName(detail?.companyName ?? company.companyName ?? "");
      setEditOwnerName(detail?.ownerName ?? "");
      setEditEmail(detail?.email ?? "");
      setEditPhoneNumber(detail?.phoneNumber ?? "");
      setEditAgencyRange(detail?.agencyRange ?? "");
      setEditReasonToUse(detail?.reasonToUse ?? "");
    } catch (e: any) {
      setEditCompanyName(company.companyName ?? "");
      setEditOwnerName("");
      setEditEmail("");
      setEditPhoneNumber("");
      setEditAgencyRange("");
      setEditReasonToUse("");
      toast({ title: "Error", description: e?.message || "Gagal memuat detail company", variant: "destructive" });
    } finally {
      setEditDialogOpen(true);
    }
  };

  const submitEditCompany = async () => {
    if (!selectedCompany) return;
    const companyName = editCompanyName.trim();
    if (!companyName) {
      toast({ title: "Error", description: "Company name wajib diisi", variant: "destructive" });
      return;
    }

    try {
      const updateData: any = {};
      if (companyName) updateData.companyName = companyName;
      if (editOwnerName.trim()) updateData.ownerName = editOwnerName.trim();
      if (editEmail.trim()) updateData.email = editEmail.trim();
      if (editPhoneNumber.trim()) updateData.phoneNumber = editPhoneNumber.trim();
      if (editAgencyRange.trim()) updateData.agencyRange = editAgencyRange.trim();
      if (editReasonToUse.trim()) updateData.reasonToUse = editReasonToUse.trim();
      if (editPassword.trim()) updateData.password = editPassword.trim();

      await companyAdminAPI.updateCompanyFull(selectedCompany.companyCode, updateData);


      toast({ title: "Sukses", description: "Company berhasil diupdate" });
      setEditDialogOpen(false);
      await loadCompanies();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Gagal update company", variant: "destructive" });
    }
  };

  const toggleCompanyStatus = async (companyCode: string, active: boolean) => {
    try {
      await companyAdminAPI.updateCompanyStatus(companyCode, active ? "INACTIVE" : "ACTIVE");
      toast({ title: "Sukses", description: "Status company berhasil diupdate" });
      await loadCompanies();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Gagal update status", variant: "destructive" });
    }
  };

  const openDeleteDialog = (company: CompanySummary) => {
    setSelectedCompany(company);
    setDeleteDialogOpen(true);
  };

  const submitDeleteCompany = async () => {
    if (!selectedCompany) return;

    try {
      await companyAdminAPI.deleteCompany(selectedCompany.companyCode);
      toast({ title: "Sukses", description: "Company berhasil dihapus" });
      setDeleteDialogOpen(false);
      await loadCompanies();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Gagal menghapus company", variant: "destructive" });
    }
  };

  return (
    <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN", "MODERATOR"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950">
        <AdminPageHeader
          title="Company Management"
          description="Manage companies and send invitations"
          icon={Building2}
          primaryAction={{
            label: "Refresh",
            onClick: loadCompanies,
            icon: RefreshCw,
          }}
          stats={[
            { label: "Total Companies", value: companies.length, variant: "secondary" },
            { label: "Active Companies", value: activeCount, variant: "default" },
          ]}
        />

        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Companies Table */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-white/50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold">Companies</CardTitle>
                  <CardDescription className="mt-1">
                    {companies.length} {companies.length === 1 ? 'company' : 'companies'} registered
                  </CardDescription>
                </div>
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 shadow-sm hover:shadow-md transition-shadow">
                      <UserPlus className="h-4 w-4" />
                      Send Invitation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-lg">
                        <Send className="h-5 w-5 text-primary" />
                        Send Company Invitation
                      </DialogTitle>
                      <DialogDescription>
                        Enter owner details to send a WhatsApp invitation link
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="ownerName" className="text-sm font-medium">
                          Owner Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="ownerName"
                          placeholder="e.g., John Doe"
                          value={inviteNama}
                          onChange={(e) => setInviteNama(e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber" className="text-sm font-medium">
                          Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <PhoneNumberField
                          countryCodeValue={invitePhoneCountryCode}
                          onCountryCodeChange={setInvitePhoneCountryCode}
                          numberValue={invitePhoneNumber}
                          onNumberChange={setInvitePhoneNumber}
                          countryCodePlaceholder="Country code"
                          numberPlaceholder="Phone number"
                          idPrefix="invite-phone"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration" className="text-sm font-medium">
                          Valid Duration (days)
                        </Label>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          max="30"
                          placeholder="7"
                          value={inviteDays}
                          onChange={(e) => setInviteDays(e.target.value)}
                          className="h-10"
                        />
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setInviteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" onClick={sendInvitation} className="gap-2">
                        <Send className="h-4 w-4" />
                        Send
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">Company</TableHead>
                      <TableHead className="font-semibold">Code</TableHead>
                      <TableHead className="font-semibold text-center w-[100px]">Users</TableHead>
                      <TableHead className="font-semibold text-center w-[100px]">Active</TableHead>
                      <TableHead className="font-semibold text-center w-[100px]">Status</TableHead>
                      <TableHead className="font-semibold text-center w-[80px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <RefreshCw className="h-8 w-8 animate-spin text-primary/60" />
                            <span className="text-sm text-muted-foreground">Loading...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : companies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Building2 className="h-12 w-12 text-muted-foreground/30" />
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">No companies yet</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Click "Send Invitation" to add your first company
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      companies.map((c) => (
                        <TableRow key={c.companyCode} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">{c.companyName}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono text-xs">
                              {c.companyCode}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-medium">{c.totalUsers}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                              {c.activeUsers}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={c.activeUsers > 0 ? "default" : "secondary"}
                              className={
                                c.activeUsers > 0
                                  ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
                              }
                            >
                              {c.activeUsers > 0 ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openEditDialog(c)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Company
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleCompanyStatus(c.companyCode, c.activeUsers > 0)}>
                                  {c.activeUsers > 0 ? (
                                    <><PowerOff className="mr-2 h-4 w-4" />Set Inactive</>
                                  ) : (
                                    <><Power className="mr-2 h-4 w-4" />Set Active</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => openDeleteDialog(c)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Company
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Company Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Edit className="h-5 w-5 text-primary" />
                Edit Company
              </DialogTitle>
              <DialogDescription>
                Update company information for: <strong>{selectedCompany?.companyCode}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="editCompanyName" className="text-sm font-medium">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="editCompanyName"
                    placeholder="Enter company name"
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editOwnerName" className="text-sm font-medium">
                    Owner Name
                  </Label>
                  <Input
                    id="editOwnerName"
                    placeholder="Enter owner name"
                    value={editOwnerName}
                    onChange={(e) => setEditOwnerName(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEmail" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="editEmail"
                    type="email"
                    placeholder="Enter email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPhoneNumber" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="editPhoneNumber"
                    placeholder="Enter phone number"
                    value={editPhoneNumber}
                    onChange={(e) => setEditPhoneNumber(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editAgencyRange" className="text-sm font-medium">
                    Agency Range
                  </Label>
                  <Select value={editAgencyRange} onValueChange={setEditAgencyRange}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select agency range" />
                    </SelectTrigger>
                    <SelectContent>
                      {agencyRanges.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPassword" className="text-sm font-medium">
                    New Password
                  </Label>
                  <Input
                    id="editPassword"
                    type="password"
                    placeholder="Enter new password (optional)"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">Leave empty to keep current password</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="editReasonToUse" className="text-sm font-medium">
                    Reason to Use
                  </Label>
                  <Input
                    id="editReasonToUse"
                    placeholder="Enter reason"
                    value={editReasonToUse}
                    onChange={(e) => setEditReasonToUse(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={submitEditCompany}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Company Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Company
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this company?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
                <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                  {selectedCompany?.companyName}
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  Code: {selectedCompany?.companyCode}
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  Users: {selectedCompany?.totalUsers} (Active: {selectedCompany?.activeUsers})
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                This action <strong>cannot be undone</strong>. All users in this company will be deleted.
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" onClick={submitDeleteCompany}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Company
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
