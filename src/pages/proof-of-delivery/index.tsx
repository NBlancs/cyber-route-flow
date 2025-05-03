
import { useEffect, useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Search, Download, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DeliveryProof {
  id: string;
  tracking_id: string;
  image_url: string;
  created_at: string;
  user_id: string;
  user_email?: string;
  notes?: string;
  status: string;
}

export default function ProofOfDeliveryPage() {
  const [deliveryProofs, setDeliveryProofs] = useState<DeliveryProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  useEffect(() => {
    fetchDeliveryProofs();
  }, []);
  
  const fetchDeliveryProofs = async () => {
    try {
      setLoading(true);
      
      // Fetch delivery proofs from the new table structure
      const { data, error } = await supabase
        .from('delivery_proofs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Type assertion to ensure the data is of DeliveryProof type
      const proofs = data as unknown as DeliveryProof[];
      
      // Get user emails for the delivery proofs
      if (proofs && proofs.length > 0) {
        // Get unique user ids
        const userIds = [...new Set(proofs.map(proof => proof.user_id))];
        
        // Fetch user profiles
        for (const userId of userIds) {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('id', userId)
            .single();
          
          if (!userError && userData) {
            // Update proofs with user email
            proofs.forEach(proof => {
              if (proof.user_id === userData.id) {
                proof.user_email = userData.email;
              }
            });
          }
        }
        
        setDeliveryProofs(proofs);
      } else {
        setDeliveryProofs([]);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching delivery proofs",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const filteredProofs = deliveryProofs.filter(proof => 
    proof.tracking_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (proof.user_email && proof.user_email.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const openImageViewer = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Proof of Delivery</h1>
        <p className="text-gray-400">View and manage delivery proof uploads</p>
      </div>
      
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Delivery Proof Records</CardTitle>
          <div className="w-full sm:w-auto flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by tracking ID..."
                className="pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={fetchDeliveryProofs} 
              title="Refresh"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                </div>
                <span className="ml-2">Loading...</span>
              </div>
            ) : filteredProofs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No matching delivery proofs found.' : 'No delivery proofs have been uploaded yet.'}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProofs.map((proof) => (
                  <div key={proof.id} className="border rounded-lg overflow-hidden bg-white/5">
                    <div className="aspect-video relative">
                      <img 
                        src={proof.image_url} 
                        alt={`Proof for ${proof.tracking_id}`} 
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-3">
                        <div className="text-white font-medium">{proof.tracking_id}</div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-400">Uploaded by:</span>
                        <span className="font-medium">{proof.user_email || 'Unknown User'}</span>
                      </div>
                      <div className="flex flex-col mt-2">
                        <span className="text-sm text-gray-400">Date:</span>
                        <span>{formatDate(proof.created_at)}</span>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => openImageViewer(proof.image_url)}
                        >
                          <Eye size={16} className="mr-2" /> View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => window.open(proof.image_url, '_blank')}
                        >
                          <Download size={16} className="mr-2" /> Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-3xl w-full p-0">
          <DialogHeader className="p-4">
            <DialogTitle>Proof of Delivery Image</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center items-center">
              <img 
                src={selectedImage} 
                alt="Proof of Delivery" 
                className="max-h-[70vh] object-contain"
              />
            </div>
          )}
          <div className="p-4 flex justify-end">
            <Button variant="outline" onClick={() => setSelectedImage(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
