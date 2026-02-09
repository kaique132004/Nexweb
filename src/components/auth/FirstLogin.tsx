/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EyeCloseIcon, EyeIcon } from "../../assets/icons";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { authFetch } from "../../api/apiAuth";
import { API_ENDPOINTS } from "../../api/endpoint";

interface FirstLoginStorage {
  username: string;
  code: string;      // reset code sent by backend
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
  const [username, setUsername] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  // Load first login info from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("firstLogin");
      if (!stored) {
        // No first-login data → go back to sign in
        navigate("/signin", { replace: true });
        return;
      }

      const parsed: FirstLoginStorage = JSON.parse(stored);

      if (!parsed.username || !parsed.code) {
        localStorage.removeItem("firstLogin");
        navigate("/signin", { replace: true });
        return;
      }

      setUsername(parsed.username);
      setCode(parsed.code);
      if (parsed.message) {
        setInfoMessage(parsed.message);
      } else {
        setInfoMessage("Password reset required on first login.");
      }

      // Optional: expire code based on timestamp (15 minutes)
      if (parsed.timestamp) {
        const fifteenMinutes = 15 * 60 * 1000;
        if (Date.now() - parsed.timestamp > fifteenMinutes) {
          localStorage.removeItem("firstLogin");
          setError("Your reset code has expired. Please request a new one.");
        }
      }
    } catch (e) {
      console.error("Error reading firstLogin from localStorage:", e);
      localStorage.removeItem("firstLogin");
      navigate("/signin", { replace: true });
    }
  }, [navigate]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Password must contain at least one uppercase letter.";
    }
    if (!/[a-z]/.test(pwd)) {
      return "Password must contain at least one lowercase letter.";
    }
    if (!/[0-9]/.test(pwd)) {
      return "Password must contain at least one number.";
    }
    if (!/[!@#$%^&*]/.test(pwd)) {
      return "Password must contain at least one special character (!@#$%^&*).";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);

    if (!password || !passwordConfirm) {
      setError("Please fill in all required fields.");
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

    if (!username || !code) {
      setError(
        "Invalid first-login information. Please try signing in again."
      );
      return;
    }

    try {
      setLoading(true);

      // Adjust endpoint name if your backend uses a different path
      await authFetch(`${API_ENDPOINTS.auth}/redefine-password`, {
        method: "POST",
        body: JSON.stringify({
          username,
          code,
          password,
        }),
      });

      // Clear firstLogin data
      localStorage.removeItem("firstLogin");

      // Redirect to sign in page with success message
      navigate("/signin", {
        replace: true,
        state: {
          message:
            "Password updated successfully. Please sign in with your new password.",
        },
      });
    } catch (err: any) {
      console.error("Error resetting password:", err);

      const backendMessage =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.message;

      setError(
        backendMessage ||
          "Error resetting password. Please try again or request a new code."
      );
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled =
    loading ||
    !password ||
    !passwordConfirm ||
    !code ||
    !!validatePassword(password) ||
    password !== passwordConfirm;

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 text-title-sm font-semibold text-[#2B3E2B] dark:text-white sm:text-title-md">
              Reset your password
            </h1>
            <p className="text-sm text-[#2B3E2B] dark:text-gray-400">
              {infoMessage ??
                "Enter the code you received and set your new password."}
            </p>
            {username && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                User: <span className="font-medium">{username}</span>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Error message */}
              {error && (
                <div
                  className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* Code */}
              <div>
                <Label>
                  Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={code}
                  placeholder="Enter the code you received"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCode(e.target.value)
                  }
                  disabled={loading}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
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
                  Password must be at least 8 characters and include an
                  uppercase letter, a lowercase letter, a number and a special
                  character (!@#$%^&*).
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPasswordConfirm(e.target.value)
                    }
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

              {/* Submit button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="w-full rounded-lg bg-[#2b3e2b] py-2 text-white transition-all hover:bg-[#2b3e2bd7] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#4c3de3] dark:hover:bg-[#4b3de3c0]"
                >
                  {loading ? "Sending..." : "Reset password"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
