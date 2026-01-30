import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react';

const Sync = () => {
    const { t } = useLanguage();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleSync = () => {
        setSyncing(true);
        // Simulate sync process
        setTimeout(() => {
            setSyncing(false);
            setLastSync(new Date().toLocaleTimeString());
        }, 2000);
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                <RefreshCw className="mr-3 text-blue-600" />
                {t('dataSync')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Network Status Card */}
                <div className={`p-6 rounded-2xl shadow-sm border ${isOnline ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-semibold ${isOnline ? 'text-green-800' : 'text-red-800'}`}>
                            {t('networkStatus')}
                        </h3>
                        {isOnline ? <Wifi className="text-green-600 w-6 h-6" /> : <WifiOff className="text-red-600 w-6 h-6" />}
                    </div>
                    <p className={`text-2xl font-bold ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
                        {isOnline ? t('connected') : t('offline')}
                    </p>
                    <p className="text-sm mt-2 opacity-80">
                        {isOnline ? t('onlineMsg') : t('offlineMsg')}
                    </p>
                </div>

                {/* Sync Action Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">{t('syncActions')}</h3>
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-slate-500">{t('pendingTxns')}</p>
                        <span className="bg-slate-100 text-slate-800 py-1 px-3 rounded-full text-sm font-bold">0</span>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                        <p className="text-slate-500">{t('lastSynced')}</p>
                        <span className="text-slate-800 font-medium">{lastSync}</span>
                    </div>

                    <button
                        onClick={handleSync}
                        disabled={!isOnline || syncing}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all flex justify-center items-center"
                    >
                        {syncing ? <RefreshCw className="animate-spin w-5 h-5" /> : t('syncNow')}
                    </button>
                    {syncing && <p className="text-center text-sm text-blue-600 mt-2">{t('synchronizing')}</p>}
                </div>
            </div>

            <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                    {t('syncLog')}
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                        <span className="text-slate-600">{t('fullDataSync')}</span>
                        <span className="text-slate-400">{lastSync}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                        <span className="text-slate-600">Beneficiary List Update</span>
                        <span className="text-slate-400">10:00 AM</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sync;
