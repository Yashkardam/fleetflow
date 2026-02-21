import { useState, useEffect } from 'react';
import axios from 'axios';

export default function TripAndFuelLogging() {
  const [activeTrips, setActiveTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [fuelData, setFuelData] = useState({ vehicle_id: '', liters: '', cost: '', log_date: '' });
  const [odometerInputs, setOdometerInputs] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  const fetchData = async () => {
    try {
      const [tripsRes, vehiclesRes, fuelRes] = await Promise.all([
        axios.get('http://localhost:5000/api/trips'),
        axios.get('http://localhost:5000/api/vehicles'),
        axios.get('http://localhost:5000/api/fuel')
      ]);
      setActiveTrips(tripsRes.data.filter(t => t.status === 'Dispatched'));
      setVehicles(vehiclesRes.data); setFuelLogs(fuelRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCompleteTrip = async (tripId) => {
    const final_odometer = odometerInputs[tripId];
    if (!final_odometer) { setErrorMessage("Please enter a final odometer reading."); return; }
    try {
      setErrorMessage('');
      await axios.put(`http://localhost:5000/api/trips/${tripId}/complete`, { final_odometer });
      setOdometerInputs(prev => ({ ...prev, [tripId]: '' }));
      fetchData(); 
    } catch (error) {
      setErrorMessage(error.response?.data?.error || "An unexpected error occurred.");
    }
  };

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    try {
      setErrorMessage('');
      await axios.post('http://localhost:5000/api/fuel', fuelData);
      setFuelData({ vehicle_id: '', liters: '', cost: '', log_date: '' });
      fetchData();
    } catch (error) {
      setErrorMessage("Error logging fuel expense.");
    }
  };

  const inputStyle = { background: '#050b14', color: '#fff', border: '1px solid #1b4965', padding: '12px', borderRadius: '4px', outline: 'none', flex: 1 };
  const btnStyle = { background: '#0077b6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };

  return (
    <div>
      <h2 style={{ color: '#e0e1dd', marginBottom: '30px', fontWeight: '400' }}>Trip Completion & Fuel Logging</h2>
      
      {errorMessage && <div style={{ padding: '12px', marginBottom: '20px', background: '#450a0a', border: '1px solid #7f1d1d', color: '#fca5a5', borderRadius: '4px' }}>{errorMessage}</div>}

      <div style={{ background: '#0a111c', border: '1px solid #1b4965', padding: '24px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3 style={{ color: '#00a8e8', marginTop: 0, marginBottom: '20px' }}>Complete Active Trips</h3>
        {activeTrips.length === 0 ? (
          <p style={{ color: '#8d99ae' }}>No active trips to complete right now.</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#023e8a', color: '#fff' }}>
                <th style={{ padding: '16px' }}>Trip ID</th><th>Vehicle</th><th>Driver</th><th>Final Odometer</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {activeTrips.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #1b4965', color: '#e0e1dd' }}>
                  <td style={{ padding: '16px' }}>{t.id}</td><td>{t.vehicle_name}</td><td>{t.driver_name}</td>
                  <td>
                    <input 
                      type="number" placeholder="e.g., 15200" value={odometerInputs[t.id] || ''} 
                      onChange={(e) => setOdometerInputs({...odometerInputs, [t.id]: e.target.value})}
                      style={{ ...inputStyle, width: '120px', padding: '8px' }}
                    />
                  </td>
                  <td>
                    <button onClick={() => handleCompleteTrip(t.id)} style={{ ...btnStyle, background: '#1b4965' }}>Mark Done</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ background: '#0a111c', border: '1px solid #1b4965', padding: '24px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3 style={{ color: '#00a8e8', marginTop: 0, marginBottom: '20px' }}>Log Fuel Expense</h3>
        <form onSubmit={handleFuelSubmit} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <select required value={fuelData.vehicle_id} onChange={(e) => setFuelData({...fuelData, vehicle_id: e.target.value})} style={inputStyle}>
            <option value="" style={{ color: '#888' }}>-- Select Vehicle --</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <input type="number" placeholder="Liters" required min="1" step="0.1" value={fuelData.liters} onChange={(e) => setFuelData({...fuelData, liters: e.target.value})} style={inputStyle} />
          <input type="number" placeholder="Total Cost ($)" required min="0" step="0.01" value={fuelData.cost} onChange={(e) => setFuelData({...fuelData, cost: e.target.value})} style={inputStyle} />
          <input type="date" required value={fuelData.log_date} onChange={(e) => setFuelData({...fuelData, log_date: e.target.value})} style={inputStyle} />
          <button type="submit" style={btnStyle}>Submit Fuel Log</button>
        </form>
      </div>

      <div style={{ background: '#0a111c', border: '1px solid #1b4965', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#023e8a', color: '#fff' }}>
              <th style={{ padding: '16px' }}>Log ID</th><th>Vehicle</th><th>Liters</th><th>Cost</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            {fuelLogs.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid #1b4965', color: '#e0e1dd' }}>
                <td style={{ padding: '16px' }}>{log.id}</td><td>{log.vehicle_name}</td><td>{log.liters} L</td><td>${Number(log.cost).toFixed(2)}</td><td>{new Date(log.log_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}