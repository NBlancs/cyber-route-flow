import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { usePaymentGateway } from '@/hooks/usePaymentGateway';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export function PaymentTransactionsTable() {
  const { getPaymentTransactions, loading } = usePaymentGateway();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [transactionCache, setTransactionCache] = useState<Record<number, any[]>>({});

  useEffect(() => {
    fetchTransactions();
  }, [currentPage]);

  const fetchTransactions = async () => {
    setError(null);
    
    // Check if we already have this page cached
    if (transactionCache[currentPage] && transactionCache[currentPage].length > 0) {
      console.log(`Using cached data for page ${currentPage}`);
      setTransactions(transactionCache[currentPage]);
      return;
    }
    
    try {
      console.log(`Fetching transactions for page ${currentPage}`);
      
      // For PayMongo API, we'll still use cursor-based pagination internally
      // but present it as page numbers to the user
      let params: any = { 
        limit: pageSize
      };
      
      // Use the cached transactions to determine cursors if available
      if (currentPage > 1 && transactionCache[currentPage-1]) {
        // If we're going to a page after page 1, use the last ID from the previous page
        const prevPageData = transactionCache[currentPage-1];
        if (prevPageData.length > 0) {
          const lastIdFromPrevPage = prevPageData[prevPageData.length - 1].id;
          params.starting_after = lastIdFromPrevPage;
          console.log(`Using starting_after=${lastIdFromPrevPage} for page ${currentPage}`);
        }
      }
      
      const result = await getPaymentTransactions(params);
      
      if (result && result.data && Array.isArray(result.data)) {
        if (result.data.length > 0) {
          console.log(`Received ${result.data.length} transactions for page ${currentPage}`);
          
          // Update the transactions state and cache
          setTransactions(result.data);
          setTransactionCache(prevCache => ({
            ...prevCache,
            [currentPage]: result.data
          }));
          
          // If this is the first page, try to estimate total count based on has_more
          if (currentPage === 1) {
            const estimatedTotalCount = result.has_more 
              ? Math.max(result.data.length * 3, 30) // Rough estimate if there are more pages
              : result.data.length;
            setTotalCount(estimatedTotalCount);
          }
        } else {
          console.log("No transactions found for this page");
          setTransactions([]);
          
          // If we get no results and we're not on page 1, go back to page 1
          if (currentPage !== 1) {
            setCurrentPage(1);
          }
        }
      } else {
        console.log("Invalid or empty response received");
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      // Only set error if it's a true error, not just an empty result
      if (error instanceof Error && error.message.includes("Edge function")) {
        // Don't show Edge function errors to users
        console.error("Edge function error:", error.message);
      } else {
        setError("Failed to retrieve transactions. Please try again later.");
        toast({
          title: "Error",
          description: "There was a problem retrieving payment data",
          variant: "destructive"
        });
      }
    }
  };

  // Calculate how many pages we should display
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // If we have fewer pages than the max to show, display all of them
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include page 1
      pages.push(1);
      
      // Calculate the middle pages to show
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're at the beginning or end
      if (currentPage <= 2) {
        endPage = Math.min(totalPages - 1, 4);
      } else if (currentPage >= totalPages - 1) {
        startPage = Math.max(2, totalPages - 3);
      }
      
      // Add ellipsis after page 1 if needed
      if (startPage > 2) {
        pages.push('ellipsis');
      }
      
      // Add the middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before the last page if needed
      if (endPage < totalPages - 1) {
        pages.push('ellipsis');
      }
      
      // Always include the last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  const refreshData = () => {
    // Clear cache and fetch first page
    setTransactionCache({});
    setCurrentPage(1);
    fetchTransactions();
  };

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return 'N/A';
    try {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(timestamp * 1000));
    } catch (e) {
      console.error("Error formatting date:", e);
      return 'Invalid date';
    }
  };

  const formatAmount = (amount: number) => {
    if (!amount && amount !== 0) return 'N/A';
    try {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
      }).format(amount / 100); // Convert from cents
    } catch (e) {
      console.error("Error formatting amount:", e);
      return `₱${amount/100}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500 hover:bg-green-600';
      case 'pending':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'failed':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h3 className="text-lg font-medium">PayMongo Transactions</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshData}
          disabled={loading}
        >
          <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Table>
        <TableCaption>
          {loading ? 'Loading transactions...' : 
           transactions.length === 0 ? 'No payment transactions found' : 
           `Page ${currentPage} of payment transactions`}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Customer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-mono text-xs">
                {transaction.id?.substring(0, 8) || 'N/A'}...
              </TableCell>
              <TableCell>
                {formatDate(transaction.attributes?.created_at)}
              </TableCell>
              <TableCell>
                {transaction.attributes?.description || 'N/A'}
              </TableCell>
              <TableCell>
                {formatAmount(transaction.attributes?.amount)}
              </TableCell>
              <TableCell>
                <Badge 
                  className={getStatusColor(transaction.attributes?.status || 'unknown')}
                >
                  {transaction.attributes?.status || 'unknown'}
                </Badge>
              </TableCell>
              <TableCell>
                {transaction.attributes?.billing?.name || 
                 transaction.attributes?.billing?.email || 
                 transaction.attributes?.metadata?.customer_id || 
                 'Unknown'}
              </TableCell>
            </TableRow>
          ))}
          {(transactions.length === 0 && !loading) && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                {error ? 'Error loading transactions' : 'No transactions found'}
              </TableCell>
            </TableRow>
          )}
          {loading && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                <div className="flex justify-center items-center">
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  Loading transactions...
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Classic numbered pagination */}
      <div className="flex justify-center items-center p-4 border-t border-gray-700">
        <nav className="flex items-center space-x-1">
          {/* First page button */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1 || loading}
          >
            <ChevronsLeftIcon className="h-4 w-4" />
          </Button>
          
          {/* Previous page button */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          
          {/* Page numbers */}
          {getPageNumbers().map((page, index) => (
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-2">...</span>
            ) : (
              <Button
                key={`page-${page}`}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(page as number)}
                disabled={loading}
              >
                {page}
              </Button>
            )
          ))}
          
          {/* Next page button */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          
          {/* Last page button */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || loading}
          >
            <ChevronsRightIcon className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </Card>
  );
}