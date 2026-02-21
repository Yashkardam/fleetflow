import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import VehicleRegistry from './pages/VehicleRegistry';
import DriverProfiles from './pages/DriverProfiles';
import TripDispatcher from './pages/TripDispatcher';
import MaintenanceLogs from './pages/MaintenanceLogs';
import TripAndFuelLogging from './pages/TripAndFuelLogging';
import OperationalAnalytics from './pages/OperationalAnalytics';
import CommandCenter from './pages/CommandCenter';

function Sidebar({ role, onLogout }) {
  const location = useLocation();
  
  // ROLE-BASED ACCESS CONTROL (RBAC): Determine which links this role can see
const allLinks = [
  { path: '/', label: 'Command Center', roles: ['Manager', 'Dispatcher'] },
  { path: '/dispatch', label: 'Trip Dispatcher', roles: ['Manager', 'Dispatcher'] },
  { path: '/vehicles', label: 'Vehicle Registry', roles: ['Manager', 'Dispatcher'] },
  { path: '/drivers', label: 'Driver Profiles', roles: ['Manager', 'Dispatcher'] },
  { path: '/maintenance', label: 'Service Logs', roles: ['Manager'] },
  { path: '/fuel-and-completion', label: 'Trip Logs & Fuel', roles: ['Manager', 'Dispatcher'] },
  { path: '/analytics', label: 'Operational Analytics & Financial Reports', roles: ['Manager'] },

];

  // Filter links based on the user's role
  const visibleLinks = allLinks.filter(link => link.roles.includes(role));

  return (
    <nav style={{ width: '260px', background: '#0a111c', borderRight: '1px solid #1b4965', padding: '30px 20px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <h2 style={{ color: '#00a8e8', marginBottom: '5px', letterSpacing: '1px' }}>FleetFlow</h2>
      <p style={{ color: '#8d99ae', fontSize: '12px', marginBottom: '40px', textTransform: 'uppercase' }}>Role: {role}</p>
      
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 }}>
        {visibleLinks.map(link => {
          const isActive = location.pathname === link.path || (link.path === '/' && location.pathname === '/');
          return (
            <li key={link.path}>
              <Link to={link.path} style={{ 
                  textDecoration: 'none', display: 'block', padding: '12px 15px', borderRadius: '6px',
                  color: isActive ? '#fff' : '#8d99ae', background: isActive ? '#0077b6' : 'transparent',
                  transition: '0.2s', fontWeight: isActive ? '600' : '400'
                }}>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <button onClick={onLogout} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '4px', cursor: 'pointer', marginTop: 'auto' }}>
        Log Out
      </button>
    </nav>
  );
}

export default function App() {
  const [auth, setAuth] = useState({ isAuthenticated: false, role: null });

  // Check if already logged in on page load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role) {
      setAuth({ isAuthenticated: true, role });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setAuth({ isAuthenticated: false, role: null });
  };

  // If not authenticated, ONLY render the Login page
// If not authenticated, wrap the Login component in the Router 
  // so it can read the ?token= from the email link!
  if (!auth.isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<Login setAuth={setAuth} />} />
        </Routes>
      </Router>
    );
  }

  // If authenticated, render the full app structure
  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
        <Sidebar role={auth.role} onLogout={handleLogout} />
        <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={auth.role === 'Dispatcher' ? <Navigate to="/dispatch" /> : <CommandCenter />} />
            <Route path="/vehicles" element={<VehicleRegistry />} />
            <Route path="/drivers" element={<DriverProfiles />} />
            <Route path="/dispatch" element={<TripDispatcher />} />
            <Route path="/maintenance" element={<MaintenanceLogs />} />
            <Route path="/fuel-and-completion" element={<TripAndFuelLogging />} />
            <Route path="/analytics" element={auth.role === 'Dispatcher' ? <Navigate to="/dispatch" /> : <OperationalAnalytics />} />
            {/* Add this as the very last Route in your App.jsx */}
            <Route path="*" element={
              <div style={{ textAlign: 'center', marginTop: '100px', color: '#8d99ae' }}>
                <h1 style={{ color: '#00a8e8', fontSize: '4rem', margin: 0 }}>404</h1>
                <h2>Route Not Found</h2>
                <p>The page you are looking for has been moved or doesn't exist.</p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}