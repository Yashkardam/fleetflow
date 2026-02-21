import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DriverProfiles() {
  const [drivers, setDrivers] = useState([]);
  const [formData, setFormData] = useState({ name: '', license_expiry: '' });
  const [errorMessage, setErrorMessage] = useState('');

  const fetchDrivers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/drivers');
      setDrivers(response.data);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await axios.post('http://localhost:5000/api/drivers', formData);
      setFormData({ name: '', license_expiry: '' }); 
      fetchDrivers(); 
    } catch (error) {
      setErrorMessage("Error adding driver. Please check your inputs.");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/drivers/${id}/status`, { status: newStatus });
      fetchDrivers();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const inputStyle = { background: '#050b14', color: '#fff', border: '1px solid #1b4965', padding: '12px', borderRadius: '4px', outline: 'none', flex: 1 };
  const btnStyle = { background: '#0077b6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
  const selectStyle = { background: '#050b14', color: '#fff', border: '1px solid #1b4965', padding: '6px', borderRadius: '4px', outline: 'none', cursor: 'pointer' };

  return (
    <div>
      <h2 style={{ color: '#e0e1dd', marginBottom: '30px', fontWeight: '400' }}>Driver Performance & Safety Profiles</h2>
      
      {errorMessage && <div style={{ padding: '12px', marginBottom: '20px', background: '#450a0a', border: '1px solid #7f1d1d', color: '#fca5a5', borderRadius: '4px' }}>{errorMessage}</div>}

      <div style={{ background: '#0a111c', border: '1px solid #1b4965', padding: '24px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3 style={{ color: '#00a8e8', marginTop: 0, marginBottom: '20px' }}>Onboard New Driver</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Driver Name (e.g., Alex Mercer)" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={inputStyle} />
          <input type="date" required value={formData.license_expiry} onChange={(e) => setFormData({...formData, license_expiry: e.target.value})} title="License Expiry Date" style={inputStyle} />
          <button type="submit" style={btnStyle}>Add Driver</button>
        </form>
      </div>

      <div style={{ background: '#0a111c', border: '1px solid #1b4965', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#023e8a', color: '#fff' }}>
              <th style={{ padding: '16px' }}>ID</th>
              <th>Name</th>
              <th>License Expiry</th>
              <th>Safety Score</th>
              <th>Completion Rate</th>
              <th>Status Action</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => {
              const isExpired = new Date(d.license_expiry) < new Date();
              // Calculate completion percentage safely
              const completionRate = d.total_trips > 0 
                ? Math.round((Number(d.completed_trips) / Number(d.total_trips)) * 100) 
                : 0;

              return (
              <tr key={d.id} style={{ borderBottom: '1px solid #1b4965', color: '#e0e1dd', opacity: d.status === 'Suspended' ? 0.6 : 1 }}>
                <td style={{ padding: '16px' }}>{d.id}</td>
                <td>{d.name}</td>
                <td style={{ color: isExpired ? '#ef4444' : '#10b981', fontWeight: isExpired ? 'bold' : 'normal' }}>
                  {new Date(d.license_expiry).toLocaleDateString()} {isExpired && " ⚠️ EXPIRED"}
                </td>
                <td style={{ color: d.safety_score < 75 ? '#ef4444' : '#e0e1dd' }}>
                  {d.safety_score} / 100
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>{completionRate}%</span>
                    <span style={{ fontSize: '11px', color: '#8d99ae' }}>({d.completed_trips}/{d.total_trips})</span>
                  </div>
                </td>
                <td>
                  <select 
                    value={d.status} 
                    onChange={(e) => handleStatusChange(d.id, e.target.value)}
                    style={{
                      ...selectStyle,
                      borderColor: d.status === 'On Duty' ? '#0077b6' : d.status === 'Suspended' ? '#ef4444' : '#8d99ae',
                      color: d.status === 'On Duty' ? '#00a8e8' : d.status === 'Suspended' ? '#ef4444' : '#8d99ae'
                    }}
                  >
                    <option value="On Duty">🟢 On Duty</option>
                    <option value="Off Duty">⚪ Off Duty</option>
                    <option value="Suspended">🔴 Suspended</option>
                  </select>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
}