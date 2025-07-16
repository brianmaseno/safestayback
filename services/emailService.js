const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email notification
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

// Email templates
const emailTemplates = {
  // Bill payment reminder
  billReminder: (tenantName, amount, dueDate, apartmentName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Rent Payment Reminder</h2>
      <p>Dear ${tenantName},</p>
      <p>This is a friendly reminder that your rent payment is due.</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Amount Due:</strong> KSH ${amount?.toLocaleString()}</p>
        <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
        <p><strong>Apartment:</strong> ${apartmentName}</p>
      </div>
      <p>Please make your payment before the due date to avoid any late fees.</p>
      <p>If you have any questions, please contact your landlord.</p>
      <p>Best regards,<br>Safe Stay Management</p>
    </div>
  `,

  // Payment confirmation
  paymentConfirmation: (tenantName, amount, paymentDate, apartmentName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Payment Confirmation</h2>
      <p>Dear ${tenantName},</p>
      <p>Your payment has been successfully received and processed.</p>
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Amount Paid:</strong> KSH ${amount?.toLocaleString()}</p>
        <p><strong>Payment Date:</strong> ${new Date(paymentDate).toLocaleDateString()}</p>
        <p><strong>Apartment:</strong> ${apartmentName}</p>
      </div>
      <p>Thank you for your timely payment!</p>
      <p>Best regards,<br>Safe Stay Management</p>
    </div>
  `,

  // Complaint status update
  complaintUpdate: (tenantName, complaintTitle, status, landlordNote, apartmentName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f59e0b;">Complaint Update</h2>
      <p>Dear ${tenantName},</p>
      <p>There has been an update to your complaint.</p>
      <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Complaint:</strong> ${complaintTitle}</p>
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Apartment:</strong> ${apartmentName}</p>
        ${landlordNote ? `<p><strong>Landlord Note:</strong> ${landlordNote}</p>` : ''}
      </div>
      <p>You can view more details by logging into your Safe Stay account.</p>
      <p>Best regards,<br>Safe Stay Management</p>
    </div>
  `,

  // New rule notification
  newRule: (tenantName, ruleTitle, ruleDescription, apartmentName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #7c3aed;">New Rule Posted</h2>
      <p>Dear ${tenantName},</p>
      <p>Your landlord has posted a new rule for your apartment.</p>
      <div style="background-color: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Rule Title:</strong> ${ruleTitle}</p>
        <p><strong>Description:</strong> ${ruleDescription}</p>
        <p><strong>Apartment:</strong> ${apartmentName}</p>
      </div>
      <p>Please review this rule carefully as it is part of your lease agreement.</p>
      <p>Best regards,<br>Safe Stay Management</p>
    </div>
  `,

  // Monthly bill generated
  monthlyBillGenerated: (tenantName, amount, month, year, dueDate, apartmentName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Monthly Bill Generated</h2>
      <p>Dear ${tenantName},</p>
      <p>Your monthly rent bill has been generated.</p>
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Amount:</strong> KSH ${amount?.toLocaleString()}</p>
        <p><strong>Period:</strong> ${month} ${year}</p>
        <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
        <p><strong>Apartment:</strong> ${apartmentName}</p>
      </div>
      <p>Please make your payment before the due date.</p>
      <p>You can view and pay your bill by logging into your Safe Stay account.</p>
      <p>Best regards,<br>Safe Stay Management</p>
    </div>
  `
};

// Notification functions
const sendBillReminder = async (tenant, bill) => {
  const subject = `Rent Payment Reminder - ${bill.apartmentName}`;
  const html = emailTemplates.billReminder(
    tenant.name,
    bill.amount,
    bill.dueDate,
    bill.apartmentName
  );
  
  await sendEmail(tenant.email, subject, html);
};

const sendPaymentConfirmation = async (tenant, bill) => {
  const subject = `Payment Confirmation - ${bill.apartmentName}`;
  const html = emailTemplates.paymentConfirmation(
    tenant.name,
    bill.amount,
    bill.paymentDate,
    bill.apartmentName
  );
  
  await sendEmail(tenant.email, subject, html);
};

const sendComplaintUpdate = async (tenant, complaint) => {
  const subject = `Complaint Update - ${complaint.apartmentName}`;
  const html = emailTemplates.complaintUpdate(
    tenant.name,
    complaint.title,
    complaint.status,
    complaint.landlordNotes?.[complaint.landlordNotes.length - 1]?.note,
    complaint.apartmentName
  );
  
  await sendEmail(tenant.email, subject, html);
};

const sendComplaintNotification = async (recipient, sender, complaint) => {
  let subject, html;
  
  if (recipient.role === 'Landlord') {
    // New complaint notification to landlord
    subject = `New Complaint - ${complaint.apartmentName}`;
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">New Complaint Submitted</h2>
        <p>Dear ${recipient.name},</p>
        <p>A new complaint has been submitted by your tenant.</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Tenant:</strong> ${sender.name}</p>
          <p><strong>Apartment:</strong> ${complaint.apartmentName}</p>
          <p><strong>Message:</strong> ${complaint.message}</p>
          <p><strong>Status:</strong> ${complaint.status}</p>
          <p><strong>Date:</strong> ${new Date(complaint.dateCreated).toLocaleDateString()}</p>
        </div>
        <p>Please review and respond to this complaint in your Safe Stay dashboard.</p>
        <p>Best regards,<br>Safe Stay Management</p>
      </div>
    `;
  } else {
    // Status update notification to tenant
    subject = `Complaint Update - ${complaint.apartmentName}`;
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Complaint Status Update</h2>
        <p>Dear ${recipient.name},</p>
        <p>Your complaint has been updated by your landlord.</p>
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Complaint:</strong> ${complaint.message}</p>
          <p><strong>Status:</strong> ${complaint.status}</p>
          <p><strong>Apartment:</strong> ${complaint.apartmentName}</p>
          ${complaint.landlordNotes ? `<p><strong>Landlord Notes:</strong> ${complaint.landlordNotes}</p>` : ''}
        </div>
        <p>You can view more details in your Safe Stay dashboard.</p>
        <p>Best regards,<br>Safe Stay Management</p>
      </div>
    `;
  }
  
  await sendEmail(recipient.email, subject, html);
};

const sendNewRuleNotification = async (tenant, rule) => {
  const subject = `New Rule Posted - ${rule.apartmentName}`;
  const html = emailTemplates.newRule(
    tenant.name,
    rule.title,
    rule.description,
    rule.apartmentName
  );
  
  await sendEmail(tenant.email, subject, html);
};

const sendMonthlyBillNotification = async (tenant, bill) => {
  const subject = `Monthly Bill Generated - ${bill.apartmentName}`;
  const html = emailTemplates.monthlyBillGenerated(
    tenant.name,
    bill.amount,
    bill.month,
    bill.year,
    bill.dueDate,
    bill.apartmentName
  );
  
  await sendEmail(tenant.email, subject, html);
};

module.exports = {
  sendEmail,
  sendBillReminder,
  sendPaymentConfirmation,
  sendComplaintUpdate,
  sendComplaintNotification,
  sendNewRuleNotification,
  sendMonthlyBillNotification
};
