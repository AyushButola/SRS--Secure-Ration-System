import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, TextInput } from 'react-native';
import { initDB, getDB } from '../../src/db/sqlite';
import * as Crypto from 'expo-crypto';
import { BlurView } from 'expo-blur';

export default function Dashboard() {
  const [offlineCount, setOfflineCount] = useState(0);
  const [cart, setCart] = useState<any[]>([]);
  const [scannedItem, setScannedItem] = useState('');

  useEffect(() => {
    initDB();
    updatePendingCount();
  }, []);

  const updatePendingCount = async () => {
    const db = await getDB();
    const res = await db.getAllAsync('SELECT * FROM offline_transactions WHERE synced = 0');
    setOfflineCount(res.length);
  };

  const addToCart = () => {
    if (!scannedItem) {
      Alert.alert('Error', 'Enter a commodity name (e.g., RICE)');
      return;
    }

    const newItem = {
      id: Crypto.randomUUID(),
      commodity: scannedItem.trim().toUpperCase(),
      quantity: 1, // Default 1kg for demo
      price: 0 // Not tracking price yet
    };

    setCart(prev => [...prev, newItem]);
    setScannedItem('');
  };

  const clearData = async () => {
    const db = await getDB();
    await db.runAsync('DELETE FROM offline_transactions');
    setCart([]);
    updatePendingCount();
    Alert.alert('Success', 'Local Data Cleared');
  };

  const checkout = async () => {
    if (cart.length === 0) return;

    const db = await getDB();
    const shopId = 'SHOP_001'; // Should come from Auth Context
    const beneficiaryId = 'BEN_001'; // Should come from Scanner
    const period = '2026-01';

    // Process each item as a transaction
    for (const item of cart) {
      await db.runAsync(
        `INSERT INTO offline_transactions (id, beneficiary_id, shop_id, ration_period, commodity, quantity, timestamp, synced)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [item.id, beneficiaryId, shopId, period, item.commodity, item.quantity, new Date().toISOString()]
      );
    }

    Alert.alert('Success', 'Distribution Recorded Offline');
    setCart([]);
    updatePendingCount();
  };

  return (
    <View style={styles.container}>
      {/* Network Status Header */}
      <View style={styles.header}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>OFFLINE MODE</Text>
        </View>
        <Text style={styles.pendingText}>Pending Sync: {offlineCount}</Text>
      </View>

      {/* "Scanner" Area */}
      <View style={styles.scanArea}>
        <Text style={styles.sectionTitle}>Distribute Ration</Text>
        <TextInput
          style={styles.input}
          placeholder="Scan Commodity (e.g. RICE)"
          value={scannedItem}
          onChangeText={setScannedItem}
        />
        <TouchableOpacity style={styles.addButton} onPress={addToCart}>
          <Text style={styles.addButtonText}>Add to Cart</Text>
        </TouchableOpacity>
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
              <Text style={styles.cartItemQty}>5 KG</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Cart is empty</Text>}
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
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    elevation: 2
  },
  statusBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10
  },
  statusText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  pendingText: { color: '#6B7280', fontWeight: '600' },

  scanArea: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 10 },
  input: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  addButton: {
    backgroundColor: '#4F46E5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  addButtonText: { color: '#FFF', fontWeight: 'bold' },

  cartArea: { flex: 1, padding: 20 },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10
  },
  cartItemName: { fontSize: 16, fontWeight: '600' },
  cartItemQty: { fontSize: 16, color: '#6B7280' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 20 },

  footer: { padding: 20, backgroundColor: '#FFF', elevation: 10 },
  checkoutButton: {
    backgroundColor: '#10B981',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center'
  },
  checkoutText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});
