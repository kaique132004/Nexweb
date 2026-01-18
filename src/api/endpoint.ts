export const API_BASE = `${process.env.REACT_BACKEND_API_URL || 'http://localhost:9000'}`;

export const API_ENDPOINTS = {
    supply: `${API_BASE}/api/v2/supply`,
    transaction: `${API_BASE}/api/v2/transaction`,
    auth: `${API_BASE}/api/v2/auth`,
    region: `${API_BASE}/api/v2/region`,
    permission: `${API_BASE}/api/v2/permission`,
    preferences: `${API_BASE}/api/v2/preferences`,
    notifications: `${API_BASE}/api/v2/notifications`,
};