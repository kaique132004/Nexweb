// src/config/api.js (ou onde você preferir)
const API_BASE = import.meta.env.VITE_API_URL;

export const API_ENDPOINTS = {
  supply: `${API_BASE}/api/v2/supply`,
  transaction: `${API_BASE}/api/v2/transaction`,
  auth: `${API_BASE}/api/v2/auth`,
  region: `${API_BASE}/api/v2/region`,
  permission: `${API_BASE}/api/v2/permission`,
  preferences: `${API_BASE}/api/v2/preferences`,
  notifications: `${API_BASE}/api/v2/notifications`,
};
