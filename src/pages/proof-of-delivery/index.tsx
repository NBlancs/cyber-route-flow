import { useEffect, useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Search, Download, Eye, Trash2, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingProof, setDeletingProof] = useState<DeliveryProof | null>(null);
  const [detailsProof, setDetailsProof] = useState<DeliveryProof | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDeliveryProofs();
  }, []);

  const fetchDeliveryProofs = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('delivery_proofs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const proofs = data as unknown as DeliveryProof[];

      if (proofs && proofs.length > 0) {
        const userIds = [...new Set(proofs.map(proof => proof.user_id))];

        for (const userId of userIds) {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('id', userId)
            .single();

          if (!userError && userData) {
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

  const handleDeleteClick = (proof: DeliveryProof) => {
    setDeletingProof(proof);
    setDeleteConfirmOpen(true);
  };

  const handleViewDetails = (proof: DeliveryProof) => {
    setDetailsProof(proof);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProof) return;

    try {
      setDeleting(true);

      const { error } = await supabase
        .from('delivery_proofs')
        .delete()
        .eq('id', deletingProof.id);

      if (error) throw error;

      setDeliveryProofs(prev => prev.filter(p => p.id !== deletingProof.id));

      toast({
        title: "Proof deleted",
        description: `Proof for tracking ID ${deletingProof.tracking_id} has been deleted.`,
      });

      setDeleteConfirmOpen(false);
      setDeletingProof(null);
    } catch (error: any) {
      toast({
        title: "Error deleting proof",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
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
                        <span className="font-medium">{proof.user_id || 'Unknown User'}</span>
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
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleViewDetails(proof)}
                        >
                          <Info size={16} className="mr-2" /> Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50/5"
                          onClick={() => handleDeleteClick(proof)}
                        >
                          <Trash2 size={16} className="mr-2" /> Delete
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

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500">Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the proof of delivery for tracking ID:
              <span className="font-semibold"> {deletingProof?.tracking_id}</span>?
              <Alert className="mt-4 border-red-200 bg-red-50/10 text-red-400">
                <AlertDescription>
                  This action cannot be undone. This will permanently delete the proof of delivery record.
                </AlertDescription>
              </Alert>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailsProof} onOpenChange={(open) => !open && setDetailsProof(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Proof of Delivery Details</DialogTitle>
          </DialogHeader>
          {detailsProof && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 gap-4 items-center">
                <span className="font-medium text-gray-400">Tracking ID:</span>
                <span className="col-span-3 font-semibold">{detailsProof.tracking_id}</span>

                <span className="font-medium text-gray-400">Uploaded By:</span>
                <span className="col-span-3">{detailsProof.user_email || 'Unknown User'}</span>

                <span className="font-medium text-gray-400">Date:</span>
                <span className="col-span-3">{formatDate(detailsProof.created_at)}</span>

                <span className="font-medium text-gray-400">Status:</span>
                <span className="col-span-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    detailsProof.status === 'verified'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {detailsProof.status ? detailsProof.status.charAt(0).toUpperCase() + detailsProof.status.slice(1) : 'Pending'}
                  </span>
                </span>

                {detailsProof.notes && (
                  <>
                    <span className="font-medium text-gray-400">Notes:</span>
                    <span className="col-span-3">{detailsProof.notes}</span>
                  </>
                )}
              </div>

              <div className="mt-2">
                <span className="font-medium text-gray-400">Image:</span>
                <div className="mt-2 overflow-hidden rounded-md border">
                  <img
                    src={detailsProof.image_url}
                    alt={`Proof for ${detailsProof.tracking_id}`}
                    className="w-full object-contain max-h-[300px]"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailsProof(null)}
            >
              Close
            </Button>
            <Button
              variant="default"
              onClick={() => window.open(detailsProof?.image_url, '_blank')}
            >
              <Download size={16} className="mr-2" /> Download Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}