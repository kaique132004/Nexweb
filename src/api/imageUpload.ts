// src/api/imageUpload.ts

import { API_ENDPOINTS } from "./endpoint"; // Certifique-se que o caminho está correto

export class ImageUploadError extends Error {
    public status: number;
    public data?: unknown;

    constructor(message: string, status: number, data?: unknown) {
        super(message);
        this.name = "ImageUploadError";
        this.status = status;
        this.data = data;
    }
}

interface UploadResponse {
    status: number;
    message: string;
    data: string; // A URL da imagem
}

export async function uploadProfilePicture(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token'); // Obtenha o token de onde ele estiver armazenado

    const headers = new Headers();
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    // IMPORTANTE: NÃO defina 'Content-Type' aqui para FormData.
    // O navegador fará isso automaticamente com o boundary correto.

    let res: Response;

    try {
        res = await fetch(`${API_ENDPOINTS.upload}/profile-picture`, {
            method: 'POST',
            headers: headers,
            body: formData,
            credentials: 'include', // Envia cookies HttpOnly
        });
    } catch (err) {
        console.error("Network error in uploadProfilePicture:", err);
        throw new ImageUploadError(
            "Failed to connect to server for image upload. Please check your connection.",
            0
        );
    }

    if (res.status === 401) {
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("userSession");
            window.location.href = "/signin";
        }
        throw new ImageUploadError("Unauthorized. Please sign in again.", 401);
    }

    if (!res.ok) {
        const text = await res.text();
        let errorMessage = `Image upload failed with status ${res.status}`;
        try {
            const data = JSON.parse(text);
            if (data && typeof data === "object" && "message" in data) {
                errorMessage = String(data.message);
            }
        } catch {
            if (text) {
                errorMessage = text;
            }
        }
        throw new ImageUploadError(errorMessage, res.status);
    }

    const data = await res.json();
    return data as UploadResponse;
}

export async function deleteProfilePicture(): Promise<void> {
    const token = localStorage.getItem('token');

    const headers = new Headers();
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    let res: Response;

    try {
        res = await fetch(`${API_ENDPOINTS.upload}/profile-picture`, {
            method: 'DELETE',
            headers: headers,
            credentials: 'include',
        });
    } catch (err) {
        console.error("Network error in deleteProfilePicture:", err);
        throw new ImageUploadError(
            "Failed to connect to server for image deletion. Please check your connection.",
            0
        );
    }

    if (res.status === 401) {
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("userSession");
            window.location.href = "/signin";
        }
        throw new ImageUploadError("Unauthorized. Please sign in again.", 401);
    }

    if (!res.ok) {
        const text = await res.text();
        let errorMessage = `Image deletion failed with status ${res.status}`;
        try {
            const data = JSON.parse(text);
            if (data && typeof data === "object" && "message" in data) {
                errorMessage = String(data.message);
            }
        } catch {
            if (text) {
                errorMessage = text;
            }
        }
        throw new ImageUploadError(errorMessage, res.status);
    }
    // Se a resposta for 200 OK ou 204 No Content, não há corpo para retornar
}