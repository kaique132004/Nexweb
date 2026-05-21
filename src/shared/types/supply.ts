import type {RegionControlSupply} from "./region.ts";

export interface SupplyOption {
    id: number;
    supply_name: string;
    description: string;
    regional_prices: RegionalPrice[];
    is_active: boolean;
    created_at: string;
    updated_at?: string;
    supply_image: string[] | null;
}

export interface RegionalPrice {
    id: number;
    region_id: number;
    region_code: string;
    currency: string;
    supplier: string;
    price: number;
    quantity: number;
    min_stock_alert: number;
}

export interface SupplyRequestSnake {
    id: number;
    supply_name: string;
    description: string;
    is_active: boolean;
    supply_image: string[];
    regional_prices: RegionControlSupply[];
}

export interface SupplyResponseSnake {
    id: number;
    supply_name: string;
    description: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    supply_image: string[];
    regional_prices: RegionControlSupply[];
}