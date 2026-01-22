import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function AdminLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleLogin = async () => {
        try {
            const res = await axios.post('/api/auth/login', { email, password })
            if (res.data.user.role !== 'ADMIN') {
                setError('Access Denied: Not an Admin Account')
                return
            }
            localStorage.setItem('token', res.data.token)
            localStorage.setItem('role', 'ADMIN')
            navigate('/admin/dashboard')
        } catch (err) {
            console.error(err)
            setError('Login Failed: ' + (err.response?.data?.message || err.message))
        }
    }

    return (
        <div className="card">
            <h2>Admin Login</h2>
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><br /><br />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} /><br /><br />
            <button onClick={handleLogin}>Login as Admin</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    )
}

export default AdminLogin
