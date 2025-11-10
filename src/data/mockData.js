// Mock data for TapTime application
// This file contains all mock data that represents real API responses

export const mockDeviceData = [
  {
    AccessKey: "abc123def456ghi789",
    access_key: "abc123def456ghi789",
    DeviceID: "DEVICE001",
    device_id: "iPad Pro 12.9",
    DeviceName: "Main Reception iPad",
    device_name: "Main Reception iPad",
    time_zone: "America/New_York",
    branch_name: "Main Branch",
    access_key_generated_time: "2024-01-15T10:30:00Z",
    last_modified_by: "Admin"
  },
];

export const mockEmployeeData = [
  {
    emp_id: "EMP001",
    EmpID: "EMP001",
    pin: "1234",
    Pin: "1234",
    first_name: "John",
    FName: "John",
    last_name: "Doe",
    LName: "Doe",
    Name: "John Doe",
    phone_number: "1234567890",
    PhoneNumber: "(123) 456-7890",
    is_admin: 0,
    IsAdmin: 0,
    is_active: true,
    IsActive: true,
    c_id: "COMP001",
    CID: "COMP001",
    last_modified_by: "Admin"
  },
  {
    emp_id: "EMP002",
    EmpID: "EMP002",
    pin: "5678",
    Pin: "5678",
    first_name: "Jane",
    FName: "Jane",
    last_name: "Smith",
    LName: "Smith",
    Name: "Jane Smith",
    phone_number: "2345678901",
    PhoneNumber: "(234) 567-8901",
    is_admin: 1,
    IsAdmin: 1,
    is_active: true,
    IsActive: true,
    c_id: "COMP001",
    CID: "COMP001",
    last_modified_by: "Admin"
  },
  {
    emp_id: "EMP003",
    EmpID: "EMP003",
    pin: "9012",
    Pin: "9012",
    first_name: "Mike",
    FName: "Mike",
    last_name: "Johnson",
    LName: "Johnson",
    Name: "Mike Johnson",
    phone_number: "3456789012",
    PhoneNumber: "(345) 678-9012",
    is_admin: 2,
    IsAdmin: 2,
    is_active: true,
    IsActive: true,
    c_id: "COMP001",
    CID: "COMP001",
    last_modified_by: "Admin"
  },
  {
    emp_id: "EMP004",
    EmpID: "EMP004",
    pin: "3456",
    Pin: "3456",
    first_name: "Sarah",
    FName: "Sarah",
    last_name: "Wilson",
    LName: "Wilson",
    Name: "Sarah Wilson",
    phone_number: "4567890123",
    PhoneNumber: "(456) 789-0123",
    email: "",
    Email: "",
    is_admin: 0,
    IsAdmin: 0,
    is_active: true,
    IsActive: true,
    c_id: "COMP001",
    CID: "COMP001",
    last_modified_by: "Admin"
  },
  {
    emp_id: "EMP005",
    EmpID: "EMP005",
    pin: "7890",
    Pin: "7890",
    first_name: "David",
    FName: "David",
    last_name: "Brown",
    LName: "Brown",
    Name: "David Brown",
    phone_number: "5678901234",
    PhoneNumber: "(567) 890-1234",
    is_admin: 0,
    IsAdmin: 0,
    is_active: true,
    IsActive: true,
    c_id: "COMP001",
    CID: "COMP001",
    last_modified_by: "Admin"
  },
  {
    emp_id: "EMP006",
    EmpID: "EMP006",
    pin: "2468",
    Pin: "2468",
    first_name: "Emily",
    FName: "Emily",
    last_name: "Davis",
    LName: "Davis",
    Name: "Emily Davis",
    phone_number: "6789012345",
    PhoneNumber: "(678) 901-2345",
    is_admin: 0,
    IsAdmin: 0,
    is_active: false,
    IsActive: false,
    c_id: "COMP001",
    CID: "COMP001",
    last_modified_by: "Admin"
  }
];

export const mockReportData = [
  // Today's data
  {
    EmpID: "EMP001",
    Pin: "1234",
    Name: "John Doe",
    CheckInTime: "2024-02-15T09:00:00Z",
    CheckOutTime: "2024-02-15T17:30:00Z",
    TimeWorked: "8:30",
    Type: "Belt",
    TypeID: "Belt",
    DeviceID: "DEVICE001",
    Date: "2024-02-15",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  {
    EmpID: "EMP002",
    Pin: "5678",
    Name: "Jane Smith",
    CheckInTime: "2024-02-15T08:30:00Z",
    CheckOutTime: "2024-02-15T16:45:00Z",
    TimeWorked: "8:15",
    Type: "Path",
    TypeID: "Path",
    DeviceID: "DEVICE001",
    Date: "2024-02-15",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  {
    EmpID: "EMP003",
    Pin: "9012",
    Name: "Mike Johnson",
    CheckInTime: "2024-02-15T08:45:00Z",
    CheckOutTime: "2024-02-15T17:00:00Z",
    TimeWorked: "8:15",
    Type: "Belt",
    TypeID: "Belt",
    DeviceID: "DEVICE001",
    Date: "2024-02-15",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  {
    EmpID: "EMP004",
    Pin: "3456",
    Name: "Sarah Wilson",
    CheckInTime: "2024-02-15T09:15:00Z",
    CheckOutTime: null,
    TimeWorked: "0:00",
    Type: "Reception",
    TypeID: "Reception",
    DeviceID: "DEVICE002",
    Date: "2024-02-15",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  
  // Yesterday's data
  {
    EmpID: "EMP001",
    Pin: "1234",
    Name: "John Doe",
    CheckInTime: "2024-02-14T08:55:00Z",
    CheckOutTime: "2024-02-14T17:25:00Z",
    TimeWorked: "8:30",
    Type: "Belt",
    TypeID: "Belt",
    DeviceID: "DEVICE001",
    Date: "2024-02-14",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  {
    EmpID: "EMP002",
    Pin: "5678",
    Name: "Jane Smith",
    CheckInTime: "2024-02-14T08:25:00Z",
    CheckOutTime: "2024-02-14T16:40:00Z",
    TimeWorked: "8:15",
    Type: "Path",
    TypeID: "Path",
    DeviceID: "DEVICE001",
    Date: "2024-02-14",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  {
    EmpID: "EMP003",
    Pin: "9012",
    Name: "Mike Johnson",
    CheckInTime: "2024-02-14T09:10:00Z",
    CheckOutTime: "2024-02-14T18:15:00Z",
    TimeWorked: "9:05",
    Type: "Belt",
    TypeID: "Belt",
    DeviceID: "DEVICE001",
    Date: "2024-02-14",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  {
    EmpID: "EMP004",
    Pin: "3456",
    Name: "Sarah Wilson",
    CheckInTime: "2024-02-14T09:00:00Z",
    CheckOutTime: "2024-02-14T17:30:00Z",
    TimeWorked: "8:30",
    Type: "Reception",
    TypeID: "Reception",
    DeviceID: "DEVICE002",
    Date: "2024-02-14",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  
  // Day before yesterday
  {
    EmpID: "EMP001",
    Pin: "1234",
    Name: "John Doe",
    CheckInTime: "2024-02-13T09:05:00Z",
    CheckOutTime: "2024-02-13T17:35:00Z",
    TimeWorked: "8:30",
    Type: "Belt",
    TypeID: "Belt",
    DeviceID: "DEVICE001",
    Date: "2024-02-13",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  {
    EmpID: "EMP002",
    Pin: "5678",
    Name: "Jane Smith",
    CheckInTime: "2024-02-13T08:20:00Z",
    CheckOutTime: "2024-02-13T16:50:00Z",
    TimeWorked: "8:30",
    Type: "Path",
    TypeID: "Path",
    DeviceID: "DEVICE001",
    Date: "2024-02-13",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  {
    EmpID: "EMP003",
    Pin: "9012",
    Name: "Mike Johnson",
    CheckInTime: "2024-02-13T08:50:00Z",
    CheckOutTime: "2024-02-13T16:45:00Z",
    TimeWorked: "7:55",
    Type: "Belt",
    TypeID: "Belt",
    DeviceID: "DEVICE001",
    Date: "2024-02-13",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  
  // Last week data
  {
    EmpID: "EMP001",
    Pin: "1234",
    Name: "John Doe",
    CheckInTime: "2024-02-12T09:00:00Z",
    CheckOutTime: "2024-02-12T17:30:00Z",
    TimeWorked: "8:30",
    Type: "Belt",
    TypeID: "Belt",
    DeviceID: "DEVICE001",
    Date: "2024-02-12",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  {
    EmpID: "EMP002",
    Pin: "5678",
    Name: "Jane Smith",
    CheckInTime: "2024-02-12T08:30:00Z",
    CheckOutTime: "2024-02-12T17:00:00Z",
    TimeWorked: "8:30",
    Type: "Path",
    TypeID: "Path",
    DeviceID: "DEVICE001",
    Date: "2024-02-12",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  {
    EmpID: "EMP004",
    Pin: "3456",
    Name: "Sarah Wilson",
    CheckInTime: "2024-02-12T09:15:00Z",
    CheckOutTime: "2024-02-12T17:45:00Z",
    TimeWorked: "8:30",
    Type: "Reception",
    TypeID: "Reception",
    DeviceID: "DEVICE002",
    Date: "2024-02-12",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  
  // More historical data
  {
    EmpID: "EMP001",
    Pin: "1234",
    Name: "John Doe",
    CheckInTime: "2024-02-09T08:45:00Z",
    CheckOutTime: "2024-02-09T17:15:00Z",
    TimeWorked: "8:30",
    Type: "Belt",
    TypeID: "Belt",
    DeviceID: "DEVICE001",
    Date: "2024-02-09",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  {
    EmpID: "EMP002",
    Pin: "5678",
    Name: "Jane Smith",
    CheckInTime: "2024-02-09T08:30:00Z",
    CheckOutTime: "2024-02-09T16:30:00Z",
    TimeWorked: "8:00",
    Type: "Path",
    TypeID: "Path",
    DeviceID: "DEVICE001",
    Date: "2024-02-09",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  {
    EmpID: "EMP003",
    Pin: "9012",
    Name: "Mike Johnson",
    CheckInTime: "2024-02-09T09:00:00Z",
    CheckOutTime: "2024-02-09T18:00:00Z",
    TimeWorked: "9:00",
    Type: "Belt",
    TypeID: "Belt",
    DeviceID: "DEVICE001",
    Date: "2024-02-09",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  {
    EmpID: "EMP004",
    Pin: "3456",
    Name: "Sarah Wilson",
    CheckInTime: "2024-02-09T09:30:00Z",
    CheckOutTime: "2024-02-09T17:00:00Z",
    TimeWorked: "7:30",
    Type: "Reception",
    TypeID: "Reception",
    DeviceID: "DEVICE002",
    Date: "2024-02-09",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  
  // Weekend/partial data
  {
    EmpID: "EMP002",
    Pin: "5678",
    Name: "Jane Smith",
    CheckInTime: "2024-02-10T10:00:00Z",
    CheckOutTime: "2024-02-10T14:00:00Z",
    TimeWorked: "4:00",
    Type: "Path",
    TypeID: "Path",
    DeviceID: "DEVICE001",
    Date: "2024-02-10",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  {
    EmpID: "EMP003",
    Pin: "9012",
    Name: "Mike Johnson",
    CheckInTime: "2024-02-08T08:30:00Z",
    CheckOutTime: "2024-02-08T16:30:00Z",
    TimeWorked: "8:00",
    Type: "Belt",
    TypeID: "Belt",
    DeviceID: "DEVICE001",
    Date: "2024-02-08",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  
  // Late arrivals and early departures
  {
    EmpID: "EMP001",
    Pin: "1234",
    Name: "John Doe",
    CheckInTime: "2024-02-07T10:30:00Z",
    CheckOutTime: "2024-02-07T18:30:00Z",
    TimeWorked: "8:00",
    Type: "Belt",
    TypeID: "Belt",
    DeviceID: "DEVICE001",
    Date: "2024-02-07",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  {
    EmpID: "EMP004",
    Pin: "3456",
    Name: "Sarah Wilson",
    CheckInTime: "2024-02-07T09:00:00Z",
    CheckOutTime: "2024-02-07T15:00:00Z",
    TimeWorked: "6:00",
    Type: "Reception",
    TypeID: "Reception",
    DeviceID: "DEVICE002",
    Date: "2024-02-07",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  
  // Additional David Brown entries
  {
    EmpID: "EMP005",
    Pin: "7890",
    Name: "David Brown",
    CheckInTime: "2024-02-15T08:30:00Z",
    CheckOutTime: "2024-02-15T16:30:00Z",
    TimeWorked: "8:00",
    Type: "Belt",
    TypeID: "Belt",
    DeviceID: "DEVICE001",
    Date: "2024-02-15",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  {
    EmpID: "EMP005",
    Pin: "7890",
    Name: "David Brown",
    CheckInTime: "2024-02-14T08:45:00Z",
    CheckOutTime: "2024-02-14T17:15:00Z",
    TimeWorked: "8:30",
    Type: "Belt",
    TypeID: "Belt",
    DeviceID: "DEVICE001",
    Date: "2024-02-14",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  {
    EmpID: "EMP005",
    Pin: "7890",
    Name: "David Brown",
    CheckInTime: "2024-02-13T09:00:00Z",
    CheckOutTime: "2024-02-13T17:30:00Z",
    TimeWorked: "8:30",
    Type: "Belt",
    TypeID: "Belt",
    DeviceID: "DEVICE001",
    Date: "2024-02-13",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  {
    EmpID: "EMP005",
    Pin: "7890",
    Name: "David Brown",
    CheckInTime: "2024-02-12T08:15:00Z",
    CheckOutTime: "2024-02-12T16:45:00Z",
    TimeWorked: "8:30",
    Type: "Belt",
    TypeID: "Belt",
    DeviceID: "DEVICE001",
    Date: "2024-02-12",
    CheckInSnap: null,
    CheckOutSnap: null
  },
  {
    EmpID: "EMP005",
    Pin: "7890",
    Name: "David Brown",
    CheckInTime: "2024-02-09T08:00:00Z",
    CheckOutTime: "2024-02-09T16:30:00Z",
    TimeWorked: "8:30",
    Type: "Belt",
    TypeID: "Belt",
    DeviceID: "DEVICE001",
    Date: "2024-02-09",
    CheckInSnap: null,
    CheckOutSnap: null
  }
];

export const mockCompanyData = {
  CID: "COMP001",
  companyID: "COMP001",
  CName: "TechCorp Solutions",
  companyName: "TechCorp Solutions",
  CAddress: "123 Business Ave--New York--NY--10001",
  companyAddress: "123 Business Ave--New York--NY--10001",
  CLogo: "/images/tap-time-logo.png",
  companyLogo: "/images/tap-time-logo.png",
  UserName: "admin",
  username: "admin",
  Password: "encrypted_password",
  password: "encrypted_password",
  ReportType: "Weekly,Monthly,Quarterly",
  reportType: "Weekly,Monthly,Quarterly",
  NoOfDevices: "5",
  device_count: "5",
  NoOfEmployees: "50",
  LastModifiedBy: "Admin"
};

export const mockCustomerData = {
  CustomerID: "CUST001",
  customerID: "CUST001",
  CID: "COMP001",
  FName: "John",
  firstName: "John",
  LName: "Administrator",
  lastName: "Administrator",
  Address: "456 Admin Street--New York--NY--10002",
  address: "456 Admin Street--New York--NY--10002",
  PhoneNumber: "(555) 123-4567",
  phone: "(555) 123-4567",
  Email: "admin@techcorp.com",
  email: "admin@techcorp.com",
  IsActive: true,
  LastModifiedBy: "Admin"
};

export const mockUserProfile = {
  name: "John Administrator",
  email: "admin@techcorp.com",
  picture: "",
  fallback: "JA",
  adminType: "Owner",
  companyID: "COMP001",
  customerID: "CUST001"
};

export const mockContactData = [
  {
    id: "CONT001",
    name: "John Smith",
    email: "john.smith@techcorp.com",
    phone: "(555) 123-4567",
    company: "TechCorp Solutions",
    position: "HR Manager",
    department: "Human Resources",
    status: "active",
    lastContact: "2024-02-15T10:30:00Z",
    notes: "Primary contact for employee onboarding",
    tags: ["HR", "Primary"]
  },
  {
    id: "CONT002",
    name: "Sarah Johnson",
    email: "sarah.johnson@techcorp.com",
    phone: "(555) 234-5678",
    company: "TechCorp Solutions",
    position: "IT Director",
    department: "Information Technology",
    status: "active",
    lastContact: "2024-02-14T14:20:00Z",
    notes: "Technical implementation contact",
    tags: ["IT", "Technical"]
  },
  {
    id: "CONT003",
    name: "Mike Davis",
    email: "mike.davis@acmecorp.com",
    phone: "(555) 345-6789",
    company: "ACME Corporation",
    position: "Operations Manager",
    department: "Operations",
    status: "active",
    lastContact: "2024-02-13T09:15:00Z",
    notes: "Interested in enterprise solution",
    tags: ["Prospect", "Enterprise"]
  },
  {
    id: "CONT004",
    name: "Lisa Chen",
    email: "lisa.chen@startup.io",
    phone: "(555) 456-7890",
    company: "StartupIO",
    position: "CEO",
    department: "Executive",
    status: "inactive",
    lastContact: "2024-01-20T16:45:00Z",
    notes: "Small team, budget constraints",
    tags: ["Startup", "Budget"]
  }
];

// Mock analytics data for dashboard
export const mockAnalyticsData = {
  totalEmployees: 6,
  activeEmployees: 5,
  todayAttendance: 4,
  avgHoursPerDay: 8.2,
  totalHoursThisWeek: 164.5,
  totalHoursThisMonth: 658.0,
  attendanceRate: 85.7,
  punctualityRate: 92.3,
  overtimeHours: 12.5,
  weeklyTrends: [
    { day: 'Mon', hours: 34.5, employees: 4 },
    { day: 'Tue', hours: 33.0, employees: 4 },
    { day: 'Wed', hours: 32.5, employees: 4 },
    { day: 'Thu', hours: 33.5, employees: 4 },
    { day: 'Fri', hours: 31.0, employees: 3 },
    { day: 'Sat', hours: 4.0, employees: 1 },
    { day: 'Sun', hours: 0, employees: 0 }
  ],
  departmentBreakdown: [
    { department: 'Belt', employees: 2, avgHours: 8.4 },
    { department: 'Path', employees: 1, avgHours: 8.2 },
    { department: 'Reception', employees: 1, avgHours: 7.8 },
    { department: 'Other', employees: 1, avgHours: 8.0 }
  ]
};

// Mock report summary data
export const mockReportSummary = {
  daily: {
    totalRecords: 4,
    presentEmployees: 3,
    totalHours: 25.0,
    avgCheckIn: '09:02',
    avgCheckOut: '17:18',
    lateArrivals: 1,
    earlyDepartures: 0,
    overtime: 1
  },
  weekly: {
    totalRecords: 18,
    avgDailyAttendance: 3.6,
    totalHours: 148.5,
    avgHoursPerEmployee: 8.25,
    perfectAttendance: 2,
    totalLateArrivals: 3,
    totalOvertimeHours: 9.5
  },
  monthly: {
    totalRecords: 72,
    avgDailyAttendance: 3.8,
    totalHours: 592.0,
    avgHoursPerEmployee: 8.22,
    attendanceRate: 88.5,
    punctualityRate: 91.2,
    totalOvertimeHours: 28.5
  }
};

// Helper functions to simulate API calls
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApiResponse = (data, shouldFail = false, delayMs = 500) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error('Mock API Error'));
      } else {
        resolve({ success: true, data });
      }
    }, delayMs);
  });
};

// Generate dynamic mock data based on current date
export const generateTodayMockData = () => {
  const today = new Date().toISOString().split('T')[0];
  const todayData = [
    {
      EmpID: "EMP001",
      Pin: "1234",
      Name: "John Doe",
      CheckInTime: today + "T09:00:00Z",
      CheckOutTime: null,
      TimeWorked: "0:00",
      Type: "Belt",
      TypeID: "Belt",
      DeviceID: "DEVICE001",
      Date: today,
      CheckInSnap: null,
      CheckOutSnap: null
    },
    {
      EmpID: "EMP002",
      Pin: "5678",
      Name: "Jane Smith",
      CheckInTime: today + "T08:30:00Z",
      CheckOutTime: today + "T16:45:00Z",
      TimeWorked: "8:15",
      Type: "Path",
      TypeID: "Path",
      DeviceID: "DEVICE001",
      Date: today,
      CheckInSnap: null,
      CheckOutSnap: null
    },
    {
      EmpID: "EMP005",
      Pin: "7890",
      Name: "David Brown",
      CheckInTime: today + "T08:45:00Z",
      CheckOutTime: null,
      TimeWorked: "0:00",
      Type: "Belt",
      TypeID: "Belt",
      DeviceID: "DEVICE001",
      Date: today,
      CheckInSnap: null,
      CheckOutSnap: null
    },
    {
      EmpID: "EMP004",
      Pin: "3456",
      Name: "Sarah Wilson",
      CheckInTime: today + "T09:15:00Z",
      CheckOutTime: today + "T17:30:00Z",
      TimeWorked: "8:15",
      Type: "Reception",
      TypeID: "Reception",
      DeviceID: "DEVICE002",
      Date: today,
      CheckInSnap: null,
      CheckOutSnap: null
    }
  ];
  return todayData;
};

// Get mock data for date range
export const getMockDataForDateRange = (startDate, endDate) => {
  return mockReportData.filter(record => {
    const recordDate = new Date(record.Date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return recordDate >= start && recordDate <= end;
  });
};