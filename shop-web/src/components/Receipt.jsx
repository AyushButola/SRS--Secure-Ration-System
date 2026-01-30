import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Receipt = ({ transaction, cart, shopDetails, user }) => {
    const { t, language } = useLanguage();

    if (!transaction && (!cart || cart.length === 0)) return null;

    // Helper to format currency/numbers if needed (not strict here)
    const date = new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US');
    const time = new Date().toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-US');

    return (
        <div id="receipt-print" className="hidden print:block p-8 bg-white text-black font-mono text-sm">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2 uppercase border-b-2 border-black pb-2">
                    {t('shopPortal')}
                </h1>
                <p className="text-lg font-semibold">{t('shopOwner')}: {user?.username || 'SHOP_OWNER'}</p>
                <div className="text-xs mt-1">
                    <p>{t('dateTime')}: {date} {time}</p>
                    <p>TXN ID: {transaction?.txn_id || 'PENDING'}</p>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex justify-between border-b border-black pb-1 mb-2 font-bold">
                    <span>{t('commodity')}</span>
                    <span>{t('quantity')}</span>
                </div>
                {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between mb-1">
                        <span>{item.commodity}</span>
                        <span>{item.quantity} kg/L</span>
                    </div>
                ))}
            </div>

            <div className="border-t-2 border-black pt-4 mb-8 text-center">
                <p className="font-bold text-lg">{t('totalItems')}: {cart.length}</p>
            </div>

            <div className="text-center text-xs space-y-2">
                <p className="font-bold text-base">{t('thankYou')}</p>
                <p>{t('receiptTitle')}</p>
            </div>

            <div className="mt-8 text-[10px] text-center text-gray-500">
                <p>Secure Ration System (SRS)</p>
            </div>
        </div>
    );
};

export default Receipt;
