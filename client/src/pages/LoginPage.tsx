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
    <div className="login-container">
      <div className="login-card glass">
        <h1 className="login-title">Helpdesk</h1>
        <p className="login-subtitle">Sign in to your account</p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className={`form-input${errors.email ? " form-input-error" : ""}`}
              type="email"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className={`form-input${errors.password ? " form-input-error" : ""}`}
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && <p className="field-error">{errors.password.message}</p>}
          </div>
          {serverError && <p className="error-message">{serverError}</p>}
          <button className="primary-btn login-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
