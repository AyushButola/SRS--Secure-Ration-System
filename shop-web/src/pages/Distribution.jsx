import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { Search, ShoppingCart, CheckCircle, AlertTriangle, Loader, Plus, Trash2, ShieldCheck, KeyRound, Printer } from 'lucide-react';
import Receipt from '../components/Receipt';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const Distribution = () => {
    const { currentUser, getToken } = useContext(AuthContext);
    const { t } = useLanguage();

    // Steps: 1 = Verify User, 2 = Add to Cart
    const [step, setStep] = useState(1);

    // Verify State
    const [beneficiaryId, setBeneficiaryId] = useState('');
    const [otp, setOtp] = useState('');
    const [otpVerified, setOtpVerified] = useState(false);

    // Cart State
    const [cart, setCart] = useState([]);
    const [selectedCommodity, setSelectedCommodity] = useState('Rice');
    const [quantity, setQuantity] = useState('');

    // UI State
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [lastTransaction, setLastTransaction] = useState(null); // For Receipt

    // --- Step 1: Verification Logic ---
    const handleVerifyOTP = async () => {
        if (!beneficiaryId || !otp) return setError("Please enter Beneficiary ID and OTP");
        setLoading(true);
        setError(null);
        try {
            const token = getToken();
            const res = await axios.post(`${API_URL}/otp/verify`, { beneficiaryId, otp }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.valid) {
                setOtpVerified(true);
                setStep(2); // Move to Cart Step
                setMessage("Beneficiary Verified! Add items to cart.");
            } else {
                setError("Invalid OTP");
            }
        } catch (err) {
            setError(err.response?.data?.error || "Verification Failed");
        } finally {
            setLoading(false);
        }
    };

    // --- Step 2: Cart Logic ---
    const addToCart = () => {
        if (!quantity || parseFloat(quantity) <= 0) return setError("Invalid quantity");

        const newItem = {
            id: Date.now(),
            commodity: selectedCommodity,
            quantity: parseFloat(quantity)
        };

        setCart([...cart, newItem]);
        setQuantity('');
        setMessage(null);
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const handleDistribute = async () => {
        if (cart.length === 0) return setError("Cart is empty");
        setLoading(true);
        setError(null);
        setMessage(null);

        const token = getToken();
        let successCount = 0;
        let failCount = 0;
        let lastTxnData = null;

        try {
            for (const item of cart) {
                try {
                    await axios.post(`${API_URL}/transactions`, {
                        beneficiary_id: beneficiaryId,
                        shop_id: currentUser.id,
                        ration_period: new Date().toISOString().slice(0, 7), // YYYY-MM
                        commodity: item.commodity,
                        quantity: item.quantity
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    successCount++;
                    lastTxnData = {
                        txn_id: Date.now(), // Mock ID as real one comes from individual calls
                        ...item
                    };
                } catch (err) {
                    console.error(`Failed to distribute ${item.commodity}`, err);
                    failCount++;
                }
            }

            if (failCount === 0) {
                setMessage(t('successDistribute'));
                setLastTransaction({ cart: [...cart], ...lastTxnData }); // Save for receipt
                setCart([]);
            } else {
                setError(`Completed with issues: ${successCount} success, ${failCount} failed.`);
            }

        } catch (err) {
            setError("Distribution process failed");
        } finally {
            setLoading(false);
        }
    };

    const resetFlow = () => {
        setStep(1);
        setOtpVerified(false);
        setOtp('');
        setBeneficiaryId('');
        setCart([]);
        setMessage(null);
        setError(null);

        setLastTransaction(null);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center justify-between">
                <div className="flex items-center">
                    <ShoppingCart className="mr-3 text-blue-600" />
                    {t('distributeRation')}
                </div>
                {step === 2 && (
                    <button onClick={resetFlow} className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors">
                        {t('resetNewUser')}
                    </button>
                )}
            </h2>

            {/* Messages */}
            {message && (
                <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-center justify-between border border-green-100 animate-fade-in">
                    <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        {message}
                    </div>
                    {lastTransaction && (
                        <button
                            onClick={handlePrint}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            {t('print')}
                        </button>
                    )}
                </div>
            )}
            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-100 animate-fade-in">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}

            {/* Step 1: Verification */}
            {step === 1 && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-slate-700 flex items-center">
                            <ShieldCheck className="w-5 h-5 mr-2 text-indigo-500" />
                            {t('verifyUser')}
                        </h3>
                        <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wide">
                            {t('verificationMode')}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('beneficiaryId')}</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={beneficiaryId}
                                        onChange={(e) => setBeneficiaryId(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        placeholder={t('enterId')}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('adminSentOtp')}</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        placeholder={t('enterOtp')}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 mb-4">
                            {t('noteOtp')}
                        </div>

                        <button
                            onClick={handleVerifyOTP}
                            disabled={loading || !beneficiaryId || !otp}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
                        >
                            {loading ? <Loader className="animate-spin" /> : t('verifyProceed')}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Distribution Cart */}
            {step === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Item Form */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
                            <Plus className="w-5 h-5 mr-2 text-blue-500" />
                            {t('addItems')}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">{t('commodity')}</label>
                                <select
                                    value={selectedCommodity}
                                    onChange={(e) => setSelectedCommodity(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                                >
                                    <option value="Rice">Rice</option>
                                    <option value="Wheat">Wheat</option>
                                    <option value="Sugar">Sugar</option>
                                    <option value="Kerosene">Kerosene</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">{t('quantity')}</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <button
                            onClick={addToCart}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl transition-all flex justify-center items-center"
                        >
                            <Plus className="w-4 h-4 mr-2" /> {t('addToCart')}
                        </button>
                    </div>

                    {/* Cart Summary */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
                        <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
                            <ShoppingCart className="w-5 h-5 mr-2 text-green-500" />
                            {t('cart')} ({cart.length})
                        </h3>

                        <div className="flex-1 overflow-y-auto min-h-[150px] space-y-3 mb-4">
                            {cart.length === 0 ? (
                                <p className="text-slate-400 text-center py-6">{t('cartEmpty')}</p>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div>
                                            <p className="font-semibold text-slate-800">{item.commodity}</p>
                                            <p className="text-sm text-slate-500">{item.quantity} kg/L</p>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-red-400 hover:text-red-600 p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-auto border-t border-slate-100 pt-4">
                            <div className="flex justify-between mb-4 text-sm font-medium text-slate-600">
                                <span>{t('totalItems')}:</span>
                                <span>{cart.length}</span>
                            </div>
                            <button
                                onClick={handleDistribute}
                                disabled={cart.length === 0 || loading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all flex justify-center items-center"
                            >
                                {loading ? <Loader className="animate-spin w-5 h-5" /> : t('confirmDistribution')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Receipt Component for Printing */}
            <Receipt
                transaction={lastTransaction}
                cart={lastTransaction?.cart}
                user={currentUser}
            />
        </div>
    );
};

export default Distribution;
