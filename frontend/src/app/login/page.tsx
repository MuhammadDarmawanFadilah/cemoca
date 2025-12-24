"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, LogIn, Mail, Lock, Info, X, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { ApiError, authAPI, userAPI } from "@/lib/api";
import { PhoneNumberField, toE164 } from "@/components/PhoneNumberField";

const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const agencyRanges = [
  { value: "10", label: "10" },
  { value: "100", label: "100" },
  { value: "1000", label: "1,000" },
  { value: "10000", label: "10,000" },
  { value: "100000", label: "100,000" },
] as const;

type AccountRequestFormData = {
  ownerName: string;
  companyName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  username: string;
  password: string;
  agencyRange: "10" | "100" | "1000" | "10000" | "100000";
  reasonToUse: string;
};

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPendingMessage, setShowPendingMessage] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  
  const loginSchema = z.object({
    username: z.string().min(1, t('auth.emailRequired')),
    password: z.string().min(1, t('auth.passwordRequired')),
  });
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });  // Check for registration messages

  const requestSchema = z.object({
    ownerName: z.string().min(1, t('auth.ownerNameRequired')),
    companyName: z.string().min(1, t('auth.companyNameRequired')),
    email: z.string().min(1, t('auth.emailRequired')).email(t('auth.emailRequired')),
    phoneCountryCode: z.string().min(1, "Country code is required"),
    phoneNumber: z.string().min(1, t('auth.phoneRequired')),
    username: z.string().min(1, t('auth.usernameRequired')),
    password: z.string().min(1, t('auth.passwordRequired')),
    agencyRange: z.enum(["10", "100", "1000", "10000", "100000"], {
      required_error: t('auth.agencyRangeRequired'),
    }),
    reasonToUse: z.string().min(1, t('auth.reasonRequired')),
  });

  const requestForm = useForm<AccountRequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      ownerName: "",
      companyName: "",
      email: "",
      phoneCountryCode: "+62",
      phoneNumber: "",
      username: "",
      password: "",
      agencyRange: "100" as AccountRequestFormData["agencyRange"],
      reasonToUse: "",
    },
  });

  const closeCreate = () => {
    setIsCreateDialogOpen(false);
    setShowCreatePanel(false);
  };

  useEffect(() => {
    const message = searchParams?.get('message');
    if (message === 'registration_success') {
      toast.success(t('auth.accountCreated'));
    } else if (message === 'registration_pending_approval') {
      setShowPendingMessage(true);
      toast.info(t('auth.pendingApproval'), {
        duration: 6000,
      });
    }
  }, [searchParams, t]);
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = searchParams?.get('redirect') || '/dashboard';
      router.push(redirectTo);
    }
  }, [isAuthenticated, router, searchParams]);
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await login(data.username, data.password);
      toast.success(t('auth.loginSuccess'));
      // Redirect to intended page or dashboard
      const redirectTo = searchParams?.get('returnUrl') || searchParams?.get('redirect') || '/dashboard';
      router.push(redirectTo);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('auth.loginFailed');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitAccountRequest = async (data: AccountRequestFormData) => {
    setError(null);
    try {
      const phoneE164 = toE164(data.phoneCountryCode, data.phoneNumber);

      try {
        const [usernameExists, emailExists, phoneExists] = await Promise.all([
          userAPI.checkUsernameExists(data.username),
          userAPI.checkEmailExists(data.email),
          userAPI.checkPhoneExists(phoneE164 || data.phoneNumber),
        ]);

        if (usernameExists) {
          requestForm.setError("username", { type: "manual", message: "Username is already registered" });
          toast.error("Username is already registered");
          return;
        }
        if (emailExists) {
          requestForm.setError("email", { type: "manual", message: "Email is already registered" });
          toast.error("Email is already registered");
          return;
        }

        if (phoneExists) {
          requestForm.setError("phoneNumber", { type: "manual", message: "Phone number is already registered" });
          toast.error("Phone number is already registered");
          return;
        }
      } catch {
        // ignore precheck failures; backend will validate
      }

      await authAPI.register({
        username: data.username,
        email: data.email,
        password: data.password,
        phoneNumber: phoneE164 || data.phoneNumber,
        ownerName: data.ownerName,
        companyName: data.companyName,
        agencyRange: data.agencyRange,
        reasonToUse: data.reasonToUse,
      });

      await login(data.username, data.password);
      toast.success(t('auth.accountCreated'));

      const redirectTo = searchParams?.get('returnUrl') || searchParams?.get('redirect') || '/dashboard';
      router.push(redirectTo);

      requestForm.reset({
        ownerName: "",
        companyName: "",
        email: "",
        phoneCountryCode: "+62",
        phoneNumber: "",
        username: "",
        password: "",
        agencyRange: "100" as AccountRequestFormData["agencyRange"],
        reasonToUse: "",
      });
      closeCreate();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('errors.general');

      if (e instanceof ApiError && e.details && typeof e.details === 'object') {
        const details = e.details as Record<string, string>;
        if (details.username) requestForm.setError('username', { type: 'manual', message: details.username });
        if (details.email) requestForm.setError('email', { type: 'manual', message: details.email });
        if (details.phoneNumber) requestForm.setError('phoneNumber', { type: 'manual', message: details.phoneNumber });
        if (details.ownerName) requestForm.setError('ownerName', { type: 'manual', message: details.ownerName });
        if (details.companyName) requestForm.setError('companyName', { type: 'manual', message: details.companyName });
        if (details.agencyRange) requestForm.setError('agencyRange', { type: 'manual', message: details.agencyRange });
        if (details.reasonToUse) requestForm.setError('reasonToUse', { type: 'manual', message: details.reasonToUse });
      } else {
        const lower = msg.toLowerCase();
        if (lower.includes('username')) requestForm.setError('username', { type: 'manual', message: msg });
        if (lower.includes('email')) requestForm.setError('email', { type: 'manual', message: msg });
        if (lower.includes('phone') || lower.includes('nomor') || lower.includes('hp')) {
          requestForm.setError('phoneNumber', { type: 'manual', message: msg });
        }
      }

      toast.error(msg);
    }
  };

  const CreateAccountForm = (
    <Form {...requestForm}>
      <form onSubmit={requestForm.handleSubmit(onSubmitAccountRequest)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={requestForm.control}
            name="ownerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.ownerName')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t('auth.enterOwnerName')} className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={requestForm.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.companyName')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t('auth.enterCompanyName')} className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={requestForm.control}
            name="email"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t('auth.email')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="name@company.com" className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={requestForm.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.username')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t('auth.enterUsername')} className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={requestForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.password')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showCreatePassword ? "text" : "password"}
                      placeholder={t('auth.enterPassword')}
                      className="pr-12 h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword(!showCreatePassword)}
                      className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground hover:text-foreground"
                      aria-label={showCreatePassword ? "Hide password" : "Show password"}
                    >
                      {showCreatePassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={requestForm.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t('auth.phoneNumber')}</FormLabel>
                <FormControl>
                  <FormField
                    control={requestForm.control}
                    name="phoneCountryCode"
                    render={({ field: ccField }) => (
                      <PhoneNumberField
                        countryCodeValue={ccField.value}
                        onCountryCodeChange={ccField.onChange}
                        numberValue={field.value}
                        onNumberChange={field.onChange}
                        countryCodePlaceholder="Country code"
                        numberPlaceholder={t('auth.enterPhoneNumber')}
                        idPrefix="create-account-phone"
                      />
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={requestForm.control}
            name="agencyRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.agencyRange')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t('auth.selectAgencyRange')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {agencyRanges.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="hidden md:block" />

          <FormField
            control={requestForm.control}
            name="reasonToUse"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t('auth.reasonToUse')}</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder={t('auth.enterReason')} className="min-h-[96px]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button type="button" variant="outline" onClick={closeCreate}>
            {t('common.cancel')}
          </Button>
          <Button type="submit">
            {t('auth.submitAccountRequest')}
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <div className="min-h-[calc(100svh-64px)] flex items-center justify-center px-4 py-10">
      <div
        className={`w-full grid gap-6 items-start ${
          showCreatePanel ? 'max-w-5xl md:grid-cols-2' : 'max-w-md md:grid-cols-1'
        }`}
      >
      <Card className="w-full rounded-2xl shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-center">
            <div className="h-12 w-12 rounded-2xl border bg-background flex items-center justify-center">
              <Image src="/logo.svg" alt="CAMOCA" width={26} height={26} />
            </div>
          </div>
          <div className="text-center space-y-1">
            <CardTitle className="text-xl font-semibold">{t('auth.login')}</CardTitle>
            <CardDescription>{t('auth.loginDescription')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {showPendingMessage && (
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <AlertDescription className="text-blue-800 dark:text-blue-200 font-medium">
                      {t('auth.accountPendingApproval')}
                    </AlertDescription>
                    {t('auth.contactAdmin') ? (
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        {t('auth.contactAdmin')}
                      </p>
                    ) : null}
                  </div>
                  <button
                    onClick={() => setShowPendingMessage(false)}
                    className="ml-3 text-blue-400 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-100 transition-colors"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </Alert>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.usernameOrEmail')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="text"
                            placeholder={t('auth.enterUsernameOrEmail')}
                            className="pl-10 h-11"
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.password')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder={t('auth.enterPassword')}
                            className="pl-10 pr-12 h-11"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground hover:text-foreground"
                            disabled={isLoading}
                          >
                            {showPassword ? <EyeOff /> : <Eye />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('auth.loggingIn')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      <span>{t('auth.login')}</span>
                    </div>
                  )}
                </Button>

                <div className="text-sm">
                  <Link
                    href="/forgot-password"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
              </form>
            </Form>

            <Separator />

            <div className="md:hidden">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <Button variant="outline" className="w-full h-11" onClick={() => setIsCreateDialogOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t('auth.addAccount')}
                </Button>
                <DialogContent className="sm:max-w-[560px]">
                  <DialogHeader>
                    <DialogTitle>{t('auth.addAccount')}</DialogTitle>
                    <DialogDescription>{t('auth.requestNote')}</DialogDescription>
                  </DialogHeader>

                  {CreateAccountForm}
                </DialogContent>
              </Dialog>
            </div>

            <div className="hidden md:block">
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={() => setShowCreatePanel(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {t('auth.addAccount')}
              </Button>
            </div>
        </CardContent>
      </Card>

      {showCreatePanel && (
      <Card className="w-full rounded-2xl shadow-sm hidden md:block">
        <CardHeader className="space-y-1">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold">{t('auth.addAccount')}</CardTitle>
              <CardDescription>{t('auth.requestNote')}</CardDescription>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={closeCreate}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {CreateAccountForm}
        </CardContent>
      </Card>
      )}

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
