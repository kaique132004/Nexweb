export interface UserPreferencesColumnsTransactions {
  username: boolean;
  supply_name: boolean;
  quantity_amended: boolean;
  quantity_before: boolean;
  quantity_after: boolean;
  created: boolean;
  region_code: boolean;
  price_unit: boolean;
  total_price: boolean;
  type_entry: boolean;
  obs_alter: boolean;
}

export interface UserPreferencesColumnsSupply {
  supply_name: boolean;
  description: boolean;
  regional_prices: boolean;
  is_active: boolean;
  created_at: boolean;
  updated_at: boolean;
  supply_image: boolean;
}

export interface UserPreferencesColumnsRegions {
  region_code: boolean;
  region_name: boolean;
  city_name: boolean;
  country_name: boolean;
  state_name: boolean;
  address_code: boolean;
  responsible_name: boolean;
  is_active: boolean;
  contains_agents_local: boolean;
  latitude: boolean;
  longitude: boolean;
}

export interface UserPreferencesColumnsUser {
  username: boolean;
  email: boolean;
  first_name: boolean;
  last_name: boolean;
  role: boolean;
  is_active: boolean;
  created_by: boolean;
  created_at: boolean;
  last_password_reset_date: boolean; // ajustado
  is_not_temporary: boolean;
  account_non_expired: boolean;
  account_non_locked: boolean;
  credentials_non_expired: boolean;
  regions: boolean;
  permissions: boolean;
  preferences: boolean;
}

export interface UserPreferencesColumnsVisibility {
  transactions: UserPreferencesColumnsTransactions;
  supply: UserPreferencesColumnsSupply;
  regions: UserPreferencesColumnsRegions;
  user: UserPreferencesColumnsUser;
}

export interface UserPreferences {
  language: string;
  theme: string;
  notifications_enabled: boolean;
  columns_visibility: UserPreferencesColumnsVisibility;
}

export interface UserDetail {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_by: string | null;
  created_at: string;
  last_password_reset_date: string | null;
  account_non_expired: boolean;
  account_non_locked: boolean;
  credentials_non_expired: boolean;
  regions: string[];
  permissions: string[];
  preferences: UserPreferences;
  active: boolean;
  not_temporary: boolean;
}
