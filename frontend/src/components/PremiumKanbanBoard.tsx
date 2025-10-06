import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PremiumLeadCard from './PremiumLeadCard';
import { useLeads } from '../hooks/useLeads';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width > 400 ? 300 : 280;

interface Lead {
  id: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  stage: string;
  priority: string;
  last_interaction?: string;
  created_at: string;
}

interface PremiumKanbanBoardProps {
  leads: Lead[];
  onLeadPress: (lead: Lead) => void;
  refreshControl?: React.ReactElement;
}

const STAGES = [
  { 
    id: 'New Leads', 
    name: 'New Leads', 
    color: '#3B82F6', 
    bgColor: '#EFF6FF',
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
    color: '#F97316', 
    bgColor: '#FFF7ED',
    icon: 'time-outline',
    description: 'Awaiting response'
  },
  { 
    id: 'Negotiation', 
    name: 'Negotiation', 
    color: '#8B5CF6', 
    bgColor: '#F3E8FF',
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

export default function PremiumKanbanBoard({ leads, onLeadPress, refreshControl }: PremiumKanbanBoardProps) {
  const [undoAction, setUndoAction] = useState<{
    leadId: string;
    fromStage: string;
    toStage: string;
    timestamp: number;
  } | null>(null);
  
  const { updateLeadStage } = useLeads();
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const undoAnimValue = useRef(new Animated.Value(0)).current;

  const getLeadsByStage = (stage: string) => {
    return leads.filter(lead => lead.stage === stage);
  };

  const getTotalValue = (stageLeads: Lead[]) => {
    // Mock calculation for demo - in real app would use deal values
    return stageLeads.length * 5000;
  };

  const handleStageMove = async (leadId: string, fromStage: string, toStage: string) => {
    // Optimistic update
    const success = await updateLeadStage(leadId, toStage);
    
    if (success) {
      // Show undo option
      setUndoAction({
        leadId,
        fromStage,
        toStage,
        timestamp: Date.now(),
      });
      
      // Animate in undo bar
      Animated.timing(undoAnimValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Auto-hide after 3 seconds
      undoTimeoutRef.current = setTimeout(() => {
        hideUndoAction();
      }, 3000);
    } else {
      Alert.alert('Error', 'Failed to move lead. Please try again.');
    }
  };

  const handleUndo = async () => {
    if (undoAction) {
      await updateLeadStage(undoAction.leadId, undoAction.fromStage);
      hideUndoAction();
    }
  };

  const hideUndoAction = () => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    
    Animated.timing(undoAnimValue, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setUndoAction(null);
    });
  };

  const renderColumn = (stage: any) => {
    const stageLeads = getLeadsByStage(stage.id);
    const totalValue = getTotalValue(stageLeads);
    
    return (
      <View key={stage.id} style={[styles.column, { backgroundColor: stage.bgColor }]}>
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
          <Text style={styles.columnValue}>${totalValue.toLocaleString()}</Text>
        </View>
        
        <ScrollView 
          style={styles.columnContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.columnScrollContent}
        >
          {stageLeads.map((lead) => (
            <PremiumLeadCard
              key={lead.id}
              lead={lead}
              onPress={() => onLeadPress(lead)}
              onStageMove={(toStage) => handleStageMove(lead.id, stage.id, toStage)}
              availableStages={STAGES}
            />
          ))}
          
          {stageLeads.length === 0 && (
            <View style={styles.emptyColumn}>
              <Ionicons name={stage.icon as any} size={32} color={stage.color} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>Drag leads here</Text>
              <View style={styles.dropZone} />
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
      >
        {STAGES.map(renderColumn)}
      </ScrollView>

      {/* Undo Action Bar */}
      {undoAction && (
        <Animated.View 
          style={[
            styles.undoBar,
            {
              opacity: undoAnimValue,
              transform: [
                {
                  translateY: undoAnimValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.undoContent}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.undoText}>
              Moved to {undoAction.toStage}
            </Text>
          </View>
          <TouchableOpacity style={styles.undoButton} onPress={handleUndo}>
            <Text style={styles.undoButtonText}>UNDO</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.undoClose} onPress={hideUndoAction}>
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        </Animated.View>
      )}
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
    marginBottom: 16,
  },
  dropZone: {
    width: '100%',
    height: 40,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  undoBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  undoContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  undoText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  undoButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  undoButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  undoClose: {
    padding: 4,
  },
});
