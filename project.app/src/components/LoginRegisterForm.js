import React, { useState } from 'react';

function LoginRegisterForm({ formType, handleLogin }) { 
  const [activeTab, setActiveTab] = useState(formType || 'login');
  const isLogin = activeTab === 'login';
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const [formData, setFormData] = useState({ 
    firstName: '', lastName: '', username: '',
    email: '', password: '', confirmPassword: '' 
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (serverError) setServerError(''); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setServerError('');
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setServerError("Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin 
        ? 'http://127.0.0.1:5001/api/auth/login' 
        : 'http://127.0.0.1:5001/api/auth/register';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Authentication failed');

      if (isLogin) {
        // 1. Store individual items returned by backend
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('username', data.username);
        
        // FIX: Extract only the first name for the Dashboard greeting
        // This prevents "Aakash undefined" by taking only the first word
        const firstNameOnly = data.firstName ? data.firstName.split(' ')[0] : 'Scholar';
        localStorage.setItem('userName', firstNameOnly);

        // 2. Role-Based Redirect Logic
        // Determine the role based on the email domain if not provided by backend
        const userRole = data.role || (data.email.endsWith('@adminedu.com') ? 'admin' : 'student');
        localStorage.setItem('userRole', userRole); 
        
        // 3. Trigger the redirect in the parent App.js
        handleLogin(userRole); 
      } else {
        alert("Registration Successful! Please login.");
        setActiveTab('login'); 
        setFormData({ firstName: '', lastName: '', username: '', email: '', password: '', confirmPassword: '' });
      }

    } catch (err) {
      setServerError(err.message === "Failed to fetch" 
        ? "Connection Error: Ensure your Node server is running on port 5001." 
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  // ... (rest of your component JSX remains the same)
  return (
    <div className="auth-container p-4 shadow-lg rounded-4 bg-white" style={{ maxWidth: '450px', margin: 'auto' }}>
      <h2 className="text-center fw-black mb-4">{isLogin ? 'Sign In' : 'Join Us'}</h2>
      <div className="d-flex mb-4 bg-light rounded-pill p-1 shadow-sm border">
        <button type="button" className={`btn flex-grow-1 rounded-pill fw-bold py-2 ${isLogin ? 'bg-white shadow-sm text-primary' : 'text-secondary border-0'}`} onClick={() => setActiveTab('login')}>Login</button>
        <button type="button" className={`btn flex-grow-1 rounded-pill fw-bold py-2 ${!isLogin ? 'bg-white shadow-sm text-primary' : 'text-secondary border-0'}`} onClick={() => setActiveTab('register')}>Register</button>
      </div>

      {serverError && <div className="alert alert-danger py-2 small text-center rounded-3 mb-3">{serverError}</div>}

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label small fw-bold text-muted">FIRST NAME</label>
                <input name="firstName" type="text" className="form-control" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label small fw-bold text-muted">LAST NAME</label>
                <input name="lastName" type="text" className="form-control" value={formData.lastName} onChange={handleChange} required />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold text-muted">USERNAME</label>
              <input name="username" type="text" className="form-control" value={formData.username} onChange={handleChange} required />
            </div>
          </>
        )}
        <div className="mb-3">
          <label className="form-label small fw-bold text-muted">EMAIL ADDRESS</label>
          <input name="email" type="email" className="form-control" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label small fw-bold text-muted">PASSWORD</label>
          <input name="password" type="password" className="form-control" value={formData.password} onChange={handleChange} required />
        </div>
        {!isLogin && (
          <div className="mb-3">
            <label className="form-label small fw-bold text-muted">CONFIRM PASSWORD</label>
            <input name="confirmPassword" type="password" className="form-control" value={formData.confirmPassword} onChange={handleChange} required />
          </div>
        )}
        <div className="d-grid mt-4">
          <button type="submit" className={`btn btn-lg fw-bold ${isLogin ? 'btn-dark' : 'btn-primary'}`} disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default LoginRegisterForm;