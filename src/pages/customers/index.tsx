
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomerList from "@/components/CustomerList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerData } from "@/hooks/useCustomerData";

export default function CustomersPage() {
  const { customers, loading, fetchCustomers } = useCustomerData();
  const [view, setView] = useState<'grid' | 'table'>('grid');

  const activeCustomers = customers.filter(c => c.active_shipments && c.active_shipments > 0);
  const overdueCustomers = customers.filter(c => c.credit_status === 'exceeded');
  
  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Customers</h1>
            <p className="text-gray-400">Manage your customer relationships and credit limits</p>
          </div>
          <Button>
            <Plus size={16} className="mr-1" /> Add Customer
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{overdueCustomers.length}</div>
          </CardContent>
        </Card>
      </div>
      
      <CustomerList />
    </DashboardLayout>
  );
}
