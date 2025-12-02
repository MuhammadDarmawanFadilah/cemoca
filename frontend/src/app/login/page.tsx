"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowLeft, Info, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPendingMessage, setShowPendingMessage] = useState(false);
  
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md space-y-6">        {/* Header with Logo */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-40 h-40 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Image src="/logo.svg" alt="Sistem Cemoca" width={120} height={120} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('auth.welcomeTitle')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('auth.welcomeSubtitle')}
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-gray-900 dark:text-white">
              {t('auth.login')}
            </CardTitle>
            <CardDescription className="text-center text-gray-600 dark:text-gray-400">
              {t('auth.loginDescription')}
            </CardDescription>
          </CardHeader>          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}            {showPendingMessage && (
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <AlertDescription className="text-blue-800 dark:text-blue-200 font-medium">
                      {t('auth.accountPendingApproval')}
                    </AlertDescription>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {t('auth.contactAdmin')}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPendingMessage(false)}
                    className="ml-3 text-blue-400 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-100 transition-colors"
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
                      <FormLabel className="text-gray-700 dark:text-gray-300">
                        {t('auth.usernameOrEmail')}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            type="text"
                            placeholder={t('auth.enterUsernameOrEmail')}
                            className="pl-10 h-12 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
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
                      <FormLabel className="text-gray-700 dark:text-gray-300">
                        {t('auth.password')}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder={t('auth.enterPassword')}
                            className="pl-10 pr-12 h-12 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
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
                
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('auth.loggingIn')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <LogIn className="w-4 h-4" />
                      <span>{t('auth.login')}</span>
                    </div>
                  )}
                </Button>
                
                {/* Forgot Password Link */}
                <div className="text-center mt-4">
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center space-y-4">
          <Link 
            href="/"
            className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('common.back')}</span>
          </Link>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t('auth.noAccount')}{" "}
            <span className="text-gray-600 dark:text-gray-300">
              {t('auth.waitForInvitation')}
            </span>
          </div>
        </div>
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
