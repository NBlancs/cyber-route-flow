
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomerList from "@/components/CustomerList";

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Customers</h1>
        <p className="text-gray-400">Manage your customer relationships and credit limits</p>
      </div>
      <CustomerList />
    </DashboardLayout>
  );
}
