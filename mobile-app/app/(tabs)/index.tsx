import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { initDB, getDB } from '../../src/db/sqlite';
import * as Crypto from 'expo-crypto'; // Use Expo Crypto for UUID

export default function Dashboard() {
  const [offlineCount, setOfflineCount] = useState(0);

  useEffect(() => {
    initDB();
    updateCount();
  }, []);

  const updateCount = async () => {
    const db = await getDB();
    const res = await db.getAllAsync('SELECT * FROM offline_transactions WHERE synced = 0');
    setOfflineCount(res.length);
  };

  const simulateOfflineSale = async () => {
    const db = await getDB();
    const txnId = Crypto.randomUUID();

    // Simulate selling 5kg Rice to BEN_001
    await db.runAsync(
      `INSERT INTO offline_transactions (id, beneficiary_id, shop_id, ration_period, commodity, quantity, timestamp, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [txnId, 'BEN_001', 'SHOP_001', '2026-01', 'RICE', 5.0, new Date().toISOString()]
    );

    Alert.alert('Success', 'Transaction saved OFFLINE');
    updateCount();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Shop Dashboard</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Pending Offline Transactions</Text>
        <Text style={styles.count}>{offlineCount}</Text>
        <Text style={styles.subtext}>Waiting for sync...</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={simulateOfflineSale}>
        <Text style={styles.buttonText}>+ Simulate Offline Sale</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#111827'
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 30,
    width: '100%'
  },
  label: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 10
  },
  count: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#EF4444' // Red to indicate pending
  },
  subtext: {
    fontSize: 14,
    color: '#9CA3AF'
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center'
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold'
  }
});
