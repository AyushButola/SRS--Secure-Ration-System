import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function ShopLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleLogin = async () => {
        try {
            const res = await axios.post('/api/auth/login', { email, password })
            // Allow ADMIN or SHOP_OWNER to login here? strict to SHOP_OWNER
            // if(res.data.user.role !== 'SHOP_OWNER') ...

            localStorage.setItem('token', res.data.token)
            localStorage.setItem('role', res.data.user.role)
            navigate('/shop/dashboard')
        } catch (err) {
            setError('Login Failed: ' + (err.response?.data?.message || err.message))
        }
    }

    return (
        <div className="card">
            <h2>Shop Owner Login</h2>
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><br /><br />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} /><br /><br />
            <button onClick={handleLogin}>Login to Shop</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    )
}

export default ShopLogin
