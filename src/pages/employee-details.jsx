import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import { fetchDateRangeReport } from "../api";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CircleAlert,
  Crown,
  Hash,
  Clock3,
  LoaderCircle,
  Mail,
  Phone,
  RefreshCw,
  Shield,
  Timer,
  User,
} from "lucide-react";

// Temporary demo entries used only until employee report data is available from the API.
const createMockReports = (employee) => {
  const today = new Date();
  const createEntry = (daysAgo, checkInHour, checkOutHour) => {
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    date.setHours(checkInHour, 0, 0, 0);
    const checkIn = new Date(date);
    const checkOut = new Date(date);
    checkOut.setHours(checkOutHour, 0, 0, 0);
    return {
      Pin: employee.pin,
      EmpID: employee.emp_id,
      Name: `${employee.first_name || "John"} ${employee.last_name || "Doe"}`,
      CheckInTime: checkIn.toISOString(),
      CheckOutTime: checkOut.toISOString(),
      TimeWorked: `${checkOutHour - checkInHour}:00`,
    };
  };

  const monthly = [createEntry(1, 9, 18), createEntry(2, 9, 17), createEntry(3, 9, 18), createEntry(4, 10, 18), createEntry(7, 9, 18), createEntry(9, 9, 17)];
  return { weekly: monthly.filter((entry) => today - new Date(entry.CheckInTime) < 7 * 24 * 60 * 60 * 1000), monthly };
};

const EmployeeDetails = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [reports, setReports] = useState({ weekly: [], monthly: [] });
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");
  const [activeReport, setActiveReport] = useState("weekly");

  useEffect(() => {
    const storedEmployee = localStorage.getItem("employeeData");

    if (!storedEmployee) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setEmployee(JSON.parse(storedEmployee));
    } catch {
      localStorage.removeItem("employeeData");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const loadReports = async () => {
    if (!employee) return;

    const companyId = employee.c_id || localStorage.getItem("companyID");
    if (!companyId) return;

    const today = new Date();
    const toDateString = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    const weekStart = new Date(today);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setReportsLoading(true);
    setReportsError("");
    try {
      const [weekly, monthly] = await Promise.all([
        fetchDateRangeReport(companyId, toDateString(weekStart), toDateString(weekEnd)),
        fetchDateRangeReport(companyId, toDateString(monthStart), toDateString(monthEnd)),
      ]);
      const belongsToEmployee = (entry) => {
        const pin = String(employee.pin || "");
        const employeeId = String(employee.emp_id || "");
        return [entry.Pin, entry.EmpID].some((value) => value && (String(value) === pin || String(value) === employeeId));
      };
      const employeeWeeklyReports = weekly.filter(belongsToEmployee);
      const employeeMonthlyReports = monthly.filter(belongsToEmployee);
      const mockReports = createMockReports(employee);
      setReports({
        weekly: employeeWeeklyReports.length ? employeeWeeklyReports : mockReports.weekly,
        monthly: employeeMonthlyReports.length ? employeeMonthlyReports : mockReports.monthly,
      });
    } catch (error) {
      console.error("Unable to load employee reports:", error);
      setReportsError("Your reports could not be loaded right now. Please try again.");
      setReports({ weekly: [], monthly: [] });
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  // loadReports intentionally uses the current employee record.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee]);

  const getRole = () => {
    if (employee.is_admin === 2) return { label: "Super Admin", icon: Crown };
    if (employee.is_admin === 1) return { label: "Administrator", icon: Shield };
    return { label: "Employee", icon: User };
  };

  const formatPhone = (phone) => {
    if (!phone) return "Not provided";
    const digits = phone.replace(/\D/g, "");
    if (digits.length >= 11) {
      const countryCode = digits.slice(0, -10);
      return `+${countryCode} ${digits.slice(-10, -5)} ${digits.slice(-5)}`;
    }
    return phone;
  };

  if (!employee) return null;

  const { label: roleLabel, icon: RoleIcon } = getRole();
  const initials = `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`.toUpperCase();
  const companyId = employee.c_id || localStorage.getItem("companyID") || "—";
  const employeeCode = employee.emp_id || "EMP-001";
  const firstName = employee.first_name || "Employee";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 pt-20 pb-8 sm:pt-24 sm:pb-12 lg:pb-14">
        <div className="mx-auto w-full max-w-5xl px-3 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              {/* <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#01005a]">Employee portal</p> */}
              <h1 className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Welcome back, {firstName}</h1>
              <p className="mt-1 text-sm text-slate-500">Here’s a quick view of your TapTime account.</p>
            </div>
            <div className="inline-flex max-w-full items-center gap-2 self-start break-all rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm sm:self-auto">
              <Building2 className="h-3.5 w-3.5 text-[#01005a]" />
              Company ID: {companyId}
            </div>
          </div>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:rounded-2xl">
            <div className="h-24 bg-gradient-to-r from-[#01005a] via-[#15157c] to-[#2b5bb6] sm:h-28" />
            <div className="px-4 pb-5 sm:px-8 sm:pb-8">
              <div className="-mt-12 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-slate-100 text-2xl font-bold text-[#01005a] shadow-md sm:h-32 sm:w-32 sm:text-3xl">
                    {initials || <User className="h-10 w-10" />}
                  </div>
                  <div className="min-w-0 pb-1 ">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Employee profile</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <h2 className="break-words text-xl font-bold tracking-tight text-slate-900 sm:text-3xl sm:text-white">{employee.first_name} {employee.last_name}</h2>
                      {employee.is_active && <BadgeCheck className="h-5 w-5 text-blue-600" aria-label="Verified active employee" />}
                    </div>
                    <p className="pt-3 text-sm font-medium text-slate-500">
                      Employee ID <span className="font-mono text-slate-700">{employeeCode}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                        <RoleIcon className="h-3.5 w-3.5" /> {roleLabel}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${employee.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${employee.is_active ? "bg-emerald-500" : "bg-red-500"}`} />
                        {employee.is_active ? "Active account" : "Inactive account"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            <DashboardCard
              icon={Timer}
              label="Today’s status"
              value="Ready to check in"
              detail="No active time entry"
              accent="text-emerald-600 bg-emerald-50"
            />
            <DashboardCard
              icon={Clock3}
              label="Scheduled shift"
              value="09:00 AM – 06:00 PM"
              detail="Standard work schedule"
              accent="text-blue-600 bg-blue-50"
            />
            <DashboardCard
              icon={BadgeCheck}
              label="Account status"
              value={employee.is_active ? "Active" : "Inactive"}
              detail={employee.is_active ? "Your access is enabled" : "Please contact your administrator"}
              accent={employee.is_active ? "text-violet-600 bg-violet-50" : "text-red-600 bg-red-50"}
              className="sm:col-span-2 lg:col-span-1"
            />
          </section>

         

          <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 md:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
              <h3 className="text-base font-semibold text-slate-900">Contact information</h3>
              <p className="mt-1 text-sm text-slate-500">The contact details associated with your account.</p>
              <div className="mt-5 space-y-4">
                <DetailRow icon={Mail} label="Email address" value={employee.email || "Not provided"} />
                <DetailRow icon={Phone} label="Phone number" value={formatPhone(employee.phone_number)} />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
              <h3 className="text-base font-semibold text-slate-900">Account information</h3>
              <p className="mt-1 text-sm text-slate-500">Your access and employee record details.</p>
              <div className="mt-5 space-y-4">
                <DetailRow icon={Hash} label="Employee PIN" value="••••" mono />
                <DetailRow icon={Building2} label="Company ID" value={companyId} mono />
              </div>
            </section>
          </div>
        </div>
      </main>

      <EmployeeFooter />
    </div>
  );
};

const DetailRow = ({ icon: Icon, label, value, mono = false }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#01005a]">
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-0.5 break-all text-sm font-medium text-slate-800 ${mono ? "font-mono tracking-wide" : ""}`}>{value}</p>
    </div>
  </div>
);

const getEntryMinutes = (entry) => {
  if (entry.TimeWorked) {
    const [hours, minutes] = String(entry.TimeWorked).split(":").map(Number);
    if (Number.isFinite(hours) && Number.isFinite(minutes)) return (hours * 60) + minutes;
  }
  const checkIn = new Date(entry.CheckInTime);
  const checkOut = entry.CheckOutTime ? new Date(entry.CheckOutTime) : new Date();
  const minutes = Math.floor((checkOut - checkIn) / 60000);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
};

const formatMinutes = (minutes) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;

const formatReportDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
};



const ReportStat = ({ label, value }) => <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{value}</p></div>;

const DashboardCard = ({ icon: Icon, label, value, detail, accent, className = "" }) => (
  <article className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5 ${className}`}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
        <p className="mt-1 text-sm text-slate-500">{detail}</p>
      </div>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </article>
);

const EmployeeFooter = () => (
  <footer className="mt-4 bg-gradient-to-r from-[#01005a] via-[#15157c] to-[#123b80] text-white sm:mt-6">
    <div className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-semibold tracking-tight">TapTime Employee Portal</p>
          <p className="mt-1 text-sm leading-6 text-blue-100">A simpler way to stay connected with your workday.</p>
        </div>
        <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-200">Need assistance?</p>
          <a href="mailto:contact@tap-time.com" className="mt-1 inline-block text-sm font-semibold text-white transition-colors hover:text-blue-200">
            Contact TapTime Support →
          </a>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-2 border-t border-white/15 pt-4 text-xs text-blue-200 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} TapTime by Arjava Technologies. All rights reserved.</p>
        <p>Employee access portal</p>
      </div>
    </div>
  </footer>
);

export default EmployeeDetails;
