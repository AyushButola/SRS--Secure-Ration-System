import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants'; // For debug info

export default function LoginScreen() {
    const router = useRouter();
    const [shopId, setShopId] = useState('SHOP_001'); // Default for demo
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        // Simulating Auth for now (as we didn't implement complex Auth API, just Transaction API)
        // Real app would hit POST /api/auth/login

        setTimeout(async () => {
            setLoading(false);
            if (shopId.length > 3) {
                await AsyncStorage.setItem('shop_id', shopId);
                router.replace('/(tabs)');
            } else {
                Alert.alert('Error', 'Invalid Shop ID');
            }
        }, 1000);
    };

    return (
        <View style={styles.container}>
            <BlurView intensity={50} style={styles.glassCard}>
                <Text style={styles.title}>Secure Ration System</Text>
                <Text style={styles.subtitle}>Shop Owner Login</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Shop ID</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Shop ID"
                        value={shopId}
                        onChangeText={setShopId}
                        autoCapitalize="characters"
                    />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.buttonText}>Login to Dashboard</Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.footer}>
                    Connecting to: {Constants.expoConfig?.hostUri || 'Localhost'}
                </Text>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#4F46E5', // Primary Color
        justifyContent: 'center',
        padding: 20,
    },
    glassCard: {
        padding: 30,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginBottom: 30,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        color: '#FFF',
        marginBottom: 5,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#FFF',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#10B981', // Success Green
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    footer: {
        marginTop: 20,
        textAlign: 'center',
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12
    }
});
