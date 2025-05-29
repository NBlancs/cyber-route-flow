import React, { useState, useMemo } from "react";
import { Package, RefreshCcw, Pencil, Trash, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShipmentTableRow, Shipment } from "./shipping/ShipmentTableRow";
import { EmptyShipmentState } from "./shipping/EmptyShipmentState";
import { useShipmentData } from "@/hooks/useShipmentData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

type ShipmentTrackerProps = {
  onEdit?: (shipment: Shipment) => void;
  onDelete?: (shipment: Shipment) => void;
};

export default function ShipmentTracker({ onEdit, onDelete }: ShipmentTrackerProps) {
  const { 
    shipments, 
    loading, 
    trackingLoading, 
    fetchShipments, 
    handleTrackShipment 
  } = useShipmentData();
  const isMobile = useIsMobile();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Pagination calculations
  const paginationData = useMemo(() => {
    const totalItems = shipments.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedShipments = shipments.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      paginatedShipments,
      startIndex,
      endIndex: Math.min(endIndex, totalItems)
    };
  }, [shipments, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < paginationData.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to first page when shipments change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [shipments.length]);

  return (
    <div className="cyber-card p-3 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package size={18} className="text-cyber-neon" />
          <span>Active Shipments</span>
        </h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchShipments} 
            disabled={loading}
            className="text-xs"
          >
            <RefreshCcw size={14} className="mr-1" /> Refresh
          </Button>
          <button className="text-xs text-cyber-neon hover:underline">View All</button>
        </div>
      </div>
      
      {loading ? (
        <div className="py-8 flex justify-center items-center">
          <div className="animate-spin">
            <RefreshCcw size={24} />
          </div>
          <span className="ml-2">Loading shipments...</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            {isMobile ? (
              // Mobile view - card layout
              <div className="grid grid-cols-1 gap-3">
                {paginationData.paginatedShipments.map((shipment) => (
                  <div 
                    key={shipment.id} 
                    className="border border-gray-800 rounded-lg p-3 bg-cyber-dark/30"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Tracking ID</span>
                        <span className="font-medium text-cyber-neon">{shipment.tracking_id}</span>
                      </div>
                      {(onEdit || onDelete) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="24" 
                                height="24" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(shipment)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <DropdownMenuItem 
                                onClick={() => onDelete(shipment)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <span className="text-xs text-gray-400">Customer</span>
                        <p className="text-sm">{shipment.customer_name}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400">Status</span>
                        <div className="mt-1">
                          <span className={`
                            inline-flex px-2 py-1 text-xs rounded-full
                            ${shipment.status === 'delivered' ? 'bg-green-500/20 text-green-400' : 
                              shipment.status === 'in-transit' ? 'bg-blue-500/20 text-blue-400' : 
                              'bg-yellow-500/20 text-yellow-400'}
                          `}>
                            {shipment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <span className="text-xs text-gray-400">Origin</span>
                        <p className="text-sm truncate">{shipment.origin}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400">Destination</span>
                        <p className="text-sm truncate">{shipment.destination}</p>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-400">ETA</span>
                      <p className="text-sm">{shipment.eta || 'Calculating...'}</p>
                    </div>
                  </div>
                ))}
                {paginationData.paginatedShipments.length === 0 && <EmptyShipmentState />}
              </div>
            ) : (
              // Desktop view - table layout
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-800">
                    <th className="pb-2 text-left font-medium">Tracking ID</th>
                    <th className="pb-2 text-left font-medium">Customer</th>
                    <th className="pb-2 text-left font-medium">Route</th>
                    <th className="pb-2 text-left font-medium">Status</th>
                    <th className="pb-2 text-left font-medium">ETA</th>
                    <th className="pb-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginationData.paginatedShipments.map((shipment) => (
                    <ShipmentTableRow
                      key={shipment.id}
                      shipment={shipment}
                      onTrack={handleTrackShipment}
                      isTracking={trackingLoading}
                      actions={(onEdit || onDelete) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="24" 
                                height="24" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(shipment)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <DropdownMenuItem 
                                onClick={() => onDelete(shipment)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    />
                  ))}
                  {paginationData.paginatedShipments.length === 0 && <EmptyShipmentState />}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {paginationData.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {paginationData.startIndex + 1}-{paginationData.endIndex} of {paginationData.totalItems} shipments
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft size={14} />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: paginationData.totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page and adjacent pages
                      return page === 1 || 
                             page === paginationData.totalPages || 
                             Math.abs(page - currentPage) <= 1;
                    })
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentPage === paginationData.totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
