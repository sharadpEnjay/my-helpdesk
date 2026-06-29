import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "../lib/auth-client";

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
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md p-10 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl">
        <h1 className="mb-2 text-3xl font-extrabold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Helpdesk
        </h1>
        <p className="text-center text-slate-400 mb-8">Sign in to your account</p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-slate-400" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white/87 text-base font-inherit outline-none transition-colors duration-200 box-border ${
                errors.email
                  ? "border-red-500 focus:border-red-500 focus:ring-3 focus:ring-red-500/15"
                  : "border-white/10 focus:border-blue-400 focus:ring-3 focus:ring-blue-400/15"
              }`}
              type="email"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-slate-400" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white/87 text-base font-inherit outline-none transition-colors duration-200 box-border ${
                errors.password
                  ? "border-red-500 focus:border-red-500 focus:ring-3 focus:ring-red-500/15"
                  : "border-white/10 focus:border-blue-400 focus:ring-3 focus:ring-blue-400/15"
              }`}
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          {serverError && <p className="text-red-500 text-sm mb-4">{serverError}</p>}
          <button
            className="w-full mt-2 py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none rounded-xl text-lg font-semibold cursor-pointer shadow-lg shadow-blue-600/30 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-blue-600/40 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
