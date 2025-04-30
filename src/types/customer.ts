
export interface Customer {
  id: string;
  name: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  credit_limit: number;
  credit_used: number;
  active_shipments?: number;
  credit_status?: 'good' | 'warning' | 'exceeded';
  email?: string;
  phone?: string;
  address?: string;
  payment_methods?: PaymentMethod[];
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'gcash' | 'grabpay';
  last_four?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default?: boolean;
}

export interface CustomerPaymentIntent {
  id: string;
  customer_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  payment_method_id?: string;
  description?: string;
}
