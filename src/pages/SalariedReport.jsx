import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import DashboardNavigation from '../components/DashboardNavigation';
import Footer from '../components/Footer';

const SalariedReport = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportType, setReportType] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const companyID = localStorage.getItem('companyID');
    if (!companyID) {
      navigate('/login');
      return;
    }
    
    const reportTypeFromStorage = localStorage.getItem('reportType') || 'Weekly';
    setReportType(reportTypeFromStorage);
    
    // Set default date range based on report type
    const today = new Date();
    const endDateStr = today.toISOString().split('T')[0];
    let startDateStr = '';
    
    switch (reportTypeFromStorage) {
      case 'Weekly':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        startDateStr = weekStart.toISOString().split('T')[0];
        break;
      case 'Biweekly':
        const biweekStart = new Date(today);
        biweekStart.setDate(today.getDate() - 14);
        startDateStr = biweekStart.toISOString().split('T')[0];
        break;
      case 'Monthly':
        const monthStart = new Date(today);
        monthStart.setMonth(today.getMonth() - 1);
        startDateStr = monthStart.toISOString().split('T')[0];
        break;
      case 'Bimonthly':
        const bimonthStart = new Date(today);
        bimonthStart.setMonth(today.getMonth() - 2);
        startDateStr = bimonthStart.toISOString().split('T')[0];
        break;
      default:
        startDateStr = endDateStr;
    }
    
    setStartDate(startDateStr);
    setEndDate(endDateStr);
    
    loadSalariedReport(startDateStr, endDateStr);
  }, [navigate]);

  const loadSalariedReport = async (start, end) => {
    setLoading(true);
    try {
      const companyID = localStorage.getItem('companyID');
      const response = await fetch(`https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/checkin/getSalariedReport/${companyID}/${start}/${end}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.error !== "No data found for the given date range!") {
          setReports(Array.isArray(data) ? data : []);
        } else {
          setReports([]);
        }
      }
    } catch (error) {
      console.error('Error loading salaried report:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTotalHours = (totalMinutes) => {
    if (!totalMinutes || totalMinutes === 0) return '00:00';
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
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
                  <div className="list-item unselect">
                    <a href="/day-wise-report" style={{ textDecoration: 'none', color: 'inherit' }}>
                      Day Wise Report
                    </a>
                  </div>
                  <div className="list-item current">Salaried Report</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mt-5 mb-5">
          <h5 className="text-center fw-bold">{reportType} Report</h5>

          <div className="emp-table table-responsive mt-5">
            <div className="row">
              <div className="col-sm-6">
                <h5 className="Date start-date-sty">Start Date: <span>{startDate}</span></h5>
              </div>
              <div className="col-sm-6">
                <h5 className="Date end-date-sty">End Date: <span>{endDate}</span></h5>
              </div>
            </div>
            
            <div className="custom-table-container">
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

              <table className="table custom-table table-bordered">
                <thead>
                  <tr>
                    <th style={{ borderBottom: '1px solid #cdcdcd' }}>Name</th>
                    <th style={{ borderBottom: '1px solid #cdcdcd' }}>Pin</th>
                    <th style={{ borderBottom: '1px solid #cdcdcd' }}>Total Worked Hours (HH:MM)</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length > 0 ? (
                    reports.map((report, index) => (
                      <tr key={index}>
                        <td>{report.FName} {report.LName}</td>
                        <td>{report.Pin}</td>
                        <td>{formatTotalHours(report.TotalWorkedMinutes)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                        No data found for the selected date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default SalariedReport;