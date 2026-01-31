import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getVendorInvoices } from '../../slices/invoiceSlice';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FiFileText,
  FiDownload,
  FiSearch,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiEye,
  FiPrinter,
  FiMoreVertical,
} from 'react-icons/fi';

// Status Configuration
const statusConfig = {
  paid: {
    label: 'Paid',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: FiCheckCircle,
  },
  pending: {
    label: 'Pending',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: FiClock,
  },
  overdue: {
    label: 'Overdue',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: FiAlertCircle,
  },
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: FiFileText,
  },
  sent: {
    label: 'Sent',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: FiFileText,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-500 border-gray-200',
    icon: FiAlertCircle,
  },
};

// Skeleton Components
const InvoiceRowSkeleton = () => (
  <tr className="border-b border-gray-100">
    <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse w-24" /></td>
    <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse w-32" /></td>
    <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse w-24" /></td>
    <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse w-24" /></td>
    <td className="px-4 py-4"><div className="h-6 bg-gray-100 rounded animate-pulse w-16" /></td>
    <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse w-20" /></td>
    <td className="px-4 py-4"><div className="h-8 bg-gray-100 rounded animate-pulse w-20" /></td>
  </tr>
);

// Format currency in INR
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

// Tab definitions
const tabs = [
  { id: 'all', label: 'All Invoices' },
  { id: 'paid', label: 'Paid' },
  { id: 'pending', label: 'Pending' },
  { id: 'overdue', label: 'Overdue' },
];

// Action Dropdown Component
const ActionDropdown = ({ invoice, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
      >
        <FiMoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
            <button
              onClick={() => { onAction('view', invoice); setIsOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <FiEye className="w-4 h-4" />
              View Details
            </button>
            <button
              onClick={() => { onAction('download', invoice); setIsOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <FiDownload className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={() => { onAction('print', invoice); setIsOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <FiPrinter className="w-4 h-4" />
              Print
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Main Invoices Component
const VendorInvoices = () => {
  const dispatch = useDispatch();
  const { invoices: storeInvoices, isLoading } = useSelector((state) => state.invoices);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(getVendorInvoices());
  }, [dispatch]);

  // Use API data
  const apiInvoices = storeInvoices?.data || storeInvoices || [];
  const invoices = Array.isArray(apiInvoices) ? apiInvoices : [];

  // Filter invoices based on tab and search
  const filteredInvoices = invoices.filter((invoice) => {
    // Tab filter
    if (activeTab !== 'all' && invoice.status !== activeTab) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesInvoice = invoice.invoiceNumber?.toLowerCase().includes(query);
      const matchesCustomer = invoice.customer?.name?.toLowerCase().includes(query);
      const matchesEmail = invoice.customer?.email?.toLowerCase().includes(query);
      if (!matchesInvoice && !matchesCustomer && !matchesEmail) return false;
    }

    return true;
  });

  // Calculate stats
  const stats = {
    total: invoices.length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    pending: invoices.filter((i) => i.status === 'pending').length,
    overdue: invoices.filter((i) => i.status === 'overdue').length,
    totalRevenue: invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + (i.amounts?.total || 0), 0),
    pendingAmount: invoices
      .filter((i) => i.status === 'pending' || i.status === 'overdue')
      .reduce((sum, i) => sum + (i.amounts?.amountDue || 0), 0),
  };

  // Generate and download invoice as PDF
  const downloadInvoicePDF = (invoice) => {
    const doc = new jsPDF();
    
    // Colors - Dark theme inspired
    const primaryColor = [99, 102, 241]; // Indigo
    const accentColor = [236, 72, 153]; // Pink
    const darkBg = [30, 41, 59]; // Slate-800
    const lightText = [248, 250, 252]; // Slate-50
    const grayText = [148, 163, 184]; // Slate-400
    const successColor = [34, 197, 94]; // Green
    const warningColor = [234, 179, 8]; // Yellow
    
    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 0;
    
    // Header background
    doc.setFillColor(...darkBg);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    // Title
    doc.setTextColor(...lightText);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice', pageWidth / 2, 25, { align: 'center' });
    
    // Status badge
    const statusColors = {
      paid: successColor,
      pending: warningColor,
      overdue: [239, 68, 68],
      draft: grayText,
    };
    const statusColor = statusColors[invoice.status] || grayText;
    const statusText = (invoice.status || 'Draft').toUpperCase();
    doc.setFillColor(...statusColor);
    doc.roundedRect(pageWidth - 50, 35, 35, 10, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(statusText, pageWidth - 32.5, 42, { align: 'center' });
    
    // Invoice Number Box
    y = 60;
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 3, 3, 'F');
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 3, 3, 'S');
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.invoiceNumber || 'INV/2026/0001', pageWidth / 2, y + 13, { align: 'center' });
    
    // Two column layout for details
    y = 90;
    const col1X = margin;
    const col2X = pageWidth / 2 + 10;
    
    // Left Column - Customer Details
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(col1X, y, 85, 55, 3, 3, 'F');
    
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer', col1X + 5, y + 12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(invoice.customer?.name || 'Customer Name', col1X + 5, y + 22);
    
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Address', col1X + 5, y + 34);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(invoice.customer?.email || 'customer@email.com', col1X + 5, y + 44);
    
    // Right Column - Rental Period & Dates
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(col2X, y, 85, 55, 3, 3, 'F');
    
    // Rental Period
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Rental Period', col2X + 5, y + 12);
    
    const startDate = invoice.order?.rentalPeriod?.startDate ? formatDate(invoice.order.rentalPeriod.startDate) : formatDate(invoice.createdAt);
    const endDate = invoice.order?.rentalPeriod?.endDate ? formatDate(invoice.order.rentalPeriod.endDate) : 'N/A';
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`${startDate}  →  ${endDate}`, col2X + 5, y + 22);
    
    // Invoice Date
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Date', col2X + 5, y + 34);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(formatDate(invoice.createdAt), col2X + 5, y + 44);
    
    // Due Date
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.text('Due Date', col2X + 50, y + 34);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(formatDate(invoice.dueDate), col2X + 50, y + 44);
    
    // Invoice Lines Section
    y = 155;
    doc.setFillColor(...primaryColor);
    doc.roundedRect(margin, y, 60, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Lines', margin + 5, y + 6);
    
    // Items table
    y += 15;
    const tableData = (invoice.items || []).map(item => {
      const productName = item.description || item.name || 'Rental Item';
      const rentalInfo = `[${startDate} → ${endDate}]`;
      return [
        `${productName}\n${rentalInfo}`,
        (item.quantity || 1).toString(),
        'Units',
        `₹ ${(item.unitPrice || 0).toLocaleString('en-IN')}`,
        `${(invoice.amounts?.tax || 0) > 0 ? '18%' : '-'}`,
        `₹ ${(item.totalPrice || 0).toLocaleString('en-IN')}`
      ];
    });
    
    // Add downpayment/deposit row if exists
    if (invoice.amounts?.securityDeposit > 0) {
      tableData.push([
        'Security Deposit',
        '1',
        'Units',
        `₹ ${invoice.amounts.securityDeposit.toLocaleString('en-IN')}`,
        '-',
        `₹ ${invoice.amounts.securityDeposit.toLocaleString('en-IN')}`
      ]);
    }
    
    const tableResult = autoTable(doc, {
      startY: y,
      head: [['Product', 'Qty', 'Unit', 'Unit Price', 'Taxes', 'Amount']],
      body: tableData.length > 0 ? tableData : [['No items', '-', '-', '-', '-', '-']],
      theme: 'plain',
      headStyles: { 
        fillColor: [241, 245, 249], 
        textColor: [71, 85, 105], 
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 4
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 4,
        textColor: [30, 41, 59]
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 35, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });
    
    // Summary section
    y = (tableResult?.finalY || y + 50) + 10;
    
    // Summary box
    const summaryBoxX = pageWidth - margin - 80;
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(summaryBoxX, y, 80, 45, 3, 3, 'F');
    
    let summaryY = y + 12;
    
    // Untaxed Amount
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text('Untaxed Amount:', summaryBoxX + 5, summaryY);
    doc.setTextColor(30, 41, 59);
    doc.text(`₹ ${(invoice.amounts?.subtotal || 0).toLocaleString('en-IN')}`, summaryBoxX + 75, summaryY, { align: 'right' });
    
    // Tax
    summaryY += 10;
    doc.setTextColor(71, 85, 105);
    doc.text('Taxes:', summaryBoxX + 5, summaryY);
    doc.setTextColor(30, 41, 59);
    doc.text(`₹ ${(invoice.amounts?.tax || 0).toLocaleString('en-IN')}`, summaryBoxX + 75, summaryY, { align: 'right' });
    
    // Divider
    summaryY += 5;
    doc.setDrawColor(203, 213, 225);
    doc.line(summaryBoxX + 5, summaryY, summaryBoxX + 75, summaryY);
    
    // Total
    summaryY += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text('Total:', summaryBoxX + 5, summaryY);
    doc.text(`₹ ${(invoice.amounts?.total || 0).toLocaleString('en-IN')}`, summaryBoxX + 75, summaryY, { align: 'right' });
    
    // Payment Status Box (Left side)
    const paymentBoxY = y;
    doc.setFillColor(...(invoice.status === 'paid' ? [220, 252, 231] : [254, 249, 195]));
    doc.roundedRect(margin, paymentBoxY, 80, 25, 3, 3, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.text('Amount Paid:', margin + 5, paymentBoxY + 10);
    doc.setTextColor(...successColor);
    doc.text(`₹ ${(invoice.amounts?.amountPaid || 0).toLocaleString('en-IN')}`, margin + 75, paymentBoxY + 10, { align: 'right' });
    
    doc.setTextColor(71, 85, 105);
    doc.text('Amount Due:', margin + 5, paymentBoxY + 20);
    doc.setTextColor(239, 68, 68);
    doc.text(`₹ ${(invoice.amounts?.amountDue || 0).toLocaleString('en-IN')}`, margin + 75, paymentBoxY + 20, { align: 'right' });
    
    // Terms & Conditions
    y = Math.max(y + 55, paymentBoxY + 35);
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, pageWidth - margin, y);
    
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text('Terms & Conditions: Payment is due within the specified due date. Late payments may incur additional charges.', margin, y);
    
    // Footer
    y = 280;
    doc.setFillColor(...darkBg);
    doc.rect(0, y - 5, pageWidth, 25, 'F');
    
    doc.setTextColor(...grayText);
    doc.setFontSize(8);
    doc.text('Thank you for your business!', pageWidth / 2, y + 5, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, y + 12, { align: 'center' });
    
    // Save
    doc.save(`${invoice.invoiceNumber || 'invoice'}.pdf`);
    toast.success('Invoice PDF downloaded successfully!');
  };

  // Print invoice
  const printInvoice = (invoice) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #333; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .section { margin: 20px 0; }
          .section-title { font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; }
          .total-row { font-weight: bold; font-size: 1.1em; }
          .status { padding: 5px 10px; border-radius: 4px; display: inline-block; }
          .status-paid { background: #d4edda; color: #155724; }
          .status-pending { background: #fff3cd; color: #856404; }
          .footer { text-align: center; margin-top: 40px; color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <p>${invoice.invoiceNumber}</p>
        </div>
        
        <div class="info-row">
          <div><strong>Date:</strong> ${formatDate(invoice.createdAt)}</div>
          <div><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</div>
        </div>
        <div class="info-row">
          <div><strong>Status:</strong> <span class="status status-${invoice.status}">${invoice.status?.toUpperCase()}</span></div>
        </div>
        
        <div class="section">
          <div class="section-title">Customer</div>
          <p><strong>Name:</strong> ${invoice.customer?.name || 'N/A'}</p>
          <p><strong>Email:</strong> ${invoice.customer?.email || 'N/A'}</p>
        </div>
        
        <div class="section">
          <div class="section-title">Items</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${(invoice.items || []).map(item => `
                <tr>
                  <td>${item.description || 'Item'}</td>
                  <td>${item.quantity || 1}</td>
                  <td>₹${(item.unitPrice || 0).toFixed(2)}</td>
                  <td>₹${(item.totalPrice || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section" style="text-align: right;">
          <p>Subtotal: ₹${(invoice.amounts?.subtotal || 0).toFixed(2)}</p>
          <p>Tax: ₹${(invoice.amounts?.tax || 0).toFixed(2)}</p>
          <p>Security Deposit: ₹${(invoice.amounts?.securityDeposit || 0).toFixed(2)}</p>
          <p class="total-row">Total: ₹${(invoice.amounts?.total || 0).toFixed(2)}</p>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
        </div>
        
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleAction = (action, invoice) => {
    switch (action) {
      case 'view':
        console.log('View invoice:', invoice.invoiceNumber);
        break;
      case 'download':
        downloadInvoicePDF(invoice);
        break;
      case 'print':
        printInvoice(invoice);
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track all your invoices</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-500">Total Invoices</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-500">Total Revenue</div>
          <div className="text-2xl font-semibold text-emerald-600 mt-1">{formatCurrency(stats.totalRevenue)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-500">Paid</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">{stats.paid}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-500">Pending Amount</div>
          <div className="text-2xl font-semibold text-amber-600 mt-1">{formatCurrency(stats.pendingAmount)}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full md:w-64 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <InvoiceRowSkeleton key={i} />)
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <FiFileText className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">No invoices found</p>
                      <p className="text-gray-400 text-sm mt-1">
                        {searchQuery
                          ? 'Try a different search term'
                          : 'Invoices will appear here when orders are placed'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{invoice.customer?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{invoice.customer?.email || ''}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {formatDate(invoice.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(invoice.amounts?.total)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleAction('download', invoice)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        title="Download PDF"
                      >
                        <FiDownload className="w-4 h-4" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VendorInvoices;
