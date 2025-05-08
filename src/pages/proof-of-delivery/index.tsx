
import { useEffect, useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Search, Download, Eye, Trash2, Edit } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody,
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";

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

const proofFormSchema = z.object({
  notes: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected'])
});

export default function ProofOfDeliveryPage() {
  const [deliveryProofs, setDeliveryProofs] = useState<DeliveryProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingProof, setEditingProof] = useState<DeliveryProof | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  const form = useForm<z.infer<typeof proofFormSchema>>({
    resolver: zodResolver(proofFormSchema),
    defaultValues: {
      notes: '',
      status: 'pending'
    },
  });
  
  useEffect(() => {
    fetchDeliveryProofs();
  }, []);
  
  useEffect(() => {
    if (editingProof) {
      form.reset({
        notes: editingProof.notes || '',
        status: editingProof.status as any
      });
    }
  }, [editingProof, form]);
  
  const fetchDeliveryProofs = async () => {
    try {
      setLoading(true);
      
      // Fetch delivery proofs from the table structure
      const { data, error } = await supabase
        .from('delivery_proofs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Type assertion to ensure the data is of DeliveryProof type
      const proofs = data as unknown as DeliveryProof[];
      
      // Get user emails directly from auth.users through a server-side function
      // since we can't query auth.users directly from the client
      if (proofs && proofs.length > 0) {
        // Get unique user ids
        const userIds = [...new Set(proofs.map(proof => proof.user_id))];
        
        // For each user id, fetch the user email from auth
        for (const userId of userIds) {
          // Query the profiles table which has user emails
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
  
  // Helper function to sanitize image URLs
  const sanitizeImageUrl = (url: string) => {
    try {
      // If the URL is already properly formatted, return it
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      
      // If it's a filename or path, encode it properly
      const encodedUrl = encodeURI(url.replace(/\s/g, '%20').replace(/\t/g, '%09'));
      console.log('Sanitized URL:', encodedUrl);
      return encodedUrl;
    } catch (error) {
      console.error('Error sanitizing image URL:', error);
      return url; // Return original URL if sanitization fails
    }
  };
  
  const openImageViewer = (imageUrl: string) => {
    setSelectedImage(sanitizeImageUrl(imageUrl));
  };
  
  const openEditProof = (proof: DeliveryProof) => {
    setEditingProof(proof);
  };
  
  const closeEditProof = () => {
    setEditingProof(null);
    form.reset();
  };
  
  const confirmDelete = (id: string) => {
    setDeleteConfirmationId(id);
  };
  
  const closeDeleteConfirmation = () => {
    setDeleteConfirmationId(null);
  };
  
  const handleDeleteProof = async () => {
    if (!deleteConfirmationId) return;
    
    try {
      const { error } = await supabase
        .from('delivery_proofs')
        .delete()
        .eq('id', deleteConfirmationId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Delivery proof deleted successfully",
      });
      
      // Refresh the list
      fetchDeliveryProofs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete delivery proof: " + error.message,
        variant: "destructive"
      });
    } finally {
      closeDeleteConfirmation();
    }
  };
  
  const onSubmitEdit = async (values: z.infer<typeof proofFormSchema>) => {
    if (!editingProof) return;
    
    try {
      const { error } = await supabase
        .from('delivery_proofs')
        .update({
          notes: values.notes,
          status: values.status
        })
        .eq('id', editingProof.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Delivery proof updated successfully",
      });
      
      // Refresh the list
      closeEditProof();
      fetchDeliveryProofs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update delivery proof: " + error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusClassName = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
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
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')} 
              title={viewMode === 'grid' ? "Table View" : "Grid View"}
            >
              {viewMode === 'grid' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="3" x2="21" y1="15" y2="15"/><line x1="9" x2="9" y1="3" y2="21"/><line x1="15" x2="15" y1="3" y2="21"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
              )}
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
            ) : viewMode === 'grid' ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProofs.map((proof) => (
                  <div key={proof.id} className="border rounded-lg overflow-hidden bg-white/5">
                    <div className="aspect-video relative">
                      <img 
                        src={sanitizeImageUrl(proof.image_url)} 
                        alt={`Proof for ${proof.tracking_id}`} 
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          console.error(`Error loading image: ${proof.image_url}`);
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-3">
                        <div className="text-white font-medium">{proof.tracking_id}</div>
                        <span className={`text-xs mt-1 px-2 py-0.5 rounded ${getStatusClassName(proof.status)}`}>
                          {proof.status}
                        </span>
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
                      {proof.notes && (
                        <div className="flex flex-col mt-2">
                          <span className="text-sm text-gray-400">Notes:</span>
                          <span className="text-sm italic">{proof.notes}</span>
                        </div>
                      )}
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
                          onClick={() => window.open(sanitizeImageUrl(proof.image_url), '_blank')}
                        >
                          <Download size={16} className="mr-2" /> Download
                        </Button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => openEditProof(proof)}
                        >
                          <Edit size={16} className="mr-2" /> Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-red-500 hover:text-red-700"
                          onClick={() => confirmDelete(proof.id)}
                        >
                          <Trash2 size={16} className="mr-2" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking ID</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProofs.map((proof) => (
                    <TableRow key={proof.id}>
                      <TableCell>{proof.tracking_id}</TableCell>
                      <TableCell>{proof.user_email || 'Unknown'}</TableCell>
                      <TableCell>{formatDate(proof.created_at)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded ${getStatusClassName(proof.status)}`}>
                          {proof.status}
                        </span>
                      </TableCell>
                      <TableCell>{proof.notes || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openImageViewer(proof.image_url)}
                          >
                            <Eye size={16} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditProof(proof)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm" 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => confirmDelete(proof.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Image Viewer Dialog */}
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
                onError={(e) => {
                  console.error(`Error loading image in viewer: ${selectedImage}`);
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            </div>
          )}
          <div className="p-4 flex justify-end">
            <Button variant="outline" onClick={() => setSelectedImage(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog open={!!editingProof} onOpenChange={(open) => !open && closeEditProof()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Delivery Proof</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select 
                        className="w-full p-2 border rounded bg-background"
                        {...field}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </FormControl>
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
                      <Textarea placeholder="Add notes about this delivery proof..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={closeEditProof}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmationId} onOpenChange={(open) => !open && closeDeleteConfirmation()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this delivery proof? This action cannot be undone.</p>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={closeDeleteConfirmation}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDeleteProof}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
