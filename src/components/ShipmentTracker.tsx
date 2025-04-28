
import { Package } from "lucide-react";

interface Shipment {
  id: string;
  trackingId: string;
  customer: string;
  origin: string;
  destination: string;
  status: 'processing' | 'in-transit' | 'delivered' | 'failed';
  eta: string;
}

export default function ShipmentTracker() {
  const shipments: Shipment[] = [
    {
      id: '1',
      trackingId: 'SHP-12345',
      customer: 'TechCorp Inc.',
      origin: 'San Francisco, CA',
      destination: 'New York, NY',
      status: 'in-transit',
      eta: '3h 45m'
    },
    {
      id: '2',
      trackingId: 'SHP-12346',
      customer: 'Global Systems',
      origin: 'Austin, TX',
      destination: 'Seattle, WA',
      status: 'processing',
      eta: 'Pending'
    },
    {
      id: '3',
      trackingId: 'SHP-12347',
      customer: 'Quantum Industries',
      origin: 'Chicago, IL',
      destination: 'Miami, FL',
      status: 'delivered',
      eta: 'Delivered'
    },
    {
      id: '4',
      trackingId: 'SHP-12348',
      customer: 'Future Dynamics',
      origin: 'Boston, MA',
      destination: 'Los Angeles, CA',
      status: 'in-transit',
      eta: '1d 2h'
    },
  ];

  return (
    <div className="cyber-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package size={18} className="text-cyber-neon" />
          <span>Active Shipments</span>
        </h2>
        <button className="text-xs text-cyber-neon hover:underline">View All</button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-800">
              <th className="pb-2 text-left font-medium">Tracking ID</th>
              <th className="pb-2 text-left font-medium">Customer</th>
              <th className="pb-2 text-left font-medium">Route</th>
              <th className="pb-2 text-left font-medium">Status</th>
              <th className="pb-2 text-left font-medium">ETA</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((shipment) => (
              <tr 
                key={shipment.id} 
                className="text-sm border-b border-gray-800/50 hover:bg-white/5"
              >
                <td className="py-3 text-cyber-neon">{shipment.trackingId}</td>
                <td className="py-3">{shipment.customer}</td>
                <td className="py-3 text-xs">
                  <div className="flex flex-col">
                    <span className="text-gray-400">From: {shipment.origin}</span>
                    <span className="text-white">To: {shipment.destination}</span>
                  </div>
                </td>
                <td className="py-3">
                  <ShipmentStatus status={shipment.status} />
                </td>
                <td className="py-3">{shipment.eta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ShipmentStatusProps {
  status: 'processing' | 'in-transit' | 'delivered' | 'failed';
}

function ShipmentStatus({ status }: ShipmentStatusProps) {
  const statusConfig = {
    'processing': {
      label: 'Processing',
      className: 'bg-yellow-500/20 text-yellow-300',
    },
    'in-transit': {
      label: 'In Transit',
      className: 'bg-blue-500/20 text-blue-300',
    },
    'delivered': {
      label: 'Delivered',
      className: 'bg-green-500/20 text-green-300',
    },
    'failed': {
      label: 'Failed',
      className: 'bg-red-500/20 text-red-300',
    },
  };

  const config = statusConfig[status];
  
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${config.className}`}>
      {config.label}
    </span>
  );
}
