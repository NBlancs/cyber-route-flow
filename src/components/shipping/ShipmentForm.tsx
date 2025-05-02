
import { useState, useEffect } from 'react';
import { X } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Textarea
} from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from '@/types/customer';
import { Shipment } from '@/components/shipping/ShipmentTableRow';

const formSchema = z.object({
  customer_id: z.string().min(1, {
    message: "Please select a customer.",
  }),
  tracking_id: z.string().min(2, {
    message: "Tracking ID must be at least 2 characters.",
  }),
  origin: z.string().min(2, {
    message: "Origin is required",
  }),
  destination: z.string().min(2, {
    message: "Destination is required",
  }),
  weight: z.string().min(1, {
    message: "Weight is required",
  }),
  shipping_fee: z.string().min(1, {
    message: "Shipping fee is required",
  }),
  status: z.string().min(2, {
    message: "Status is required",
  }),
  notes: z.string().optional(),
});

interface ShipmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  shipment?: Shipment;
}

export function ShipmentForm({ isOpen, onClose, onSave, shipment }: ShipmentFormProps) {
  const [customerOptions, setCustomerOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const isEditing = Boolean(shipment);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: shipment?.customer_id || "",
      tracking_id: shipment?.tracking_id || "",
      origin: shipment?.origin || "",
      destination: shipment?.destination || "",
      weight: "",
      shipping_fee: "",
      status: shipment?.status || "pending",
      notes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (isEditing) {
        const { error } = await supabase
          .from("shipments")
          .update(values)
          .eq("id", shipment.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Shipment updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("shipments")
          .insert([values]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Shipment created successfully",
        });
      }
      
      onSave && onSave();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: isEditing ? "Could not update shipment" : "Could not create shipment",
        variant: "destructive",
      });
    }
  }

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, name, credit_limit, credit_used');
        
        if (error) throw error;
        
        if (data) {
          // Ensure we have all required Customer properties
          const formattedCustomers = data.map(customer => ({
            ...customer,
            credit_limit: customer.credit_limit || 0,
            credit_used: customer.credit_used || 0,
            location: '',
            credit_status: 'good' as const,
          }));
          setCustomers(formattedCustomers);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        setCustomerOptions([
          { id: '1', name: 'TechCorp Inc.' },
          { id: '2', name: 'Global Systems' },
          { id: '3', name: 'Quantum Industries' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomers();
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border border-gray-800 text-white">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{isEditing ? 'Edit Shipment' : 'Create Shipment'}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-800 border border-gray-700 text-white">
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border border-gray-700 text-white">
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tracking_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking ID</FormLabel>
                  <FormControl>
                    <Input
                      className="bg-gray-800 border border-gray-700 text-white"
                      placeholder="Enter tracking ID"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-gray-800 border border-gray-700 text-white"
                        placeholder="Enter origin"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-gray-800 border border-gray-700 text-white"
                        placeholder="Enter destination"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-gray-800 border border-gray-700 text-white"
                        placeholder="Enter weight"
                        type="number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shipping_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Fee</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-gray-800 border border-gray-700 text-white"
                        placeholder="Enter shipping fee"
                        type="number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-800 border border-gray-700 text-white">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border border-gray-700 text-white">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-transit">In Transit</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Shipment notes"
                      className="bg-gray-800 border border-gray-700 text-white resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{isEditing ? 'Update' : 'Create'} Shipment</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
