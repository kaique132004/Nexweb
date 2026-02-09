// src/lib/authFetch.ts

export class AuthFetchError extends Error {
  public status: number;
  public data?: unknown;

  constructor(
    message: string,
    status: number,
    data?: unknown
  ) {
    super(message);
    this.name = "AuthFetchError";
    this.status = status;
    this.data = data;
  }
}

export async function authFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T | null> {
  // Monta headers base
  const baseHeaders = new Headers({
    "Content-Type": "application/json",
  });

  // Merge com headers customizados
  if (options.headers) {
    const incoming = new Headers(options.headers as HeadersInit);
    incoming.forEach((value, key) => {
      baseHeaders.set(key, value);
    });
  }

  let res: Response;

  try {
    res = await fetch(url, {
      ...options,
      headers: baseHeaders,
      credentials: "include", // Envia cookies HttpOnly
    });
  } catch (err) {
    console.error("Network error in authFetch:", err);
    throw new AuthFetchError(
      "Failed to connect to server. Please check your connection.",
      0
    );
  }

  // 401 - Não autorizado (redireciona para login)
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("userSession");
      window.location.href = "/signin";
    }
    throw new AuthFetchError("Unauthorized. Please sign in again.", 401);
  }

  // 204 - No Content (sucesso sem corpo)
  if (res.status === 204) {
    return null;
  }

  // Tenta ler o corpo da resposta
  const text = (await res.text()).trim();

  // 2xx com corpo vazio
  if (res.ok && !text) {
    return null;
  }

  // Parse do JSON (se houver)
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Se não for JSON, mantém como texto
      data = text;
    }
  }

  // Erros 4xx (exceto 401 já tratado)
  if (res.status >= 400 && res.status < 500) {
    const errorMessage =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as { message: string }).message)
        : `Request failed with status ${res.status}`;

    throw new AuthFetchError(errorMessage, res.status, data);
  }

  // Erros 5xx
  if (res.status >= 500) {
    const errorMessage =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as { message: string }).message)
        : "Internal server error. Please try again later.";

    throw new AuthFetchError(errorMessage, res.status, data);
  }

  // Sucesso (2xx)
  return data as T;
}

// Nova função para download de arquivos (blob)
export async function authFetchBlob(
  url: string,
  options: RequestInit = {}
): Promise<{ blob: Blob; filename?: string }> {
  // Monta headers base
  const baseHeaders = new Headers({
    "Content-Type": "application/json",
  });

  // Merge com headers customizados
  if (options.headers) {
    const incoming = new Headers(options.headers as HeadersInit);
    incoming.forEach((value, key) => {
      baseHeaders.set(key, value);
    });
  }

  let res: Response;

  try {
    res = await fetch(url, {
      ...options,
      headers: baseHeaders,
      credentials: "include", // Envia cookies HttpOnly
    });
  } catch (err) {
    console.error("Network error in authFetchBlob:", err);
    throw new AuthFetchError(
      "Failed to connect to server. Please check your connection.",
      0
    );
  }

  // 401 - Não autorizado (redireciona para login)
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("userSession");
      window.location.href = "/signin";
    }
    throw new AuthFetchError("Unauthorized. Please sign in again.", 401);
  }

  // Erros 4xx/5xx
  if (!res.ok) {
    // Tenta ler mensagem de erro
    const text = await res.text();
    let errorMessage = `Request failed with status ${res.status}`;

    try {
      const data = JSON.parse(text);
      if (data && typeof data === "object" && "message" in data) {
        errorMessage = String(data.message);
      }
    } catch {
      // Se não for JSON, usa o texto direto
      if (text) {
        errorMessage = text;
      }
    }

    throw new AuthFetchError(errorMessage, res.status);
  }

  // Extrair filename do header Content-Disposition
  const contentDisposition = res.headers.get("Content-Disposition");
  let filename: string | undefined;

  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch) {
      filename = filenameMatch[1];
    }
  }

  // Pegar o blob da resposta
  const blob = await res.blob();

  return { blob, filename };
}
