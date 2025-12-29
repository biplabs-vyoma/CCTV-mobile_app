import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

const PlaceholderScreen = ({ title }: { title: string }) => (
    <View style={styles.container}>
        <Text style={styles.text}>{title}</Text>
        <Text style={styles.subtext}>Coming Soon</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    subtext: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: 8,
    }
});

export const CCTVMonitorScreen = () => <PlaceholderScreen title="CCTV Monitoring" />;
export const TicketQueueScreen = () => <PlaceholderScreen title="Ticket Queue" />;
export const NetworkMonitorScreen = () => <PlaceholderScreen title="Network Monitor" />;
export const PerformanceScreen = () => <PlaceholderScreen title="System Performance" />;
