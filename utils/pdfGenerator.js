const PDFDocument = require('pdfkit');

// Generate PDF for bill
const generateBillPDF = (bill, tenant) => {
  const doc = new PDFDocument();
  
  // Title
  doc.fontSize(20).text('RENTAL BILL', { align: 'center' });
  doc.moveDown();
  
  // Apartment details
  doc.fontSize(14).text(`Apartment: ${bill.apartmentName}`);
  doc.text(`Bill Period: ${bill.month} ${bill.year}`);
  doc.text(`Due Date: ${new Date(bill.dueDate).toLocaleDateString()}`);
  doc.moveDown();
  
  // Tenant details
  doc.text(`Tenant Name: ${tenant.name}`);
  doc.text(`National ID: ${tenant.nationalID}`);
  doc.text(`Email: ${tenant.email}`);
  doc.moveDown();
  
  // Bill details
  doc.text(`Total Amount: KES ${bill.amount.toLocaleString()}`);
  doc.text(`Paid Amount: KES ${bill.paidAmount.toLocaleString()}`);
  doc.text(`Remaining Balance: KES ${bill.remainingAmount.toLocaleString()}`);
  doc.text(`Status: ${bill.status}`);
  doc.moveDown();
  
  // Payment history
  if (bill.paymentHistory && bill.paymentHistory.length > 0) {
    doc.text('Payment History:');
    bill.paymentHistory.forEach((payment, index) => {
      doc.text(`${index + 1}. ${new Date(payment.date).toLocaleDateString()} - KES ${payment.amount.toLocaleString()} (${payment.method})`);
    });
  }
  
  // Footer
  doc.moveDown();
  doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });
  
  return doc;
};

// Generate PDF for payment receipt
const generatePaymentReceiptPDF = (payment, bill, tenant) => {
  const doc = new PDFDocument();
  
  // Title
  doc.fontSize(20).text('PAYMENT RECEIPT', { align: 'center' });
  doc.moveDown();
  
  // Receipt details
  doc.fontSize(14).text(`Receipt Date: ${new Date().toLocaleDateString()}`);
  doc.text(`Apartment: ${bill.apartmentName}`);
  doc.text(`Bill Period: ${bill.month} ${bill.year}`);
  doc.moveDown();
  
  // Tenant details
  doc.text(`Tenant Name: ${tenant.name}`);
  doc.text(`National ID: ${tenant.nationalID}`);
  doc.moveDown();
  
  // Payment details
  doc.text(`Payment Amount: KES ${payment.amount.toLocaleString()}`);
  doc.text(`Payment Method: ${payment.method}`);
  doc.text(`Payment Date: ${new Date(payment.date).toLocaleDateString()}`);
  doc.moveDown();
  
  // Bill status
  doc.text(`Previous Balance: KES ${(bill.paidAmount - payment.amount + bill.remainingAmount).toLocaleString()}`);
  doc.text(`Current Balance: KES ${bill.remainingAmount.toLocaleString()}`);
  doc.text(`Bill Status: ${bill.status}`);
  
  // Footer
  doc.moveDown();
  doc.fontSize(10).text('Thank you for your payment!', { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });
  
  return doc;
};

module.exports = {
  generateBillPDF,
  generatePaymentReceiptPDF
};
