
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shipment } from "@/components/shipping/ShipmentTableRow";
import { Customer } from "@/types/customer";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";

const shipmentSchema = z.object({
  tracking_id: z.string().min(3, { message: "Tracking ID is required" }),
  customer_id: z.string().min(1, { message: "Customer is required" }),
  origin: z.string().min(3, { message: "Origin is required" }),
  destination: z.string().min(3, { message: "Destination is required" }),
  status: z.enum(["processing", "in-transit", "delivered", "failed"]),
});

type ShipmentFormProps = {
  shipment?: Shipment;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
};

export function ShipmentForm({ shipment, isOpen, onClose, onSave }: ShipmentFormProps) {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const isEditing = !!shipment;

  const form = useForm<z.infer<typeof shipmentSchema>>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      tracking_id: shipment?.tracking_id || "",
      customer_id: shipment?.customer_id || "",
      origin: shipment?.origin || "",
      destination: shipment?.destination || "",
      status: (shipment?.status as any) || "processing",
    },
  });

  useEffect(() => {
    async function fetchCustomers() {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("Error fetching customers:", error);
        toast({
          title: "Error",
          description: "Failed to load customers list",
          variant: "destructive",
        });
      } else {
        setCustomers(data || []);
      }
    }

    fetchCustomers();
  }, [toast]);

  async function onSubmit(data: z.infer<typeof shipmentSchema>) {
    try {
      if (isEditing) {
        // Update existing shipment
        const { error } = await supabase
          .from("shipments")
          .update({
            tracking_id: data.tracking_id,
            customer_id: data.customer_id,
            origin: data.origin,
            destination: data.destination,
            status: data.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", shipment.id);

        if (error) throw error;

        toast({
          title: "Shipment Updated",
          description: `Shipment ${data.tracking_id} has been updated successfully.`,
        });
      } else {
        // Create new shipment
        const { error } = await supabase.from("shipments").insert({
          tracking_id: data.tracking_id,
          customer_id: data.customer_id,
          origin: data.origin,
          destination: data.destination,
          status: data.status,
          eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default ETA to 7 days from now
        });

        if (error) throw error;

        toast({
          title: "Shipment Added",
          description: `Shipment ${data.tracking_id} has been added successfully.`,
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving shipment:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "add"} shipment. Please try again.`,
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Shipment" : "Create New Shipment"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tracking_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking ID*</FormLabel>
                  <FormControl>
                    <Input placeholder="LAL-XXXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer*</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin*</FormLabel>
                    <FormControl>
                      <Input placeholder="Origin location" {...field} />
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
                    <FormLabel>Destination*</FormLabel>
                    <FormControl>
                      <Input placeholder="Destination location" {...field} />
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
                  <FormLabel>Status*</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="in-transit">In Transit</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? "Update Shipment" : "Create Shipment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
