import api from "./api";

export async function requestPasswordResetLink(email) {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
}

export async function submitPasswordReset(payload) {
    const { data } = await api.post("/auth/reset-password", payload);
    return data;
}

export function getApiErrorDetails(error, fallbackMessage) {
    const responseData = error?.response?.data;
    const message = responseData?.message || fallbackMessage;
    const errors = responseData?.errors || {};

    return { message, errors };
}
