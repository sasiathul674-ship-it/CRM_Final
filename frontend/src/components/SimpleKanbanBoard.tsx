import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SimpleLeadCard from './SimpleLeadCard';
import DealOutcomeModal from './DealOutcomeModal';
import { Lead } from '../services/api';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width > 400 ? 300 : 280;

interface SimpleKanbanBoardProps {
  leads: Lead[];
  onLeadPress: (lead: Lead) => void;
  refreshControl?: React.ReactElement;
}

const STAGES = [
  { 
    id: 'New Leads', 
    name: 'New Leads', 
    color: '#3B82F6', 
    bgColor: '#F0F9FF',
    icon: 'person-add-outline',
    description: 'Fresh prospects to contact'
  },
  { 
    id: 'Contacted', 
    name: 'Contacted', 
    color: '#F59E0B', 
    bgColor: '#FFFBEB',
    icon: 'call-outline',
    description: 'Initial contact made'
  },
  { 
    id: 'Follow-up', 
    name: 'Follow-up', 
    color: '#EF4444', 
    bgColor: '#FEF2F2',
    icon: 'time-outline',
    description: 'Awaiting response'
  },
  { 
    id: 'Negotiation', 
    name: 'Negotiation', 
    color: '#8B5CF6', 
    bgColor: '#FAF5FF',
    icon: 'chatbubbles-outline',
    description: 'Discussing terms'
  },
  { 
    id: 'Closed', 
    name: 'Closed', 
    color: '#10B981', 
    bgColor: '#ECFDF5',
    icon: 'checkmark-circle-outline',
    description: 'Deal completed'
  },
];

export default function SimpleKanbanBoard({ leads, onLeadPress, refreshControl }: SimpleKanbanBoardProps) {
  const [dealOutcomeModal, setDealOutcomeModal] = useState<{
    visible: boolean;
    lead: Lead | null;
  }>({ visible: false, lead: null });

  const getLeadsByStage = (stage: string) => {
    return leads.filter(lead => lead.stage === stage);
  };

  const getTotalValue = (stageLeads: Lead[]) => {
    return stageLeads.reduce((total, lead) => total + (lead.order_value || 0), 0);
  };

  // This function will be called when a lead moves to "Closed" stage
  const handleLeadMovedToClosed = (leadId: string, newStage: string) => {
    if (newStage === 'Closed') {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        setDealOutcomeModal({
          visible: true,
          lead: { ...lead, stage: newStage }, // Update stage in modal
        });
      }
    }
  };

  const handleDealOutcomeConfirm = async (dealStatus: 'won' | 'lost', notes?: string) => {
    if (!dealOutcomeModal.lead) return;
    
    // TODO: Update lead with deal_status and notes using backend API
    // For now, just show success message
    
    Toast.show({
      type: 'success',
      text1: `✅ Deal Closed - ${dealStatus === 'won' ? 'Won! 🎉' : 'Lost 😔'}`,
      text2: `${dealOutcomeModal.lead.name} marked as ${dealStatus}`,
      position: 'top',
      visibilityTime: 4000,
    });
    
    // Close modal
    setDealOutcomeModal({ visible: false, lead: null });
  };

  const handleDealOutcomeCancel = () => {
    setDealOutcomeModal({ visible: false, lead: null });
    
    Toast.show({
      type: 'info',
      text1: '↩️ Deal Closure Cancelled',
      text2: 'Lead remains in Closed stage',
      position: 'bottom',
    });
  };

  const renderColumn = (stage: any) => {
    const stageLeads = getLeadsByStage(stage.id);
    const totalValue = getTotalValue(stageLeads);
    
    return (
      <View 
        key={stage.id} 
        style={[styles.column, { backgroundColor: stage.bgColor }]}
      >
        <View style={[styles.columnHeader, { backgroundColor: stage.color }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Ionicons name={stage.icon as any} size={20} color="#FFFFFF" />
              <Text style={styles.columnTitle}>{stage.name}</Text>
            </View>
            <View style={styles.columnBadge}>
              <Text style={styles.columnCount}>{stageLeads.length}</Text>
            </View>
          </View>
          <Text style={styles.columnDescription}>{stage.description}</Text>
          <Text style={styles.columnValue}>₹{totalValue.toLocaleString()}</Text>
        </View>
        
        <ScrollView 
          style={styles.columnContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.columnScrollContent}
        >
          {stageLeads.map((lead) => (
            <SimpleLeadCard
              key={lead.id}
              lead={lead}
              onPress={() => onLeadPress(lead)}
              onStageChange={handleLeadMovedToClosed}
            />
          ))}
          
          {stageLeads.length === 0 && (
            <View style={styles.emptyColumn}>
              <Ionicons 
                name={stage.icon as any} 
                size={32} 
                color="#D1D5DB"
                style={styles.emptyIcon} 
              />
              <Text style={styles.emptyText}>No leads yet</Text>
              <Text style={styles.emptySubtext}>
                {stage.id === 'New Leads' ? 'Add leads to get started' : 'Move leads here'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.board}
        contentContainerStyle={styles.boardContent}
        refreshControl={refreshControl}
        decelerationRate="fast"
        snapToInterval={COLUMN_WIDTH + 16}
        snapToAlignment="start"
      >
        {STAGES.map(renderColumn)}
      </ScrollView>

      {/* Deal Outcome Modal */}
      <DealOutcomeModal
        visible={dealOutcomeModal.visible}
        leadName={dealOutcomeModal.lead?.name || ''}
        leadId={dealOutcomeModal.lead?.id || ''}
        orderValue={dealOutcomeModal.lead?.order_value}
        currency={dealOutcomeModal.lead?.currency}
        onClose={handleDealOutcomeCancel}
        onConfirm={handleDealOutcomeConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: '100%',
  },
  columnHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  columnBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  columnCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  columnDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  columnValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  columnContent: {
    flex: 1,
    paddingHorizontal: 8,
  },
  columnScrollContent: {
    paddingBottom: 16,
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
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#D1D5DB',
    textAlign: 'center',
  },
});