import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/theme';
import { X } from 'lucide-react-native';

export const CreateTicketModal = ({ onClose, onSubmit }: any) => {
    return (
        <Modal visible={true} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Ticket</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.body}>
                        <Text style={{ color: COLORS.textSecondary }}>Create Ticket Form Placeholder</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 20,
        minHeight: 300,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    body: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    }
});
