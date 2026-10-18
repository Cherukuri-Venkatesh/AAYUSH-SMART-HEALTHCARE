import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'
import { PhcContext } from '../context/PhcContext'
import { showError, showSuccess } from '../utils/adminToast'
import { BACKENDURL } from '../../lib'
import './Login.css'

const Login = () => {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('ADMIN')
  const [loading, setLoading] = useState(false)

  const { setDToken } = useContext(DoctorContext)
  const { setAToken } = useContext(AdminContext)
  const { setPhcToken, setPhcRole } = useContext(PhcContext)
  const navigate = useNavigate()

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true)

    // Validation
    if (!email.trim()) {
      showError("Email is required");
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9]+@gmail\.com$/.test(email)) {
      showError("Email must be alphanumeric@gmail.com");
      setLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      showError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(`${BACKENDURL}auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          role
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await res.text();

      if (!res.ok) {
        throw new Error(data);
      }

      // Store token and redirect based on role
      if (role === 'ADMIN') {
        setAToken(data)
        localStorage.setItem('aToken', data)
        showSuccess("Admin Login Successful")
        navigate('/admin-dashboard')
      } else if (role === 'DOCTOR') {
        setDToken(data)
        localStorage.setItem('dToken', data)
        showSuccess("Doctor Login Successful")
        navigate('/doctor-dashboard')
      } else if (role === 'PHC_CENTER') {
        setPhcToken(data)
        setPhcRole('PHC_CENTER')
        localStorage.setItem('phcToken', data)
        localStorage.setItem('phcRole', 'PHC_CENTER')
        showSuccess("PHC Center Login Successful")
        navigate('/phc-centers/dashboard')
      }

    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        showError("Backend server connection timed out. Please ensure the backend is running.");
      } else {
        showError(err.message || "Login Failed. Please verify backend is running.");
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='admin-login-form'>
      <div className='admin-login-container'>

        <p className='admin-login-title'>
          <span className='primary-text'>Staff & Provider Login</span>
        </p>

        {/* EMAIL */}
        <div className='admin-login-form-group'>
          <p>Email</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* PASSWORD */}
        <div className='admin-login-form-group'>
          <p>Password</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength="6"
            required
          />
        </div>

        {/* ✅ ROLE FIELD */}
        <div className='admin-login-form-group'>
          <p>Portal Role</p>
          <select value={role} onChange={(e) => setRole(e.target.value)} disabled={loading}>
            <option value="ADMIN">Admin</option>
            <option value="DOCTOR">Doctor</option>
            <option value="PHC_CENTER">PHC Center</option>
          </select>
        </div>

        <button type="submit" className='admin-login-submit-btn' disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

      </div>
    </form>
  )
}

export default Login;