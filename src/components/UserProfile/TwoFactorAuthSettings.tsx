// components/UserProfile/TwoFactorAuthSettings.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../../shared/components/form/Label.tsx";
import Input from "../../shared/components/form/input/InputField";
import { authFetch } from "../../api/apiAuth";
import { API_ENDPOINTS } from "../../api/endpoint";

interface TwoFactorAuthSettingsProps {
    userId: string;
    initialTwoFactorEnabled: boolean;
    onUpdate: (newStatus: boolean) => void; // Callback para atualizar o pai
}

interface TwoFactorStatusResponse {
    two_factor_enabled: boolean;
    two_factor_secret_configured: boolean;
    qr_code_image_url?: string; // URL do QR code, se gerado
}

interface TwoFactorSetupResponse {
    qr_code_generated: boolean;
    qr_code_image_url: string;
    message: string;
}

export default function TwoFactorAuthSettings({
                                                  userId,
                                                  initialTwoFactorEnabled,
                                                  onUpdate,
                                              }: TwoFactorAuthSettingsProps) {
    const { isOpen, openModal, closeModal } = useModal();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialTwoFactorEnabled);
    const [secretConfigured, setSecretConfigured] = useState(false); // Indica se o secret foi gerado e está pronto para ser verificado
    const [qrCodeImageUrl, setQrCodeImageUrl] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState("");

    useEffect(() => {
        setTwoFactorEnabled(initialTwoFactorEnabled);
        // Sempre verifica o status quando o modal abre ou initialTwoFactorEnabled muda
        if (isOpen) {
            checkTwoFactorStatus();
        } else {
            // Limpa estados quando o modal fecha
            setSecretConfigured(false);
            setQrCodeImageUrl(null);
            setVerificationCode("");
            setError(null);
            setSuccessMessage(null);
        }
    }, [initialTwoFactorEnabled, userId, isOpen]);

    const checkTwoFactorStatus = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await authFetch<TwoFactorStatusResponse>(
                `${API_ENDPOINTS.auth}/2fa/status/${userId}`
            );
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setTwoFactorEnabled(data.two_factor_enabled);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setSecretConfigured(data.two_factor_secret_configured);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setQrCodeImageUrl(data.qr_code_image_url || null); // Pode vir um QR code se o secret foi gerado mas não verificado
        } catch (err: any) {
            console.error("Error checking 2FA status:", err);
            setError(err.message || "Failed to load 2FA status.");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateQrCode = async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const data = await authFetch<TwoFactorSetupResponse>(
                `${API_ENDPOINTS.auth}/2fa/generate/${userId}`,
                { method: "POST" }
            );
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setQrCodeImageUrl(data.qr_code_image_url);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setSecretConfigured(data.qr_code_generated); // Se o QR code foi gerado, o secret está pronto para verificação
            setTwoFactorEnabled(false); // Ainda não está habilitado, apenas gerado
            setSuccessMessage("New QR code generated. Scan it with your authenticator app and enter the code below to enable 2FA.");
        } catch (err: any) {
            console.error("Error generating QR code:", err);
            setError(err.message || "Failed to generate QR code.");
        } finally {
            setLoading(false);
        }
    };

    const handleEnableTwoFactor = async () => {
        setSaving(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await authFetch(`${API_ENDPOINTS.auth}/2fa/enable/${userId}`, {
                method: "POST",
                body: JSON.stringify({ code: verificationCode }),
            });
            setTwoFactorEnabled(true);
            setSecretConfigured(true); // Secret agora está configurado e 2FA habilitado
            setQrCodeImageUrl(null); // Limpa o QR code após habilitação
            setVerificationCode("");
            onUpdate(true); // Notifica o componente pai
            setSuccessMessage("Two-Factor Authentication enabled successfully!");
            closeModal(); // Fecha o modal após habilitar
        } catch (err: any) {
            console.error("Error enabling 2FA:", err);
            setError(err.message || "Failed to enable 2FA. Check your code.");
        } finally {
            setSaving(false);
        }
    };

    const handleDisableTwoFactor = async () => {
        setSaving(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await authFetch(`${API_ENDPOINTS.auth}/2fa/disable/${userId}`, {
                method: "DELETE", // Seu backend usa DELETE para disable
                body: JSON.stringify({ code: verificationCode }),
            });
            setTwoFactorEnabled(false);
            setSecretConfigured(false);
            setQrCodeImageUrl(null);
            setVerificationCode("");
            onUpdate(false); // Notifica o componente pai
            setSuccessMessage("Two-Factor Authentication disabled successfully!");
            closeModal(); // Fecha o modal após desabilitar
        } catch (err: any) {
            console.error("Error disabling 2FA:", err);
            setError(err.message || "Failed to disable 2FA. Check your code.");
        } finally {
            setSaving(false);
        }
    };

    const handleCloseModal = () => {
        // Resetar estados ao fechar o modal
        setVerificationCode("");
        setError(null);
        setSuccessMessage(null);
        closeModal();
    };

    return (
        <>
            <button
                onClick={openModal}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
            >
                {twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
            </button>

            <Modal isOpen={isOpen} onClose={handleCloseModal} className="max-w-[500px] m-4">
                <div className="relative w-full p-4 overflow-hidden bg-white rounded-3xl dark:bg-[#1e1e1e] lg:p-8">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Two-Factor Authentication
                        </h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                            {twoFactorEnabled
                                ? "Manage your Two-Factor Authentication settings."
                                : "Enhance your account security with 2FA."}
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                    ) : (
                        <div className="px-2 pb-3">
                            {error && (
                                <p className="mb-4 text-sm text-red-500">{error}</p>
                            )}
                            {successMessage && (
                                <p className="mb-4 text-sm text-green-500">{successMessage}</p>
                            )}

                            {!twoFactorEnabled && !secretConfigured && (
                                // Estado inicial: 2FA desabilitado, secret não gerado
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Click "Generate QR Code" to start setting up 2FA.
                                    </p>
                                    <Button
                                        onClick={handleGenerateQrCode}
                                        disabled={saving}
                                        className="w-full"
                                    >
                                        {loading ? "Generating..." : "Generate QR Code"}
                                    </Button>
                                </div>
                            )}

                            {!twoFactorEnabled && secretConfigured && qrCodeImageUrl && (
                                // Estado: Secret gerado, esperando verificação
                                <div className="space-y-4 text-center">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Scan the QR code below with your authenticator app (e.g., Google Authenticator, Authy).
                                    </p>
                                    <div className="flex justify-center p-4 bg-white rounded-lg">
                                        <img src={qrCodeImageUrl} alt="QR Code" className="w-48 h-48" />
                                    </div>
                                    <Label htmlFor="verificationCode" className="block text-left">
                                        Enter 6-digit code from app
                                    </Label>
                                    <Input
                                        id="verificationCode"
                                        type="text"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        placeholder="e.g., 123456"
                                        disabled={saving}
                                        className="text-center tracking-widest"
                                    />
                                    <Button
                                        onClick={handleEnableTwoFactor}
                                        disabled={saving || verificationCode.length !== 6}
                                        className="w-full"
                                    >
                                        {saving ? "Enabling..." : "Enable 2FA"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleCloseModal}
                                        disabled={saving}
                                        className="w-full"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}

                            {twoFactorEnabled && (
                                // Estado: 2FA habilitado, opção de desabilitar
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Two-Factor Authentication is currently enabled. To disable it, enter a verification code from your authenticator app.
                                    </p>
                                    <Label htmlFor="verificationCodeDisable" className="block text-left">
                                        Enter 6-digit code from app
                                    </Label>
                                    <Input
                                        id="verificationCodeDisable"
                                        type="text"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        placeholder="e.g., 123456"
                                        disabled={saving}
                                        className="text-center tracking-widest"
                                    />
                                    <Button
                                        onClick={handleDisableTwoFactor}
                                        disabled={saving || verificationCode.length !== 6}
                                        className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                                    >
                                        {saving ? "Disabling..." : "Disable 2FA"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleCloseModal}
                                        disabled={saving}
                                        className="w-full"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
}