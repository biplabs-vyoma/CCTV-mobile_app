import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { COLORS } from '../../constants/theme';
import { Ticket } from '../../types/Ticket';
import { Star, X } from 'lucide-react-native';

interface FinalClosureModalProps {
    ticket: Ticket;
    onClose: () => void;
    onFinalClosure: (ticketId: string, closureData: any) => void;
}

export const FinalClosureModal: React.FC<FinalClosureModalProps> = ({ ticket, onClose, onFinalClosure }) => {
    const [remarks, setRemarks] = useState('');
    const [rating, setRating] = useState(5);

    const handleSubmit = () => {
        if (!remarks.trim()) {
            Alert.alert('Required', 'Please enter closure remarks');
            return;
        }
        onFinalClosure(ticket.ticket_id, { remarks, rating });
        onClose();
    };

    return (
        <Modal visible={true} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Final Closure</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Remarks *</Text>
                    <TextInput
                        style={styles.input}
                        multiline
                        numberOfLines={4}
                        placeholder="Enter final remarks..."
                        value={remarks}
                        onChangeText={setRemarks}
                    />

                    <Text style={styles.label}>Satisfaction Rating</Text>
                    <View style={styles.ratingContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                <Star
                                    size={32}
                                    color={star <= rating ? '#EAB308' : '#D1D5DB'}
                                    fill={star <= rating ? '#EAB308' : 'none'}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                        <Text style={styles.submitButtonText}>Confirm Closure</Text>
                    </TouchableOpacity>
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
        backgroundColor: COLORS?.surface || '#fff',
        borderRadius: 16,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS?.text || '#000',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS?.text || '#000',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS?.border || '#ccc',
        borderRadius: 8,
        padding: 12,
        height: 100,
        textAlignVertical: 'top',
        color: COLORS?.text || '#000',
        backgroundColor: COLORS?.background || '#fff',
    },
    ratingContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    submitButton: {
        backgroundColor: COLORS?.primary || '#2563eb',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
