// Interface para os filtros
// Interface para o payload de export
export interface ExportPayload {
    dateDays?: number;
    nameSupply?: string[];
    typeEntry?: string;
    regionCodes?: string[];
    quantitySupply?: number;
    user?: string;
    startDate?: string;
    endDate?: string;
}

export interface TransactionRequestPayload {
    supply_id: number;
    quantity_amended: number;
    created: string;
    region_id: number;
    type_entry: string;
    obs_alter?: string;
}

export interface TransactionResponse {
    id: number;
    username: string;
    supply_name: string;
    supply_id: number;
    quantity_amended: number;
    quantity_before: number;
    quantity_after: number;
    created_at: string;
    region_id: number;
    region_code: string;
    price_unit: number;
    total_price: number;
    type_entry: string;
    obs_alter: string;
    created_by: string;
}

export interface TransactionFilters {
    startDate?: string;
    endDate?: string;
    regionCode?: string;
    supplyName?: string;
    typeEntry?: string;
    username?: string;
}