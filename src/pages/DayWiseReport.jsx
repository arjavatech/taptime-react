import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import DashboardNavigation from '../components/DashboardNavigation';
import Footer from '../components/Footer';

const DayWiseReport = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [showTable, setShowTable] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const companyID = localStorage.getItem('companyID');
    if (!companyID) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    
    if (date) {
      loadDayWiseReport(date);
    } else {
      setShowTable(false);
      setReports([]);
    }
  };

  const loadDayWiseReport = async (date) => {
    setLoading(true);
    try {
      const companyID = localStorage.getItem('companyID');
      const response = await fetch(`https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/checkin/getByDate/${companyID}/${date}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.error !== "No check-ins found for the given date!") {
          setReports(Array.isArray(data) ? data : []);
          setShowTable(true);
        } else {
          setReports([]);
          setShowTable(true);
        }
      }
    } catch (error) {
      console.error('Error loading day wise report:', error);
      setReports([]);
      setShowTable(true);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const calculateWorkedHours = (checkinTime, checkoutTime) => {
    if (!checkinTime || !checkoutTime) return 'N/A';
    
    const checkin = new Date(checkinTime);
    const checkout = new Date(checkoutTime);
    const diffMs = checkout - checkin;
    
    if (diffMs <= 0) return 'N/A';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const downloadPdf = () => {
    // PDF download functionality would be implemented here
    console.log('Download PDF functionality');
  };

  const downloadCsv = () => {
    // CSV download functionality would be implemented here
    console.log('Download CSV functionality');
  };

  return (
    <>
      <DashboardNavigation />
      
      {loading && (
        <div className="overlay" style={{ display: 'flex' }}>
          <div className="spinner"></div>
        </div>
      )}

      <section>
        <div className="container-fluid pt-2 pb-2 bg-white">
          <div className="row">
            <div className="container">
              <div className="row">
                <div className="list-container d-flex flex-wrap justify-content-end">
                  <div className="list-item unselect">
                    <a href="/report-summary" style={{ textDecoration: 'none', color: 'inherit' }}>
                      Todays Report
                    </a>
                  </div>
                  <div className="list-item current">Day Wise Report</div>
                  <div className="list-item unselect">
                    <a href="/salaried-report" style={{ textDecoration: 'none', color: 'inherit' }}>
                      Salaried Report
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mt-5">
          <div className="d-flex justify-content-center mt-2">
            <Input
              type="date"
              className="date pt-1 pb-1"
              value={selectedDate}
              onChange={handleDateChange}
              style={{
                width: '200px',
                paddingLeft: '10px',
                borderRadius: '5px',
                borderColor: '#cdcdcd'
              }}
            />
          </div>
          
          <div className="emp-table table-responsive mt-5">
            {!selectedDate && (
              <p style={{ textAlign: 'center' }}>Please select a date to show report.</p>
            )}
            
            {showTable && (
              <div className="custom-table-container mt-15" style={{ display: 'block' }}>
                {reports.length > 0 && (
                  <div className="d-flex justify-content-center gap-3 mb-3">
                    <Button
                      className="btn addEntryBtnStyle employee-add-entry"
                      onClick={downloadPdf}
                    >
                      Download PDF
                    </Button>
                    <Button
                      className="btn addEntryBtnStyle employee-add-entry"
                      onClick={downloadCsv}
                    >
                      Download CSV
                    </Button>
                  </div>
                )}

                <table className="table custom-table table-bordered mt-15">
                  <thead>
                    <tr>
                      <th>Employee Name</th>
                      <th>Employee ID</th>
                      <th>Check-in Time</th>
                      <th>Check-out Time</th>
                      <th>Time Worked Hours (HH:MM)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.length > 0 ? (
                      reports.map((report, index) => (
                        <tr key={index}>
                          <td>{report.FName} {report.LName}</td>
                          <td>{report.Pin}</td>
                          <td>{formatTime(report.CheckinTime)}</td>
                          <td>{formatTime(report.CheckoutTime)}</td>
                          <td>{calculateWorkedHours(report.CheckinTime, report.CheckoutTime)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                          No data found for the selected date.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default DayWiseReport;