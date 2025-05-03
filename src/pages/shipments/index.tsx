
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ShipmentTracker from "@/components/ShipmentTracker";
import { Button } from "@/components/ui/button";
import { Plus, Trash, FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useShipmentData } from "@/hooks/useShipmentData";
import { ShipmentForm } from "@/components/shipping/ShipmentForm";
import { Shipment } from "@/components/shipping/ShipmentTableRow";
import { generateShipmentsPDF } from "@/utils/pdfGenerator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ShipmentsPage() {
  const { shipments, loading, fetchShipments } = useShipmentData();
  const [isAddShipmentOpen, setIsAddShipmentOpen] = useState(false);
  const [isEditShipmentOpen, setIsEditShipmentOpen] = useState(false);
  const [shipmentToEdit, setShipmentToEdit] = useState<Shipment | null>(null);
  const [shipmentToDelete, setShipmentToDelete] = useState<Shipment | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Count shipments by status
  const inTransitCount = shipments.filter(s => s.status === 'in-transit').length;
  const processingCount = shipments.filter(s => s.status === 'processing').length;
  const deliveredCount = shipments.filter(s => s.status === 'delivered').length;
  
  const handleEditShipment = (shipment: Shipment) => {
    setShipmentToEdit(shipment);
    setIsEditShipmentOpen(true);
  };

  const handleDeleteShipment = async () => {
    if (!shipmentToDelete) return;

    try {
      const { error } = await supabase
        .from('shipments')
        .delete()
        .eq('id', shipmentToDelete.id);

      if (error) throw error;

      toast({
        title: "Shipment Deleted",
        description: `Shipment ${shipmentToDelete.tracking_id} has been deleted successfully.`,
      });
      
      fetchShipments(); // Refresh the shipment list
      setShipmentToDelete(null);
    } catch (error) {
      console.error("Error deleting shipment:", error);
      toast({
        title: "Error",
        description: "Failed to delete shipment.",
        variant: "destructive",
      });
    }
  };
  
  const handleDownloadPdf = () => {
    try {
      setIsPdfGenerating(true);
      generateShipmentsPDF(shipments);
      toast({
        title: "PDF Generated",
        description: "Shipments report has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report.",
        variant: "destructive",
      });
    } finally {
      setIsPdfGenerating(false);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className={`flex ${isMobile ? 'flex-col gap-4' : 'justify-between items-center'}`}>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Shipments</h1>
            <p className="text-sm text-gray-400">Track and manage all your active shipments</p>
          </div>
          <div className={`flex ${isMobile ? 'flex-col w-full' : 'gap-2'}`}>
            <Button 
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={isPdfGenerating || loading || shipments.length === 0}
              className={isMobile ? "mb-2 w-full" : ""}
            >
              <FileDown size={16} className="mr-1" /> Download PDF
            </Button>
            <Button 
              onClick={() => setIsAddShipmentOpen(true)}
              className={isMobile ? "w-full" : ""}
            >
              <Plus size={16} className="mr-1" /> Create Shipment
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inTransitCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{deliveredCount}</div>
          </CardContent>
        </Card>
      </div>
      
      <ShipmentTracker 
        onEdit={handleEditShipment} 
        onDelete={(shipment) => setShipmentToDelete(shipment)}
      />

      {/* Add Shipment Modal */}
      <ShipmentForm 
        isOpen={isAddShipmentOpen} 
        onClose={() => setIsAddShipmentOpen(false)}
        onSave={fetchShipments}
      />

      {/* Edit Shipment Modal */}
      {shipmentToEdit && (
        <ShipmentForm 
          shipment={shipmentToEdit}
          isOpen={isEditShipmentOpen} 
          onClose={() => {
            setIsEditShipmentOpen(false);
            setShipmentToEdit(null);
          }}
          onSave={fetchShipments}
        />
      )}

      {/* Delete Shipment Confirmation */}
      <AlertDialog open={!!shipmentToDelete} onOpenChange={(open) => !open && setShipmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete shipment 
              "{shipmentToDelete?.tracking_id}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteShipment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
