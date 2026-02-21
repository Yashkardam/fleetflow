import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CommandCenter() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  
  // LOGIC STATES
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Default'); 
  const [groupByStatus, setGroupByStatus] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');

  const fetchData = async () => {
    try {
      const [vRes, tRes] = await Promise.all([
        axios.get('http://localhost:5000/api/vehicles'),
        axios.get('http://localhost:5000/api/trips')
      ]);
      setVehicles(vRes.data);
      setTrips(tRes.data);
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  // --- KPI CALCULATIONS ---
  const activeFleet = vehicles.filter(v => v.status === 'On Trip').length;
  const maintenanceAlerts = vehicles.filter(v => v.status === 'In Shop').length;
  const pendingCargo = trips.filter(t => t.status === 'Draft' || t.status === 'Pending').length;

  // --- THE SEARCH, FILTER, & SORT ENGINE ---
  const processedTrips = trips
    .filter(t => {
      const matchesSearch = t.vehicle_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.driver_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'All' || t.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'ID') return b.id - a.id;
      if (sortBy === 'Driver') return a.driver_name.localeCompare(b.driver_name);
      if (groupByStatus) return a.status.localeCompare(b.status);
      return 0;
    });

  const cardStyle = { flex: 1, border: '1px solid #1b4965', borderRadius: '12px', padding: '24px', background: '#0a111c', textAlign: 'center' };
  const kpiLabelStyle = { color: '#10b981', fontSize: '18px', marginBottom: '15px', fontWeight: '400' };
  const kpiValueStyle = { color: '#e0e1dd', fontSize: '3rem', margin: 0, fontWeight: 'bold' };
  
  // Style for the functional header buttons
  const headerBtnStyle = (isActive) => ({
    background: isActive ? '#00a8e8' : 'transparent',
    color: isActive ? '#050b14' : '#8d99ae',
    border: '1px solid #1b4965',
    padding: '8px 16px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: isActive ? 'bold' : 'normal'
  });

  return (
    <div style={{ color: '#e0e1dd' }}>
      <h2 style={{ color: '#00a8e8', marginBottom: '20px', fontWeight: '400' }}>Fleet Flow</h2>

      {/* --- RE-WIRED SEARCH & ACTION BAR --- */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', alignItems: 'center', background: '#0a111c', padding: '15px', borderRadius: '8px', border: '1px solid #1b4965' }}>
        <input 
          type="text" placeholder="Search vehicle or driver ......" 
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          style={{ background: '#050b14', color: '#fff', border: '1px solid #1b4965', padding: '10px', borderRadius: '20px', flex: 1, outline: 'none' }} 
        />
        
        {/* GROUP BY TOGGLE */}
        <button 
          onClick={() => setGroupByStatus(!groupByStatus)} 
          style={headerBtnStyle(groupByStatus)}
        >
          Group by Status
        </button>

        {/* FILTER SELECT */}
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ background: 'transparent', color: '#8d99ae', border: '1px solid #1b4965', padding: '8px', borderRadius: '20px', outline: 'none', cursor: 'pointer' }}
        >
          <option value="All">Filter: All</option>
          <option value="Dispatched">Dispatched</option>
          <option value="Draft">Draft</option>
          <option value="Completed">Completed</option>
        </select>

        {/* SORT SELECT */}
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          style={{ background: 'transparent', color: '#8d99ae', border: '1px solid #1b4965', padding: '8px', borderRadius: '20px', outline: 'none', cursor: 'pointer' }}
        >
          <option value="Default">Sort by...</option>
          <option value="ID">Newest ID</option>
          <option value="Driver">Driver Name</option>
        </select>
      </div>

      {/* --- KPI CARDS ROW --- */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={cardStyle}>
          <h3 style={kpiLabelStyle}>Active Fleet</h3>
          <p style={kpiValueStyle}>{activeFleet}</p>
        </div>
        <div style={cardStyle}>
          <h3 style={kpiLabelStyle}>Maintenance Alert</h3>
          <p style={kpiValueStyle}>{maintenanceAlerts}</p>
        </div>
        <div style={cardStyle}>
          <h3 style={kpiLabelStyle}>Pending Cargo</h3>
          <p style={kpiValueStyle}>{pendingCargo}</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginBottom: '20px' }}>
        <button onClick={() => navigate('/dispatch')} style={{ background: 'transparent', border: '1px solid #00a8e8', color: '#00a8e8', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer' }}>New Trip</button>
        <button onClick={() => navigate('/vehicles')} style={{ background: 'transparent', border: '1px solid #00a8e8', color: '#00a8e8', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer' }}>New Vehicle</button>
      </div>

      {/* --- TABLE --- */}
      <div style={{ background: '#0a111c', border: '1px solid #1b4965', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: '#ff758f', borderBottom: '2px solid #1b4965' }}>
              <th style={{ padding: '16px' }}>Trip</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {processedTrips.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #1b4965' }}>
                <td style={{ padding: '16px' }}>{t.id}</td>
                <td style={{ color: '#8d99ae' }}>{t.vehicle_name}</td>
                <td>{t.driver_name}</td>
                <td style={{ color: t.status === 'Dispatched' ? '#f59e0b' : '#10b981' }}>
                  {t.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}