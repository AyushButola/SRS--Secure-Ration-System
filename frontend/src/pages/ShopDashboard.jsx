import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function ShopDashboard() {
    const navigate = useNavigate()
    const token = localStorage.getItem('token')

    // Transaction Form State
    const [beneficiaryId, setBeneficiaryId] = useState('')
    const [commodity, setCommodity] = useState('Rice')
    const [quantity, setQuantity] = useState('')
    const [secretCode, setSecretCode] = useState('') // New Field
    const [message, setMessage] = useState('')
    const [lastHash, setLastHash] = useState('')

    const handleProcess = async () => {
        setMessage('Processing...')
        try {
            const res = await axios.post('/api/transactions/process', {
                shop_id: 'SHOP_SYNC_01', // Default for demo
                beneficiary_id: beneficiaryId,
                commodity,
                quantity: Number(quantity),
                secret_code: secretCode // Send Code
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            setMessage(`Success! Remaining: ${res.data.remaining}`)
            setLastHash(res.data.hash)
            setSecretCode('') // Clear code for security
        } catch (err) {
            console.error(err)
            setMessage('Error: ' + (err.response?.data?.message || err.message))
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        navigate('/')
    }

    return (
        <div className="container">
            <h1>Shop Owner Dashboard</h1>
            <button onClick={logout}>Logout</button>

            <div className="card" style={{ marginTop: '20px' }}>
                <h3>Distribute Ration (Online)</h3>

                <label>Shop ID (For Demo): </label>
                <input placeholder="SHOP_ID" defaultValue="SHOP_SYNC_01" onChange={() => { }} /><br /><br />

                <label>Beneficiary ID: </label>
                <input placeholder="BEN123" value={beneficiaryId} onChange={e => setBeneficiaryId(e.target.value)} /><br /><br />

                <label>Benificiary Ration Code (PIN): </label>
                <input
                    type="password"
                    placeholder="****"
                    value={secretCode}
                    onChange={e => setSecretCode(e.target.value)}
                    style={{ borderColor: 'red' }}
                /><br /><br />

                <label>Commodity: </label>
                <select value={commodity} onChange={e => setCommodity(e.target.value)}>
                    <option value="Rice">Rice</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Sugar">Sugar</option>
                    <option value="Kerosene">Kerosene</option>
                </select><br /><br />

                <label>Quantity: </label>
                <input type="number" placeholder="kg/l" value={quantity} onChange={e => setQuantity(e.target.value)} /><br /><br />

                <button onClick={handleProcess}>Process Transaction (Verify Code)</button>
            </div>

            {message && (
                <div className="card" style={{ marginTop: '20px', background: '#f0f0f0' }}>
                    <p><strong>Status:</strong> {message}</p>
                    {lastHash && <p style={{ fontSize: '0.8em', wordBreak: 'break-all' }}><strong>Txn Hash:</strong> {lastHash}</p>}
                </div>
            )}
        </div>
    )
}

export default ShopDashboard
