import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import DashboardNavigation from '../components/DashboardNavigation';
import Footer from '../components/Footer';

const ReportSettings = () => {
  const [reportSettings, setReportSettings] = useState([]);
  const [reportViewSettings, setReportViewSettings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    frequency: []
  });
  const [updateData, setUpdateData] = useState({
    frequency: []
  });
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);
  const [showUpdateFrequencyDropdown, setShowUpdateFrequencyDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const companyID = localStorage.getItem('companyID');
    if (!companyID) {
      navigate('/login');
      return;
    }
    loadReportSettings();
    loadReportViewSettings();
  }, [navigate]);



  const loadReportSettings = async () => {
    setLoading(true);
    try {
      const companyID = localStorage.getItem('companyID');
      const response = await fetch(`https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/company-report-type/getAllReportEmail/${companyID}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.error) {
          setReportSettings([]);
        } else {
          setReportSettings(Array.isArray(data) ? data : []);
        }
      } else {
        setReportSettings([]);
      }
    } catch (error) {
      setReportSettings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadReportViewSettings = async () => {
    try {
      const companyID = localStorage.getItem('companyID');
      const response = await fetch(`https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/report_view_setting/getAll/${companyID}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.error !== "No report view settings found !") {
          setReportViewSettings(Array.isArray(data) ? data : []);
        }
      } else {
        setReportViewSettings([]);
      }
    } catch (error) {
      setReportViewSettings([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFrequencyChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      frequency: checked 
        ? [...prev.frequency, value]
        : prev.frequency.filter(freq => freq !== value)
    }));
  };

  const handleUpdateFrequencyChange = (e) => {
    const { value, checked } = e.target;
    setUpdateData(prev => ({
      ...prev,
      frequency: checked 
        ? [...prev.frequency, value]
        : prev.frequency.filter(freq => freq !== value)
    }));
  };

  const addReportSetting = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const companyID = localStorage.getItem('companyID');
      
      const settingData = {
        CID: companyID,
        Email: formData.email,
        Frequency: formData.frequency.join(','),
        LastModifiedBy: 'Admin'
      };

      const response = await fetch('https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/report_setting/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settingData)
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({
          email: '',
          frequency: []
        });
        loadReportSettings();
      }
    } catch (error) {
      console.error('Error adding report setting:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReportViewSetting = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const companyID = localStorage.getItem('companyID');
      
      const settingData = {
        CID: companyID,
        Frequency: updateData.frequency.join(','),
        LastModifiedBy: 'Admin'
      };

      const response = await fetch('https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/report_view_setting/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settingData)
      });

      if (response.ok) {
        setShowUpdateModal(false);
        setUpdateData({
          frequency: []
        });
        loadReportViewSettings();
      }
    } catch (error) {
      console.error('Error updating report view setting:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteReportSetting = async (email) => {
    if (window.confirm('Are you sure you want to delete this report setting?')) {
      try {
        const companyID = localStorage.getItem('companyID');
        const response = await fetch(`https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/report_setting/delete/${email}/${companyID}/Admin`, {
          method: 'PUT'
        });

        if (response.ok) {
          loadReportSettings();
        }
      } catch (error) {
        console.error('Error deleting report setting:', error);
      }
    }
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
        <div className="container mt-5">
          <div className="emp-list">
            <div className="row">
              <div className="col-6">
                <h3 className="fw-bold mb-3 report-setting-head">Report Settings</h3>
              </div>
              <div className="col-6">
                <span style={{ float: 'right' }}>
                  <Button
                    className="btn float-end addEntryBtnStyle"
                    onClick={() => setShowAddModal(true)}
                  >
                    Add Entry
                  </Button>
                </span>
              </div>
            </div>

            <div className="emp-table table-responsive">
              <div className="custom-table-container">
                <table className="table custom-table">
                  <thead>
                    <tr>
                      <th style={{ borderBottom: '1px solid #cdcdcd' }}>Email</th>
                      <th style={{ borderBottom: '1px solid #cdcdcd' }}>Frequency</th>
                      <th style={{ borderBottom: '1px solid #cdcdcd' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportSettings.map((setting, index) => (
                      <tr key={index}>
                        <td>{setting.Email}</td>
                        <td>{setting.Frequency}</td>
                        <td>
                          <Button
                            onClick={() => deleteReportSetting(setting.Email)}
                            style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                          >
                            <i className="fas fa-trash" style={{ color: '#02066F', fontSize: '20px' }}></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <h3 className="fw-bold mb-4 mt-5 report-view-style" style={{ marginLeft: '155px' }}>
              Report View Settings
            </h3>

            <div className="emp-table table-responsive">
              <div className="custom-table-container">
                <table className="table custom-table">
                  <thead>
                    <tr>
                      <th style={{ borderBottom: '1px solid #cdcdcd' }}>Frequency</th>
                      <th style={{ borderBottom: '1px solid #cdcdcd' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportViewSettings.map((setting, index) => (
                      <tr key={index}>
                        <td>{setting.Frequency}</td>
                        <td>
                          <Button
                            onClick={() => setShowUpdateModal(true)}
                            className="btn btn-green"
                          >
                            Update
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Add Report Setting Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => { setShowAddModal(false); setShowFrequencyDropdown(false); }}>
          <div className="modal-dialog" onClick={(e) => { e.stopPropagation(); setShowFrequencyDropdown(false); }}>
            <div className="modal-content" style={{ width: '350px' }}>
              <div className="modal-header">
                <h5 className="modal-title fw-bold" style={{ textAlign: 'center', width: '100%' }}>
                  Report Details
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={addReportSetting} className="p-2 text-center">
                  <Input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="all-input-style mb-3"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />

                  <div className="all-input-style mb-3 frequency-dropdown-container" style={{ textAlign: 'left', padding: '10px', position: 'relative' }}>
                    <label>Select Frequency:</label>
                    <div 
                      className="form-control" 
                      style={{ cursor: 'pointer', minHeight: '38px', display: 'flex', alignItems: 'center' }}
                      onClick={() => setShowFrequencyDropdown(!showFrequencyDropdown)}
                    >
                      {formData.frequency.length > 0 ? formData.frequency.join(', ') : 'Select frequencies...'}
                    </div>
                    {showFrequencyDropdown && (
                      <div 
                        className="dropdown-menu show" 
                        style={{ position: 'absolute', top: '100%', left: '0', right: '0', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
                      >
                        {['Daily', 'Weekly', 'Biweekly', 'Monthly', 'Bimonthly'].map(freq => (
                          <div key={freq} className="dropdown-item" style={{ padding: '8px 12px' }}>
                            <input
                              className="form-check-input me-2"
                              type="checkbox"
                              value={freq}
                              id={freq}
                              onChange={handleFrequencyChange}
                              checked={formData.frequency.includes(freq)}
                            />
                            <label className="form-check-label" htmlFor={freq} style={{ cursor: 'pointer' }}>
                              {freq}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="settings-btn-sty btn btn-green mt-2"
                    disabled={loading || !formData.email || formData.frequency.length === 0}
                  >
                    Save
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Report View Setting Modal */}
      {showUpdateModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => { setShowUpdateModal(false); setShowUpdateFrequencyDropdown(false); }}>
          <div className="modal-dialog" onClick={(e) => { e.stopPropagation(); setShowUpdateFrequencyDropdown(false); }}>
            <div className="modal-content" style={{ width: '350px' }}>
              <div className="modal-header">
                <h5 className="modal-title fw-bold" style={{ textAlign: 'center', width: '100%' }}>
                  Report Details
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowUpdateModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={updateReportViewSetting} className="p-2 text-center">
                  <div className="all-input-style mb-3 frequency-dropdown-container" style={{ textAlign: 'left', padding: '10px', position: 'relative' }}>
                    <label>Select Frequency:</label>
                    <div 
                      className="form-control" 
                      style={{ cursor: 'pointer', minHeight: '38px', display: 'flex', alignItems: 'center' }}
                      onClick={() => setShowUpdateFrequencyDropdown(!showUpdateFrequencyDropdown)}
                    >
                      {updateData.frequency.length > 0 ? updateData.frequency.join(', ') : 'Select frequencies...'}
                    </div>
                    {showUpdateFrequencyDropdown && (
                      <div 
                        className="dropdown-menu show" 
                        style={{ position: 'absolute', top: '100%', left: '0', right: '0', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
                      >
                        {['Weekly', 'Biweekly', 'Monthly', 'Bimonthly'].map(freq => (
                          <div key={freq} className="dropdown-item" style={{ padding: '8px 12px' }}>
                            <input
                              className="form-check-input me-2"
                              type="checkbox"
                              value={freq}
                              id={`update-${freq}`}
                              onChange={handleUpdateFrequencyChange}
                              checked={updateData.frequency.includes(freq)}
                            />
                            <label className="form-check-label" htmlFor={`update-${freq}`} style={{ cursor: 'pointer' }}>
                              {freq}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="settings-btn-sty btn btn-green"
                    disabled={loading || updateData.frequency.length === 0}
                  >
                    Update
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default ReportSettings;