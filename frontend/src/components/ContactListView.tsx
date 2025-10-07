import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Lead } from '../services/api';

interface ContactListViewProps {
  leads: Lead[];
  onLeadPress: (lead: Lead) => void;
  refreshControl?: React.ReactElement;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return '#EF4444';
    case 'medium': return '#F59E0B';
    case 'low': return '#10B981';
    default: return '#6B7280';
  }
};

const getCurrencySymbol = (currency?: string) => {
  switch (currency) {
    case 'INR': return '₹';
    case 'USD': return '$';
    case 'GBP': return '£';
    case 'EUR': return '€';
    default: return '₹';
  }
};

export default function ContactListView({ leads, onLeadPress, refreshControl }: ContactListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'stage' | 'priority'>('name');

  const filteredAndSortedLeads = leads
    .filter(lead => {
      const searchLower = searchQuery.toLowerCase();
      return (
        lead.name.toLowerCase().includes(searchLower) ||
        (lead.company?.toLowerCase().includes(searchLower) || false) ||
        (lead.phone?.includes(searchQuery) || false) ||
        (lead.email?.toLowerCase().includes(searchLower) || false) ||
        lead.stage.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'company':
          return (a.company || '').localeCompare(b.company || '');
        case 'stage':
          return a.stage.localeCompare(b.stage);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                 (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        default:
          return 0;
      }
    });

  const handleCall = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('No Phone Number', 'This contact does not have a phone number.');
    }
  };

  const handleEmail = (email?: string) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    } else {
      Alert.alert('No Email', 'This contact does not have an email address.');
    }
  };

  const renderLead = ({ item: lead }: { item: Lead }) => (
    <TouchableOpacity
      style={styles.leadItem}
      onPress={() => onLeadPress(lead)}
      activeOpacity={0.7}
    >
      <View style={styles.leadContent}>
        {/* Left Section - Avatar and Info */}
        <View style={styles.leftSection}>
          <View style={[styles.avatar, { backgroundColor: getPriorityColor(lead.priority) + '20' }]}>
            <Text style={[styles.avatarText, { color: getPriorityColor(lead.priority) }]}>
              {lead.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.leadInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.leadName} numberOfLines={1}>{lead.name}</Text>
              <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(lead.priority) }]} />
            </View>
            
            {lead.company && (
              <Text style={styles.leadCompany} numberOfLines={1}>{lead.company}</Text>
            )}
            
            <View style={styles.contactRow}>
              {lead.phone && (
                <Text style={styles.contactInfo} numberOfLines={1}>
                  📞 {lead.phone}
                </Text>
              )}
              {lead.email && (
                <Text style={styles.contactInfo} numberOfLines={1}>
                  ✉️ {lead.email}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Right Section - Stage, Value, Actions */}
        <View style={styles.rightSection}>
          <View style={styles.stageContainer}>
            <Text style={styles.stageText}>{lead.stage}</Text>
          </View>
          
          {lead.order_value && (
            <Text style={styles.orderValue}>
              {getCurrencySymbol(lead.currency)}{lead.order_value.toLocaleString()}
            </Text>
          )}

          <View style={styles.quickActions}>
            {lead.phone && (
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={(e) => {
                  e.stopPropagation();
                  handleCall(lead.phone);
                }}
              >
                <Ionicons name="call" size={16} color="#10B981" />
              </TouchableOpacity>
            )}
            {lead.email && (
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={(e) => {
                  e.stopPropagation();
                  handleEmail(lead.email);
                }}
              >
                <Ionicons name="mail" size={16} color="#3B82F6" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {(['name', 'company', 'stage', 'priority'] as const).map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.sortButton, sortBy === option && styles.activeSortButton]}
            onPress={() => setSortBy(option)}
          >
            <Text style={[styles.sortButtonText, sortBy === option && styles.activeSortButtonText]}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredAndSortedLeads.length} of {leads.length} contacts
        </Text>
      </View>

      {/* Contact List */}
      <FlatList
        data={filteredAndSortedLeads}
        renderItem={renderLead}
        keyExtractor={(item) => item.id}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching contacts' : 'No contacts yet'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? 'Try adjusting your search query'
                : 'Add your first lead to start building your contact list'
              }
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  clearButton: {
    padding: 4,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sortLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginRight: 12,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  activeSortButton: {
    backgroundColor: '#4F46E5',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  activeSortButtonText: {
    color: '#FFFFFF',
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  resultsText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  listContent: {
    paddingTop: 8,
  },
  leadItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  leadContent: {
    flexDirection: 'row',
    padding: 16,
  },
  leftSection: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  leadInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  leadCompany: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'column',
    gap: 2,
  },
  contactInfo: {
    fontSize: 12,
    color: '#6B7280',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  stageContainer: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stageText: {
    fontSize: 10,
    color: '#4F46E5',
    fontWeight: '600',
  },
  orderValue: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});