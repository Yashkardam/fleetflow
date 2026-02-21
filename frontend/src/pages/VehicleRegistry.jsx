import { useState, useEffect } from 'react';
import axios from 'axios';

export default function VehicleRegistry() {
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({ name: '', license_plate: '', max_capacity_kg: '' });

  const fetchVehicles = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/vehicles', formData);
      setFormData({ name: '', license_plate: '', max_capacity_kg: '' });
      fetchVehicles();
    } catch (error) {
      console.error("Error adding vehicle:", error);
    }
  };

  // --- THEME STYLES ---
  const inputStyle = { background: '#050b14', color: '#fff', border: '1px solid #1b4965', padding: '12px', borderRadius: '4px', outline: 'none', flex: 1 };
  const btnStyle = { background: '#0077b6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };

  return (
    <div>
      <h2 style={{ color: '#e0e1dd', marginBottom: '30px', fontWeight: '400' }}>Vehicle Registry</h2>
      
      <div style={{ background: '#0a111c', border: '1px solid #1b4965', padding: '24px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3 style={{ color: '#00a8e8', marginTop: 0, marginBottom: '20px' }}>Add New Vehicle</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Name (e.g., Van-05)" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="License Plate" required value={formData.license_plate} onChange={(e) => setFormData({...formData, license_plate: e.target.value})} style={inputStyle} />
          <input type="number" placeholder="Max Capacity (kg)" required value={formData.max_capacity_kg} onChange={(e) => setFormData({...formData, max_capacity_kg: e.target.value})} style={inputStyle} />
          <button type="submit" style={btnStyle}>Add Vehicle</button>
        </form>
      </div>

      <div style={{ background: '#0a111c', border: '1px solid #1b4965', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#023e8a', color: '#fff' }}>
              <th style={{ padding: '16px' }}>ID</th><th>Name</th><th>License Plate</th><th>Capacity (kg)</th><th>Odometer</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} style={{ borderBottom: '1px solid #1b4965', color: '#e0e1dd' }}>
                <td style={{ padding: '16px' }}>{v.id}</td>
                <td>{v.name}</td>
                <td>{v.license_plate}</td>
                <td>{v.max_capacity_kg}</td>
                <td>{v.odometer}</td>
                <td>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: '12px', fontSize: '12px',
                    background: v.status === 'Available' ? '#0077b6' : '#1b4965', color: '#fff' 
                  }}>
                    {v.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}