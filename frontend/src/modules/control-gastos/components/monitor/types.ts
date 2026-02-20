
export interface AssetExecutionDetail {
    tipo: string;
    budget: number;
    real: number;
}

export interface AssetExecutionGroup {
    activo: string;
    tipoFila: string;
    totalBudget: number;
    totalReal: number;
    details: AssetExecutionDetail[];
    hasDateAlert?: boolean;
    planta?: string;
    claseContable?: string;
    deviation: number;
    hasActiveOT?: boolean;
}

export interface CostCenterGroup {
    centroCosto: string;
    assets: AssetExecutionGroup[];
    totalBudget: number;
    totalReal: number;
    deviation: number;
}

export type SortField = 'centroCosto' | 'totalBudget' | 'totalReal' | 'deviation';
export type SortOrder = 'asc' | 'desc';
