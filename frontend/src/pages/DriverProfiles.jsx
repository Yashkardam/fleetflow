import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DriverProfiles() {
  const [drivers, setDrivers] = useState([]);
  const [formData, setFormData] = useState({ name: '', license_expiry: '' });

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
    try {
      await axios.post('http://localhost:5000/api/drivers', formData);
      setFormData({ name: '', license_expiry: '' }); 
      fetchDrivers(); 
    } catch (error) {
      console.error("Error adding driver:", error);
    }
  };

  const inputStyle = { background: '#050b14', color: '#fff', border: '1px solid #1b4965', padding: '12px', borderRadius: '4px', outline: 'none', flex: 1 };
  const btnStyle = { background: '#0077b6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };

  return (
    <div>
      <h2 style={{ color: '#e0e1dd', marginBottom: '30px', fontWeight: '400' }}>Driver Profiles</h2>
      
      <div style={{ background: '#0a111c', border: '1px solid #1b4965', padding: '24px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3 style={{ color: '#00a8e8', marginTop: 0, marginBottom: '20px' }}>Add New Driver</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Driver Name (e.g., Alex)" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={inputStyle} />
          <input type="date" required value={formData.license_expiry} onChange={(e) => setFormData({...formData, license_expiry: e.target.value})} title="License Expiry Date" style={inputStyle} />
          <button type="submit" style={btnStyle}>Add Driver</button>
        </form>
      </div>

      <div style={{ background: '#0a111c', border: '1px solid #1b4965', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#023e8a', color: '#fff' }}>
              <th style={{ padding: '16px' }}>ID</th><th>Name</th><th>License Expiry</th><th>Safety Score</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => {
              const isExpired = new Date(d.license_expiry) < new Date();
              return (
              <tr key={d.id} style={{ borderBottom: '1px solid #1b4965', color: '#e0e1dd' }}>
                <td style={{ padding: '16px' }}>{d.id}</td>
                <td>{d.name}</td>
                <td style={{ color: isExpired ? '#ef4444' : '#e0e1dd', fontWeight: isExpired ? 'bold' : 'normal' }}>
                  {new Date(d.license_expiry).toLocaleDateString()} {isExpired && " (Expired)"}
                </td>
                <td>{d.safety_score}</td>
                <td>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: '12px', fontSize: '12px',
                    background: d.status === 'On Duty' ? '#0077b6' : '#1b4965', color: '#fff' 
                  }}>
                    {d.status}
                  </span>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
}