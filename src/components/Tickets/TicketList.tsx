import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Keyboard } from 'react-native';
import { Ticket } from '../../types/Ticket';
import { TicketRow } from './TicketRow';
import { useAuth } from '../../context/AuthContext'; // Corrected path
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';

interface TicketListProps {
    tickets: Ticket[];
    onTicketClick?: (ticket: Ticket) => void;
    isLoading?: boolean;
    refreshing?: boolean;
    onRefresh?: () => void;
    hasSearched?: boolean;
}

export const TicketList: React.FC<TicketListProps> = ({
    tickets,
    onTicketClick,
    isLoading,
    refreshing,
    onRefresh,
    hasSearched = false,
}) => {
    // @ts-ignore
    const { user } = useAuth();
    const user_type_id = user?.user_type_id || '10';

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    React.useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const totalPages = Math.ceil((tickets?.length || 0) / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTickets = tickets?.slice(startIndex, endIndex) || [];

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS?.primary || '#2563eb'} />
                <Text style={styles.loadingText}>Loading tickets...</Text>
            </View>
        );
    }

    // Default message when no search has been performed yet
    if (!hasSearched) {
        return (
            <View style={styles.emptyContainer}>
                <Inbox size={48} color={COLORS?.textSecondary || '#666'} />
                <Text style={styles.emptyText}>Select filters and click search to view tickets</Text>
            </View>
        );
    }

    // Message when search has been performed but no results found
    if ((!tickets || tickets.length === 0) && !isLoading) {
        return (
            <View style={styles.emptyContainer}>
                <Inbox size={48} color={COLORS?.textSecondary || '#666'} />
                <Text style={styles.emptyText}>No tickets found</Text>
            </View>
        );
    }

    const renderFooter = () => {
        if (totalPages <= 1 || isKeyboardVisible) return null;

        return (
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Showing {startIndex + 1}-{Math.min(endIndex, tickets.length)} of {tickets.length}
                </Text>
                <View style={styles.paginationControls}>
                    <TouchableOpacity
                        onPress={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
                    >
                        <ChevronLeft size={20} color={currentPage === 1 ? (COLORS?.textSecondary || '#666') : (COLORS?.text || '#000')} />
                    </TouchableOpacity>

                    <Text style={styles.pageNumber}>
                        {currentPage} / {totalPages}
                    </Text>

                    <TouchableOpacity
                        onPress={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
                    >
                        <ChevronRight size={20} color={currentPage === totalPages ? (COLORS?.textSecondary || '#666') : (COLORS?.text || '#000')} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={paginatedTickets}
                keyExtractor={(item) => item.ticket_id}
                renderItem={({ item }) => (
                    <TicketRow
                        ticket={item}
                        user_type_id={user_type_id}
                        onClick={() => onTicketClick?.(item)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                ListFooterComponent={renderFooter}
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={refreshing || false}
                            onRefresh={onRefresh}
                            colors={[COLORS?.primary || '#2563eb']}
                        />
                    ) : undefined
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 20, // Reduced space
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        color: COLORS?.textSecondary || '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: 40,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: COLORS?.textSecondary || '#666',
    },
    footer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS?.border || '#ccc',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: COLORS?.textSecondary || '#666',
    },
    paginationControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    pageButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: COLORS?.background || '#f1f5f9',
        borderWidth: 1,
        borderColor: COLORS?.border || '#ccc',
    },
    disabledButton: {
        opacity: 0.5,
        backgroundColor: COLORS?.surface || '#fff',
    },
    pageNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS?.text || '#000',
    },
});