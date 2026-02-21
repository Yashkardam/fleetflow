import { useState, useEffect } from 'react';
import axios from 'axios';

export default function MaintenanceLogs() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false); 
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Newest');
  const [costFilter, setCostFilter] = useState('All'); 

  const [completingId, setCompletingId] = useState(null);

  const [formData, setFormData] = useState({ 
    vehicle_id: '', 
    service_type: '', 
    cost: '', 
    service_date: '' 
  });

  const fetchData = async () => {
    try {
      const [logsRes, vehiclesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/maintenance'),
        axios.get('http://localhost:5000/api/vehicles')
      ]);
      setLogs(logsRes.data);
      setVehicles(vehiclesRes.data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const processedLogs = logs
    .filter(log => {
      const matchesSearch = log.vehicle_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            log.service_type?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCost = costFilter === 'All' ? true : 
                          costFilter === 'High' ? Number(log.cost) >= 10000 : 
                          Number(log.cost) < 10000;

      return matchesSearch && matchesCost;
    })
    .sort((a, b) => {
      if (sortBy === 'Newest') return new Date(b.service_date) - new Date(a.service_date);
      if (sortBy === 'Oldest') return new Date(a.service_date) - new Date(b.service_date);
      if (sortBy === 'Costly') return Number(b.cost) - Number(a.cost);
      return 0;
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/maintenance', formData);
      setFormData({ vehicle_id: '', service_type: '', cost: '', service_date: '' });
      setShowForm(false);
      fetchData(); 
    } catch (error) {
      console.error("Submission error:", error);
      alert("Error creating service log.");
    }
  };

  const completeService = async (logId) => {
    setCompletingId(logId); 
    try {
      await axios.put(`http://localhost:5000/api/maintenance/${logId}/complete`);
      fetchData(); // This instantly pulls the new 'Completed' status from the database
    } catch (error) {
      console.error("Error completing service:", error);
      alert("Failed to complete service.");
    } finally {
      setCompletingId(null); 
    }
  };

  const inputStyle = { background: '#050b14', color: '#fff', border: '1px solid #1b4965', padding: '10px', borderRadius: '4px', outline: 'none' };
  const btnStyle = { background: '#0077b6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
  const filterBtnStyle = { background: 'transparent', color: '#8d99ae', border: '1px solid #1b4965', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' };

  return (
    <div>
      <h2 style={{ color: '#e0e1dd', marginBottom: '20px', fontWeight: '400' }}>Maintenance & Service Logs</h2>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '10px', alignItems: 'center', background: '#0a111c', padding: '15px', borderRadius: '8px', border: '1px solid #1b4965' }}>
        <input 
          type="text" placeholder="Search by vehicle or issue..." 
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          style={{ ...inputStyle, flex: 2 }} 
        />
        
        <button type="button" style={filterBtnStyle}>Group by</button>
        
        <button 
          type="button"
          onClick={() => setShowFilters(!showFilters)} 
          style={{ ...filterBtnStyle, borderColor: showFilters ? '#00a8e8' : '#1b4965', color: showFilters ? '#fff' : '#8d99ae' }}
        >
          Filter {showFilters ? '▲' : '▼'}
        </button>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ ...inputStyle, width: '150px' }}>
          <option value="Newest">Sort by: Date</option>
          <option value="Costly">Sort by: Cost</option>
        </select>

        <button type="button" onClick={() => setShowForm(true)} style={{ ...btnStyle, background: '#00a8e8' }}>Create New Service</button>
      </div>

      {showFilters && (
        <div style={{ display: 'flex', gap: '20px', background: '#050b14', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #1b4965' }}>
          <div style={{ color: '#8d99ae', fontSize: '14px' }}>
            <strong>Cost Range:</strong>
            <button type="button" onClick={() => setCostFilter('All')} style={{ marginLeft: '10px', color: costFilter === 'All' ? '#00a8e8' : '#8d99ae', background: 'none', border: 'none', cursor: 'pointer' }}>All</button>
            <button type="button" onClick={() => setCostFilter('High')} style={{ marginLeft: '10px', color: costFilter === 'High' ? '#00a8e8' : '#8d99ae', background: 'none', border: 'none', cursor: 'pointer' }}>High (&gt;10k)</button>
            <button type="button" onClick={() => setCostFilter('Low')} style={{ marginLeft: '10px', color: costFilter === 'Low' ? '#00a8e8' : '#8d99ae', background: 'none', border: 'none', cursor: 'pointer' }}>Low (&lt;10k)</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px' }}>
        
        {showForm && (
          <div style={{ width: '350px', background: '#0a111c', border: '1px solid #1b4965', padding: '24px', borderRadius: '8px', height: 'fit-content' }}>
            <h3 style={{ color: '#00a8e8', marginTop: 0 }}>New Service</h3>
            <form onSubmit={handleSubmit}>
              <label style={{ color: '#8d99ae', fontSize: '13px' }}>Vehicle Name:</label>
              <select required value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})} style={{ ...inputStyle, width: '100%', marginBottom: '15px' }}>
                <option value="">-- Select Available Vehicle --</option>
                {vehicles.filter(v => v.status !== 'Retired').map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.status})</option>
                ))}
              </select>

              <label style={{ color: '#8d99ae', fontSize: '13px' }}>Issue/Service:</label>
              <input type="text" required style={{ ...inputStyle, width: '100%', marginBottom: '15px' }} value={formData.service_type} onChange={e => setFormData({...formData, service_type: e.target.value})} />
              
              <label style={{ color: '#8d99ae', fontSize: '13px' }}>Date:</label>
              <input type="date" required style={{ ...inputStyle, width: '100%', marginBottom: '15px' }} value={formData.service_date} onChange={e => setFormData({...formData, service_date: e.target.value})} />
              
              <label style={{ color: '#8d99ae', fontSize: '13px' }}>Cost (Rs):</label>
              <input type="number" required style={{ ...inputStyle, width: '100%', marginBottom: '20px' }} value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} />
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ ...btnStyle, background: '#10b981' }}>Create</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ ...btnStyle, background: '#ef4444' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ flex: 1, background: '#0a111c', border: '1px solid #1b4965', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#1b4965', color: '#fff' }}>
              <tr>
                <th style={{ padding: '16px' }}>Log ID</th>
                <th>Vehicle</th>
                <th>Issue/Service</th>
                <th>Date</th>
                <th>Cost (Rs)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {processedLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #1b4965', color: '#e0e1dd' }}>
                  <td style={{ padding: '16px' }}>{log.id}</td>
                  <td>{log.vehicle_name}</td>
                  <td>{log.service_type}</td>
                  <td>{new Date(log.service_date).toLocaleDateString()}</td>
                  <td>{Number(log.cost).toLocaleString()}</td>
                  <td>
                    {/* READ DIRECTLY FROM THE DATABASE NOW */}
                    {log.status === 'Completed' ? (
                      <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '12px' }}>Completed ✔</span>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => completeService(log.id)}
                        disabled={completingId === log.id}
                        style={{
                          background: completingId === log.id ? '#1b4965' : 'transparent',
                          border: '1px solid #10b981',
                          color: completingId === log.id ? '#8d99ae' : '#10b981',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: completingId === log.id ? 'wait' : 'pointer',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        {completingId === log.id ? 'Completing...' : 'Complete Service'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {processedLogs.length === 0 && (
                <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#8d99ae' }}>No logs match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}