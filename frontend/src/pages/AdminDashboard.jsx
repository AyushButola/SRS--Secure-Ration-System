import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function AdminDashboard() {
    const [pendingShops, setPendingShops] = useState([])
    const [allShops, setAllShops] = useState([]) // New: Track all shops
    const [message, setMessage] = useState('')
    const navigate = useNavigate()
    const token = localStorage.getItem('token')

    // Stock Form State
    const [selectedShop, setSelectedShop] = useState(null)
    const [stockCommodity, setStockCommodity] = useState('Rice')
    const [stockQty, setStockQty] = useState('')

    useEffect(() => {
        if (!token) navigate('/admin/login')
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const pendingRes = await axios.get('/api/admin/shops/pending', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setPendingShops(pendingRes.data)

            const allRes = await axios.get('/api/admin/shops', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setAllShops(allRes.data)

        } catch (err) {
            console.error(err)
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate('/admin/login')
            }
        }
    }

    const approveShop = async (id) => {
        try {
            await axios.put(`/api/admin/shops/${id}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setMessage('Shop Approved!')
            fetchData()
        } catch (err) {
            setMessage('Approval Failed')
        }
    }

    // New: Suspend / Activate
    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'APPROVED' ? 'SUSPENDED' : 'APPROVED'
        try {
            await axios.put(`/api/admin/shops/${id}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setMessage(`Shop ${newStatus}!`)
            fetchData()
        } catch (err) {
            setMessage('Status Update Failed')
        }
    }

    // New: Add Stock
    const handleAddStock = async () => {
        if (!selectedShop) return
        try {
            await axios.post(`/api/admin/shops/${selectedShop.shop_id}/stock`, {
                commodity: stockCommodity,
                quantity: Number(stockQty)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setMessage(`Added ${stockQty} ${stockCommodity} to ${selectedShop.shop_name}`)
            setSelectedShop(null)
            setStockQty('')
        } catch (err) {
            setMessage('Failed to add stock')
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        navigate('/')
    }

    return (
        <div className="container">
            <h1>Admin Dashboard</h1>
            <button onClick={logout}>Logout</button>
            {message && <p style={{ color: 'blue' }}>{message}</p>}

            {/* Section 1: Pending Approvals */}
            <div className="card" style={{ marginTop: '20px' }}>
                <h3>Pending Shop Approvals</h3>
                {pendingShops.length === 0 ? <p>No pending shops.</p> : (
                    <ul>
                        {pendingShops.map(shop => (
                            <li key={shop.shop_id}>
                                <strong>{shop.shop_name}</strong> ({shop.shop_id})
                                <button onClick={() => approveShop(shop.shop_id)} style={{ marginLeft: '10px' }}>Approve</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Section 2: Manage All Shops */}
            <div className="card" style={{ marginTop: '20px' }}>
                <h3>Manage Shops (Stock & Status)</h3>

                <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allShops.map(shop => (
                            <tr key={shop.shop_id}>
                                <td>{shop.shop_id}</td>
                                <td>{shop.shop_name}</td>
                                <td>
                                    <span style={{
                                        color: shop.status === 'APPROVED' ? 'green' : shop.status === 'SUSPENDED' ? 'red' : 'orange'
                                    }}>
                                        {shop.status}
                                    </span>
                                </td>
                                <td>
                                    {shop.status !== 'PENDING' && (
                                        <>
                                            <button onClick={() => toggleStatus(shop.shop_id, shop.status)}>
                                                {shop.status === 'APPROVED' ? 'Suspend' : 'Activate'}
                                            </button>
                                            &nbsp;
                                            <button onClick={() => setSelectedShop(shop)}>Add Stock</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Stock Modal (Simple Inline) */}
            {selectedShop && (
                <div className="card" style={{ marginTop: '20px', border: '2px solid blue' }}>
                    <h3>Add Stock to: {selectedShop.shop_name}</h3>
                    <select value={stockCommodity} onChange={e => setStockCommodity(e.target.value)}>
                        <option>Rice</option>
                        <option>Wheat</option>
                        <option>Sugar</option>
                        <option>Kerosene</option>
                    </select>
                    <input type="number" placeholder="Qty" value={stockQty} onChange={e => setStockQty(e.target.value)} />
                    <button onClick={handleAddStock}>Confirm Add</button>
                    <button onClick={() => setSelectedShop(null)} style={{ background: '#ccc' }}>Cancel</button>
                </div>
            )}

        </div>
    )
}

export default AdminDashboard
