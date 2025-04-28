
import { useState } from "react";
import { Package } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  location: string;
  activeShipments: number;
  creditStatus: 'good' | 'warning' | 'exceeded';
  creditLimit: number;
  creditUsed: number;
}

export default function CustomerList() {
  const [customers] = useState<Customer[]>([
    {
      id: '1',
      name: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      activeShipments: 5,
      creditStatus: 'good',
      creditLimit: 50000,
      creditUsed: 20000,
    },
    {
      id: '2',
      name: 'Global Systems',
      location: 'Austin, TX',
      activeShipments: 3,
      creditStatus: 'warning',
      creditLimit: 30000,
      creditUsed: 25000,
    },
    {
      id: '3',
      name: 'Quantum Industries',
      location: 'Chicago, IL',
      activeShipments: 7,
      creditStatus: 'exceeded',
      creditLimit: 40000,
      creditUsed: 41000,
    },
  ]);

  return (
    <div className="cyber-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package size={18} className="text-cyber-neon" />
          <span>Top Customers</span>
        </h2>
        <button className="text-xs text-cyber-neon hover:underline">View All</button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {customers.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
      </div>
    </div>
  );
}

interface CustomerCardProps {
  customer: Customer;
}

function CustomerCard({ customer }: CustomerCardProps) {
  // Calculate credit percentage used
  const creditPercentage = (customer.creditUsed / customer.creditLimit) * 100;
  
  // Determine status color
  const statusColor = {
    'good': 'bg-green-500',
    'warning': 'bg-yellow-500',
    'exceeded': 'bg-red-500'
  }[customer.creditStatus];
  
  return (
    <div className="bg-white/5 border border-gray-800/60 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-white">{customer.name}</h3>
          <p className="text-gray-400 text-sm">{customer.location}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyber-neon text-sm">{customer.activeShipments}</span>
          <span className="text-xs text-gray-400">shipments</span>
        </div>
      </div>
      
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span>Credit Limit: ${(customer.creditLimit / 1000).toFixed(1)}k</span>
          <span className={creditPercentage >= 100 ? 'text-red-400' : 'text-gray-400'}>
            ${(customer.creditUsed / 1000).toFixed(1)}k used
          </span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full ${statusColor}`} 
            style={{ width: `${Math.min(creditPercentage, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
