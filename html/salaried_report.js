const apiUrlBase = 'https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/report/dateRangeReportGet';

const sidebar = document.getElementById('sidebar');
const toggler = document.querySelector('.navbar-toggler');

// Toggle sidebar open/close
toggler.addEventListener('click', function () {
  sidebar.classList.toggle('open');
});

document.addEventListener('click', function (event) {
  const isClickInside = sidebar.contains(event.target) || toggler.contains(event.target);
  if (!isClickInside) {
    sidebar.classList.remove('open');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const selectedValue = localStorage.getItem("reportType");
  console.log("Selected Report Type:", selectedValue);
  document.getElementById("reportName").textContent = `${selectedValue} Report`;
  document.getElementById("report-type-heading").textContent = `${selectedValue} Report`;

  const currentLocation = location.href;
  const menuItems = document.querySelectorAll('.sidebar a');

  menuItems.forEach(item => {
    if (item.href === currentLocation) {
      item.classList.add('active');
    }
  });

  const yearSelect = document.getElementById('yearInput');
  const monthSelect = document.getElementById('monthInput');

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  for (let year = 2025; year <= currentYear; year++) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }

  const monthNames = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];
  monthNames.forEach((month, index) => {
    const option = document.createElement('option');
    option.value = index + 1;
    option.textContent = month;
    monthSelect.appendChild(option);
  });

  if (currentMonth === 1) {
    yearSelect.value = currentYear - 1;
    monthSelect.value = 12;
  } else {
    yearSelect.value = currentYear;
    monthSelect.value = currentMonth - 1;
  }

  populateWeekDropdown(parseInt(yearSelect.value), parseInt(monthSelect.value));
  viewDateRangewiseReport();
  toggleHalfVisibility(); // ✅ Add this
});

function viewDateRangewiseReport() {
  document.querySelector(".overlay").style.display = "flex";
  const selectedValue = localStorage.getItem("reportType");
  const showReports = document.getElementById("showTheReports");
  showReports.innerHTML = "";
  // document.getElementById("tbody").innerHTML = "";

  const getMonth = parseInt(document.getElementById("monthInput").value);
  const getYear = parseInt(document.getElementById("yearInput").value);
  const cid = localStorage.getItem("companyID");

  const weekSelect = document.getElementById("weekInput");
  weekSelect.innerHTML = "";

  // 🟢 BEGIN Weekly Block
  if (selectedValue === "Weekly") {
    const startOfMonth = new Date(getYear, getMonth - 1, 1);
    const lastDay = new Date(getYear, getMonth, 0);

    const weekRanges = [];
    let weekCounter = 1;

    let current = new Date(startOfMonth);
    // find first Monday
    while (current.getDay() !== 1 && current <= lastDay) {
      current.setDate(current.getDate() + 1);
    }

    while (true) {
      const start = new Date(current);
      const end = new Date(current);
      end.setDate(end.getDate() + 6);

      // ⚠️ Break if end goes into next month
      if (end.getMonth() !== start.getMonth()) break;

      const startStr = formatDate(start);
      const endStr = formatDate(end);

      const label = `Week ${weekCounter}: ${formatDisplayDate(start)} - ${formatDisplayDate(end)} (Mon - Sun)`;

      // populate dropdown
      const option = document.createElement("option");
      option.value = weekRanges.length;
      option.textContent = label;
      weekSelect.appendChild(option);

      weekRanges.push({ startRange: startStr, endRange: endStr });
      weekCounter++;

      // move to next week
      current = new Date(end);
      current.setDate(current.getDate() + 1);
      if (current > lastDay) break;
    }

    document.getElementById("weekInputWrapper").style.display = "block";

    // load first week
    if (weekRanges.length > 0) {
      weekSelect.value = 0;
      const first = weekRanges[0];
      document.getElementById("start-date-header").innerText = first.startRange;
      document.getElementById("end-date-header").innerText = first.endRange;
      loadReportTable(first.startRange, first.endRange, cid);
    }

    // dropdown on change
    weekSelect.onchange = () => {
      const idx = parseInt(weekSelect.value);
      const r = weekRanges[idx];
      document.getElementById("start-date-header").innerText = r.startRange;
      document.getElementById("end-date-header").innerText = r.endRange;
      loadReportTable(r.startRange, r.endRange, cid);
    }

    // ❌ END Weekly Block
  } 
  else if (selectedValue === "Bimonthly") {
    document.getElementById("weekInputWrapper").style.display = "none";
    const halfValue = document.getElementById("halfInput").value;
    const daysInMonth = new Date(getYear, getMonth, 0).getDate();
    const mid = Math.ceil(daysInMonth / 2);
    const firstHalf = {
      startRange: `${getYear}-${pad(getMonth)}-01`,
      endRange: `${getYear}-${pad(getMonth)}-${pad(mid)}`
    };
    const secondHalf = {
      startRange: `${getYear}-${pad(getMonth)}-${pad(mid + 1)}`,
      endRange: `${getYear}-${pad(getMonth)}-${pad(daysInMonth)}`
    };
    const sel = halfValue === "first" ? firstHalf : secondHalf;
    document.getElementById("start-date-header").innerText = sel.startRange;
    document.getElementById("end-date-header").innerText = sel.endRange;
    loadReportTable(sel.startRange, sel.endRange, cid);

  } 
  else if (selectedValue === "Monthly") {
    document.getElementById("weekInputWrapper").style.display = "none";
    const daysInMonth = new Date(getYear, getMonth, 0).getDate();
    const start = `${getYear}-${pad(getMonth)}-01`;
    const end = `${getYear}-${pad(getMonth)}-${pad(daysInMonth)}`;
    document.getElementById("start-date-header").innerText = start;
    document.getElementById("end-date-header").innerText = end;
    loadReportTable(start, end, cid);

  } else if (selectedValue === "Biweekly") {
    document.getElementById("weekInputWrapper").style.display = "none";
    document.getElementById("add-entry-year-month").style.display = "none";
    const today = new Date();
    const end = new Date(today);
    const start = new Date(today);
    start.setDate(end.getDate() - 13);
    const s = formatDate(start);
    const e = formatDate(end);
    document.getElementById("start-date-header").innerText = s;
    document.getElementById("end-date-header").innerText = e;
    loadReportTable(s, e, cid);

  } else {
    document.getElementById("weekInputWrapper").style.display = "none";
  }
  document.getElementById("overlay").style.display = "none";
}


document.getElementById('halfInput').addEventListener('change', viewDateRangewiseReport);
// Removed weekInput global listener - it conflicts with the inline onchange handler set in viewDateRangewiseReport()



function loadReportTable(startVal, endVal, cid) {
  console.log(`Loading report table for CID: ${cid}, Start: ${startVal}, End: ${endVal}`);
  document.querySelector(".overlay").style.display = "flex";

  function render(data) {
    const tbody = document.getElementById('tbody');
    if (!tbody) {
      console.error("Table body element '#tbody' not found.");
      return;
    }

    tbody.innerHTML = ''; // Clear old rows

    if (!data || data.length === 0) {
      const noDataRow = document.createElement('tr');
      noDataRow.innerHTML = `<td colspan="3" class="text-center">No data available</td>`;
      tbody.appendChild(noDataRow);
      document.getElementById('download-buttons').style.display = 'none';
      window.reportData = [];
      return;
    }

    // Consolidate employees and calculate total hours
    const totalTimeWorked = calculateTotalTimeWorked(data);

    // Prepare data for download (PDF/CSV)
    window.reportData = Object.entries(totalTimeWorked).map(([pin, emp]) => ({
      Name: emp.name,
      Pin: pin,
      TotalHours: emp.totalHoursWorked
    }));

    // Render consolidated data
    Object.entries(totalTimeWorked).forEach(([pin, emp]) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${emp.name}</td>
        <td>${pin}</td>
        <td>${emp.totalHoursWorked}</td>
      `;
      tbody.appendChild(row);
    });

    document.getElementById('download-buttons').style.display = 'flex';
  }

  // Always fetch fresh data from API
  const apiUrl = `${apiUrlBase}/${cid}/${startVal}/${endVal}`;
  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      // Check if API returned an error object
      if (data && data.error) {
        console.error('API Error:', data.error);
        render([]);
      } else {
        render(data || []);
      }
      document.querySelector(".overlay").style.display = "none";
    })
    .catch((error) => {
      console.error('Fetch Error:', error);
      render([]);
      document.querySelector(".overlay").style.display = "none";
    });
}


function renderReportTable(data, tableBody) {
  const totalTimeWorked = calculateTotalTimeWorked(data);

  if (!data || data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="3" class="text-center">No Records Found</td></tr>`;
    document.getElementById("download-buttons").style.display = "none";
    return;
  }

  Object.entries(totalTimeWorked).forEach(([pin, emp]) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${emp.name}</td>
      <td>${pin}</td>
      <td>${emp.totalHoursWorked}</td>
    `;
    tableBody.appendChild(row);
  });

  $('#employeeTable').DataTable();
  document.getElementById("download-buttons").style.display = "flex";
}


function pad(n) {
  return n.toString().padStart(2, '0');
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDisplayDate(date) {
  return `${pad(date.getDate())} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
}






function toggleHalfVisibility() {
  const type = localStorage.getItem("reportType");
  const weekWrapper = document.getElementById("weekInputWrapper");
  const halfWrapper = document.getElementById("halfInputWrapper");

  weekWrapper.style.display = (type === "Weekly") ? "inline-block" : "none";
  halfWrapper.style.display = (type === "Bimonthly") ? "inline-block" : "none";

}

function populateWeekDropdown(year, month) {
  const weekSelect = document.getElementById('weekInput');
  weekSelect.innerHTML = '';

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  let current = new Date(firstDay);
  let weekCount = 0;

  while (current <= lastDay) {
    if (current.getDay() === 1) { // Only if it's Monday
      weekCount++;
      const option = document.createElement('option');
      option.value = weekCount;
      option.textContent = `Week ${weekCount}`;
      weekSelect.appendChild(option);
    }
    current.setDate(current.getDate() + 1);
  }
}

// Weekly Report Date Calculation
function getWeeklyReport(year, month) {
  const weekNum = parseInt(document.getElementById("weekInput").value);

  const firstDay = new Date(year, month - 1, 1);
  while (firstDay.getDay() !== 1) {
    firstDay.setDate(firstDay.getDate() + 1);
  }

  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() + (weekNum - 1) * 7);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const lastDayOfMonth = new Date(year, month, 0);
  const format = (d) => d.toISOString().split("T")[0];

  return {
    startRange: format(startDate),
    endRange: format(endDate > lastDayOfMonth ? lastDayOfMonth : endDate)
  };
}



function getLastTwoWeeksDateRange() {
  let today = new Date();
  let currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
  let startDate = new Date(currentWeekStart);
  startDate.setDate(currentWeekStart.getDate() - 14);
  let endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 13);

  let formatDate = (date) => date.toISOString().split('T')[0];

  let startDateStr = formatDate(startDate);
  let endDateStr = formatDate(endDate);

  return {
    startRange: startDateStr,
    endRange: endDateStr
  };
}


function getBimonthlyReport(year, month) {
  const selectedHalf = document.getElementById("halfInput")?.value || "first";
  const daysInMonth = new Date(year, month, 0).getDate(); // full days in month
  const mid = Math.ceil(daysInMonth / 2);

  let startDate, endDate;

  if (selectedHalf === "first") {
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month - 1, mid);
  } else {
    startDate = new Date(year, month - 1, mid + 1);
    endDate = new Date(year, month - 1, daysInMonth);
  }

  const pad = (n) => n.toString().padStart(2, '0');

  return {
    startRange: `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`,
    endRange: `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`
  };
}


function getMonthlyReport(year, month) {
  const today = new Date();
  // const startDateLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  // const endDateLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  const startDateLastMonth = new Date(year, month - 1, 1);
  const endDateLastMonth = new Date(year, month, 0);

  return {
    startRange: formatDate(startDateLastMonth),
    endRange: formatDate(endDateLastMonth)
  };
}


// Functions to convert time and calculate totals
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}


// When I click Logo go to home page 
function calculateTotalTimeWorked(data) {
  const employeeTimes = {};

  data.forEach(entry => {
    const { Name, Pin, CheckInTime, CheckOutTime } = entry;

    if (!Name || !Pin || !CheckInTime) {

      return;
    }

    // Convert CheckInTime and CheckOutTime to Date objects
    const checkInDate = new Date(CheckInTime);
    const checkOutDate = CheckOutTime ? new Date(CheckOutTime) : new Date(); // Use current time if CheckOutTime is null

    const timeDifferenceInMinutes = Math.floor((checkOutDate - checkInDate) / 1000 / 60); // Convert time difference to minutes

    if (!employeeTimes[Pin]) {
      employeeTimes[Pin] = { name: Name, totalMinutes: 0 };
    }

    employeeTimes[Pin].totalMinutes += timeDifferenceInMinutes;
  });

  // Convert totalMinutes to HH:MM format
  for (const [pin, details] of Object.entries(employeeTimes)) {
    details.totalHoursWorked = minutesToTime(details.totalMinutes);
  }

  return employeeTimes;
}

function homePage() {
  const modalElement = document.getElementById('homePageModal');
  const modalInstance = new bootstrap.Modal(modalElement);
  modalInstance.show();
}

document.getElementById('homePageYes').addEventListener('click', function () {
  window.open('index.html', 'noopener, noreferrer');
})

function downloadPdf() {
  if (!window.reportData || window.reportData.length === 0) {
    alert('No data to download.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const selectedValue = localStorage.getItem('reportType');
  const startDate = document.getElementById('start-date-header').textContent;
  const endDate = document.getElementById('end-date-header').textContent;

  doc.setFontSize(16);
  doc.text(`${selectedValue} Report (${startDate} to ${endDate})`, 14, 20);

  const columns = ['Name', 'Pin', 'Total Worked Hours (HH:MM)'];

  const data = window.reportData.map(element => [
    element.Name,
    element.Pin,
    element.TotalHours
  ]);

  doc.autoTable({
    head: [columns],
    body: data,
    startY: 30,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [2, 6, 111] }
  });

  doc.save(`${selectedValue.toLowerCase()}_report.pdf`);
}

function downloadCsv() {
  if (!window.reportData || window.reportData.length === 0) {
    alert('No data to download.');
    return;
  }

  const headers = ['Name', 'Pin', 'Total Worked Hours (HH:MM)'];

  const csvData = window.reportData.map(element => [
    element.Name,
    element.Pin,
    element.TotalHours
  ]);

  let csvContent = headers.join(',') + '\n';
  csvData.forEach(row => {
    csvContent += row.join(',') + '\n';
  });

  const selectedValue = localStorage.getItem('reportType');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${selectedValue.toLowerCase()}_report.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
