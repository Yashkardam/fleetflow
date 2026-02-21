import { useState, useEffect } from 'react';
import axios from 'axios';

export default function TripDispatcher() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');

  // Form State matching the Excalidraw Mockup
  const [formData, setFormData] = useState({ 
    vehicle_id: '', 
    driver_id: '', 
    cargo_weight: '', 
    origin_address: '', 
    destination_address: '', 
    estimated_fuel_cost: '' 
  });
  const [errorMessage, setErrorMessage] = useState('');

  const fetchData = async () => {
    try {
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        axios.get('http://localhost:5000/api/trips'),
        axios.get('http://localhost:5000/api/vehicles'),
        axios.get('http://localhost:5000/api/drivers')
      ]);
      setTrips(tripsRes.data); 
      setVehicles(vehiclesRes.data); 
      setDrivers(driversRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e, targetStatus) => {
    e.preventDefault(); 
    setErrorMessage('');
    try {
      await axios.post('http://localhost:5000/api/trips', { ...formData, status: targetStatus });
      setFormData({ 
        vehicle_id: '', driver_id: '', cargo_weight: '', 
        origin_address: '', destination_address: '', estimated_fuel_cost: '' 
      });
      fetchData();
    } catch (error) {
      setErrorMessage(error.response?.data?.error || "Check cargo weight vs vehicle capacity.");
    }
  };

  // Logic for filtering and searching trips
  const processedTrips = trips.filter(t => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      t.vehicle_name?.toLowerCase().includes(query) || 
      t.origin_address?.toLowerCase().includes(query) ||
      t.destination_address?.toLowerCase().includes(query);
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Common Styles
  const inputStyle = { background: '#050b14', color: '#fff', border: '1px solid #1b4965', padding: '10px', borderRadius: '4px', outline: 'none', flex: 1 };
  const labelStyle = { width: '180px', color: '#e0e1dd', fontSize: '14px' };

  return (
    <div style={{ width: '100%' }}>
      <h2 style={{ color: '#00a8e8', marginBottom: '20px' }}>Trip Dispatcher & Management</h2>

      {/* --- TOP: SEARCH & FILTERS --- */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: '#0a111c', padding: '15px', borderRadius: '8px', border: '1px solid #1b4965' }}>
        <input 
          type="text" placeholder="Search by vehicle, origin, or destination..." 
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
          style={{ ...inputStyle, flex: 3 }} 
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={inputStyle}>
          <option value="All">All Statuses</option>
          <option value="Dispatched">Dispatched</option>
          <option value="Draft">Draft</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* --- MIDDLE: TRIP TABLE --- */}
      <div style={{ background: '#0a111c', border: '1px solid #1b4965', borderRadius: '8px', overflow: 'hidden', marginBottom: '30px' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#1b4965', color: '#fff' }}>
            <tr>
              <th style={{ padding: '12px 16px' }}>Trip ID</th>
              <th>Vehicle</th>
              <th>Origin</th>
              <th>Destination</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {processedTrips.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #1b4965', color: '#e0e1dd' }}>
                <td style={{ padding: '12px 16px' }}>{t.id}</td>
                <td>{t.vehicle_name}</td>
                <td>{t.origin_address}</td>
                <td>{t.destination_address}</td>
                <td>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: '12px', fontSize: '11px', 
                    background: t.status === 'Dispatched' ? '#00a8e8' : '#f59e0b', 
                    color: '#fff' 
                  }}>{t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- BOTTOM: NEW TRIP FORM (Green Outline) --- */}
      <div style={{ background: '#0a111c', border: '1px solid #10b981', padding: '24px', borderRadius: '8px' }}>
        <h3 style={{ color: '#10b981', marginTop: 0, marginBottom: '20px' }}>New Trip Form</h3>
        
        {errorMessage && <p style={{ color: '#ef4444' }}>{errorMessage}</p>}

        <form>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={labelStyle}>Select Vehicle:</label>
              <select style={inputStyle} value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})}>
                <option value="">-- Select --</option>
                {vehicles.filter(v => v.status === 'Available').map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={labelStyle}>Cargo Weight (kg):</label>
              <input type="number" style={inputStyle} value={formData.cargo_weight} onChange={e => setFormData({...formData, cargo_weight: e.target.value})} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={labelStyle}>Select Driver:</label>
              <select style={inputStyle} value={formData.driver_id} onChange={e => setFormData({...formData, driver_id: e.target.value})}>
                <option value="">-- Select --</option>
                {drivers.filter(d => d.status === 'On Duty').map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={labelStyle}>Origin Address:</label>
              <input type="text" style={inputStyle} value={formData.origin_address} onChange={e => setFormData({...formData, origin_address: e.target.value})} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={labelStyle}>Destination:</label>
              <input type="text" style={inputStyle} value={formData.destination_address} onChange={e => setFormData({...formData, destination_address: e.target.value})} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={labelStyle}>Estimated Fuel Cost:</label>
              <input type="number" style={inputStyle} value={formData.estimated_fuel_cost} onChange={e => setFormData({...formData, estimated_fuel_cost: e.target.value})} />
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
            <button onClick={(e) => handleSubmit(e, 'Dispatched')} style={{ background: '#10b981', color: '#fff', padding: '12px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Confirm & Dispatch Trip
            </button>
            <button onClick={(e) => handleSubmit(e, 'Draft')} style={{ background: '#1b4965', color: '#fff', padding: '12px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Save as Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}