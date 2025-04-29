
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Customer } from "@/types/customer";

interface CustomerCardProps {
  customer: Customer;
  onRequestPayment: (customer: Customer) => void;
  paymentLoading: boolean;
}

export function CustomerCard({ customer, onRequestPayment, paymentLoading }: CustomerCardProps) {
  // Calculate credit percentage used
  const creditPercentage = (customer.credit_used / customer.credit_limit) * 100;
  
  // Determine status color
  const statusColor = {
    'good': 'bg-green-500',
    'warning': 'bg-yellow-500',
    'exceeded': 'bg-red-500'
  }[customer.credit_status || 'good'];
  
  return (
    <div className="bg-white/5 border border-gray-800/60 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-white">{customer.name}</h3>
          <p className="text-gray-400 text-sm">{customer.location}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyber-neon text-sm">{customer.active_shipments}</span>
          <span className="text-xs text-gray-400">shipments</span>
        </div>
      </div>
      
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span>Credit Limit: ${(customer.credit_limit / 1000).toFixed(1)}k</span>
          <span className={creditPercentage >= 100 ? 'text-red-400' : 'text-gray-400'}>
            ${(customer.credit_used / 1000).toFixed(1)}k used
          </span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full ${statusColor}`} 
            style={{ width: `${Math.min(creditPercentage, 100)}%` }}
          ></div>
        </div>

        {creditPercentage >= 90 && (
          <div className="mt-3 flex justify-end">
            <Button 
              size="sm"
              variant="ghost"
              className="text-xs h-8"
              onClick={() => onRequestPayment(customer)}
              disabled={paymentLoading}
            >
              <CreditCard size={14} className="mr-1" /> 
              Request Payment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
