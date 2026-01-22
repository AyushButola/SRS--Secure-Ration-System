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
    // Disabled Auto-Login for Demo
    // const token = localStorage.getItem('admin_token');
    // if (token) {
    //   setIsAuthenticated(true);
    //   fetchData();
    // } else {
    setIsAuthenticated(false);
    setLoading(false);
    // }
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
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      {/* Header */}
      <header className="flex justify-between items-center mb-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">SRS Command Center</h1>
          <p className="text-slate-500 font-medium mt-1">Blockchain-Enabled Ration Distribution Monitor</p>
        </div>
        <div className="flex gap-4">
          <button onClick={fetchData} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition active:scale-95">
            <RefreshCcw size={18} /> Refresh
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 transition">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard icon={<Users className="text-white" size={24} />} bg="bg-blue-500" label="Beneficiaries" value={stats.beneficiaries} />
        <StatCard icon={<ShoppingBag className="text-white" size={24} />} bg="bg-violet-500" label="Ration Shops" value={stats.shops} />
        <StatCard icon={<Link className="text-white" size={24} />} bg="bg-emerald-500" label="Total Transactions" value={stats.transactions} />
        <StatCard icon={<AlertTriangle className="text-white" size={24} />} bg="bg-rose-500" label="Pending Conflicts" value={stats.pending_conflicts} alert={stats.pending_conflicts > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Ledger Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-slate-800">
            <div className="bg-emerald-100 p-2 rounded-lg"><Link className="text-emerald-600" size={20} /></div>
            Live Ledger Chain
          </h2>
          <div className="space-y-6">
            {ledger.map((txn, i) => (
              <div key={txn.txn_id} className="relative pl-10 pb-6 border-l-2 border-slate-200 last:border-0 last:pb-0">
                {/* Chain Connector Node */}
                <div className={`absolute -left-[9px] top-6 w-4 h-4 rounded-full border-2 ring-4 ring-white ${txn.status === 'VALID' ? 'bg-emerald-500 border-emerald-200' : 'bg-rose-500 border-rose-200'}`}></div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 hover:shadow-md transition duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest">TX: {txn.txn_id.substring(0, 8)}</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${txn.status === 'VALID' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{txn.status}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-lg text-slate-800">{txn.commodity} <span className="text-slate-400">|</span> {txn.quantity} KG</h3>
                    <span className="text-sm font-medium text-slate-500">{new Date(txn.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-slate-600 mb-4 leading-relaxed">
                    <span className="font-semibold text-slate-700">Beneficiary:</span> {txn.beneficiary_name || txn.beneficiary_id} <br />
                    <span className="font-semibold text-slate-700">Shop:</span> {txn.shop_name || txn.shop_id}
                  </div>
                  <div className="pt-3 border-t border-slate-200 font-mono text-[10px] text-slate-400 break-all flex flex-col gap-1">
                    <div><span className="font-bold text-slate-500">HASH:</span> {txn.hash}</div>
                    <div><span className="font-bold text-slate-500">PREV:</span> {txn.prev_hash}</div>
                  </div>
                </div>
              </div>
            ))}
            {ledger.length === 0 && <p className="text-slate-400 italic text-center py-10">No transactions recorded yet.</p>}
          </div>
        </div>

        {/* Conflicts Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 h-fit sticky top-8">
          <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-slate-800">
            <div className="bg-rose-100 p-2 rounded-lg"><AlertTriangle className="text-rose-600" size={20} /></div>
            Fraud Alerts
          </h2>
          <div className="space-y-4">
            {conflicts.map(conf => (
              <div key={conf.conflict_id} className="bg-rose-50 border border-rose-100 p-5 rounded-xl">
                <div className="flex justify-between mb-2 items-center">
                  <span className="font-bold text-rose-800 text-sm uppercase tracking-wide">{conf.conflict_type}</span>
                  <span className="text-xs font-medium text-rose-500">{new Date(conf.detected_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-rose-700 mb-4 font-medium">
                  {conf.beneficiary_name || 'Unknown User'} <br />
                  <span className="opacity-75 font-mono text-xs">TX: {conf.txn_id.substring(0, 8)}...</span>
                </p>
                <button className="w-full text-center bg-white border border-rose-200 text-rose-600 py-2 rounded-lg font-bold hover:bg-rose-100 transition text-sm shadow-sm">
                  Investigate Issue
                </button>
              </div>
            ))}
            {conflicts.length === 0 && (
              <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                <div className="inline-block p-4 bg-emerald-50 rounded-full mb-3">
                  <Users className="text-emerald-400" size={28} />
                </div>
                <p className="font-medium">System Secure</p>
                <p className="text-sm opacity-70">No active threats detected</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

const StatCard = ({ icon, label, value, alert, bg }) => (
  <div className={`bg-white p-6 rounded-2xl shadow-sm border ${alert ? 'border-rose-300 bg-rose-50' : 'border-slate-100'} flex items-center gap-5 transition hover:shadow-md`}>
    <div className={`p-4 rounded-xl shadow-sm ${bg || (alert ? 'bg-rose-500' : 'bg-slate-100')}`}>
      {icon}
    </div>
    <div>
      <p className="text-slate-500 text-sm font-bold uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-extrabold ${alert ? 'text-rose-700' : 'text-slate-800'}`}>{value}</p>
    </div>
  </div>
);

export default App;
