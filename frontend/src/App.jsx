import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'

// Pages
import AdminLogin from './pages/AdminLogin'
import ShopLogin from './pages/ShopLogin'
import BeneficiaryLogin from './pages/BeneficiaryLogin'
import AdminDashboard from './pages/AdminDashboard'
import ShopDashboard from './pages/ShopDashboard'
import BeneficiaryDashboard from './pages/BeneficiaryDashboard'
import ShopRegister from './pages/ShopRegister'

// Landing Page Component
function Landing() {
  return (
    <div className="card">
      <h1>Secure Ration System</h1>
      <p>Select your role to Login:</p>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Link to="/admin/login"><button>Admin Login</button></Link>
        <Link to="/shop/login"><button>Shop Owner Login</button></Link>
        <Link to="/beneficiary/login"><button>Beneficiary Login</button></Link>
      </nav>
      <hr />
      <div style={{ marginTop: '20px' }}>
        <h3>New Shop?</h3>
        <Link to="/shop/register"><button style={{ backgroundColor: '#4CAF50' }}>Register New Shop</button></Link>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/shop/login" element={<ShopLogin />} />
        <Route path="/beneficiary/login" element={<BeneficiaryLogin />} />

        <Route path="/shop/register" element={<ShopRegister />} />

        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/shop/dashboard" element={<ShopDashboard />} />
        <Route path="/beneficiary/dashboard" element={<BeneficiaryDashboard />} />
      </Routes>
    </Router>
  )
}

export default App
