import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function ShopRegister() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [shopId, setShopId] = useState('')
    const [shopName, setShopName] = useState('')
    const [location, setLocation] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleRegister = async () => {
        try {
            const res = await axios.post('/api/shops/register', {
                email,
                password,
                shop_id: shopId,
                shop_name: shopName,
                location,
                device_id: 'WEB-REG-portal'
            })
            setMessage('Success: ' + res.data.message)
            setError('')
            // clear form or redirect
            setTimeout(() => navigate('/'), 2000)
        } catch (err) {
            console.error(err)
            setError('Registration Failed: ' + (err.response?.data?.message || err.message))
            setMessage('')
        }
    }

    return (
        <div className="card">
            <h2>Register New Shop</h2>
            <p>Submit your shop details for Admin approval.</p>

            <div className="form-group">
                <input placeholder="Owner Email" value={email} onChange={e => setEmail(e.target.value)} /><br /><br />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} /><br /><br />

                <input placeholder="Shop ID (Unique)" value={shopId} onChange={e => setShopId(e.target.value)} /><br /><br />
                <input placeholder="Shop Name" value={shopName} onChange={e => setShopName(e.target.value)} /><br /><br />
                <input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} /><br /><br />

                <button onClick={handleRegister}>Submit Registration</button>
            </div>

            {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

            <br />
            <button onClick={() => navigate('/')} style={{ background: '#ccc' }}>Back to Home</button>
        </div>
    )
}

export default ShopRegister
