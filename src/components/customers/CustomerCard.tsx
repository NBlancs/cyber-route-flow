
import { CreditCard, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Customer } from "@/types/customer";
import { CustomerPaymentModal } from "./CustomerPaymentModal";

interface CustomerCardProps {
  customer: Customer;
  onRequestPayment: (customer: Customer) => void;
  paymentLoading: boolean;
}

export function CustomerCard({ customer, onRequestPayment, paymentLoading }: CustomerCardProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Calculate credit percentage used
  const creditPercentage = (customer.credit_used / customer.credit_limit) * 100;
  
  // Determine status color
  const statusColor = {
    'good': 'bg-green-500',
    'warning': 'bg-yellow-500',
    'exceeded': 'bg-red-500'
  }[customer.credit_status || 'good'];
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 1000);
  };
  
  return (
    <div className="bg-white/5 border border-gray-800/60 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-white">{customer.name}</h3>
          <p className="text-gray-400 text-sm">{customer.location}</p>
          {customer.email && (
            <p className="text-gray-400 text-xs mt-1">{customer.email}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyber-neon text-sm">{customer.active_shipments}</span>
          <span className="text-xs text-gray-400">
            <Package size={14} className="inline mr-1" />
            shipments
          </span>
        </div>
      </div>
      
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span>Credit Limit: ₱{formatCurrency(customer.credit_limit)}k</span>
          <span className={creditPercentage >= 100 ? 'text-red-400' : 'text-gray-400'}>
            ₱{formatCurrency(customer.credit_used)}k used
          </span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full ${statusColor}`} 
            style={{ width: `${Math.min(creditPercentage, 100)}%` }}
          ></div>
        </div>

        <div className="mt-3 flex justify-end">
          <Button 
            size="sm"
            variant="ghost"
            className="text-xs h-8"
            onClick={() => setShowPaymentModal(true)}
            disabled={paymentLoading}
          >
            <CreditCard size={14} className="mr-1" /> 
            Process Payment
          </Button>
        </div>
      </div>
      
      <CustomerPaymentModal 
        customer={customer}
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          // This will trigger a refresh of customer data
          window.location.reload();
        }}
      />
    </div>
  );
}
