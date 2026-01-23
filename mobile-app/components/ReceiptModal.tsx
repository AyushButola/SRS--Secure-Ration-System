import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

interface ReceiptModalProps {
    visible: boolean;
    txnId: string | null;
    onClose: () => void;
}

export default function ReceiptModal({ visible, txnId, onClose }: ReceiptModalProps) {
    const [loading, setLoading] = useState(false);
    const [receipt, setReceipt] = useState<any>(null);

    React.useEffect(() => {
        if (visible && txnId) {
            fetchReceipt(txnId);
        } else {
            setReceipt(null);
        }
    }, [visible, txnId]);

    const fetchReceipt = async (id: string) => {
        setLoading(true);
        try {
            const client = require('../src/api/client').default;
            const res = await client.get(`/transactions/${id}/receipt`);
            setReceipt(res.data);
        } catch (error) {
            console.error('Fetch Receipt Error', error);
            Alert.alert('Error', 'Could not load receipt. Please try again.');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <BlurView intensity={80} style={styles.container}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#2563EB" />
                    ) : receipt ? (
                        <View style={styles.receiptCard}>
                            <View style={styles.header}>
                                <Text style={styles.headerTitle}>Digital Receipt</Text>
                                <MaterialIcons name="verified" size={24} color="#059669" />
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.row}>
                                <Text style={styles.label}>Beneficiary:</Text>
                                <Text style={styles.value}>{receipt.beneficiary_name}</Text>
                            </View>
                            <Text style={styles.subValue}>ID: {receipt.beneficiary_id}</Text>

                            <View style={styles.row}>
                                <Text style={styles.label}>Shop:</Text>
                                <Text style={styles.value}>{receipt.shop_name}</Text>
                            </View>
                            <Text style={styles.subValue}>{receipt.location}</Text>

                            <View style={styles.divider} />

                            <View style={styles.row}>
                                <Text style={styles.item}>{receipt.commodity}</Text>
                                <Text style={styles.qty}>{receipt.quantity} kg</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.row}>
                                <Text style={styles.label}>Date:</Text>
                                <Text style={styles.value}>{new Date(receipt.timestamp).toLocaleDateString()}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Time:</Text>
                                <Text style={styles.value}>{new Date(receipt.timestamp).toLocaleTimeString()}</Text>
                            </View>

                            <View style={styles.footer}>
                                <Text style={styles.hashLabel}>Transaction Hash:</Text>
                                <Text style={styles.hash} numberOfLines={1} ellipsizeMode="middle">{receipt.hash}</Text>
                                <Text style={styles.txnId}>TXN: {receipt.txn_id}</Text>
                            </View>

                            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                                <Text style={styles.closeText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    )}
                </BlurView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    container: {
        width: '90%',
        padding: 20,
        borderRadius: 20,
        overflow: 'hidden'
    },
    receiptCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B'
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 12,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
        alignItems: 'center'
    },
    label: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600'
    },
    value: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '700'
    },
    subValue: {
        fontSize: 12,
        color: '#94A3B8',
        marginBottom: 8,
        textAlign: 'right'
    },
    item: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2563EB'
    },
    qty: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B'
    },
    footer: {
        marginTop: 20,
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 8
    },
    hashLabel: {
        fontSize: 10,
        color: '#64748B',
        marginBottom: 2
    },
    hash: {
        fontSize: 10,
        color: '#94A3B8',
        fontFamily: 'monospace',
        marginBottom: 4
    },
    txnId: {
        fontSize: 10,
        color: '#CBD5E1',
        textAlign: 'center',
        marginTop: 4
    },
    closeBtn: {
        backgroundColor: '#F1F5F9',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24
    },
    closeText: {
        color: '#475569',
        fontWeight: '700'
    }
});
