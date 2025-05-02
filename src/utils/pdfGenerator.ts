
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Shipment } from '@/components/shipping/ShipmentTableRow';
import { Customer } from '@/types/customer';

/**
 * Generate a PDF of shipment data
 */
export const generateShipmentsPDF = (shipments: Shipment[]) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text('Shipments Report', 14, 22);
  doc.setFontSize(11);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Format data for table
  const tableData = shipments.map(shipment => [
    shipment.tracking_id,
    shipment.customer_name || '-',
    `${shipment.origin} → ${shipment.destination}`,
    shipment.status,
    shipment.eta || '-'
  ]);
  
  // Generate table
  autoTable(doc, {
    head: [['Tracking ID', 'Customer', 'Route', 'Status', 'ETA']],
    body: tableData,
    startY: 35,
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [52, 73, 94],
    },
  });
  
  // Save PDF
  doc.save('shipments-report.pdf');
};

/**
 * Generate a PDF of customer data
 */
export const generateCustomersPDF = (customers: Customer[]) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text('Customers Report', 14, 22);
  doc.setFontSize(11);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Format data for table
  const tableData = customers.map(customer => [
    customer.name,
    customer.email || '-',
    customer.location || '-',
    `${customer.credit_used || 0} / ${customer.credit_limit || 0}`,
    customer.credit_status || '-',
    customer.active_shipments?.toString() || '0'
  ]);
  
  // Generate table
  autoTable(doc, {
    head: [['Name', 'Email', 'Location', 'Credit Used/Limit', 'Credit Status', 'Active Shipments']],
    body: tableData,
    startY: 35,
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [52, 73, 94],
    },
  });
  
  // Save PDF
  doc.save('customers-report.pdf');
};
