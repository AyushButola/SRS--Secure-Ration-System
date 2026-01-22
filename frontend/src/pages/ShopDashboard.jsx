import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import CryptoJS from 'crypto-js'

function ShopDashboard() {
    const navigate = useNavigate()
    const token = localStorage.getItem('token')
    const shopId = 'SHOP_SYNC_01' // Demo ID

    // Transaction Form State
    const [beneficiaryId, setBeneficiaryId] = useState('')
    const [commodity, setCommodity] = useState('Rice')
    const [quantity, setQuantity] = useState('')
    const [secretCode, setSecretCode] = useState('')
    const [message, setMessage] = useState('')
    const [lastHash, setLastHash] = useState('') // For Chain

    // Offline State
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [offlineQueue, setOfflineQueue] = useState([])
    const [showHistory, setShowHistory] = useState(false) // Toggle History

    useEffect(() => {
        // 1. Network Listeners
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // 2. Load Offline Queue
        const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]')
        setOfflineQueue(queue)

        // 3. Load Last Hash (Try Server, fallback to Local)
        fetchLastHash()

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    const fetchLastHash = async () => {
        try {
            // Ideally fetch from API. 
            // For demo, we default to GENESIS_HASH or cached.
            const storedHash = localStorage.getItem('lastHash') || 'GENESIS_HASH'
            setLastHash(storedHash)
        } catch (e) {
            console.log("Could not fetch hash")
        }
    }

    const generateHash = (prevHash, txnData) => {
        const { shop_id, beneficiary_id, commodity, quantity, created_at } = txnData;
        const dataString = `${prevHash}|${shop_id}|${beneficiary_id}|${commodity}|${quantity}|${created_at}`;
        return CryptoJS.SHA256(dataString).toString(CryptoJS.enc.Hex);
    }

    const handleProcess = async () => {
        setMessage('Processing...')
        const timestamp = new Date().toISOString()

        const txnPayload = {
            shop_id: shopId,
            beneficiary_id: beneficiaryId,
            commodity,
            quantity: Number(quantity),
            secret_code: secretCode
        }

        // OFFLINE MODE CHECK
        if (!isOnline) {
            try {
                // 1. Local Processing
                setMessage('Network Unavailable. Switching to Offline Mode...')

                const currentPrevHash = localStorage.getItem('lastHash') || 'GENESIS_HASH'

                // Construct Full Payload for Sync (needs hash)
                const offlineTxn = {
                    txn_id: crypto.randomUUID(),
                    ...txnPayload,
                    timestamp,
                    prev_hash: currentPrevHash
                }

                // Calculate Hash Locally
                const newHash = generateHash(currentPrevHash, { ...offlineTxn, created_at: timestamp })
                offlineTxn.hash = newHash

                // 2. Save to Queue
                const newQueue = [...offlineQueue, offlineTxn]
                setOfflineQueue(newQueue)
                localStorage.setItem('offlineQueue', JSON.stringify(newQueue))

                // 3. Update Local Chain
                localStorage.setItem('lastHash', newHash)
                setLastHash(newHash)

                setMessage(`Saved Offline! (Queue: ${newQueue.length})`)
                setSecretCode('') // Reset input
                return
            } catch (e) {
                setMessage('Offline Error: ' + e.message)
                return
            }
        }

        // ONLINE MODE
        try {
            const res = await axios.post('/api/transactions/process', txnPayload, {
                headers: { Authorization: `Bearer ${token}` }
            })

            setMessage(`Success! Remaining: ${res.data.remaining}`)
            setLastHash(res.data.hash)
            localStorage.setItem('lastHash', res.data.hash) // Update Cache
            setSecretCode('')
        } catch (err) {
            console.error(err)
            // Detect Network Error specifically if axios fails to connect
            if (err.message === 'Network Error' || !err.response) {
                setMessage('Server Unreachable. You appear Offline. Please refresh or check connection.')
                setIsOnline(false); // Force offline mode
            } else {
                setMessage('Error: ' + (err.response?.data?.message || err.message))
            }
        }
    }

    const handleSync = async () => {
        setMessage('Syncing...')
        try {
            const res = await axios.post('/api/transactions/sync', {
                shop_id: shopId,
                transactions: offlineQueue
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            setMessage(`Sync Complete! Processed: ${res.data.processed_count}`)
            setOfflineQueue([])
            localStorage.setItem('offlineQueue', '[]')
        } catch (err) {
            setMessage('Sync Failed: ' + (err.response?.data?.message || err.message))
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p>Status: <span style={{ color: isOnline ? 'green' : 'red', fontWeight: 'bold' }}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span></p>
                <button onClick={logout}>Logout</button>
            </div>

            {/* OFFLINE SYNC BANNER */}
            {offlineQueue.length > 0 && (
                <div className="card" style={{ background: '#fff3cd', border: '1px solid #ffeeba', padding: '10px', marginTop: '10px' }}>
                    <h3>⚠️ Pending Offline Transactions: {offlineQueue.length}</h3>
                    <p>You have data waiting to be sent to the server.</p>
                    <button onClick={handleSync} disabled={!isOnline} style={{ background: isOnline ? '#28a745' : '#ccc', padding: '10px 20px', color: 'white', border: 'none', cursor: isOnline ? 'pointer' : 'not-allowed' }}>
                        {isOnline ? 'Sync Now' : 'Connect to Internet to Sync'}
                    </button>
                </div>
            )}

            <div className="card" style={{ marginTop: '20px' }}>
                <h3>Distribute Ration</h3>

                <label>Shop ID: </label>
                <input disabled value={shopId} /><br /><br />

                <label>Beneficiary ID: </label>
                <input placeholder="BEN123" value={beneficiaryId} onChange={e => setBeneficiaryId(e.target.value)} /><br /><br />

                <label>Benificiary Ration Code (PIN): </label>
                <input
                    type="password"
                    placeholder="****"
                    value={secretCode}
                    onChange={e => setSecretCode(e.target.value)}
                    style={{ borderColor: secretCode.length === 4 ? 'green' : 'red' }}
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

                <button onClick={handleProcess} style={{ background: isOnline ? '#007bff' : '#fd7e14' }}>
                    {isOnline ? 'Process Online' : 'Save Offline'}
                </button>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <button onClick={() => setShowHistory(!showHistory)} style={{ width: '100%', background: '#6c757d' }}>
                    {showHistory ? 'Hide Transaction History' : 'Show Recent Transactions'}
                </button>

                {showHistory && (
                    <div style={{ marginTop: '10px' }}>
                        <TransactionHistory shopId={shopId} token={token} isOnline={isOnline} lastHash={lastHash} />
                    </div>
                )}
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

function TransactionHistory({ shopId, token, isOnline, lastHash }) {
    const [transactions, setTransactions] = useState([])

    useEffect(() => {
        if (isOnline && token) {
            axios.get(`/api/transactions/shop/${shopId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => setTransactions(res.data))
                .catch(err => console.error("History Error", err))
        }
    }, [shopId, token, isOnline, lastHash])

    if (!transactions.length) return <p>No transactions found.</p>

    return (
        <table border="1" cellPadding="5" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em', marginTop: '10px' }}>
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Ben ID</th>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Hash (Short)</th>
                </tr>
            </thead>
            <tbody>
                {transactions.map(t => (
                    <tr key={t.txn_id}>
                        <td>{new Date(t.timestamp).toLocaleString()}</td>
                        <td>{t.beneficiary_id}</td>
                        <td>{t.commodity}</td>
                        <td>{t.quantity}</td>
                        <td title={t.hash}>{t.hash.substring(0, 8)}...</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export default ShopDashboard
