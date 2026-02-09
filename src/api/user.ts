import { authFetch } from "./apiAuth";

export async function getCurrentUser(id: number) {
    return await authFetch(`/v2/auth/user-detail/${id}`);
}

export async function getListUsers() {
    return await authFetch(`/v2/auth/list`);
}