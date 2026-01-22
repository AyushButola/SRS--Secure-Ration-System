import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';

export default function BeneficiaryDashboard() {
    const router = useRouter();
    const [entitlements, setEntitlements] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [beneficiaryId, setBeneficiaryId] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const id = await AsyncStorage.getItem('user_id'); // We need to store user_id on login
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

            // 2. Fetch History (Optional, if endpoint exists)
            // For now, let's just show entitlements
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const logout = async () => {
        await AsyncStorage.clear();
        router.replace('/');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Ration Card</Text>
                <Text style={styles.subTitle}>ID: {beneficiaryId}</Text>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
            >
                <Text style={styles.sectionTitle}>Current Entitlements (Jan 2026)</Text>

                {entitlements.map((ent: any) => (
                    <View key={ent.entitlement_id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.commodity}>{ent.commodity}</Text>
                            <Text style={styles.status}>{ent.max_quantity - ent.consumed_quantity > 0 ? 'Available' : 'Consumed'}</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${(ent.consumed_quantity / ent.max_quantity) * 100}%` }]} />
                        </View>
                        <View style={styles.stats}>
                            <Text>Used: {ent.consumed_quantity} kg</Text>
                            <Text>Max: {ent.max_quantity} kg</Text>
                        </View>
                    </View>
                ))}

                {entitlements.length === 0 && !loading && (
                    <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>No entitlements found.</Text>
                )}
            </ScrollView>
        </View>
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
});
