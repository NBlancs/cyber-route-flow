import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomerList from "@/components/CustomerList";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerData } from "@/hooks/useCustomerData";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Customer } from "@/types/customer";

export default function CustomersPage() {
  const { customers, loading, fetchCustomers } = useCustomerData();
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const { toast } = useToast();

  const activeCustomers = customers.filter(c => c.active_shipments && c.active_shipments > 0);
  const overdueCustomers = customers.filter(c => c.credit_status === 'exceeded');
  
  const handleEditCustomer = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsEditCustomerOpen(true);
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerToDelete.id);

      if (error) throw error;

      toast({
        title: "Customer Deleted",
        description: `${customerToDelete.name} has been deleted successfully.`,
      });
      
      fetchCustomers(); // Refresh the customer list
      setCustomerToDelete(null);
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer. It may have associated shipments.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Customers</h1>
            <p className="text-gray-400">Manage your customer relationships and credit limits</p>
          </div>
          <Button onClick={() => setIsAddCustomerOpen(true)}>
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
      
      <CustomerList 
        onEdit={handleEditCustomer} 
        onDelete={(customer) => setCustomerToDelete(customer)}
      />

      {/* Add Customer Modal */}
      <CustomerForm 
        isOpen={isAddCustomerOpen} 
        onClose={() => setIsAddCustomerOpen(false)}
        onSave={fetchCustomers}
      />

      {/* Edit Customer Modal */}
      {customerToEdit && (
        <CustomerForm 
          customer={customerToEdit}
          isOpen={isEditCustomerOpen} 
          onClose={() => {
            setIsEditCustomerOpen(false);
            setCustomerToEdit(null);
          }}
          onSave={fetchCustomers}
        />
      )}

      {/* Delete Customer Confirmation */}
      <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer
              "{customerToDelete?.name}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
