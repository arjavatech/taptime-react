// Raw data file - replaces all API calls
export const rawData = {
  // Company data
  companies: [
    {
      CID: "1",
      CName: "Demo Company",
      CLogo: "/assets/images/logo.png",
      CAddress: "123 Business St, City, State 12345",
      UserName: "admin@demo.com",
      Password: "encrypted_password_hash",
      ReportType: "daily",
      device_count: 5,
      employee_count: 15
    },
    {
      CID: "2",
      CName: "Tech Solutions Inc",
      CLogo: "/assets/images/logo.png",
      CAddress: "456 Tech Ave, Silicon Valley, CA 94000",
      UserName: "admin@demo.com",
      Password: "encrypted_password_hash",
      ReportType: "weekly",
      device_count: 8,
      employee_count: 25
    },
    {
      CID: "3",
      CName: "Global Services Ltd",
      CLogo: "/assets/images/logo.png",
      CAddress: "789 Global Blvd, New York, NY 10001",
      UserName: "admin@demo.com",
      Password: "encrypted_password_hash",
      ReportType: "daily",
      device_count: 12,
      employee_count: 50
    }
  ],

  // Employee data
  employees: [
    // Company 1 employees
    {
      emp_id: 1,
      pin: "1234",
      first_name: "John",
      last_name: "Doe",
      phone_number: "+1 (555) 123-4567",
      email: "john.doe@demo.com",
      is_admin: 0,
      is_active: true,
      c_id: "1",
      created_date: "2024-01-15",
      last_modified_by: "Admin"
    },
    {
      emp_id: 2,
      pin: "5678",
      first_name: "Jane",
      last_name: "Smith",
      phone_number: "+1 (555) 234-5678",
      email: "jane.smith@demo.com",
      is_admin: 1,
      is_active: true,
      c_id: "1",
      created_date: "2024-01-16",
      last_modified_by: "Admin"
    },
    {
      emp_id: 3,
      pin: "9012",
      first_name: "Mike",
      last_name: "Johnson",
      phone_number: "+1 (555) 345-6789",
      email: "mike.johnson@demo.com",
      is_admin: 2,
      is_active: true,
      c_id: "1",
      created_date: "2024-01-17",
      last_modified_by: "Admin"
    },
    // Company 2 employees
    {
      emp_id: 4,
      pin: "2468",
      first_name: "Sarah",
      last_name: "Wilson",
      phone_number: "+1 (555) 456-7890",
      email: "sarah.wilson@techsolutions.com",
      is_admin: 0,
      is_active: true,
      c_id: "2",
      created_date: "2024-01-18",
      last_modified_by: "Admin"
    },
    {
      emp_id: 5,
      pin: "1357",
      first_name: "David",
      last_name: "Brown",
      phone_number: "+1 (555) 567-8901",
      email: "david.brown@techsolutions.com",
      is_admin: 1,
      is_active: true,
      c_id: "2",
      created_date: "2024-01-19",
      last_modified_by: "Admin"
    },
    // Company 3 employees
    {
      emp_id: 6,
      pin: "9753",
      first_name: "Lisa",
      last_name: "Garcia",
      phone_number: "+1 (555) 678-9012",
      email: "lisa.garcia@globalservices.com",
      is_admin: 0,
      is_active: true,
      c_id: "3",
      created_date: "2024-01-20",
      last_modified_by: "Admin"
    },
    {
      emp_id: 7,
      pin: "4680",
      first_name: "Admin",
      last_name: "User",
      phone_number: "+1 (555) 111-2222",
      email: "admin@demo.com",
      is_admin: 3,
      is_active: true,
      c_id: "1",
      created_date: "2024-01-15",
      last_modified_by: "System"
    },
    {
      emp_id: 8,
      pin: "1122",
      first_name: "Admin",
      last_name: "User",
      phone_number: "+1 (555) 111-2222",
      email: "admin@demo.com",
      is_admin: 3,
      is_active: true,
      c_id: "2",
      created_date: "2024-01-15",
      last_modified_by: "System"
    },
    {
      emp_id: 9,
      pin: "3344",
      first_name: "Admin",
      last_name: "User",
      phone_number: "+1 (555) 111-2222",
      email: "admin@demo.com",
      is_admin: 3,
      is_active: true,
      c_id: "3",
      created_date: "2024-01-15",
      last_modified_by: "System"
    }
  ],

  // Device data
  devices: [
    // Company 1 devices
    {
      device_id: "DEV001",
      device_name: "Main Terminal",
      TimeZone: "PST",
      c_id: "1",
      is_active: true
    },
    {
      device_id: "DEV002",
      device_name: "Secondary Terminal",
      TimeZone: "PST",
      c_id: "1",
      is_active: true
    },
    // Company 2 devices
    {
      device_id: "DEV003",
      device_name: "Tech Hub Terminal",
      TimeZone: "PST",
      c_id: "2",
      is_active: true
    },
    {
      device_id: "DEV004",
      device_name: "Development Floor",
      TimeZone: "PST",
      c_id: "2",
      is_active: true
    },
    // Company 3 devices
    {
      device_id: "DEV005",
      device_name: "Global HQ Terminal",
      TimeZone: "EST",
      c_id: "3",
      is_active: true
    },
    {
      device_id: "DEV006",
      device_name: "Reception Desk",
      TimeZone: "EST",
      c_id: "3",
      is_active: true
    }
  ],

  // Daily report data
  dailyReports: [
    // Company 1 reports
    {
      id: 1,
      pin: "1234",
      name: "John Doe",
      type: "Employee",
      emp_id: 1,
      check_in_time: "2024-01-20 09:00:00",
      check_out_time: "2024-01-20 17:00:00",
      time_worked: "8:00:00",
      device_id: "DEV001",
      check_in_snap: null,
      check_out_snap: null,
      c_id: "1",
      date: "2024-01-20"
    },
    {
      id: 2,
      pin: "5678",
      name: "Jane Smith",
      type: "Admin",
      emp_id: 2,
      check_in_time: "2024-01-20 08:30:00",
      check_out_time: "2024-01-20 17:30:00",
      time_worked: "9:00:00",
      device_id: "DEV001",
      check_in_snap: null,
      check_out_snap: null,
      c_id: "1",
      date: "2024-01-20"
    },
    // Company 2 reports
    {
      id: 3,
      pin: "2468",
      name: "Sarah Wilson",
      type: "Employee",
      emp_id: 4,
      check_in_time: "2024-01-20 08:00:00",
      check_out_time: "2024-01-20 16:00:00",
      time_worked: "8:00:00",
      device_id: "DEV003",
      check_in_snap: null,
      check_out_snap: null,
      c_id: "2",
      date: "2024-01-20"
    },
    // Company 3 reports
    {
      id: 4,
      pin: "9753",
      name: "Lisa Garcia",
      type: "Employee",
      emp_id: 6,
      check_in_time: "2024-01-20 09:30:00",
      check_out_time: "2024-01-20 18:00:00",
      time_worked: "8:30:00",
      device_id: "DEV005",
      check_in_snap: null,
      check_out_snap: null,
      c_id: "3",
      date: "2024-01-20"
    }
  ],

  // Report email settings
  reportEmails: [
    {
      company_reporter_email: "reports@demo.com",
      c_id: "1",
      is_daily_report_active: true,
      is_weekly_report_active: true,
      is_bi_weekly_report_active: false,
      is_monthly_report_active: true,
      is_bi_monthly_report_active: false,
      is_active: true,
      last_modified_by: "Admin"
    },
    {
      company_reporter_email: "reports@techsolutions.com",
      c_id: "2",
      is_daily_report_active: false,
      is_weekly_report_active: true,
      is_bi_weekly_report_active: false,
      is_monthly_report_active: false,
      is_bi_monthly_report_active: false,
      is_active: true,
      last_modified_by: "Admin"
    },
    {
      company_reporter_email: "reports@globalservices.com",
      c_id: "3",
      is_daily_report_active: true,
      is_weekly_report_active: false,
      is_bi_weekly_report_active: false,
      is_monthly_report_active: true,
      is_bi_monthly_report_active: false,
      is_active: true,
      last_modified_by: "Admin"
    }
  ],

  // Customer data
  customers: [
    {
      CustomerID: "CUST001",
      FName: "Demo",
      LName: "Customer",
      Address: "456 Customer Ave, City, State 12345",
      PhoneNumber: "+1 (555) 987-6543",
      Email: "customer@demo.com",
      CID: "1"
    },
    {
      CustomerID: "CUST002",
      FName: "Tech",
      LName: "Client",
      Address: "789 Tech Street, Silicon Valley, CA 94000",
      PhoneNumber: "+1 (555) 876-5432",
      Email: "client@techsolutions.com",
      CID: "2"
    },
    {
      CustomerID: "CUST003",
      FName: "Global",
      LName: "Partner",
      Address: "321 Global Plaza, New York, NY 10001",
      PhoneNumber: "+1 (555) 765-4321",
      Email: "partner@globalservices.com",
      CID: "3"
    }
  ],

  // User-Company associations (users can belong to multiple companies)
  userCompanies: [
    { user_email: "admin@demo.com", cid: "1", admin_type: "owner" },
    { user_email: "admin@demo.com", cid: "2", admin_type: "owner" },
    { user_email: "admin@demo.com", cid: "3", admin_type: "owner" },
    { user_email: "jane.smith@demo.com", cid: "1", admin_type: "admin" },
    { user_email: "jane.smith@demo.com", cid: "2", admin_type: "superadmin" },
    { user_email: "mike.johnson@demo.com", cid: "1", admin_type: "superadmin" }
  ],

  // Authentication data
  authUsers: [
    {
      id: "auth_001",
      email: "admin@demo.com",
      password: "demo123",
      first_name: "Admin",
      last_name: "User",
      phone_number: "+1 (555) 111-2222",
      admin_type: "owner",
      company_name: "Demo Company",
      company_logo: "/assets/images/logo.png",
      report_type: "daily",
      is_verified: true,
      created_date: "2024-01-15",
      cid: "1",
      auth_id: "auth_001",
      device_count: 5,
      employee_count: 15,
      company_address_line1: "123 Business St",
      company_address_line2: "",
      company_city: "Demo City",
      company_state: "Demo State",
      company_zip_code: "12345",
      customer_zip_code: "12345",
      customer_address_line1: "456 Customer Ave",
      customer_address_line2: "",
      customer_city: "Demo City",
      customer_state: "Demo State",
      employment_type: "full-time",
      last_modified_by: "System"
    },
    {
      id: "auth_002",
      email: "jane.smith@demo.com",
      password: "admin123",
      first_name: "Jane",
      last_name: "Smith",
      phone_number: "+1 (555) 234-5678",
      admin_type: "owner",
      company_name: "Demo Company",
      company_logo: "/assets/images/logo.png",
      report_type: "daily",
      is_verified: true,
      created_date: "2024-01-16",
      cid: "1",
      auth_id: "auth_002",
      device_count: 5,
      employee_count: 15,
      company_address_line1: "123 Business St",
      company_address_line2: "",
      company_city: "Demo City",
      company_state: "Demo State",
      company_zip_code: "12345",
      customer_zip_code: "12345",
      customer_address_line1: "456 Customer Ave",
      customer_address_line2: "",
      customer_city: "Demo City",
      customer_state: "Demo State",
      employment_type: "full-time",
      last_modified_by: "System"
    },
    {
      id: "auth_003",
      email: "mike.johnson@demo.com",
      password: "superadmin123",
      first_name: "Mike",
      last_name: "Johnson",
      phone_number: "+1 (555) 345-6789",
      admin_type: "owner",
      company_name: "Demo Company",
      company_logo: "/assets/images/logo.png",
      report_type: "daily",
      is_verified: true,
      created_date: "2024-01-17",
      cid: "1",
      auth_id: "auth_003",
      device_count: 5,
      employee_count: 15,
      company_address_line1: "123 Business St",
      company_address_line2: "",
      company_city: "Demo City",
      company_state: "Demo State",
      company_zip_code: "12345",
      customer_zip_code: "12345",
      customer_address_line1: "456 Customer Ave",
      customer_address_line2: "",
      customer_city: "Demo City",
      customer_state: "Demo State",
      employment_type: "full-time",
      last_modified_by: "System"
    }
  ],

  // Contact form submissions
  contactSubmissions: []
};

// Helper functions to simulate API responses
export const getNextId = (array) => {
  return array.length > 0 ? Math.max(...array.map(item => item.id || item.emp_id || 1)) + 1 : 1;
};

export const generatePin = (phoneNumber) => {
  const digits = phoneNumber.replace(/\D/g, '').replace(/^1/, '');
  return digits.length >= 4 ? digits.slice(-4) : '0000';
};

// Helper function to get user's companies
export const getUserCompanies = (userEmail) => {
  return rawData.userCompanies
    .filter(uc => uc.user_email === userEmail)
    .map(uc => {
      const company = rawData.companies.find(c => c.CID === uc.cid);
      return {
        ...company,
        admin_type: uc.admin_type
      };
    })
    .filter(Boolean);
};