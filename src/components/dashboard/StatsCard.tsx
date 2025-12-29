import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';

interface StatsCardProps {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: LucideIcon;
    color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange';
}

const getColor = (color: string) => {
    switch (color) {
        case 'blue': return '#3b82f6';
        case 'green': return '#22c55e';
        case 'red': return '#ef4444';
        case 'yellow': return '#eab308';
        case 'purple': return '#a855f7';
        case 'orange': return '#f97316';
        default: return COLORS.primary;
    }
};

const getBgColor = (color: string) => {
    switch (color) {
        case 'blue': return '#eff6ff';
        case 'green': return '#f0fdf4';
        case 'red': return '#fef2f2';
        case 'yellow': return '#fefce8';
        case 'purple': return '#faf5ff';
        case 'orange': return '#fff7ed';
        default: return COLORS.background;
    }
};

export const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    change,
    changeType = 'neutral',
    icon: Icon,
    color
}) => {
    const isLoading = value === undefined || value === null || value === '';
    const displayValue = isLoading || String(value).includes("undefined") ? "..." : value;
    const showChange = !isLoading && change && !change.includes("NaN");

    const themeColor = getColor(color);
    const bgColor = getBgColor(color);

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.value}>{displayValue}</Text>

                    {showChange && (
                        <Text style={[
                            styles.change,
                            { color: changeType === 'positive' ? '#16a34a' : changeType === 'negative' ? '#dc2626' : '#4b5563' }
                        ]}>
                            {change}
                        </Text>
                    )}
                </View>
                <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
                    <Icon size={24} color={themeColor} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.m,
        padding: SPACING.m,
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        // Elevation for Android
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
        fontWeight: '500',
    },
    value: {
        fontSize: FONT_SIZES.xl,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    change: {
        fontSize: FONT_SIZES.xs,
        fontWeight: '500',
    },
    iconBox: {
        padding: SPACING.s,
        borderRadius: BORDER_RADIUS.m,
    }
});
