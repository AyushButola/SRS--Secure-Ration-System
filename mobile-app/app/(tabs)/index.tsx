import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, LayoutAnimation, Platform, UIManager, Alert, Modal, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDB, getDB } from '../../src/db/sqlite';
import * as Crypto from 'expo-crypto';
import CustomModal from '../../components/CustomModal';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import ReceiptModal from '../../components/ReceiptModal';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export default function Dashboard() {
    const [offlineCount, setOfflineCount] = useState(0);
    const [cart, setCart] = useState<any[]>([]);

    // Receipt State
    const [showReceipt, setShowReceipt] = useState(false);
    const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);
    const [recentTxns, setRecentTxns] = useState<any[]>([]);
    const [scannedItem, setScannedItem] = useState('');
    const [stock, setStock] = useState<any>(null);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'success' | 'error'>('success');
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');

    // To check network status (Pseudo-code, assuming we might need NetInfo later or just try-catch)
    const syncTransactions = async () => {
        try {
            const db = await getDB();
            const pending = await db.getAllAsync('SELECT * FROM offline_transactions WHERE synced = 0');
            if (pending.length === 0) return;

            const client = require('../../src/api/client').default;
            // Transform for API
            const payload = pending.map((t: any) => ({
                ...t,
                // formatting if needed
            }));

            await client.post('/sync', { device_id: 'SHOP_DEVICE_001', transactions: payload });

            // Mark as synced locally
            for (const t of pending) {
                await db.runAsync('UPDATE offline_transactions SET synced = 1 WHERE id = ?', [t.id]);
            }
            updatePendingCount();
        } catch (e) {
            console.log('Auto-Sync Failed (Offline?)', e);
        }
    };

    // QR Scanner State
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [scannedBeneficiaryId, setScannedBeneficiaryId] = useState('');
    const [otp, setOtp] = useState('');

    const router = useRouter();

    // Language State
    const [language, setLanguage] = useState<'en' | 'hi'>('en');

    const translations = {
        en: {
            offlineMode: 'OFFLINE MODE',
            pendingSync: 'Pending Sync',
            logout: 'Logout',
            distributeRation: 'Distribute Ration',
            beneficiary: 'Beneficiary',
            clear: 'Clear',
            scanQr: 'Scan Beneficiary QR',
            enterId: 'Enter Beneficiary ID (or Scan QR)',
            scanCommodity: 'Scan Commodity (e.g. RICE)',
            addToCart: 'Add to Cart',
            enterOtp: 'Enter Beneficiary OTP',
            reset: 'Reset / Clear Queue',
            cart: 'Cart',
            liveStock: 'Live Stock Levels',
            rice: 'Rice',
            wheat: 'Wheat',
            cartEmpty: 'Cart is empty',
            recentDistributions: 'Recent Distributions',
            viewReceipt: 'View Receipt',
            completeDistribution: 'Complete Distribution',
            distributionComplete: 'Distribution Complete',
            successMsg: 'Successfully distributed:',
            inputError: 'Input Error',
            enterCommodity: 'Please enter a commodity name',
            noBeneficiary: 'No Beneficiary',
            scanFirst: 'Please scan beneficiary QR code first.',
            otpRequired: 'OTP Required',
            enterOtpMsg: 'Please enter the beneficiary OTP.',
            invalidOtp: 'Invalid OTP',
            otpExpired: 'The OTP entered is incorrect or has expired.'
        },
        hi: {
            offlineMode: 'ऑफलाइन मोड',
            pendingSync: 'सिंक पेंडिंग',
            logout: 'लॉग आउट',
            distributeRation: 'राशन वितरण',
            beneficiary: 'लाभार्थी',
            clear: 'साफ़ करें',
            scanQr: 'लाभार्थी क्यूआर स्कैन करें',
            enterId: 'लाभार्थी आईडी दर्ज करें (या क्यूआर स्कैन करें)',
            scanCommodity: 'वस्तु स्कैन करें (जैसे चावल)',
            addToCart: 'कार्ट में डालें',
            enterOtp: 'लाभार्थी ओटीपी दर्ज करें',
            reset: 'रीसेट / कतार साफ़ करें',
            cart: 'कार्ट',
            liveStock: 'लाइव स्टॉक',
            rice: 'चावल',
            wheat: 'गेहूं',
            cartEmpty: 'कार्ट खाली है',
            recentDistributions: 'हालिया वितरण',
            viewReceipt: 'रसीद देखें',
            completeDistribution: 'वितरण पूरा करें',
            distributionComplete: 'वितरण पूरा हुआ',
            successMsg: 'सफलतापूर्वक वितरित:',
            inputError: 'इनपुट त्रुटि',
            enterCommodity: 'कृपया वस्तु का नाम दर्ज करें',
            noBeneficiary: 'कोई लाभार्थी नहीं',
            scanFirst: 'कृपया पहले लाभार्थी क्यूआर स्कैन करें',
            otpRequired: 'ओटीपी आवश्यक',
            enterOtpMsg: 'कृपया लाभार्थी ओटीपी दर्ज करें',
            invalidOtp: 'अमान्य ओटीपी',
            otpExpired: 'ओटीपी गलत है या समाप्त हो गया है'
        }
    };

    const t = translations[language];

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'hi' : 'en');
    };

    useEffect(() => {
        initDB();
        updatePendingCount();
        fetchStock();
    }, []);

    const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
        setScanned(true);
        try {
            const qrData = JSON.parse(data);
            if (qrData.type === 'beneficiary_qr' && qrData.beneficiaryId) {
                setScannedBeneficiaryId(qrData.beneficiaryId);
                showModal('success', 'QR Scanned', `Beneficiary ID: ${qrData.beneficiaryId}`);
            } else {
                showModal('error', 'Invalid QR', 'This QR code is not valid for ration distribution.');
            }
        } catch (err) {
            showModal('error', 'Invalid QR', 'Could not parse QR code data.');
        }
    };

    const showModal = (type: 'success' | 'error', title: string, message: string) => {
        setModalType(type);
        setModalTitle(title);
        setModalMessage(message);
        setModalVisible(true);
    };

    const logout = async () => {
        Alert.alert(
            t.logout,
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: t.logout, onPress: async () => {
                        await AsyncStorage.clear();
                        router.replace('/');
                    }
                },
            ]
        );
    };

    const fetchStock = async () => {
        try {
            const client = require('../../src/api/client').default;
            const shopId = await AsyncStorage.getItem('shop_id') || 'SHOP_001';
            const res = await client.get(`/shops/${shopId}/stock`);
            setStock(res.data);
        } catch (err) {
            console.log('Stock Fetch Error', err);
        }
    };

    const updatePendingCount = async () => {
        const db = await getDB();
        const res = await db.getAllAsync('SELECT * FROM offline_transactions WHERE synced = 0');
        setOfflineCount(res.length);

        // Also fetch recent transactions (Both synced and offline)
        const recents = await db.getAllAsync('SELECT * FROM offline_transactions ORDER BY timestamp DESC LIMIT 5');
        setRecentTxns(recents);
    };

    const addToCart = () => {
        if (!scannedItem) {
            showModal('error', t.inputError, t.enterCommodity);
            return;
        }

        const newItem = {
            id: Crypto.randomUUID(),
            commodity: scannedItem.trim().toUpperCase(),
            quantity: 1, // Default 1kg for demo
            price: 0
        };

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCart(prev => [newItem, ...prev]); // Add to top
        setScannedItem('');
    };

    const clearData = async () => {
        const db = await getDB();
        await db.runAsync('DELETE FROM offline_transactions');
        setCart([]);
        updatePendingCount();
        showModal('success', 'Cleared', 'Local queue has been cleared.');
    };

    const checkout = async () => {
        if (cart.length === 0) return;

        if (!scannedBeneficiaryId) {
            showModal('error', t.noBeneficiary, t.scanFirst);
            return;
        }

        if (!otp) {
            showModal('error', t.otpRequired, t.enterOtpMsg);
            return;
        }

        // Verify OTP
        let isOtpVerified = false;

        // 1. Try Verify (Online)
        try {
            const isValid = await verifyOTP(scannedBeneficiaryId, otp);
            if (isValid) {
                isOtpVerified = true;
            } else {
                showModal('error', t.invalidOtp, t.otpExpired);
                return;
            }
        } catch (err: any) {
            // Network Error -> Offline Mode
            console.log('Offline Mode: Storing without verification');
            isOtpVerified = false;
        }

        const db = await getDB();
        const shopId = await AsyncStorage.getItem('shop_id') || 'SHOP_001';
        const period = '2026-01';

        for (const item of cart) {
            await db.runAsync(
                `INSERT INTO offline_transactions (id, beneficiary_id, shop_id, ration_period, commodity, quantity, timestamp, synced, otp, otp_verified)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
                [item.id, scannedBeneficiaryId, shopId, period, item.commodity, item.quantity, new Date().toISOString(), otp, isOtpVerified ? 1 : 0]
            );
        }

        // Success Animation & Detailed Confirmation
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);

        const summary = cart.map(i => `${i.commodity}: ${i.quantity}kg`).join('\n');

        setCart([]);
        setScannedBeneficiaryId('');
        setOtp('');
        updatePendingCount();

        showModal('success', t.distributionComplete, `${t.successMsg}\n\n${summary}\n\nTransactions saved. Syncing...`);

        // Auto-Sync
        setTimeout(() => {
            syncTransactions();
        }, 1000);
    };

    const verifyOTP = async (beneficiaryId: string, otp: string) => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            const client = require('../../src/api/client').default;

            const response = await client.post('/otp/verify', {
                beneficiaryId: beneficiaryId.trim(),
                otp: otp.trim()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            return response.data.valid;
        } catch (err: any) {
            console.error('OTP Verification Error', err);
            // If network error, throw it so checkout knows we are offline
            if (err.message === 'Network Error' || err.code === 'ECONNABORTED' || !err.response) {
                throw err;
            }
            return false;
        }
    };

    return (
        <View style={styles.container}>
            <CustomModal
                visible={modalVisible}
                type={modalType}
                title={modalTitle}
                message={modalMessage}
                onClose={() => setModalVisible(false)}
            />

            {/* Network Status Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{t.offlineMode}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={toggleLanguage}
                        style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}
                    >
                        <Text style={{ color: '#1E40AF', fontWeight: 'bold' }}>{language === 'en' ? 'हिंदी' : 'English'}</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.pendingText}>{t.pendingSync}: {offlineCount}</Text>
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Text style={styles.logoutText}>{t.logout}</Text>
                </TouchableOpacity>
            </View>

            {/* "Scanner" Area */}
            <View style={styles.scanArea}>
                <Text style={styles.sectionTitle}>{t.distributeRation}</Text>

                {/* Beneficiary Info */}
                {scannedBeneficiaryId ? (
                    <View style={styles.beneficiaryInfo}>
                        <Text style={styles.beneficiaryText}>{t.beneficiary}: {scannedBeneficiaryId}</Text>
                        <TouchableOpacity onPress={() => setScannedBeneficiaryId('')} style={styles.clearBtn}>
                            <Text style={styles.clearText}>{t.clear}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.scanButton} onPress={() => {
                        if (!permission?.granted) {
                            requestPermission();
                        }
                        setScanned(!scanned);
                    }}>
                        <Text style={styles.scanButtonText}>{t.scanQr}</Text>
                    </TouchableOpacity>
                )}

                {scanned && !scannedBeneficiaryId && (
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ color: 'white' }}>Camera Debug Mode</Text>
                        <TouchableOpacity style={styles.cancelScanBtn} onPress={() => setScanned(false)}>
                            <Text style={styles.cancelScanText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Manual ID Input */}
                <TextInput
                    style={styles.input}
                    placeholder={t.enterId}
                    placeholderTextColor="#94A3B8"
                    value={scannedBeneficiaryId}
                    onChangeText={setScannedBeneficiaryId}
                    autoCapitalize="characters"
                />

                <TextInput
                    style={styles.input}
                    placeholder={t.scanCommodity}
                    placeholderTextColor="#94A3B8"
                    value={scannedItem}
                    onChangeText={setScannedItem}
                />
                <TouchableOpacity style={styles.addButton} onPress={addToCart}>
                    <Text style={styles.addButtonText}>{t.addToCart}</Text>
                </TouchableOpacity>

                {/* OTP Input - Always visible if ID is present */}
                {scannedBeneficiaryId ? (
                    <TextInput
                        style={styles.input}
                        placeholder={t.enterOtp}
                        placeholderTextColor="#94A3B8"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="numeric"
                        maxLength={6}
                    />
                ) : null}

                <TouchableOpacity style={[styles.addButton, { marginTop: 10, backgroundColor: '#EF4444' }]} onPress={clearData}>
                    <Text style={styles.addButtonText}>{t.reset}</Text>
                </TouchableOpacity>
            </View>

            {/* Cart List */}
            <View style={styles.cartArea}>
                <Text style={styles.sectionTitle}>{t.cart} ({cart.length})</Text>
                <FlatList
                    data={cart}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.cartItem}>
                            <Text style={styles.cartItemName}>{item.commodity}</Text>
                            <Text style={styles.cartItemQty}>1 KG</Text>
                        </View>
                    )}
                    ListHeaderComponent={
                        <View style={{ marginBottom: 20, backgroundColor: '#EFF6FF', padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#2563EB' }}>
                            <Text style={{ fontWeight: 'bold', color: '#1E40AF', marginBottom: 4 }}>{t.liveStock}</Text>
                            <Text style={{ fontSize: 13, color: '#3B82F6' }}>
                                {t.rice}: {stock?.stock?.['RICE'] ?? '--'} kg | {t.wheat}: {stock?.stock?.['WHEAT'] ?? '--'} kg
                            </Text>
                        </View>
                    }
                    ListEmptyComponent={<Text style={styles.emptyText}>{t.cartEmpty}</Text>}
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            </View>

            {/* Recent Transactions List (Mini) */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
                <Text style={styles.sectionTitle}>{t.recentDistributions}</Text>
                {recentTxns.map((txn: any, index) => (
                    <View key={index} style={styles.cartItem}>
                        <View>
                            <Text style={styles.cartItemName}>{txn.commodity}</Text>
                            <Text style={{ fontSize: 12, color: '#64748B' }}>{new Date(txn.timestamp).toLocaleTimeString()}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            {txn.synced === 1 ? (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedTxnId(txn.id);
                                        setShowReceipt(true);
                                    }}
                                >
                                    <Text style={{ color: '#2563EB', fontWeight: '600', fontSize: 12 }}>{t.viewReceipt}</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={{ color: '#D97706', fontSize: 12 }}>{t.pendingSync}</Text>
                            )}
                        </View>
                    </View>
                ))}
            </View>

            {/* Receipt Modal */}
            <ReceiptModal
                visible={showReceipt}
                txnId={selectedTxnId}
                onClose={() => setShowReceipt(false)}
            />

            {/* Checkout Wrapper */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.checkoutButton, { opacity: cart.length === 0 ? 0.5 : 1 }]}
                    onPress={checkout}
                    disabled={cart.length === 0}
                >
                    <Text style={styles.checkoutText}>{t.completeDistribution}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingTop: 60, // Top margin for Status Bar
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    statusBadge: {
        backgroundColor: '#FEF3C7', // Amber 100
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F59E0B'
    },
    statusText: { color: '#D97706', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
    pendingText: { color: '#64748B', fontWeight: '600', fontSize: 14 },
    logoutButton: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    logoutText: { color: '#FFF', fontWeight: '600', fontSize: 12 },

    scanArea: { padding: 24 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
    beneficiaryInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, marginBottom: 16 },
    beneficiaryText: { fontSize: 16, fontWeight: '600', color: '#2563EB' },
    clearBtn: { backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    clearText: { color: '#FFF', fontWeight: '600', fontSize: 12 },
    scanButton: {
        backgroundColor: '#10B981',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3
    },
    scanButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    scannerOverlay: { flex: 1, justifyContent: 'flex-end', padding: 24 },
    cancelScanBtn: { backgroundColor: '#EF4444', padding: 16, borderRadius: 12, alignItems: 'center' },
    cancelScanText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    input: {
        backgroundColor: '#FFFFFF',
        padding: 18,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        fontSize: 16,
        color: '#0F172A',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    addButton: {
        backgroundColor: '#2563EB', // Royal Blue
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

    cartArea: { flex: 1, paddingHorizontal: 24, paddingTop: 10 },
    cartItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1
    },
    cartItemName: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    cartItemQty: { fontSize: 16, color: '#64748B', fontWeight: '500' },
    emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 40, fontSize: 16 },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10
    },
    checkoutButton: {
        backgroundColor: '#10B981', // Success Green
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    checkoutText: { color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 }
});
