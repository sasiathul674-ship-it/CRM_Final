import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Lead } from '../services/api';
import LeadCard from '../components/LeadCard';
import LoadingScreen from '../components/LoadingScreen';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = Math.min(width * 0.75, 300);

const STAGES = [
  { id: 'New Leads', name: 'New Leads', color: '#3B82F6', bgColor: '#EFF6FF', icon: 'person-add' },
  { id: 'Contacted', name: 'Contacted', color: '#F59E0B', bgColor: '#FFFBEB', icon: 'call' },
  { id: 'Follow-up', name: 'Follow-up', color: '#EF4444', bgColor: '#FEF2F2', icon: 'time' },
  { id: 'Negotiation', name: 'Negotiation', color: '#8B5CF6', bgColor: '#F3E8FF', icon: 'chatbubbles' },
  { id: 'Closed', name: 'Closed', color: '#10B981', bgColor: '#ECFDF5', icon: 'checkmark-circle' },
];

export default function KanbanScreen({ navigation }: any) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchLeads = useCallback(async () => {
    if (!token) return;
    
    try {
      setError(null);
      const leadsData = await apiService.getLeads(token);
      setLeads(leadsData);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLeads();
    setRefreshing(false);
  }, [fetchLeads]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const getLeadsByStage = (stageId: string) => {
    return leads.filter(lead => lead.stage === stageId);
  };

  const handleLeadPress = (lead: Lead) => {
    navigation.navigate('LeadDetail', { leadId: lead.id });
  };

  const handleAddLead = () => {
    navigation.navigate('AddLead');
  };

  const handleMoveToStage = async (leadId: string, newStage: string) => {
    if (!token) return;
    
    try {
      await apiService.updateLeadStage(token, leadId, newStage);
      
      // Update local state optimistically
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId 
            ? { ...lead, stage: newStage, last_interaction: new Date().toISOString() }
            : lead
        )
      );
      
      // Show success feedback
      Alert.alert('Success', `Lead moved to ${newStage}`);
    } catch (err: any) {
      Alert.alert('Error', `Failed to move lead: ${err.message}`);
    }
  };

  if (loading) {
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

  const renderStageColumn = (stage: any) => {
    const stageLeads = getLeadsByStage(stage.id);
    
    return (
      <View key={stage.id} style={[styles.column, { backgroundColor: stage.bgColor }]}>
        <View style={[styles.columnHeader, { backgroundColor: stage.color }]}>
          <View style={styles.headerContent}>
            <Ionicons name={stage.icon} size={18} color="#FFFFFF" />
            <Text style={styles.columnTitle}>{stage.name} ({stageLeads.length})</Text>
          </View>
        </View>
        
        <ScrollView 
          style={styles.columnContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.columnScrollContent}
        >
          {stageLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onPress={() => handleLeadPress(lead)}
              onMoveToStage={(newStage) => handleMoveToStage(lead.id, newStage)}
              availableStages={STAGES.filter(s => s.id !== stage.id)}
            />
          ))}
          
          {stageLeads.length === 0 && (
            <View style={styles.emptyColumn}>
              <Ionicons name={stage.icon} size={32} color={stage.color} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No leads</Text>
              {stage.id === 'New Leads' && (
                <Text style={styles.emptySubtext}>Tap + to add your first lead</Text>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pipeline</Text>
        <Text style={styles.subtitle}>{leads.length} total leads</Text>
      </View>

      {leads.length === 0 ? (
        <ScrollView 
          contentContainerStyle={styles.emptyStateContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Ionicons name="analytics-outline" size={80} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>Build Your Sales Pipeline</Text>
          <Text style={styles.emptyStateText}>
            Add your first lead to start tracking your sales opportunities through each stage
          </Text>
          <TouchableOpacity style={styles.addFirstButton} onPress={handleAddLead}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addFirstButtonText}>Add First Lead</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.board}
          contentContainerStyle={styles.boardContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {STAGES.map(renderStageColumn)}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddLead}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  board: {
    flex: 1,
    paddingVertical: 16,
  },
  boardContent: {
    paddingHorizontal: 16,
    paddingRight: 32,
  },
  column: {
    width: COLUMN_WIDTH,
    marginRight: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: '100%',
  },
  columnHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  columnContent: {
    flex: 1,
    paddingHorizontal: 8,
  },
  columnScrollContent: {
    paddingBottom: 16,
    paddingTop: 8,
  },
  emptyColumn: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    opacity: 0.5,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
