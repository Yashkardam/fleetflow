import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login({ setAuth }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // UI States: 'login', 'register', 'forgot-request', 'reset-password'
  const [viewState, setViewState] = useState('login'); 
  const [formData, setFormData] = useState({ email: '', password: '', role: 'Dispatcher' });
  const [resetToken, setResetToken] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // IMPORTANT: Check if there is a token in the URL (from the Gmail link)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setViewState('reset-password'); // Jump straight to the reset screen!
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (viewState === 'register') {
        await axios.post('http://localhost:5000/api/auth/register', formData);
        setSuccessMessage('Account created! You can now log in.');
        setViewState('login'); 
        setFormData({ ...formData, password: '' }); 

      } else if (viewState === 'forgot-request') {
        // Step 1: Request the email link
        const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email: formData.email });
        setSuccessMessage(res.data.message);
        setFormData({ ...formData, email: '' });

      } else if (viewState === 'reset-password') {
        // Step 2: Submit the new password with the token from the email
        const res = await axios.post('http://localhost:5000/api/auth/reset-password', {
          token: resetToken,
          newPassword: formData.password
        });
        setSuccessMessage(res.data.message);
        setViewState('login');
        setFormData({ ...formData, password: '' });
        navigate('/'); // Clean the token out of the URL bar

      } else {
        // Standard Login
        const res = await axios.post('http://localhost:5000/api/auth/login', { 
          email: formData.email, 
          password: formData.password 
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        setAuth({ isAuthenticated: true, role: res.data.role }); 
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.error || "An error occurred. Please try again.");
    }
  };

  const inputStyle = { background: '#050b14', color: '#fff', border: '1px solid #1b4965', padding: '14px', borderRadius: '4px', outline: 'none', width: '100%', marginBottom: '20px' };
  const btnStyle = { background: '#0077b6', color: '#fff', border: 'none', padding: '14px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%', fontSize: '16px', marginBottom: '20px' };
  const linkStyle = { color: '#00a8e8', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%', background: '#050b14' }}>
      <div style={{ background: '#0a111c', border: '1px solid #1b4965', padding: '40px', borderRadius: '8px', width: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        
        <h1 style={{ color: '#00a8e8', textAlign: 'center', marginBottom: '10px', letterSpacing: '2px' }}>FleetFlow</h1>
        <p style={{ color: '#8d99ae', textAlign: 'center', marginBottom: '30px' }}>
          {viewState === 'register' && 'Create a new account'}
          {viewState === 'forgot-request' && 'Enter email to receive reset link'}
          {viewState === 'reset-password' && 'Create your new password'}
          {viewState === 'login' && 'Sign in to the Command Center'}
        </p>

        {errorMessage && <div style={{ padding: '12px', marginBottom: '20px', background: '#450a0a', border: '1px solid #7f1d1d', color: '#fca5a5', borderRadius: '4px', textAlign: 'center' }}>{errorMessage}</div>}
        {successMessage && <div style={{ padding: '12px', marginBottom: '20px', background: '#064e3b', border: '1px solid #065f46', color: '#6ee7b7', borderRadius: '4px', textAlign: 'center' }}>{successMessage}</div>}

        <form onSubmit={handleSubmit}>
          {viewState !== 'reset-password' && (
            <input 
              type="email" placeholder="Email Address" required 
              value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} 
              style={inputStyle} 
            />
          )}
          
          {viewState !== 'forgot-request' && (
            <input 
              type="password" required 
              placeholder={viewState === 'reset-password' ? "Enter New Password" : "Password"}
              value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} 
              style={inputStyle} 
            />
          )}
          
          {viewState === 'register' && (
            <select required value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} style={inputStyle}>
              <option value="Dispatcher">Dispatcher</option>
              <option value="Manager">Manager</option>
            </select>
          )}
          
          {viewState === 'login' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <label style={{ color: '#8d99ae', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" /> Remember me
              </label>
              <span onClick={() => { setViewState('forgot-request'); setErrorMessage(''); setSuccessMessage(''); }} style={linkStyle}>
                Forgot Password?
              </span>
            </div>
          )}

          <button type="submit" style={btnStyle}>
            {viewState === 'register' && 'Register Account'}
            {viewState === 'forgot-request' && 'Send Reset Link'}
            {viewState === 'reset-password' && 'Save New Password'}
            {viewState === 'login' && 'Log In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {viewState !== 'login' ? (
            <span onClick={() => { setViewState('login'); setErrorMessage(''); setSuccessMessage(''); navigate('/'); }} style={linkStyle}>
              &larr; Back to Login
            </span>
          ) : (
            <p style={{ color: '#8d99ae', fontSize: '14px', margin: 0 }}>
              Don't have an account? <span onClick={() => { setViewState('register'); setErrorMessage(''); setSuccessMessage(''); }} style={linkStyle}>Register here</span>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}