import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { History, Search, ArrowUpRight, Calendar } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const Transactions = () => {
    const { getToken } = useContext(AuthContext);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = getToken();
            const res = await axios.get(`${API_URL}/transactions/shop/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTransactions(res.data);
        } catch (err) {
            console.error("Failed to fetch history", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredTxns = transactions.filter(t =>
        t.beneficiary_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.beneficiary_name && t.beneficiary_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <History className="mr-3 text-blue-600" />
                        Transaction History
                    </h2>
                    <p className="text-slate-500 mt-1">View past distributions and beneficiary details.</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search Beneficiary..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full md:w-64"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="p-4 font-semibold text-slate-600">Beneficiary</th>
                                    <th className="p-4 font-semibold text-slate-600">Items</th>
                                    <th className="p-4 font-semibold text-slate-600">Date & Time</th>
                                    <th className="p-4 font-semibold text-slate-600">Status</th>
                                    <th className="p-4 font-semibold text-slate-600">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredTxns.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-400">
                                            No transactions found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTxns.map((txn) => (
                                        <tr key={txn.txn_id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4">
                                                <div>
                                                    <p className="font-semibold text-slate-800">{txn.beneficiary_name || 'Unknown'}</p>
                                                    <p className="text-xs text-slate-500 font-mono">{txn.beneficiary_id}</p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                                                    {txn.commodity} • {txn.quantity}kg/L
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center text-sm text-slate-600">
                                                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                                    {new Date(txn.timestamp).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${txn.status === 'VALID' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                                    }`}>
                                                    {txn.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <button className="text-slate-400 hover:text-blue-600 transition-colors">
                                                    <ArrowUpRight className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions;
