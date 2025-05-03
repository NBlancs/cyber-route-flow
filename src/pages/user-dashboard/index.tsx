
import { useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("delivery");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [trackingId, setTrackingId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();

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
            <CardHeader>
              <CardTitle>My Assigned Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-6">
                You have no assigned shipments at the moment.
              </p>
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
