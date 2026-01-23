import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, LayoutAnimation, Platform, UIManager, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDB, getDB } from '../../src/db/sqlite';
import * as Crypto from 'expo-crypto';
import CustomModal from '../../components/CustomModal';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useRouter } from 'expo-router';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Dashboard() {
    const [offlineCount, setOfflineCount] = useState(0);
    const [cart, setCart] = useState<any[]>([]);
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
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [scannedBeneficiaryId, setScannedBeneficiaryId] = useState('');
    const [otp, setOtp] = useState('');

    const router = useRouter();

    useEffect(() => {
        initDB();
        updatePendingCount();
        fetchStock();
        getBarCodeScannerPermissions();
    }, []);

    const getBarCodeScannerPermissions = async () => {
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        setHasPermission(status === 'granted');
    };

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
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout', onPress: async () => {
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
    };

    const addToCart = () => {
        if (!scannedItem) {
            showModal('error', 'Input Error', 'Please enter a commodity name (e.g., RICE)');
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
            showModal('error', 'No Beneficiary', 'Please scan beneficiary QR code first.');
            return;
        }

        if (!otp) {
            showModal('error', 'OTP Required', 'Please enter the beneficiary OTP.');
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
                showModal('error', 'Invalid OTP', 'The OTP entered is incorrect or has expired.');
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

        showModal('success', 'Distribution Complete', `Successfully distributed:\n\n${summary}\n\nTransactions saved. Syncing...`);

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
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>OFFLINE MODE</Text>
                </View>
                <Text style={styles.pendingText}>Pending Sync: {offlineCount}</Text>
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* "Scanner" Area */}
            <View style={styles.scanArea}>
                <Text style={styles.sectionTitle}>Distribute Ration</Text>

                {/* Beneficiary Info */}
                {scannedBeneficiaryId ? (
                    <View style={styles.beneficiaryInfo}>
                        <Text style={styles.beneficiaryText}>Beneficiary: {scannedBeneficiaryId}</Text>
                        <TouchableOpacity onPress={() => setScannedBeneficiaryId('')} style={styles.clearBtn}>
                            <Text style={styles.clearText}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.scanButton} onPress={() => setScanned(!scanned)}>
                        <Text style={styles.scanButtonText}>Scan Beneficiary QR</Text>
                    </TouchableOpacity>
                )}

                {scanned && !scannedBeneficiaryId && (
                    <View style={StyleSheet.absoluteFillObject}>
                        <BarCodeScanner
                            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <View style={styles.scannerOverlay}>
                            <TouchableOpacity style={styles.cancelScanBtn} onPress={() => setScanned(false)}>
                                <Text style={styles.cancelScanText}>Cancel Scan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Manual ID Input */}
                <TextInput
                    style={styles.input}
                    placeholder="Enter Beneficiary ID (or Scan QR)"
                    placeholderTextColor="#94A3B8"
                    value={scannedBeneficiaryId}
                    onChangeText={setScannedBeneficiaryId}
                    autoCapitalize="characters"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Scan Commodity (e.g. RICE)"
                    placeholderTextColor="#94A3B8"
                    value={scannedItem}
                    onChangeText={setScannedItem}
                />
                <TouchableOpacity style={styles.addButton} onPress={addToCart}>
                    <Text style={styles.addButtonText}>Add to Cart</Text>
                </TouchableOpacity>

                {/* OTP Input - Always visible if ID is present */}
                {scannedBeneficiaryId ? (
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Beneficiary OTP"
                        placeholderTextColor="#94A3B8"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="numeric"
                        maxLength={6}
                    />
                ) : null}

                <TouchableOpacity style={[styles.addButton, { marginTop: 10, backgroundColor: '#EF4444' }]} onPress={clearData}>
                    <Text style={styles.addButtonText}>Reset / Clear Queue</Text>
                </TouchableOpacity>
            </View>

            {/* Cart List */}
            <View style={styles.cartArea}>
                <Text style={styles.sectionTitle}>Cart ({cart.length})</Text>
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
                            <Text style={{ fontWeight: 'bold', color: '#1E40AF', marginBottom: 4 }}>Live Stock Levels</Text>
                            <Text style={{ fontSize: 13, color: '#3B82F6' }}>
                                Rice: {stock?.stock?.['RICE'] ?? '--'} kg | Wheat: {stock?.stock?.['WHEAT'] ?? '--'} kg
                            </Text>
                        </View>
                    }
                    ListEmptyComponent={<Text style={styles.emptyText}>Cart is empty</Text>}
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            </View>

            {/* Checkout Wrapper */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.checkoutButton, { opacity: cart.length === 0 ? 0.5 : 1 }]}
                    onPress={checkout}
                    disabled={cart.length === 0}
                >
                    <Text style={styles.checkoutText}>Complete Distribution</Text>
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
