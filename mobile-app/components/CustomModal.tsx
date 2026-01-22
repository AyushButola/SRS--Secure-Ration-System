import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface CustomModalProps {
    visible: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
    onClose: () => void;
}

export default function CustomModal({ visible, type, title, message, onClose }: CustomModalProps) {
    const scaleValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(scaleValue, {
                toValue: 1,
                useNativeDriver: true,
                friction: 5,
                tension: 40
            }).start();
        } else {
            scaleValue.setValue(0);
        }
    }, [visible]);

    if (!visible) return null;

    const isSuccess = type === 'success';
    const iconName = isSuccess ? 'checkmark-circle' : 'alert-circle';
    const color = isSuccess ? '#10B981' : '#EF4444';

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <Animated.View style={[styles.card, { transform: [{ scale: scaleValue }] }]}>
                    <View style={[styles.iconContainer, { backgroundColor: isSuccess ? '#D1FAE5' : '#FEE2E2' }]}>
                        <Ionicons name={iconName} size={40} color={color} />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: color }]}
                        onPress={onClose}
                    >
                        <Text style={styles.buttonText}>Okay, Got it</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: width * 0.85,
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '800', // Extra Bold
        color: '#1E293B',
        marginBottom: 10,
        textAlign: 'center'
    },
    message: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22
    },
    button: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 14,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16
    }
});
