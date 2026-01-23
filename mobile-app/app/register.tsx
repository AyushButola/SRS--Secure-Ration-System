import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';

export default function RegisterScreen() {
    const router = useRouter();
    const [userType, setUserType] = useState('beneficiary'); // 'beneficiary' or 'shop'
    const [loading, setLoading] = useState(false);

    // Common Fields
    const [password, setPassword] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');

    // Beneficiary Fields
    const [fullName, setFullName] = useState('');
    const [rationCardNumber, setRationCardNumber] = useState('');
    const [aadhaarLast4, setAadhaarLast4] = useState('');

    // Shop Fields
    const [shopName, setShopName] = useState('');
    const [shopId, setShopId] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');

    const handleRegister = async () => {
        // Basic Validation
        if (!password || !mobileNumber) {
            Alert.alert('Error', 'Password and Mobile Number are required');
            return;
        }

        if (userType === 'beneficiary' && (!fullName || !rationCardNumber)) {
            Alert.alert('Error', 'Name and Ration Card Number are required');
            return;
        }

        if (userType === 'shop' && (!shopName || !shopId || !ownerName)) {
            Alert.alert('Error', 'Shop details are required');
            return;
        }

        setLoading(true);
        try {
            const client = require('../src/api/client').default;

            const payload: any = {
                type: userType,
                password,
                mobileNumber
            };

            if (userType === 'beneficiary') {
                payload.fullName = fullName;
                payload.rationCardNumber = rationCardNumber;
                payload.aadhaarLast4 = aadhaarLast4;
            } else {
                payload.shopName = shopName;
                payload.shopId = shopId;
                payload.ownerName = ownerName;
                payload.licenseNumber = licenseNumber;
            }

            const response = await client.post('/auth/register', payload);

            Alert.alert(
                'Account Created',
                'Your account has been created successfully! Please login.',
                [
                    { text: 'Login Now', onPress: () => router.back() }
                ]
            );

        } catch (error: any) {
            console.error('Registration Error:', error);
            const msg = error.response?.data?.error || 'Failed to register';
            Alert.alert('Registration Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <BlurView intensity={50} style={styles.glassCard}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Sign up for Secure Ration System</Text>

                    {/* Type Toggle */}
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, userType === 'beneficiary' && styles.toggleActive]}
                            onPress={() => setUserType('beneficiary')}
                        >
                            <Text style={[styles.toggleText, userType === 'beneficiary' && styles.toggleTextActive]}>Beneficiary</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, userType === 'shop' && styles.toggleActive]}
                            onPress={() => setUserType('shop')}
                        >
                            <Text style={[styles.toggleText, userType === 'shop' && styles.toggleTextActive]}>Shop Ops</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Common Fields */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Mobile Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter 10-digit Mobile"
                            value={mobileNumber}
                            onChangeText={setMobileNumber}
                            keyboardType="phone-pad"
                            maxLength={10}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Create Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    {/* Beneficiary Specific */}
                    {userType === 'beneficiary' && (
                        <>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter Full Name"
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Ration Card Number (ID)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter Unique Ration Card No"
                                    value={rationCardNumber}
                                    onChangeText={setRationCardNumber}
                                    autoCapitalize="characters"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Aadhaar (Last 4 Digits)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="XXXX"
                                    value={aadhaarLast4}
                                    onChangeText={setAadhaarLast4}
                                    keyboardType="numeric"
                                    maxLength={4}
                                />
                            </View>
                        </>
                    )}

                    {/* Shop Specific */}
                    {userType === 'shop' && (
                        <>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Shop Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter Shop Name"
                                    value={shopName}
                                    onChangeText={setShopName}
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Shop ID (FPS Code)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter Unique Shop ID"
                                    value={shopId}
                                    onChangeText={setShopId}
                                    autoCapitalize="characters"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Owner Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter Owner Name"
                                    value={ownerName}
                                    onChangeText={setOwnerName}
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>License Number</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter License No"
                                    value={licenseNumber}
                                    onChangeText={setLicenseNumber}
                                />
                            </View>
                        </>
                    )}

                    <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.buttonText}>Register Account</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                        <Text style={styles.footer}>Already have an account? Login</Text>
                    </TouchableOpacity>

                    {/* Spacer for ScrollView */}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        padding: 24,
    },
    glassCard: {
        flex: 1, // Full height for scroll
        marginTop: 40,
        marginBottom: 20,
        padding: 20,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 8,
        marginTop: 20
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        color: '#334155',
        marginBottom: 6,
        fontWeight: '700',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        color: '#0F172A'
    },
    button: {
        backgroundColor: '#10B981', // Emerald for Register
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
        marginTop: 10
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    footer: {
        textAlign: 'center',
        color: '#2563EB',
        fontSize: 14,
        fontWeight: '600'
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
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
        fontWeight: '600',
        fontSize: 13
    },
    toggleTextActive: {
        color: '#2563EB',
        fontWeight: 'bold'
    }
});
