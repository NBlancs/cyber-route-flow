import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Customer } from "@/types/customer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CustomerFormProps {
  customer?: Customer;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function CustomerForm({ customer, isOpen, onClose, onSave }: CustomerFormProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    zip: customer?.zip || '',
    country: customer?.country || '',
    credit_limit: customer?.credit_limit || 10000,
    credit_used: customer?.credit_used || 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Convert credit fields to numbers
    if (name === 'credit_limit' || name === 'credit_used') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0, // Ensure it's a number
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate required fields
      if (!formData.name) {
        toast({
          title: "Error",
          description: "Customer name is required.",
          variant: "destructive",
        });
        return;
      }

      // Prepare the customer data for saving
      const customerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country,
        credit_limit: formData.credit_limit,
        credit_used: formData.credit_used,
      };

      // Determine if we are creating a new customer or updating an existing one
      if (customer) {
        // Update existing customer
        const { data, error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', customer.id);

        if (error) throw error;

        toast({
          title: "Customer Updated",
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        // Create new customer
        const { data, error } = await supabase
          .from('customers')
          .insert([customerData]);

        if (error) throw error;

        toast({
          title: "Customer Created",
          description: `${formData.name} has been created successfully.`,
        });
      }

      // Refresh the customer list and close the form
      onSave();
      onClose();
    } catch (error: any) {
      console.error("Error saving customer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save customer.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md sm:max-w-lg bg-gray-900 border border-gray-800 text-white p-4 sm:p-6">
        <DialogHeader className="flex flex-row items-center justify-between pb-4">
          <DialogTitle>{customer ? "Edit Customer" : "Add Customer"}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="-mr-2 -mt-2 sm:mr-0 sm:mt-0">
            <X size={18} />
          </Button>
        </DialogHeader>

        <div className="py-4 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                name="name"
                required
                className="bg-gray-800 border border-gray-700 rounded-md focus:ring-cyber-neon focus:border-cyber-neon focus:outline-none"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                name="email"
                className="bg-gray-800 border border-gray-700 rounded-md focus:ring-cyber-neon focus:border-cyber-neon focus:outline-none"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                name="phone"
                className="bg-gray-800 border border-gray-700 rounded-md focus:ring-cyber-neon focus:border-cyber-neon focus:outline-none"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                name="address"
                className="bg-gray-800 border border-gray-700 rounded-md focus:ring-cyber-neon focus:border-cyber-neon focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  name="city"
                  className="bg-gray-800 border border-gray-700 rounded-md focus:ring-cyber-neon focus:border-cyber-neon focus:outline-none"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  type="text"
                  value={formData.state}
                  onChange={handleChange}
                  name="state"
                  className="bg-gray-800 border border-gray-700 rounded-md focus:ring-cyber-neon focus:border-cyber-neon focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zip">Zip Code</Label>
                <Input
                  id="zip"
                  type="text"
                  value={formData.zip}
                  onChange={handleChange}
                  name="zip"
                  className="bg-gray-800 border border-gray-700 rounded-md focus:ring-cyber-neon focus:border-cyber-neon focus:outline-none"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  type="text"
                  value={formData.country}
                  onChange={handleChange}
                  name="country"
                  className="bg-gray-800 border border-gray-700 rounded-md focus:ring-cyber-neon focus:border-cyber-neon focus:outline-none"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="credit_limit">Credit Limit</Label>
              <Input
                id="credit_limit"
                type="number"
                value={formData.credit_limit}
                onChange={handleChange}
                name="credit_limit"
                className="bg-gray-800 border border-gray-700 rounded-md focus:ring-cyber-neon focus:border-cyber-neon focus:outline-none"
              />
            </div>
            <div>
              <Label htmlFor="credit_used">Credit Used</Label>
              <Input
                id="credit_used"
                type="number"
                value={formData.credit_used}
                onChange={handleChange}
                name="credit_used"
                className="bg-gray-800 border border-gray-700 rounded-md focus:ring-cyber-neon focus:border-cyber-neon focus:outline-none"
              />
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                {customer ? "Update Customer" : "Create Customer"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
