import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RadioTowerIcon, MailIcon, LockIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError("");

    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setServerError(error.message ?? "Sign in failed");
      return;
    }

    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="relative mb-4 flex size-14 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/25">
            <RadioTowerIcon className="size-7" />
            <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-sla-fresh ring-2 ring-background sla-pulse" />
          </span>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
            Helpdesk · Control Room
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Sign in to your shift
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Access the support queue and dashboard
          </p>
        </div>

        <Card className="border-border/60 shadow-xl shadow-black/20">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <MailIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-9"
                      placeholder="you@example.com"
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <LockIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      className="pl-9"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      aria-invalid={!!errors.password}
                      {...register("password")}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                {serverError && (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {serverError}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">
          Enjay Helpdesk · Support Ops
        </p>
      </div>
    </div>
  );
}
