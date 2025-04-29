
export interface Customer {
  id: string;
  name: string;
  location?: string;
  city?: string;
  state?: string;
  credit_limit: number;
  credit_used: number;
  active_shipments?: number;
  credit_status?: 'good' | 'warning' | 'exceeded';
}
