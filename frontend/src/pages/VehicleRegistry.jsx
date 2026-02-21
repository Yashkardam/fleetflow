import { useState, useEffect } from 'react';
import axios from 'axios';

export default function VehicleRegistry() {
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({ name: '', license_plate: '', max_capacity_kg: '' });
  const [errorMessage, setErrorMessage] = useState('');

  // READ: Fetch all physical assets
  const fetchVehicles = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  // CREATE: Add a new physical asset
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await axios.post('http://localhost:5000/api/vehicles', formData);
      setFormData({ name: '', license_plate: '', max_capacity_kg: '' });
      fetchVehicles();
    } catch (error) {
      setErrorMessage(error.response?.data?.error || "Error adding vehicle. Check for duplicate License Plates.");
    }
  };

  // UPDATE: Manual toggle for "Out of Service" (Retired)
  const toggleRetire = async (id, currentStatus) => {
    // If it's already on a trip or in the shop, block the dispatcher from retiring it until it's done
    if (currentStatus === 'On Trip' || currentStatus === 'In Shop') {
      setErrorMessage(`Cannot retire a vehicle that is currently ${currentStatus}.`);
      return;
    }

    const newStatus = currentStatus === 'Retired' ? 'Available' : 'Retired';
    setErrorMessage('');
    
    try {
      await axios.put(`http://localhost:5000/api/vehicles/${id}/retire`, { status: newStatus });
      fetchVehicles(); 
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // --- THEME STYLES ---
  const inputStyle = { background: '#050b14', color: '#fff', border: '1px solid #1b4965', padding: '12px', borderRadius: '4px', outline: 'none', flex: 1 };
  const btnStyle = { background: '#0077b6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };

  return (
    <div>
      <h2 style={{ color: '#e0e1dd', marginBottom: '30px', fontWeight: '400' }}>Vehicle Registry (Asset Management)</h2>
      
      {errorMessage && <div style={{ padding: '12px', marginBottom: '20px', background: '#450a0a', border: '1px solid #7f1d1d', color: '#fca5a5', borderRadius: '4px' }}>{errorMessage}</div>}

      {/* CREATE FORM */}
      <div style={{ background: '#0a111c', border: '1px solid #1b4965', padding: '24px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3 style={{ color: '#00a8e8', marginTop: 0, marginBottom: '20px' }}>Register New Asset</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Name/Model (e.g., Ford Transit)" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="License Plate (Unique ID)" required value={formData.license_plate} onChange={(e) => setFormData({...formData, license_plate: e.target.value})} style={inputStyle} />
          <input type="number" placeholder="Max Load Capacity (kg)" required min="1" value={formData.max_capacity_kg} onChange={(e) => setFormData({...formData, max_capacity_kg: e.target.value})} style={inputStyle} />
          <button type="submit" style={btnStyle}>Add Vehicle</button>
        </form>
      </div>

      {/* ASSET TABLE */}
      <div style={{ background: '#0a111c', border: '1px solid #1b4965', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#023e8a', color: '#fff' }}>
              <th style={{ padding: '16px' }}>ID</th>
              <th>Name / Model</th>
              <th>License Plate</th>
              <th>Max Load (kg)</th>
              <th>Odometer</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} style={{ borderBottom: '1px solid #1b4965', color: '#e0e1dd', opacity: v.status === 'Retired' ? 0.6 : 1 }}>
                <td style={{ padding: '16px' }}>{v.id}</td>
                <td>{v.name}</td>
                <td>{v.license_plate}</td>
                <td>{v.max_capacity_kg}</td>
                <td>{v.odometer}</td>
                <td>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: '12px', fontSize: '12px',
                    background: v.status === 'Available' ? '#0077b6' : v.status === 'Retired' ? '#ef4444' : '#1b4965', 
                    color: '#fff' 
                  }}>
                    {v.status}
                  </span>
                </td>
                <td>
                  {/* MANUAL TOGGLE BUTTON */}
                  <button 
                    onClick={() => toggleRetire(v.id, v.status)}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${v.status === 'Retired' ? '#10b981' : '#ef4444'}`,
                      color: v.status === 'Retired' ? '#10b981' : '#ef4444',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {v.status === 'Retired' ? 'Reactivate' : 'Retire Asset'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}