import React, { useEffect, useState } from 'react';
import client from './api/client';
import Login from './Login';
import { LayoutDashboard, Users, ShoppingBag, AlertTriangle, Link, RefreshCcw, LogOut } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState({ beneficiaries: 0, shops: 0, transactions: 0, pending_conflicts: 0 });
  const [ledger, setLedger] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);

  const checkAuth = () => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsAuthenticated(true);
      fetchData();
    } else {
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, ledgerRes, conflictsRes] = await Promise.all([
        client.get('/admin/stats'),
        client.get('/admin/ledger'),
        client.get('/admin/conflicts')
      ]);

      setStats(statsRes.data);
      setLedger(ledgerRes.data);
      setConflicts(conflictsRes.data);
    } catch (e) {
      console.error("Fetch Error", e);
      if (e.response && e.response.status === 401) { // Token invalid/expired
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (!isAuthenticated) {
    return <Login onLogin={() => { setIsAuthenticated(true); fetchData(); }} />;
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">SRS Admin Command Center</h1>
          <p className="text-gray-500">Secure Ration System - Blockchain Monitor</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <RefreshCcw size={18} /> Refresh Data
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard icon={<Users className="text-blue-500" />} label="Beneficiaries" value={stats.beneficiaries} />
        <StatCard icon={<ShoppingBag className="text-purple-500" />} label="Ration Shops" value={stats.shops} />
        <StatCard icon={<Link className="text-green-500" />} label="Total Transactions" value={stats.transactions} />
        <StatCard icon={<AlertTriangle className="text-red-500" />} label="Pending Conflicts" value={stats.pending_conflicts} alert={stats.pending_conflicts > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Ledger Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Link className="text-green-600" /> Live Ledger Chain
          </h2>
          <div className="space-y-4">
            {ledger.map((txn, i) => (
              <div key={txn.txn_id} className="relative pl-8 pb-4 border-l-2 border-gray-200 last:border-0 last:pb-0">
                {/* Chain Connector Node */}
                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${txn.status === 'VALID' ? 'bg-green-500 border-green-200' : 'bg-red-500 border-red-200'}`}></div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs text-gray-400">TX: {txn.txn_id.substring(0, 8)}...</span>
                    <span className={`text-xs px-2 py-1 rounded ${txn.status === 'VALID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{txn.status}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold">{txn.commodity} - {txn.quantity}KG</h3>
                    <span className="text-sm text-gray-500">{new Date(txn.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    To: <b>{txn.beneficiary_name || txn.beneficiary_id}</b> <br />
                    At: {txn.shop_name || txn.shop_id}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 font-mono text-[10px] break-all text-gray-400">
                    HASH: {txn.hash} <br />
                    PREV: {txn.prev_hash}
                  </div>
                </div>
              </div>
            ))}
            {ledger.length === 0 && <p className="text-gray-400 italic">No transactions found.</p>}
          </div>
        </div>

        {/* Conflicts Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <AlertTriangle className="text-red-600" /> Fraud Alerts
          </h2>
          <div className="space-y-4">
            {conflicts.map(conf => (
              <div key={conf.conflict_id} className="bg-red-50 border border-red-100 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-red-800">{conf.conflict_type}</span>
                  <span className="text-xs text-red-500">{new Date(conf.detected_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-red-700 mb-2">
                  Beneficiary: {conf.beneficiary_name} <br />
                  TX ID: {conf.txn_id.substring(0, 8)}...
                </p>
                <button className="w-full text-center bg-white border border-red-200 text-red-600 py-1 rounded hover:bg-red-100 transition text-sm">
                  Investigate
                </button>
              </div>
            ))}
            {conflicts.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <div className="inline-block p-4 bg-green-50 rounded-full mb-2">
                  <Users className="text-green-400" size={32} />
                </div>
                <p>No active conflicts.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

const StatCard = ({ icon, label, value, alert }) => (
  <div className={`bg-white p-6 rounded-xl shadow-sm border ${alert ? 'border-red-300 bg-red-50' : 'border-gray-100'} flex items-center gap-4`}>
    <div className={`p-4 rounded-lg ${alert ? 'bg-red-200' : 'bg-gray-50'}`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-500 text-sm">{label}</p>
      <p className={`text-2xl font-bold ${alert ? 'text-red-700' : 'text-gray-800'}`}>{value}</p>
    </div>
  </div>
);

export default App;
