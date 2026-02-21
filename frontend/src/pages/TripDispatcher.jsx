import { useState, useEffect } from 'react';
import axios from 'axios';

export default function TripDispatcher() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [formData, setFormData] = useState({ vehicle_id: '', driver_id: '', cargo_weight: '' });
  const [errorMessage, setErrorMessage] = useState('');

  const fetchData = async () => {
    const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
      axios.get('http://localhost:5000/api/trips'),
      axios.get('http://localhost:5000/api/vehicles'),
      axios.get('http://localhost:5000/api/drivers')
    ]);
    setTrips(tripsRes.data); setVehicles(vehiclesRes.data); setDrivers(driversRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setErrorMessage('');
    try {
      await axios.post('http://localhost:5000/api/trips', formData);
      setFormData({ vehicle_id: '', driver_id: '', cargo_weight: '' });
      fetchData();
    } catch (error) {
      setErrorMessage(error.response?.data?.error || "An unexpected error occurred.");
    }
  };

  // --- THEME STYLES ---
  const inputStyle = { background: '#050b14', color: '#fff', border: '1px solid #1b4965', padding: '12px', borderRadius: '4px', outline: 'none', flex: 1 };
  const btnStyle = { background: '#0077b6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };

  return (
    <div>
      <h2 style={{ color: '#e0e1dd', marginBottom: '30px', fontWeight: '400' }}>Trip Dispatcher</h2>
      
      <div style={{ background: '#0a111c', border: '1px solid #1b4965', padding: '24px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3 style={{ color: '#00a8e8', marginTop: 0, marginBottom: '20px' }}>Create New Trip</h3>
        
        {errorMessage && <div style={{ padding: '12px', marginBottom: '20px', background: '#450a0a', border: '1px solid #7f1d1d', color: '#fca5a5', borderRadius: '4px' }}>{errorMessage}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <select required value={formData.vehicle_id} onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})} style={inputStyle}>
            <option value="" style={{ color: '#888' }}>-- Select Vehicle --</option>
            {vehicles.filter(v => v.status === 'Available').map(v => (
              <option key={v.id} value={v.id}>{v.name} (Max: {v.max_capacity_kg}kg)</option>
            ))}
          </select>

          <select required value={formData.driver_id} onChange={(e) => setFormData({...formData, driver_id: e.target.value})} style={inputStyle}>
            <option value="">-- Select Driver --</option>
            {drivers.filter(d => d.status === 'On Duty').map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <input type="number" placeholder="Cargo Weight (kg)" required min="1" value={formData.cargo_weight} onChange={(e) => setFormData({...formData, cargo_weight: e.target.value})} style={inputStyle} />
          <button type="submit" style={btnStyle}>Dispatch Trip</button>
        </form>
      </div>

      <div style={{ background: '#0a111c', border: '1px solid #1b4965', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#023e8a', color: '#fff' }}>
              <th style={{ padding: '16px' }}>Trip ID</th><th>Vehicle</th><th>Driver</th><th>Cargo (kg)</th><th>Status</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #1b4965' }}>
                <td style={{ padding: '16px' }}>{t.id}</td>
                <td>{t.vehicle_name}</td>
                <td>{t.driver_name}</td>
                <td>{t.cargo_weight}</td>
                <td>
                  <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', background: t.status === 'Dispatched' ? '#0077b6' : '#1b4965', color: '#fff' }}>
                    {t.status}
                  </span>
                </td>
                <td>{new Date(t.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}