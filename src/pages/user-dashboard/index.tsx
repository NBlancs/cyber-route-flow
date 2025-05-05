
import { useState, useEffect } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, RefreshCcw } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Shipment } from "@/components/shipping/ShipmentTableRow";

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("delivery");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [trackingId, setTrackingId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [assignedShipments, setAssignedShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user's assigned shipments when the component mounts or active tab changes to "shipments"
    if (user && activeTab === "shipments") {
      fetchUserShipments();
    }
  }, [user, activeTab]);

  const fetchUserShipments = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      // First, find if the user's email matches any customer email
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (customerError && customerError.code !== 'PGRST116') {
        // PGRST116 is the error code for "no rows returned"
        throw customerError;
      }

      if (customerData?.id) {
        // If we found a customer with matching email, fetch their shipments
        const { data: shipments, error: shipmentsError } = await supabase
          .from('shipments')
          .select('*, customers(name)')
          .eq('customer_id', customerData.id)
          .order('created_at', { ascending: false });
        
        if (shipmentsError) throw shipmentsError;
        
        // Format the shipments
        const formattedShipments = shipments.map(shipment => ({
          id: shipment.id,
          tracking_id: shipment.tracking_id,
          customer_id: shipment.customer_id,
          origin: shipment.origin,
          destination: shipment.destination,
          status: (shipment.status || 'processing') as 'processing' | 'in-transit' | 'delivered' | 'failed',
          eta: shipment.eta ? new Date(shipment.eta).toLocaleString() : 'Pending',
          customer_name: shipment.customers?.name || 'Unknown Customer'
        }));
        
        setAssignedShipments(formattedShipments);
      } else {
        // No matching customer found
        setAssignedShipments([]);
      }
    } catch (error: any) {
      console.error('Error fetching user shipments:', error);
      toast({
        title: "Error",
        description: "Could not load your shipments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile || !trackingId) {
      toast({
        title: "Error",
        description: "Please select an image and enter a tracking ID",
        variant: "destructive"
      });
      return;
    }
    
    setUploading(true);
    
    try {
      // Upload the image to Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${trackingId}-${Date.now()}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('delivery-proofs')
        .upload(fileName, imageFile);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: publicURLData } = supabase.storage
        .from('delivery-proofs')
        .getPublicUrl(fileName);
        
      // Store the delivery proof in the database
      const { error: dbError } = await supabase
        .from('delivery_proofs')
        .insert({
          tracking_id: trackingId,
          image_url: publicURLData.publicUrl,
          user_id: user?.id
        });
        
      if (dbError) throw dbError;
      
      toast({
        title: "Success!",
        description: "Proof of delivery uploaded successfully",
      });
      
      // Clear form
      setTrackingId("");
      setImageFile(null);
      setPreviewUrl(null);
      
      // Reset the file input
      const fileInput = document.getElementById('proof-image') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Delivery Dashboard</h1>
        <p className="text-gray-400">Upload proof of delivery and manage your shipments</p>
      </div>
      
      <Tabs defaultValue="delivery" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto">
          <TabsTrigger value="delivery" className="text-base py-3">Proof of Delivery</TabsTrigger>
          <TabsTrigger value="shipments" className="text-base py-3">My Shipments</TabsTrigger>
          <TabsTrigger value="profile" className="text-base py-3">Profile</TabsTrigger>
        </TabsList>
        
        <TabsContent value="delivery" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Proof of Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="tracking-id" className="block text-sm font-medium mb-2">
                    Tracking ID
                  </label>
                  <Input 
                    id="tracking-id" 
                    value={trackingId} 
                    onChange={e => setTrackingId(e.target.value)}
                    placeholder="Enter shipment tracking ID" 
                    required 
                  />
                </div>
                
                <div>
                  <label htmlFor="proof-image" className="block text-sm font-medium mb-2">
                    Proof Image
                  </label>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="file"
                      id="proof-image"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                    <label htmlFor="proof-image" className="cursor-pointer text-center">
                      <Camera className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <span className="mt-2 block text-sm font-medium">
                        {imageFile ? imageFile.name : 'Take a photo or select an image'}
                      </span>
                    </label>
                  </div>
                </div>
                
                {previewUrl && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Preview:</p>
                    <div className="relative h-48 w-full overflow-hidden rounded-md">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full bg-cyber-neon text-black hover:bg-cyber-neon/80" 
                  disabled={uploading || !imageFile}
                >
                  {uploading ? 'Uploading...' : 'Submit Proof of Delivery'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="shipments" className="mt-6">
          <Card>
            <CardHeader className="flex justify-between items-center pb-2">
              <CardTitle>My Assigned Shipments</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchUserShipments} 
                disabled={loading}
                className="text-xs"
              >
                <RefreshCcw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} /> 
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-6 flex justify-center items-center">
                  <RefreshCcw className="animate-spin mr-2" size={18} />
                  <span>Loading shipments...</span>
                </div>
              ) : assignedShipments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tracking ID</TableHead>
                        <TableHead>Origin</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>ETA</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedShipments.map((shipment) => (
                        <TableRow key={shipment.id}>
                          <TableCell className="font-medium">{shipment.tracking_id}</TableCell>
                          <TableCell>{shipment.origin}</TableCell>
                          <TableCell>{shipment.destination}</TableCell>
                          <TableCell>
                            <span className={`
                              inline-flex px-2 py-1 text-xs rounded-full
                              ${shipment.status === 'delivered' ? 'bg-green-500/20 text-green-400' : 
                                shipment.status === 'in-transit' ? 'bg-blue-500/20 text-blue-400' : 
                                'bg-yellow-500/20 text-yellow-400'}
                            `}>
                              {shipment.status}
                            </span>
                          </TableCell>
                          <TableCell>{shipment.eta}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6">
                  No assigned shipments found for your account. 
                  {user?.email ? ` We couldn't find any customer account linked to ${user.email}.` : ''}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Role:</strong> User</p>
                <p><strong>Status:</strong> Active</p>
              </div>
              <div className="mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => supabase.auth.signOut()}
                  className="w-full"
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
