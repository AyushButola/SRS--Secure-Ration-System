import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function BeneficiaryDashboard() {
    const navigate = useNavigate()
    const beneficiaryId = localStorage.getItem('beneficiary_id')
    const [entitlements, setEntitlements] = useState([])
    const [transactions, setTransactions] = useState([])
    const [secretCode, setSecretCode] = useState('Loading...') // To show the code
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!beneficiaryId) navigate('/')
        fetchData()
    }, [])

    const fetchData = async () => {
        // 1. Entitlements
        try {
            const entRes = await axios.get(`/api/beneficiaries/${beneficiaryId}/entitlements`)
            setEntitlements(entRes.data)
        } catch (err) {
            console.error("Entitlements Error:", err)
        }

        // 2. Transactions
        try {
            const txnRes = await axios.get(`/api/transactions/beneficiary/${beneficiaryId}`)
            setTransactions(txnRes.data)
        } catch (err) {
            console.error("Transactions Error:", err)
        }

        // 3. Secret Code
        try {
            const codeRes = await axios.get(`/api/beneficiaries/${beneficiaryId}/code`)
            console.log('Code Fetch Success:', codeRes.data);
            setSecretCode(codeRes.data.secret_code)
        } catch (e) {
            console.error('Code Fetch Error:', e);
            setSecretCode(`Error: ${e.response?.status || 'Net'} - ${e.message}`)
        }

        setLoading(false)
    }

    const logout = () => {
        localStorage.removeItem('beneficiary_id')
        navigate('/')
    }

    return (
        <div className="container">
            <h1>Beneficiary Dashboard</h1>
            <p><strong>ID:</strong> {beneficiaryId}</p>

            {/* SECRET CODE CARD */}
            <div className="card" style={{ background: '#e3f2fd', border: '2px solid #2196f3' }}>
                <h2 style={{ margin: 0 }}>Your Secure Ration Code</h2>
                <h1 style={{ fontSize: '3em', margin: '10px 0', letterSpacing: '5px' }}>{secretCode}</h1>
                <p>Show this code to the Shop Owner to collect your ration.</p>
            </div>

            <button onClick={logout} style={{ marginBottom: '20px', marginTop: '20px' }}>Logout</button>

            {/* ENTITLEMENTS */}
            <div>
                <h3>My Entitlements (Current Period)</h3>
                {loading ? <p>Loading data...</p> : entitlements.length === 0 ? <p>No entitlements found.</p> : (
                    <div className="card-grid">
                        {entitlements.map(item => (
                            <div key={item.entitlement_id} className="card" style={{ border: '1px solid #ddd', padding: '10px', margin: '10px' }}>
                                <h4>{item.commodity}</h4>
                                <p>Max: {item.max_quantity} kg/l</p>
                                <p>Consumed: {item.consumed_quantity} kg/l</p>
                                <p><strong>Remaining: {item.max_quantity - item.consumed_quantity} kg/l</strong></p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <hr />

            {/* HISTORY */}
            <div style={{ marginTop: '30px' }}>
                <h3>Transaction History</h3>
                {transactions.length === 0 ? <p>No recent transactions.</p> : (
                    <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Shop</th>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(txn => (
                                <tr key={txn.txn_id}>
                                    <td>{new Date(txn.timestamp).toLocaleString()}</td>
                                    <td>{txn.shop_name || txn.shop_id}</td>
                                    <td>{txn.commodity}</td>
                                    <td>{txn.quantity}</td>
                                    <td>{txn.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default BeneficiaryDashboard
