import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';

import ReceiptModal from '../components/ReceiptModal';

export default function BeneficiaryDashboard() {
    const router = useRouter();
    const [entitlements, setEntitlements] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [beneficiaryId, setBeneficiaryId] = useState('');

    const [otp, setOtp] = useState<string | null>(null);

    // Receipt State
    const [showReceipt, setShowReceipt] = useState(false);
    const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);

    const [lastSynced, setLastSynced] = useState<string | null>(null);

    // Load data from offline storage on mount
    const loadOfflineData = async () => {
        try {
            const id = await AsyncStorage.getItem('user_id');
            if (!id) return;
            setBeneficiaryId(id);

            const cachedEntitlements = await AsyncStorage.getItem(`entitlements_${id}`);
            const cachedTransactions = await AsyncStorage.getItem(`transactions_${id}`);
            const lastSyncTime = await AsyncStorage.getItem(`last_synced_${id}`);

            if (cachedEntitlements) setEntitlements(JSON.parse(cachedEntitlements));
            if (cachedTransactions) setTransactions(JSON.parse(cachedTransactions));
            if (lastSyncTime) setLastSynced(lastSyncTime);

            // Fetch OTP if we have ID
            fetchCurrentOTP(id);
            // OTP might need network, but we can try generating or showing cached (if we cached it, unlikely for OTP)
        } catch (e) {
            console.log('Error loading offline data', e);
        } finally {
            setLoading(false);
        }
    };

    const syncData = async () => {
        setLoading(true);
        try {
            const id = await AsyncStorage.getItem('user_id');
            const token = await AsyncStorage.getItem('auth_token');

            if (!id || !token) {
                router.replace('/');
                return;
            }
            setBeneficiaryId(id);

            const client = require('../src/api/client').default;

            // 1. Fetch Entitlements
            const entRes = await client.get(`/beneficiaries/${id}/entitlements`);
            setEntitlements(entRes.data);
            await AsyncStorage.setItem(`entitlements_${id}`, JSON.stringify(entRes.data));

            // 2. Fetch Transaction History
            const transRes = await client.get(`/beneficiaries/${id}/transactions`);
            setTransactions(transRes.data);
            await AsyncStorage.setItem(`transactions_${id}`, JSON.stringify(transRes.data));

            // Update Sync Time
            const now = new Date().toLocaleString();
            setLastSynced(now);
            await AsyncStorage.setItem(`last_synced_${id}`, now);

            // Fetch Current Admin OTP
            fetchCurrentOTP(id);

        } catch (error: any) {
            console.error('[Sync Error]', error);
            const msg = error.message || 'Unknown error';
            Alert.alert('Offline Mode', `Could not sync: ${msg}\nShowing cached data.`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Chain to avoid race condition: Load Cache -> Then Sync Network
        (async () => {
            await loadOfflineData();
            await syncData();
        })();
    }, []);

    const logout = async () => {
        try {
            const id = await AsyncStorage.getItem('user_id');
            await AsyncStorage.clear();
            router.replace('/');
        } catch (e) {
            console.error(e);
        }
    };

    const fetchCurrentOTP = async (id = beneficiaryId) => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            const client = require('../src/api/client').default;

            const response = await client.get('/otp/current', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.valid) {
                setOtp(response.data.otp);
            } else {
                setOtp(null); // No active OTP
            }
        } catch (err) {
            console.error('Fetch OTP Error', err);
        }
    };

    // Language State
    const [language, setLanguage] = useState<'en' | 'hi'>('en');

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'hi' : 'en');
    };

    // Translations
    const translations = {
        en: {
            title: 'My Ration Card',
            logout: 'Logout',
            tapToSync: 'Tap to Sync',
            syncing: 'Syncing with server...',
            lastSynced: 'Last Synced:',
            syncRequired: 'Sync required',
            adminQr: 'Admin-Sent QR Code',
            scanVerify: 'Scan this to verify',
            waitingAdmin: 'Waiting for Admin...',
            askAdmin: 'Ask Shop/Admin to send QR',
            otpTitle: 'One-Time Password',
            otpSubtitle: 'Provide this to the shop for verification',
            waiting: 'Waiting...',
            refreshOtp: 'Refresh OTP Status',
            shareCode: 'Share this code with the shop owner.',
            noOtp: 'No active OTP. Ask Admin to trigger one.',
            entitlements: 'Current Entitlements (Jan 2026)',
            available: 'Available',
            consumed: 'Consumed',
            used: 'Used',
            max: 'Max',
            history: 'Transaction History',
            viewReceipt: 'View Receipt',
            noEntitlements: 'No entitlements found.',
            noTransactions: 'No transactions found.'
        },
        hi: {
            title: 'मेरा राशन कार्ड',
            logout: 'लॉग आउट',
            tapToSync: 'सिंक करने के लिए टैप करें',
            syncing: 'सर्वर के साथ सिंक हो रहा है...',
            lastSynced: 'अंतिम सिंक:',
            syncRequired: 'सिंक आवश्यक',
            adminQr: 'एडमिन द्वारा भेजा गया QR',
            scanVerify: 'सत्यापन के लिए इसे स्कैन करें',
            waitingAdmin: 'एडमिन की प्रतीक्षा...',
            askAdmin: 'दुकान/एडमिन से QR भेजने को कहें',
            otpTitle: 'वन-टाइम पासवर्ड (OTP)',
            otpSubtitle: 'सत्यापन के लिए इसे दुकानदार को दें',
            waiting: 'प्रतीक्षा...',
            refreshOtp: 'OTP स्थिति रिफ्रेश करें',
            shareCode: 'यह कोड दुकानदार के साथ साझा करें।',
            noOtp: 'कोई सक्रिय OTP नहीं। एडमिन से मांगें।',
            entitlements: 'वर्तमान पात्रता (जनवरी 2026)',
            available: 'उपलब्ध',
            consumed: 'उपभोग किया',
            used: 'उपयोग:',
            max: 'अधिकतम:',
            history: 'लेनदेन इतिहास',
            viewReceipt: 'रसीद देखें',
            noEntitlements: 'कोई पात्रता नहीं मिली।',
            noTransactions: 'कोई लेनदेन नहीं मिला।'
        }
    };

    const t = translations[language];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>{t.title}</Text>
                    <Text style={styles.subTitle}>ID: {beneficiaryId}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={toggleLanguage} style={[styles.logoutBtn, { right: 100, backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                        <Text style={styles.logoutText}>{language === 'en' ? 'हिन्दी' : 'English'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>{t.logout}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={syncData} />}
            >
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <Text style={{ textAlign: 'center', color: '#64748B', marginBottom: 8, fontSize: 12 }}>
                        {loading && !lastSynced ? t.syncing :
                            lastSynced ? `${t.lastSynced} ${lastSynced}` : t.syncRequired}
                    </Text>
                    {!loading && (
                        <TouchableOpacity
                            onPress={syncData}
                            style={{
                                backgroundColor: '#E2E8F0',
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 8
                            }}
                        >
                            <Text style={{ color: '#475569', fontSize: 12, fontWeight: '600' }}> {t.tapToSync} </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* QR Code Section - Driven by Admin OTP */}
                <View style={styles.qrSection}>
                    <Text style={styles.sectionTitle}>{t.adminQr}</Text>
                    <View style={styles.qrContainer}>
                        {otp ? (
                            <>
                                <Image
                                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otp)}` }}
                                    style={{ width: 200, height: 200 }}
                                    contentFit="contain"
                                    transition={1000}
                                />
                                <Text style={styles.qrDataText}>{t.scanVerify}</Text>
                            </>
                        ) : (
                            <View style={styles.qrPlaceholder}>
                                <Text style={styles.qrText}>{t.waitingAdmin}</Text>
                                <Text style={styles.qrDataText}>{t.askAdmin}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* OTP Section */}
                <View style={styles.otpSection}>
                    <Text style={styles.sectionTitle}>{t.otpTitle}</Text>
                    <Text style={styles.otpSubtitle}>{t.otpSubtitle}</Text>
                    <View style={styles.otpContainer}>
                        <Text style={styles.otpText}>{otp || t.waiting}</Text>
                    </View>
                    <Text style={{ textAlign: 'center', marginBottom: 10, color: '#666' }}>
                        {otp ? t.shareCode : t.noOtp}
                    </Text>
                    <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchCurrentOTP(beneficiaryId)}>
                        <Text style={styles.refreshText}>{t.refreshOtp}</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>{t.entitlements}</Text>

                {entitlements.map((ent: any) => (
                    <View key={ent.entitlement_id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.commodity}>{ent.commodity}</Text>
                            <Text style={styles.status}>{ent.max_quantity - ent.consumed_quantity > 0 ? t.available : t.consumed}</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${(ent.consumed_quantity / ent.max_quantity) * 100}%` }]} />
                        </View>
                        <View style={styles.stats}>
                            <Text>{t.used} {ent.consumed_quantity} kg</Text>
                            <Text>{t.max} {ent.max_quantity} kg</Text>
                        </View>
                    </View>
                ))}

                {entitlements.length === 0 && !loading && (
                    <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>{t.noEntitlements}</Text>
                )}

                {/* Transaction History */}
                <Text style={styles.sectionTitle}>{t.history}</Text>
                {transactions.map((trans: any) => (
                    <View key={trans.transaction_id || trans.txn_id} style={styles.historyCard}>
                        <View style={styles.historyHeader}>
                            <Text style={styles.historyCommodity}>{trans.commodity}</Text>
                            <Text style={styles.historyDate}>{new Date(trans.timestamp).toLocaleDateString()}</Text>
                        </View>
                        <Text style={styles.historyDetails}>Quantity: {trans.quantity} kg | Shop: {trans.shop_id}</Text>

                        <TouchableOpacity
                            style={styles.receiptLink}
                            onPress={() => {
                                setSelectedTxnId(trans.transaction_id || trans.txn_id);
                                setShowReceipt(true);
                            }}
                        >
                            <Text style={styles.receiptLinkText}>{t.viewReceipt}</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                {transactions.length === 0 && !loading && (
                    <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>{t.noTransactions}</Text>
                )}
            </ScrollView>

            <ReceiptModal
                visible={showReceipt}
                txnId={selectedTxnId}
                onClose={() => setShowReceipt(false)}
                language={language}
            />
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        padding: 24,
        paddingTop: 60,
        backgroundColor: '#2563EB', // Royal Blue
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10
    },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#FFF' },
    subTitle: { color: 'rgba(255,255,255,0.9)', marginTop: 4, fontSize: 16, fontWeight: '500' },
    logoutBtn: {
        position: 'absolute',
        top: 60,
        right: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)'
    },
    logoutText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    content: { padding: 24, paddingTop: 32 },
    sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20, color: '#1E293B', letterSpacing: 0.5 },
    qrSection: { alignItems: 'center', marginBottom: 32 },
    qrSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 20, textAlign: 'center' },
    qrContainer: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
        marginBottom: 16
    },
    qrPlaceholder: {
        width: 200,
        height: 200,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed'
    },
    qrText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#64748B',
        marginBottom: 8
    },
    qrDataText: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center'
    },
    refreshBtn: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3
    },
    refreshText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
    otpSection: { alignItems: 'center', marginBottom: 32 },
    otpSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 20, textAlign: 'center' },
    otpContainer: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
        marginBottom: 16,
        minWidth: 150,
        alignItems: 'center'
    },
    otpText: { fontSize: 32, fontWeight: '800', color: '#1E293B', letterSpacing: 4 },
    card: {
        backgroundColor: '#FFF',
        padding: 24,
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
    commodity: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
    status: {
        color: '#059669', // Emerald 600
        fontWeight: '700',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        fontSize: 12,
        overflow: 'hidden'
    },
    progressBarBg: { height: 12, backgroundColor: '#F1F5F9', borderRadius: 6, overflow: 'hidden', marginBottom: 12 },
    progressBarFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 6 },
    stats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    historyCard: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    historyCommodity: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    historyDate: { fontSize: 14, color: '#64748B' },
    historyDetails: { fontSize: 14, color: '#475569' },
    receiptLink: {
        marginTop: 12,
        alignSelf: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#2563EB'
    },
    receiptLinkText: {
        color: '#2563EB',
        fontSize: 13,
        fontWeight: '600'
    }
});
