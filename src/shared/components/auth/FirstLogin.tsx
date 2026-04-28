/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../../assets/icons";
import Input from "../form/input/InputField.tsx";
import Label from "../form/Label.tsx";
import { API_ENDPOINTS } from "../../../api/endpoint.ts";

interface PasswordResetStorage {
  username: string;
  reason: "FIRST_LOGIN" | "EXPIRED_PASSWORD";
  message?: string;
  timestamp?: number;
}

export default function FirstLogin() {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [username, setUsername] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [reason, setReason] = useState<"FIRST_LOGIN" | "EXPIRED_PASSWORD">(
      "FIRST_LOGIN"
  );

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      // Tenta pegar do state da navegação primeiro, depois do localStorage
      const stateData = location.state as PasswordResetStorage | null;
      const stored = localStorage.getItem("passwordReset");
      const parsed: PasswordResetStorage | null = stateData
          ? stateData
          : stored
              ? JSON.parse(stored)
              : null;

      if (!parsed?.username) {
        navigate("/signin", { replace: true });
        return;
      }

      setUsername(parsed.username);
      setReason(parsed.reason ?? "FIRST_LOGIN");
      setInfoMessage(
          parsed.message ??
          "A reset code was sent to your email. Enter it below along with your new password."
      );

      // Expira após 15 minutos
      if (parsed.timestamp) {
        const fifteenMin = 15 * 60 * 1000;
        if (Date.now() - parsed.timestamp > fifteenMin) {
          localStorage.removeItem("passwordReset");
          setError(
              "Your session has expired. Please sign in again to receive a new code."
          );
        }
      }
    } catch {
      localStorage.removeItem("passwordReset");
      navigate("/signin", { replace: true });
    }
  }, [navigate, location.state]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(pwd)) return "Must contain at least one uppercase letter.";
    if (!/[a-z]/.test(pwd)) return "Must contain at least one lowercase letter.";
    if (!/[0-9]/.test(pwd)) return "Must contain at least one number.";
    if (!/[!@#$%^&*]/.test(pwd))
      return "Must contain at least one special character (!@#$%^&*).";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError("Please enter the code sent to your email.");
      return;
    }

    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    if (!username) {
      setError("Invalid session. Please sign in again.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
          `${API_ENDPOINTS.auth}/redefine-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ username, code: code.trim(), password }),
          }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const msg =
            data?.message ||
            data?.error ||
            `Error ${response.status}. Please try again.`;
        throw new Error(msg);
      }

      localStorage.removeItem("passwordReset");
      localStorage.removeItem("firstLogin");

      setSuccess(true);

      setTimeout(() => {
        navigate("/signin", {
          replace: true,
          state: {
            message:
                "Password updated successfully. Please sign in with your new password.",
          },
        });
      }, 2000);
    } catch (err: any) {
      setError(
          err?.message ||
          "Error resetting password. Please check your code and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled =
      loading ||
      !code.trim() ||
      !password ||
      !passwordConfirm ||
      !!validatePassword(password) ||
      password !== passwordConfirm;

  const title =
      reason === "EXPIRED_PASSWORD"
          ? "Your password has expired"
          : "Set your new password";

  return (
      <div className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <div>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 text-title-sm font-semibold text-[#2B3E2B] dark:text-white sm:text-title-md">
                {title}
              </h1>
              <p className="text-sm text-[#2B3E2B] dark:text-gray-400">
                {infoMessage ??
                    "A reset code was sent to your email. Enter it below along with your new password."}
              </p>
              {username && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    User:{" "}
                    <span className="font-medium">{username}</span>
                  </p>
              )}
            </div>

            {success ? (
                <div className="p-4 text-sm text-green-700 bg-green-100 border border-green-200 rounded-lg dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                  ✅ Password updated successfully! Redirecting to sign in...
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    {error && (
                        <div
                            className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                            role="alert"
                        >
                          {error}
                        </div>
                    )}

                    {/* Code — digitado pelo usuário, recebido por email */}
                    <div>
                      <Label>
                        Verification code <span className="text-red-500">*</span>
                      </Label>
                      <Input
                          value={code}
                          placeholder="Enter the 6-digit code from your email"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setCode(e.target.value);
                            if (error) setError(null);
                          }}
                          disabled={loading}
                          autoComplete="one-time-code"
                      />
                    </div>

                    {/* New password */}
                    <div>
                      <Label>
                        New password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                            value={password}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your new password"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setPassword(e.target.value);
                              if (error) setError(null);
                            }}
                            disabled={loading}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            tabIndex={-1}
                        >
                          {showPassword ? (
                              <EyeIcon className="size-5 fill-[#2B3E2B] dark:fill-[#bbe8ee]" />
                          ) : (
                              <EyeCloseIcon className="size-5 fill-[#2B3E2B] dark:fill-cyan-400" />
                          )}
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        At least 8 characters with uppercase, lowercase, number and
                        special character (!@#$%^&*).
                      </p>
                    </div>

                    {/* Confirm password */}
                    <div>
                      <Label>
                        Confirm password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                            value={passwordConfirm}
                            type={showPasswordConfirm ? "text" : "password"}
                            placeholder="Confirm your new password"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setPasswordConfirm(e.target.value);
                              if (error) setError(null);
                            }}
                            disabled={loading}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPasswordConfirm((p) => !p)}
                            className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer"
                            aria-label={
                              showPasswordConfirm ? "Hide password" : "Show password"
                            }
                            tabIndex={-1}
                        >
                          {showPasswordConfirm ? (
                              <EyeIcon className="size-5 fill-[#2B3E2B] dark:fill-[#bbe8ee]" />
                          ) : (
                              <EyeCloseIcon className="size-5 fill-[#2B3E2B] dark:fill-cyan-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <button
                          type="submit"
                          disabled={isSubmitDisabled}
                          className="w-full rounded-lg bg-[#2b3e2b] py-2.5 font-medium text-white transition-all hover:bg-[#2b3e2bd7] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#4c3de3] dark:hover:bg-[#4b3de3c0]"
                      >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Updating...
                      </span>
                        ) : (
                            "Reset password"
                        )}
                      </button>
                    </div>

                    <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                      Didn't receive the code?{" "}
                      <button
                          type="button"
                          onClick={() => navigate("/signin", { replace: true })}
                          className="text-[#2B3E2B] underline hover:text-teal-700 dark:text-[#bbe8ee] dark:hover:text-cyan-300"
                      >
                        Go back and sign in again
                      </button>
                    </p>
                  </div>
                </form>
            )}
          </div>
        </div>
      </div>
  );
}