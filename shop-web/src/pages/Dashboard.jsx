import React, { useContext } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Distribution from './Distribution';
import Transactions from './Transactions';
import Sync from './Sync';
import { ShoppingCart, LogOut, Store, RefreshCw, History, Languages } from 'lucide-react';

const Dashboard = () => {
    const { currentUser, logout } = useContext(AuthContext);
    const { t, language, toggleLanguage } = useLanguage();
    const location = useLocation();

    const menuItems = [
        { path: 'distribute', label: t('distributeRation'), icon: ShoppingCart },
        { path: 'history', label: t('transactionHistory'), icon: History },
        { path: 'sync', label: t('syncData'), icon: RefreshCw },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-10 flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                        <Store className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-xl text-slate-800">{t('shopPortal')}</span>
                </div>

                <nav className="p-4 space-y-2 flex-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.includes(item.path);

                        return (
                            <Link
                                key={item.path}
                                to={`/dashboard/${item.path}`}
                                className={`flex items-center px-4 py-3 rounded-xl transition-all font-medium ${isActive
                                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={toggleLanguage}
                        className="w-full flex items-center px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 mb-3 transition-colors text-sm font-medium"
                    >
                        <Languages className="w-4 h-4 mr-2" />
                        {language === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'}
                    </button>

                    <div className="flex items-center mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                            <Store className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-800 truncate">{currentUser?.id}</p>
                            <p className="text-xs text-slate-500">{t('shopOwner')}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        {t('signOut')}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 bg-slate-50">
                <Routes>
                    <Route path="/" element={<Navigate to="distribute" replace />} />
                    <Route path="distribute" element={<Distribution />} />
                    <Route path="history" element={<Transactions />} />
                    <Route path="sync" element={<Sync />} />
                    <Route path="*" element={<Navigate to="distribute" replace />} />
                </Routes>
            </main>
        </div>
    );
};

export default Dashboard;
