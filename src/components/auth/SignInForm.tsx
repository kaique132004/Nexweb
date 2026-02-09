/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../assets/icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import { useUser } from "../../context/UserContext";
import { API_ENDPOINTS } from "../../api/endpoint";

interface LoginSuccessResponse {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  token?: string;
}

interface FirstLoginResponse {
  code: any;
  status: 307;
  message: string;
  token: string;
  username?: string;
}


type LoginResponse = LoginSuccessResponse | FirstLoginResponse;

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const { setUser } = useUser();

  // Validação de campos
  const isFormValid = username.trim().length > 0 && password.length > 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isFormValid) {
      setErrorMsg("Please enter both username and password");
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_ENDPOINTS.auth}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const contentType = response.headers.get("content-type");
      let data: LoginResponse | null = null;

      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
      }

      console.log("Response status:", response.status);
      console.log("Response data:", data);

      // ========================================
      // CASO 1: PRIMEIRO LOGIN (403 + mensagem específica)
      // ========================================
      const isFirstLogin =
        response.status === 403 &&
        data &&
        "message" in data &&
        typeof data.message === "string" &&
        data.message.toLowerCase().includes("password reset required");

      if (isFirstLogin) {
        const firstLoginData = data as FirstLoginResponse;

        if (!firstLoginData.code) {
          throw new Error("Invalid first login response - missing code");
        }

        const firstLoginInfo = {
          username: firstLoginData.username || username.trim(),
          code: firstLoginData.code,
          message: firstLoginData.message || "Please set your new password",
          timestamp: Date.now(),
        };

        localStorage.setItem("firstLogin", JSON.stringify(firstLoginInfo));

        console.log("First login detected, redirecting...", {
          ...firstLoginInfo,
          code: firstLoginInfo.code.substring(0, 3) + "***", // Log parcial por segurança
        });

        navigate("/first-login", {
          replace: true,
          state: firstLoginInfo,
        });

        return;
      }

      // ========================================
      // CASO 2: Erro "normal"
      // ========================================
      if (!response.ok) {
        let errorMessage = "Login failed. Please try again.";

        if (data && typeof data === "object") {
          if ("message" in data && data.message) {
            errorMessage = data.message as string;
          } else if ("error" in data && data.error) {
            errorMessage = data.error as string;
          } else {
            switch (response.status) {
              case 401:
                errorMessage = "Invalid username or password";
                break;
              case 403:
                errorMessage = "Access denied. Please contact support.";
                break;
              default:
                errorMessage = `Login failed (${response.status})`;
            }
          }
        }

        throw new Error(errorMessage);
      }

      // ========================================
      // CASO 3: Login bem-sucedido
      // ========================================
      const successData = data as LoginSuccessResponse;

      if (!successData?.id || !successData?.username) {
        throw new Error("Invalid user data received from server");
      }

      setUser({
        id: successData.id,
        name: successData.name,
        username: successData.username,
        email: successData.email,
        role: successData.role,
      });

      if (keepLoggedIn && successData.token) {
        localStorage.setItem("authToken", successData.token);
      }

      localStorage.removeItem("firstLogin");

      console.log("Login successful, redirecting to home...");

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error during login:", error);
      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };



  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      if (errorMsg) setErrorMsg(null);
    };
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-[#2B3E2B] text-title-sm dark:text-white sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-[#2B3E2B] dark:text-gray-400">
              Enter your username and password to sign in!
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Mensagem de erro */}
              {errorMsg && (
                <div
                  className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                  role="alert"
                >
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              {/* Campo Username */}
              <div>
                <Label htmlFor="username">
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={handleInputChange(setUsername)}
                  autoComplete="username"
                  disabled={loading}
                  required
                />
              </div>

              {/* Campo Password */}
              <div>
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    value={password}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    onChange={handleInputChange(setPassword)}
                    autoComplete="current-password"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 disabled:opacity-50 hover:opacity-70 transition-opacity"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    disabled={loading}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-[#2B3E2B] dark:fill-[#bbe8ee] size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-[#2B3E2B] dark:fill-cyan-400 size-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Keep logged in / Forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={keepLoggedIn}
                    onChange={setKeepLoggedIn}
                    disabled={loading}
                    aria-label="Keep me logged in"
                  />
                  <span className="block font-normal text-[#2B3E2B] text-theme-sm dark:text-cyan-300">
                    Keep me logged in
                  </span>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-[#2B3E2B] hover:text-teal-700 dark:text-[#bbe8ee] dark:hover:text-cyan-300 transition-colors"
                  tabIndex={loading ? -1 : 0}
                >
                  Forgot password?
                </Link>
              </div>

              {/* Botão Submit */}
              <div>
                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="w-full bg-[#2b3e2b] hover:bg-[#2b3e2bd7] text-white dark:bg-[#4c3de3] dark:hover:bg-[#4b3de3c0] py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="w-5 h-5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Signing In...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
