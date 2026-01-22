import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants'; // For debug info

export default function LoginScreen() {
    const router = useRouter();
    const [username, setUsername] = useState('SHOP_001'); // Default
    const [password, setPassword] = useState('password123');
    const [userType, setUserType] = useState('shop'); // 'shop' or 'beneficiary'
    const [loading, setLoading] = useState(false);

    // Check for existing session (Disabled for Demo - User wants to see Login)
    // React.useEffect(() => {
    //     const checkSession = async () => {
    //         const token = await AsyncStorage.getItem('auth_token');
    //         const type = await AsyncStorage.getItem('user_type');
    //         if (token) {
    //             if (type === 'beneficiary') {
    //                 router.replace('/beneficiary');
    //             } else {
    //                 router.replace('/(tabs)');
    //             }
    //         }
    //     };
    //     checkSession();
    // }, []);

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please enter Credentials');
            return;
        }

        setLoading(true);
        try {
            const client = require('../src/api/client').default;

            const response = await client.post('/auth/login', {
                username: username.toUpperCase(), // Ensure uppercase for IDs
                password: password,
                type: userType
            });

            const { token, id, type } = response.data;

            if (token) {
                await AsyncStorage.setItem('auth_token', token);
                await AsyncStorage.setItem('user_id', id);
                await AsyncStorage.setItem('user_type', type);

                if (type === 'beneficiary') {
                    router.replace('/beneficiary');
                } else {
                    router.replace('/(tabs)');
                }
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
                <Text style={styles.subtitle}>{userType === 'shop' ? 'Shop Owner Login' : 'Beneficiary Login'}</Text>

                {/* Type Toggle */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, userType === 'shop' && styles.toggleActive]}
                        onPress={() => { setUserType('shop'); setUsername('SHOP_001'); }}
                    >
                        <Text style={[styles.toggleText, userType === 'shop' && styles.toggleTextActive]}>Shop Ops</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, userType === 'beneficiary' && styles.toggleActive]}
                        onPress={() => { setUserType('beneficiary'); setUsername('BEN_001'); }}
                    >
                        <Text style={[styles.toggleText, userType === 'beneficiary' && styles.toggleTextActive]}>Beneficiary</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>{userType === 'shop' ? 'Shop ID' : 'Ration Card ID'}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={userType === 'shop' ? "Enter Shop ID" : "Enter Ration Card ID"}
                        value={username}
                        onChangeText={setUsername}
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
                        <Text style={styles.buttonText}>Login</Text>
                    )}
                </TouchableOpacity>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC', // Light Gray-White Background (Modern)
        justifyContent: 'center',
        padding: 24,
    },
    glassCard: {
        padding: 40,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF', // Clean White Card
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    title: {
        fontSize: 32,
        fontWeight: '800', // Extra Bold
        color: '#1E293B', // Dark Slate
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B', // Slate Gray
        textAlign: 'center',
        marginBottom: 32,
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        color: '#334155', // Darker Label
        marginBottom: 8,
        fontWeight: '700',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#F1F5F9', // Light Slate Input BG
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        color: '#0F172A'
    },
    button: {
        backgroundColor: '#2563EB', // Royal Blue
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
        marginTop: 10
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
    footer: {
        marginTop: 20,
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 13
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 6,
        marginBottom: 32
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8
    },
    toggleActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    toggleText: {
        color: '#64748B',
        fontWeight: '600'
    },
    toggleTextActive: {
        color: '#2563EB', // Royal Blue
        fontWeight: 'bold'
    }
});
