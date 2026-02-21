import { useState, useEffect } from 'react';
import axios from 'axios';

export default function MaintenanceLogs() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({ vehicle_id: '', service_type: '', cost: '', service_date: '' });
  const [errorMessage, setErrorMessage] = useState('');

  const fetchData = async () => {
    try {
      const [logsRes, vehiclesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/maintenance'),
        axios.get('http://localhost:5000/api/vehicles')
      ]);
      setLogs(logsRes.data); setVehicles(vehiclesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setErrorMessage('');
    try {
      await axios.post('http://localhost:5000/api/maintenance', formData);
      setFormData({ vehicle_id: '', service_type: '', cost: '', service_date: '' });
      fetchData(); 
    } catch (error) {
      setErrorMessage(error.response?.data?.error || "An unexpected error occurred.");
    }
  };

  const inputStyle = { background: '#050b14', color: '#fff', border: '1px solid #1b4965', padding: '12px', borderRadius: '4px', outline: 'none', flex: 1 };
  const btnStyle = { background: '#0077b6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };

  return (
    <div>
      <h2 style={{ color: '#e0e1dd', marginBottom: '30px', fontWeight: '400' }}>Maintenance & Service Logs</h2>
      
      <div style={{ background: '#0a111c', border: '1px solid #1b4965', padding: '24px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3 style={{ color: '#00a8e8', marginTop: 0, marginBottom: '20px' }}>Log New Service</h3>
        
        {errorMessage && <div style={{ padding: '12px', marginBottom: '20px', background: '#450a0a', border: '1px solid #7f1d1d', color: '#fca5a5', borderRadius: '4px' }}>{errorMessage}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <select required value={formData.vehicle_id} onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})} style={inputStyle}>
            <option value="" style={{ color: '#888' }}>-- Select Vehicle --</option>
            {vehicles.filter(v => v.status !== 'Retired').map(v => (
              <option key={v.id} value={v.id}>{v.name} ({v.license_plate}) - {v.status}</option>
            ))}
          </select>
          <input type="text" placeholder="Service Type (e.g., Oil Change)" required value={formData.service_type} onChange={(e) => setFormData({...formData, service_type: e.target.value})} style={inputStyle} />
          <input type="number" placeholder="Cost ($)" required min="0" step="0.01" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} style={inputStyle} />
          <input type="date" required value={formData.service_date} onChange={(e) => setFormData({...formData, service_date: e.target.value})} style={inputStyle} />
          <button type="submit" style={btnStyle}>Submit Log</button>
        </form>
      </div>

      <div style={{ background: '#0a111c', border: '1px solid #1b4965', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#023e8a', color: '#fff' }}>
              <th style={{ padding: '16px' }}>Log ID</th><th>Vehicle</th><th>Service Type</th><th>Cost</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid #1b4965', color: '#e0e1dd' }}>
                <td style={{ padding: '16px' }}>{log.id}</td>
                <td>{log.vehicle_name}</td>
                <td>{log.service_type}</td>
                <td>${Number(log.cost).toFixed(2)}</td>
                <td>{new Date(log.service_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}