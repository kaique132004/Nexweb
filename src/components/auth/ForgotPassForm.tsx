import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../../api/endpoint";
import Label from "../form/Label";
import Input from "../form/input/InputField";

export default function ForgotPassForm() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Validação básica de email
    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        // Validação antes de enviar
        if (!email.trim()) {
            setError("Please enter your email address");
            return;
        }

        if (!isValidEmail(email)) {
            setError("Please enter a valid email address");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_ENDPOINTS.auth}/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: email.trim() }),
            });

            // Se não for sucesso (2xx), tenta ler a mensagem de erro
            if (!response.ok) {
                let errorMessage = "Failed to send reset code";

                // Só tenta ler JSON se houver conteúdo
                if (response.status !== 204) {
                    try {
                        const data = await response.json();
                        errorMessage = data.message || errorMessage;
                    } catch {
                        // Se falhar ao parsear, usa mensagem padrão
                    }
                }

                throw new Error(errorMessage);
            }

            // Sucesso - 204 não tem corpo, então não precisa fazer .json()
            navigate("/redefine-password", {
                state: { email: email.trim() }
            });

            // Opcional: mostrar toast de sucesso
            // toast.success("Reset code sent to your email!");

        } catch (error) {
            console.error("Error during password reset:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "An error occurred. Please try again."
            );
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
                            Forgot your password?
                        </h1>
                        <p className="text-sm text-[#2B3E2B] dark:text-gray-400">
                            Enter your email to reset!
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <div>
                            <Label htmlFor="email">
                                Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Email to send code to reset..."
                                value={email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setEmail(e.target.value);
                                    if (error) setError(null); // Limpa erro ao digitar
                                }}
                                disabled={loading}
                                required
                                aria-invalid={error ? "true" : "false"}
                                aria-describedby={error ? "email-error" : undefined}
                            />
                            {error && (
                                <p
                                    id="email-error"
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
                                disabled={loading || !email.trim()}
                                className="w-full bg-[#2b3e2b] hover:bg-[#2b3e2bd7] text-white dark:bg-[#4c3de3] dark:hover:bg-[#4b3de3c0] py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Sending..." : "Send Code"}
                            </button>
                        </div>

                        {/* Link para voltar ao login (opcional) */}
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
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
