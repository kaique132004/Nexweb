// components/auth/TwoFactorAuthForm.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_ENDPOINTS } from "../../../api/endpoint.ts";
import Input from "../form/input/InputField.tsx";
import { useUser } from "../../../context/UserContext.tsx";
import Label from "../form/Label.tsx";
// import { authFetch } from "../../api/apiAuth"; // Não é necessário para este endpoint, pois não usa token de autenticação ainda

interface LocationState {
    tempToken: string;
}

interface LoginSuccessResponse {
    id: number;
    username: string;
    email: string;
    role: string;
    first_name?: string;
    last_name?: string;
    two_factor_enabled?: boolean;
}

export default function TwoFactorAuthForm() {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { setUser } = useUser();

    const { tempToken } = (location.state as LocationState) || {};

    // Redireciona se não houver tempToken
    useEffect(() => {
        if (!tempToken) {
            setError("No 2FA token found. Please try logging in again.");
            const timer = setTimeout(() => navigate("/signin", { replace: true }), 30000);
            return () => clearTimeout(timer);
        }
    }, [tempToken, navigate]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        // Validação do tempToken antes de prosseguir
        if (!tempToken) {
            setError("Authentication error: Missing temporary token. Please log in again.");
            return;
        }

        if (!code.trim()) {
            setError("Please enter the 6-digit verification code.");
            return;
        }

        if (code.trim().length !== 6 || !/\d+/.test(code.trim())) {
            setError("The code must be a 6-digit number.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_ENDPOINTS.auth}/2fa/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    tempToken: tempToken, // Garante que o tempToken é enviado
                    code: code.trim(),
                }),
            });

            let data: LoginSuccessResponse | any = null;

            const contentType = response.headers.get("content-type");
            if (contentType?.includes("application/json")) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = text ? JSON.parse(text) : null;
            }

            console.log("2FA Verify Response status:", response.status);
            console.log("2FA Verify Response data:", data);

            if (!response.ok) {
                let errorMessage = "2FA verification failed. Please try again.";
                if (data && data.message) {
                    errorMessage = data.message;
                }
                throw new Error(errorMessage);
            }

            const successData = data as LoginSuccessResponse;

            if (!successData || !successData.id || !successData.username || !successData.role) {
                throw new Error("Invalid user data received after 2FA verification.");
            }

            const userFullName =
                (successData.first_name && successData.last_name)
                    ? `${successData.first_name} ${successData.last_name}`
                    : successData.username;

            setUser({
                id: successData.id,
                name: userFullName,
                username: successData.username,
                email: successData.email, // Assumindo que o email vem na resposta final
                role: successData.role,
                twoFactorEnabled: successData.two_factor_enabled || false,
            });

            navigate("/", { replace: true });

        } catch (error: any) {
            console.error("Error during 2FA verification:", error);
            setError(error.message || "An unexpected error occurred during 2FA verification.");
        } finally {
            setLoading(false);
        }
    };

    // ... (restante do componente)
    return (
        <div className="flex flex-col flex-1"> {/* Contêiner principal como no ForgotPassForm */}
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto"> {/* Contêiner de centralização e largura máxima */}
                <div>
                    <div className="mb-5 sm:mb-8"> {/* Espaçamento para o título */}
                        <h1 className="mb-2 font-semibold text-[#2B3E2B] text-title-sm dark:text-white sm:text-title-md"> {/* Título como no ForgotPassForm */}
                            Two-Factor Authentication
                        </h1>
                        <p className="text-sm text-[#2B3E2B] dark:text-gray-400"> {/* Descrição como no ForgotPassForm */}
                            Please enter the 6-digit code from your authenticator app.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <div>
                            <Label htmlFor="2fa-code">Verification Code</Label>
                            <Input
                                id="2fa-code"
                                type="text"
                                placeholder="Enter 6-digit code"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value);
                                    if (error) setError(null); // Limpa erro ao digitar
                                }}
                                autoComplete="off"
                                disabled={loading}
                                required
                                aria-invalid={error ? "true" : "false"}
                                aria-describedby={error ? "code-error" : undefined}
                            />
                            {error && (
                                <p
                                    id="code-error"
                                    className="mt-2 text-sm text-red-600 dark:text-red-400"
                                    role="alert"
                                >
                                    {error}
                                </p>
                            )}
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading || code.trim().length !== 6}
                                className="w-full bg-[#2b3e2b] hover:bg-[#2b3e2bd7] text-white dark:bg-[#4c3de3] dark:hover:bg-[#4b3de3c0] py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Verifying..." : "Verify Code"}
                            </button>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => navigate("/signin", { replace: true })}
                                className="text-sm text-[#2b3e2b] dark:text-[#4c3de3] hover:underline"
                                disabled={loading}
                            >
                                Back to Login
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}