export interface Region {
    id: number;
    region_code: string;
    region_name: string;
    city_name?: string;
    country_name?: string;
    is_active: boolean;
    address_code?: string;
    state_name?: string;
    responsible_name?: string;
    contains_agents_local?: boolean;
    latitude?: number;
    longitude?: number;
    min_stock_alert?: number;
    created_by?: string;
    created_at?: string;
}

export interface RegionControlSupply {
    id: number;
    region_id: number;
    region_code: string;
    currency: string;
    supplier: string;
    price: number;
    quantity: number;
}