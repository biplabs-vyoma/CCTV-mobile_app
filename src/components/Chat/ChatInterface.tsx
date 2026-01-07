import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ChatInterface = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Chat Interface Placeholder</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 16,
        color: '#666',
    }
});
