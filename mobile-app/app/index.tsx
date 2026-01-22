import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants'; // For debug info

export default function LoginScreen() {
    const router = useRouter();
    const [shopId, setShopId] = useState('SHOP_001'); // Default for demo
    const [password, setPassword] = useState('password123'); // Default password
    const [loading, setLoading] = useState(false);

    // Check for existing session
    React.useEffect(() => {
        const checkSession = async () => {
            const token = await AsyncStorage.getItem('auth_token');
            if (token) {
                router.replace('/(tabs)');
            }
        };
        checkSession();
    }, []);

    const handleLogin = async () => {
        if (!shopId || !password) {
            Alert.alert('Error', 'Please enter Shop ID and Password');
            return;
        }

        setLoading(true);
        try {
            // Import client here to avoid circular dependency issues if any, 
            // though usually top-level import is fine. Using axios directly for login
            // to avoid interceptor issues, but client is cleaner.
            // Let's use the client we defined.
            const client = require('../src/api/client').default;

            const response = await client.post('/auth/login', {
                username: shopId,
                password: password,
                type: 'shop'
            });

            const { token, id } = response.data;

            if (token) {
                await AsyncStorage.setItem('auth_token', token);
                await AsyncStorage.setItem('shop_id', id);
                router.replace('/(tabs)');
            } else {
                Alert.alert('Login Failed', 'No token received');
            }

        } catch (error: any) {
            console.error('Login Error:', error);
            const msg = error.response?.data?.error || 'Failed to login';
            Alert.alert('Login Failed', msg);
        } finally {
            setLoading(false);
        }
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

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
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
