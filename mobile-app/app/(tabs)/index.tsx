import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, LayoutAnimation, Platform, UIManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDB, getDB } from '../../src/db/sqlite';
import * as Crypto from 'expo-crypto';
import CustomModal from '../../components/CustomModal';

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

  useEffect(() => {
    initDB();
    updatePendingCount();
    fetchStock();
  }, []);

  const showModal = (type: 'success' | 'error', title: string, message: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
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

    const db = await getDB();
    const shopId = 'SHOP_001';
    const beneficiaryId = 'BEN_001';
    const period = '2026-01';

    for (const item of cart) {
      await db.runAsync(
        `INSERT INTO offline_transactions (id, beneficiary_id, shop_id, ration_period, commodity, quantity, timestamp, synced)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [item.id, beneficiaryId, shopId, period, item.commodity, item.quantity, new Date().toISOString()]
      );
    }

    // Success Animation
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setCart([]);
    updatePendingCount();
    showModal('success', 'Distribution Complete', 'Transactions saved offline. Please sync when online.');
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
      </View>

      {/* "Scanner" Area */}
      <View style={styles.scanArea}>
        <Text style={styles.sectionTitle}>Distribute Ration</Text>
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

  scanArea: { padding: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
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
