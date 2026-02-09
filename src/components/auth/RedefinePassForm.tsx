import { useState } from "react";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { EyeCloseIcon, EyeIcon } from "../../assets/icons";
import { authFetch } from "../../api/apiAuth";
import { API_ENDPOINTS } from "../../api/endpoint";
import { useNavigate } from "react-router-dom";

export default function RedefinePassForm() {
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const navigate = useNavigate();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username || !code || !password || !passwordConfirm) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("As senhas não coincidem.");
      return;
    }

    // (Opcional) regra mínima de senha
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    try {
      setLoading(true);
      await authFetch(`${API_ENDPOINTS.auth}/redefine-password`, {
        method: "POST",
        body: JSON.stringify({ username, code, password }),
      });

      // Se o backend retornar algo específico, você pode usar:
      // setSuccess(res.message || "Senha redefinida com sucesso.");
      setSuccess("Senha redefinida com sucesso.");
      setPassword("");
      setPasswordConfirm("");
      setCode("");
      navigate("/signin")
    } catch (err: any) {
      console.error("Erro ao redefinir senha:", err);
      const backendMessage =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err.message;
      setError(backendMessage || "Erro ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 text-title-sm font-semibold text-[#2B3E2B] dark:text-white sm:text-title-md">
              Redefine your password
            </h1>
            <p className="text-sm text-[#2B3E2B] dark:text-gray-400">
              Enter your email, the code sent to you and your new password.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Email / Username */}
            <div>
              <Label>
                Username <span className="text-red-500">*</span>
              </Label>
              <Input
                type="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUsername(e.target.value)
                }
              />
            </div>

            {/* Code */}
            <div>
              <Label>
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter the code sent to your email"
                value={code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCode(e.target.value)
                }
              />
            </div>

            {/* New password */}
            <div>
              <Label>
                New Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  value={password}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeIcon className="size-5 fill-[#2B3E2B] dark:fill-[#bbe8ee]" />
                  ) : (
                    <EyeCloseIcon className="size-5 fill-[#2B3E2B] dark:fill-cyan-400" />
                  )}
                </span>
              </div>
            </div>

            {/* Confirm new password */}
            <div>
              <Label>
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  value={passwordConfirm}
                  type={showPasswordConfirm ? "text" : "password"}
                  placeholder="Confirm your new password"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPasswordConfirm(e.target.value)
                  }
                />
                <span
                  onClick={() =>
                    setShowPasswordConfirm(!showPasswordConfirm)
                  }
                  className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer"
                >
                  {showPasswordConfirm ? (
                    <EyeIcon className="size-5 fill-[#2B3E2B] dark:fill-[#bbe8ee]" />
                  ) : (
                    <EyeCloseIcon className="size-5 fill-[#2B3E2B] dark:fill-cyan-400" />
                  )}
                </span>
              </div>
            </div>

            {/* Mensagens de erro / sucesso */}
            {error && (
              <p className="text-sm text-red-500">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600">
                {success}
              </p>
            )}

            {/* Botão */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#2b3e2b] py-2 text-white transition-all hover:bg-[#2b3e2bd7] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#4c3de3] dark:hover:bg-[#4b3de3c0]"
              >
                {loading ? "Sending..." : "Redefine Password"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
