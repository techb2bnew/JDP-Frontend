// src/types/bluesheet.ts

export interface MaterialEntry {
    product_id: number;
    material_name: string;
    quantity: number;
    unit: string;
    total_ordered: number;
    material_used: number;
    supplier_order_id: string;
    return_to_warehouse: boolean;
    unit_cost: number; 
  }
  
  export interface BulkMaterialPayload {
    materials: MaterialEntry[];
  }