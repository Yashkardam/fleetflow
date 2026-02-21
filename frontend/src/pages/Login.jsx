// frontend/src/pages/Login.jsx
import { useState } from 'react';
import axios from 'axios';

export default function Login({ setAuth }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'Dispatcher' });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (isRegistering) {
      // REGISTRATION FLOW
      try {
        await axios.post('http://localhost:5000/api/auth/register', formData);
        setSuccessMessage('Account created! You can now log in.');
        setIsRegistering(false); // Switch back to login view
        setFormData({ ...formData, password: '' }); // Clear password for security
      } catch (error) {
        setErrorMessage(error.response?.data?.error || "Registration failed.");
      }
    } else {
      // LOGIN FLOW
      try {
        const res = await axios.post('http://localhost:5000/api/auth/login', { email: formData.email, password: formData.password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        setAuth({ isAuthenticated: true, role: res.data.role }); // Unlocks the app!
      } catch (error) {
        setErrorMessage(error.response?.data?.error || "Login failed.");
      }
    }
  };

  const inputStyle = { background: '#050b14', color: '#fff', border: '1px solid #1b4965', padding: '14px', borderRadius: '4px', outline: 'none', width: '100%', marginBottom: '20px' };
  const btnStyle = { background: '#0077b6', color: '#fff', border: 'none', padding: '14px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%', fontSize: '16px' };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%', background: '#050b14' }}>
      <div style={{ background: '#0a111c', border: '1px solid #1b4965', padding: '40px', borderRadius: '8px', width: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        
        <h1 style={{ color: '#00a8e8', textAlign: 'center', marginBottom: '10px', letterSpacing: '2px' }}>FleetFlow</h1>
        <p style={{ color: '#8d99ae', textAlign: 'center', marginBottom: '30px' }}>
          {isRegistering ? 'Create a new account' : 'Sign in to the Command Center'}
        </p>

        {errorMessage && <div style={{ padding: '12px', marginBottom: '20px', background: '#450a0a', border: '1px solid #7f1d1d', color: '#fca5a5', borderRadius: '4px', textAlign: 'center' }}>{errorMessage}</div>}
        {successMessage && <div style={{ padding: '12px', marginBottom: '20px', background: '#064e3b', border: '1px solid #065f46', color: '#6ee7b7', borderRadius: '4px', textAlign: 'center' }}>{successMessage}</div>}

        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email Address" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={inputStyle} />
          <input type="password" placeholder="Password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={inputStyle} />
          
          {/* Only show the Role dropdown if we are on the Registration screen */}
          {isRegistering && (
            <select required value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} style={inputStyle}>
              <option value="Dispatcher">Dispatcher</option>
              <option value="Manager">Manager</option>
            </select>
          )}
          
          {!isRegistering && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <label style={{ color: '#8d99ae', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" /> Remember me
              </label>
              <a href="#" onClick={(e) => { e.preventDefault(); alert("Forgot Password workflow coming soon!"); }} style={{ color: '#00a8e8', fontSize: '14px', textDecoration: 'none' }}>Forgot Password?</a>
            </div>
          )}

          <button type="submit" style={{...btnStyle, marginBottom: '20px'}}>
            {isRegistering ? 'Register Account' : 'Log In'}
          </button>
        </form>

        <p style={{ color: '#8d99ae', textAlign: 'center', fontSize: '14px', margin: 0 }}>
          {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
          <span 
            onClick={() => { setIsRegistering(!isRegistering); setErrorMessage(''); setSuccessMessage(''); }} 
            style={{ color: '#00a8e8', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isRegistering ? 'Log in here' : 'Register here'}
          </span>
        </p>

      </div>
    </div>
  );
}