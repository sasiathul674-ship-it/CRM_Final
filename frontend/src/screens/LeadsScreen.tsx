import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useLeads } from '../hooks/useLeads';
import DraggableKanbanBoard from '../components/DraggableKanbanBoard';
import LoadingScreen from '../components/LoadingScreen';

export default function LeadsScreen({ navigation }: any) {
  const { leads, loading, error, fetchLeads } = useLeads();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLeads();
    setRefreshing(false);
  }, [fetchLeads]);

  // Refresh leads when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchLeads();
    }, [fetchLeads])
  );

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (lead.company?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                         (lead.phone?.includes(searchQuery) || false);
    
    const matchesPriority = selectedPriority === 'all' || lead.priority === selectedPriority;
    
    return matchesSearch && matchesPriority;
  });

  const handleAddLead = () => {
    navigation.navigate('AddLead', { 
      onLeadAdded: () => {
        console.log('🔄 Refreshing leads after creation...');
        fetchLeads(); // Refresh leads when returning
        Toast.show({
          type: 'success',
          text1: '🔄 Pipeline Updated',
          text2: 'Lead added and pipeline refreshed',
          position: 'bottom',
        });
      }
    });
  };

  const handleLeadPress = (lead: any) => {
    navigation.navigate('LeadDetail', { 
      leadId: lead.id, 
      lead: lead 
    });
  };

  if (loading && leads.length === 0) {
    return <LoadingScreen />;
  }

  if (error && leads.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Unable to Load Leads</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchLeads}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Pipeline</Text>
          <Text style={styles.subtitle}>{filteredLeads.length} of {leads.length} leads</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={() => {
              fetchLeads();
              Toast.show({
                type: 'success',
                text1: '🔄 Pipeline Refreshed',
                text2: 'Latest leads loaded successfully',
                position: 'bottom',
                visibilityTime: 2000,
              });
            }}
          >
            <Ionicons name="refresh-outline" size={18} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleAddLead}>
            <Ionicons name="add" size={20} color="#4F46E5" />
            <Text style={styles.headerButtonText}>Add Lead</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.filterContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search leads..."
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

        {/* Date Filter Row */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.dateFilterButtons}
          contentContainerStyle={styles.filterButtonsContent}
        >
          {['Today', 'This Week', 'This Month', 'All Time'].map((dateFilter) => (
            <TouchableOpacity
              key={dateFilter}
              style={[
                styles.filterButton,
                styles.dateFilterButton
              ]}
              onPress={() => console.log(`Filter by: ${dateFilter}`)}
            >
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={styles.dateFilterButtonText}>{dateFilter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Priority Filter Row */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterButtons}
          contentContainerStyle={styles.filterButtonsContent}
        >
          {['all', 'high', 'medium', 'low'].map((priority) => (
            <TouchableOpacity
              key={priority}
              style={[
                styles.filterButton,
                selectedPriority === priority && styles.activeFilterButton,
                priority !== 'all' && { 
                  backgroundColor: getPriorityColor(priority),
                  borderColor: getPriorityColor(priority)
                }
              ]}
              onPress={() => setSelectedPriority(priority)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedPriority === priority && styles.activeFilterButtonText,
                priority !== 'all' && selectedPriority === priority && { color: '#FFFFFF' }
              ]}>
                {priority === 'all' ? 'All' : priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Kanban Board */}
      <View style={styles.boardContainer}>
        {filteredLeads.length === 0 ? (
          <ScrollView 
            contentContainerStyle={styles.emptyStateContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <Ionicons name="people-outline" size={80} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {searchQuery || selectedPriority !== 'all' ? 'No matching leads' : 'No leads yet'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery || selectedPriority !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Add your first lead to start building your pipeline'
              }
            </Text>
            {!searchQuery && selectedPriority === 'all' && (
              <TouchableOpacity style={styles.addFirstButton} onPress={handleAddLead}>
                <Text style={styles.addFirstButtonText}>Add First Lead</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          <DraggableKanbanBoard 
            leads={filteredLeads}
            onLeadPress={handleLeadPress}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddLead}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return '#EF4444';
    case 'medium': return '#F59E0B';
    case 'low': return '#10B981';
    default: return '#6B7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    height: 48,
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
  filterButtons: {
    maxHeight: 40,
  },
  dateFilterButtons: {
    maxHeight: 40,
    marginBottom: 8,
  },
  filterButtonsContent: {
    paddingRight: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  dateFilterButtonText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 4,
  },
  activeFilterButton: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  boardContainer: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
