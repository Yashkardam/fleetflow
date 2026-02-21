import { useState, useEffect } from 'react';
import axios from 'axios';

export default function TripAndFuelLogging() {
  const [expenses, setExpenses] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Newest');

  const [formData, setFormData] = useState({ 
    trip_id: '', 
    fuel_cost: '', 
    misc_cost: '', 
    distance_km: '' 
  });

  const fetchData = async () => {
    try {
      const [expRes, tripsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/expenses'),
        axios.get('http://localhost:5000/api/trips')
      ]);
      
      setExpenses(expRes.data);

      // --- CRITICAL FIX START ---
      // Log this to your browser console (F12) to see what the DB is actually sending
      console.log("All Trips from DB:", tripsRes.data);

      // Broaden the filter: Show anything that isn't finished yet
      const availableForLogging = tripsRes.data.filter(t => 
        t.status.toLowerCase() === 'dispatched' || t.status.toLowerCase() === 'on way'
      );
      
      setActiveTrips(availableForLogging);
      // --- CRITICAL FIX END ---

    } catch (error) {
      console.error("Fetch Error:", error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/expenses', formData);
      setFormData({ trip_id: '', fuel_cost: '', misc_cost: '', distance_km: '' });
      setShowForm(false);
      fetchData(); 
    } catch (error) {
      alert(error.response?.data?.error || "Error logging expense.");
    }
  };

  const inputStyle = { background: '#050b14', color: '#fff', border: '1px solid #1b4965', padding: '10px', borderRadius: '4px', outline: 'none' };
  const btnStyle = { background: '#0077b6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };

  return (
    <div>
      <h2 style={{ color: '#e0e1dd', marginBottom: '20px' }}>Expense & Fuel Logging</h2>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '10px', alignItems: 'center', background: '#0a111c', padding: '15px', borderRadius: '8px', border: '1px solid #1b4965' }}>
        <input 
          type="text" placeholder="Search..." 
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          style={{ ...inputStyle, flex: 2 }} 
        />
        <button type="button" onClick={() => setShowForm(true)} style={{ ...btnStyle, background: '#00a8e8' }}>Add an Expense</button>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {showForm && (
          <div style={{ width: '350px', background: '#0a111c', border: '1px solid #1b4965', padding: '24px', borderRadius: '8px', height: 'fit-content' }}>
            <h3 style={{ color: '#00a8e8', marginTop: 0 }}>New Expense</h3>
            
            {/* DEBUG INFO: Shows you how many trips the code thinks are available */}
            <p style={{ fontSize: '12px', color: '#8d99ae' }}>Available Trips: {activeTrips.length}</p>

            <form onSubmit={handleSubmit}>
              <label style={{ color: '#8d99ae', fontSize: '13px' }}>Select Trip:</label>
              <select 
                required 
                value={formData.trip_id} 
                onChange={e => setFormData({...formData, trip_id: e.target.value})} 
                style={{ ...inputStyle, width: '100%', marginBottom: '15px' }}
              >
                <option value="">-- Select Trip ID --</option>
                {activeTrips.map(t => (
                  <option key={t.id} value={t.id}>
                    Trip #{t.id} | {t.vehicle_name}
                  </option>
                ))}
              </select>

              <label style={{ color: '#8d99ae', fontSize: '13px' }}>Distance (km):</label>
              <input type="number" required style={{ ...inputStyle, width: '100%', marginBottom: '15px' }} value={formData.distance_km} onChange={e => setFormData({...formData, distance_km: e.target.value})} />
              
              <label style={{ color: '#8d99ae', fontSize: '13px' }}>Fuel Cost (Rs):</label>
              <input type="number" required style={{ ...inputStyle, width: '100%', marginBottom: '15px' }} value={formData.fuel_cost} onChange={e => setFormData({...formData, fuel_cost: e.target.value})} />
              
              <label style={{ color: '#8d99ae', fontSize: '13px' }}>Misc Expense (Rs):</label>
              <input type="number" required style={{ ...inputStyle, width: '100%', marginBottom: '20px' }} value={formData.misc_cost} onChange={e => setFormData({...formData, misc_cost: e.target.value})} />

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ ...btnStyle, background: '#10b981' }}>Confirm</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ ...btnStyle, background: '#ef4444' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ flex: 1, background: '#0a111c', border: '1px solid #1b4965', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#1b4965', color: '#fff' }}>
              <tr>
                <th style={{ padding: '16px' }}>Trip ID</th>
                <th>Driver</th>
                <th>Distance</th>
                <th>Fuel</th>
                <th>Misc</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id} style={{ borderBottom: '1px solid #1b4965', color: '#e0e1dd' }}>
                  <td style={{ padding: '16px' }}>{exp.trip_id}</td>
                  <td>{exp.driver_name}</td>
                  <td>{exp.distance_km} km</td>
                  <td>{exp.fuel_cost}</td>
                  <td>{exp.misc_cost}</td>
                  <td style={{ color: '#10b981' }}>Done</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}