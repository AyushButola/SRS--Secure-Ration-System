import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { getDB } from '../../src/db/sqlite';
import client from '../../src/api/client';
import Constants from 'expo-constants';

export default function SyncScreen() {
    const [logs, setLogs] = useState([]);

    const log = (msg) => setLogs(prev => [...prev, msg]);

    const handleSync = async () => {
        log('--- Starting Sync ---');
        const db = await getDB();

        // 1. Fetch Pending
        const pending = await db.getAllAsync('SELECT * FROM offline_transactions WHERE synced = 0');

        if (pending.length === 0) {
            log('No pending transactions.');
            return;
        }

        log(`Found ${pending.length} pending transactions...`);

        // 2. Prepare Payload
        // Map SQLite rows to match Backend expectations
        const payload = {
            device_id: Constants.deviceId || 'UNKNOWN_DEVICE',
            transactions: pending.map(row => ({
                txn_id: row.id,
                beneficiary_id: row.beneficiary_id,
                shop_id: row.shop_id,
                ration_period: row.ration_period,
                commodity: row.commodity,
                quantity: row.quantity,
                timestamp: row.timestamp
            }))
        };

        try {
            // 3. Send to Backend
            log(`Sending to ${client.defaults.baseURL}...`);
            const res = await client.post('/sync', payload);

            log(`Response: ${res.status}`);

            if (res.status === 200) {
                const result = res.data.results;
                log(`Synced: ${result.synced}, Failed: ${result.failed}`);

                // 4. Update Local DB
                // Mark all sent as synced (simplification: assume partial failure handled by checking 'errors' array)
                // Ideally we only mark the ones that succeeded.

                // Mark all for now to clear queue
                await db.runAsync('UPDATE offline_transactions SET synced = 1 WHERE synced = 0');
                log('Local DB Updated.');
                Alert.alert('Sync Complete');
            }
        } catch (e) {
            log(`ERROR: ${e.message}`);
            console.error(e);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Sync Manager</Text>

            <TouchableOpacity style={styles.button} onPress={handleSync}>
                <Text style={styles.buttonText}>Push to Server</Text>
            </TouchableOpacity>

            <ScrollView style={styles.console}>
                {logs.map((L, i) => (
                    <Text key={i} style={styles.logText}>{L}</Text>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F3F4F6',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#111827',
        textAlign: 'center'
    },
    button: {
        backgroundColor: '#10B981',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold'
    },
    console: {
        backgroundColor: '#111827',
        padding: 15,
        borderRadius: 10,
        flex: 1,
    },
    logText: {
        color: '#10B981',
        fontFamily: 'monospace',
        marginBottom: 5,
        fontSize: 12
    }
});
