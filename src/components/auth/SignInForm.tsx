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
  status: 307;
  message: string;
  token: string;
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validação básica
    if (!username.trim() || !password) {
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
        },
        credentials: "include", // Importante para cookies HttpOnly
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      // Lê o corpo da resposta
      const text = await response.text();
      const data: LoginResponse = text ? JSON.parse(text) : null;

      // Caso especial: 307 (primeiro login / reset de senha)
      if (response.status === 307) {
        const firstLoginData = data as FirstLoginResponse;

        if (!firstLoginData?.token) {
          throw new Error("Invalid first login response");
        }

        // Guarda dados para tela de primeiro login
        localStorage.setItem(
          "firstLogin",
          JSON.stringify({
            username: username.trim(),
            token: firstLoginData.token,
            message: firstLoginData.message || "Please set your new password",
          })
        );

        navigate("/first-login");
        return;
      }

      // Erros HTTP
      if (!response.ok) {
        const errorMessage =
          (data as any)?.message ||
          (response.status === 401
            ? "Invalid username or password"
            : `Login failed (${response.status})`);
        throw new Error(errorMessage);
      }

      // Sucesso - valida dados
      const successData = data as LoginSuccessResponse;

      if (!successData?.id) {
        throw new Error("Invalid user data received");
      }

      // Atualiza contexto do usuário
      setUser({
        id: successData.id,
        name: successData.name,
        username: successData.username,
        email: successData.email,
        role: successData.role,
      });

      // Keep me logged in - salva token se existir
      if (keepLoggedIn && successData.token) {
        localStorage.setItem("authToken", successData.token);
      }

      // Redireciona para home
      navigate("/");
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
                  {errorMsg}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setUsername(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    autoComplete="current-password"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 disabled:opacity-50"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    disabled={loading}
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
                  disabled={loading || !username.trim() || !password}
                  className="w-full bg-[#2b3e2b] hover:bg-[#2b3e2bd7] text-white dark:bg-[#4c3de3] dark:hover:bg-[#4b3de3c0] py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
