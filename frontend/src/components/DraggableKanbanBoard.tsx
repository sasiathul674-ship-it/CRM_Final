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
import * as Haptics from 'expo-haptics';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import DraggableLeadCard from './DraggableLeadCard';
import { useLeads } from '../hooks/useLeads';
import { Lead } from '../services/api';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width > 400 ? 300 : 280;

interface DraggableKanbanBoardProps {
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
    gradientColors: ['#3B82F6', '#1D4ED8'],
    icon: 'person-add-outline',
    description: 'Fresh prospects to contact'
  },
  { 
    id: 'Contacted', 
    name: 'Contacted', 
    color: '#F59E0B', 
    bgColor: '#FFFBEB',
    gradientColors: ['#F59E0B', '#D97706'],
    icon: 'call-outline',
    description: 'Initial contact made'
  },
  { 
    id: 'Follow-up', 
    name: 'Follow-up', 
    color: '#EF4444', 
    bgColor: '#FEF2F2',
    gradientColors: ['#EF4444', '#DC2626'],
    icon: 'time-outline',
    description: 'Awaiting response'
  },
  { 
    id: 'Negotiation', 
    name: 'Negotiation', 
    color: '#8B5CF6', 
    bgColor: '#FAF5FF',
    gradientColors: ['#8B5CF6', '#7C3AED'],
    icon: 'chatbubbles-outline',
    description: 'Discussing terms'
  },
  { 
    id: 'Closed', 
    name: 'Closed', 
    color: '#10B981', 
    bgColor: '#ECFDF5',
    gradientColors: ['#10B981', '#059669'],
    icon: 'checkmark-circle-outline',
    description: 'Deal completed'
  },
];

export default function DraggableKanbanBoard({ leads, onLeadPress, refreshControl }: DraggableKanbanBoardProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dropZoneStage, setDropZoneStage] = useState<string | null>(null);
  const [undoAction, setUndoAction] = useState<{
    leadId: string;
    fromStage: string;
    toStage: string;
    timestamp: number;
  } | null>(null);
  
  const { updateLeadStage } = useLeads();
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const undoAnimValue = useRef(new Animated.Value(0)).current;
  const dragAnimValue = useRef(new Animated.Value(0)).current;

  const getLeadsByStage = (stage: string) => {
    return leads.filter(lead => lead.stage === stage);
  };

  const getTotalValue = (stageLeads: Lead[]) => {
    // Mock calculation for demo - in real app would use deal values
    return stageLeads.length * 5000;
  };

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.timing(dragAnimValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleDragMove = (event: any, gestureState: any) => {
    // Determine which stage we're over based on x position
    const x = event.nativeEvent.absoluteX;
    const stageIndex = Math.floor(x / (COLUMN_WIDTH + 16));
    
    if (stageIndex >= 0 && stageIndex < STAGES.length) {
      const newDropZone = STAGES[stageIndex].id;
      if (newDropZone !== dropZoneStage) {
        setDropZoneStage(newDropZone);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      setDropZoneStage(null);
    }
  };

  const handleDragEnd = async () => {
    if (draggedLead && dropZoneStage && dropZoneStage !== draggedLead.stage) {
      await handleStageMove(draggedLead.id, draggedLead.stage, dropZoneStage);
    }
    
    // Reset drag state
    setDraggedLead(null);
    setDropZoneStage(null);
    
    Animated.timing(dragAnimValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleStageMove = async (leadId: string, fromStage: string, toStage: string) => {
    const success = await updateLeadStage(leadId, toStage);
    
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
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
      
      // Auto-hide after 4 seconds
      undoTimeoutRef.current = setTimeout(() => {
        hideUndoAction();
      }, 4000);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to move lead. Please try again.');
    }
  };

  const handleUndo = async () => {
    if (undoAction) {
      await updateLeadStage(undoAction.leadId, undoAction.fromStage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    const isDropZone = dropZoneStage === stage.id;
    
    return (
      <View 
        key={stage.id} 
        style={[
          styles.column, 
          { backgroundColor: stage.bgColor },
          isDropZone && styles.dropZoneActive
        ]}
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
          <Text style={styles.columnValue}>${totalValue.toLocaleString()}</Text>
        </View>
        
        <ScrollView 
          style={styles.columnContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.columnScrollContent}
        >
          {stageLeads.map((lead, index) => (
            <DraggableLeadCard
              key={lead.id}
              lead={lead}
              onPress={() => onLeadPress(lead)}
              onDragStart={() => handleDragStart(lead)}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              isBeingDragged={draggedLead?.id === lead.id}
            />
          ))}
          
          {stageLeads.length === 0 && (
            <View style={[styles.emptyColumn, isDropZone && styles.emptyColumnActive]}>
              <Ionicons 
                name={stage.icon as any} 
                size={32} 
                color={isDropZone ? stage.color : '#D1D5DB'} 
                style={styles.emptyIcon} 
              />
              <Text style={[styles.emptyText, isDropZone && { color: stage.color }]}>
                {isDropZone ? 'Drop here' : 'Drag leads here'}
              </Text>
              <View style={[
                styles.dropZone, 
                isDropZone && { borderColor: stage.color, backgroundColor: stage.bgColor }
              ]} />
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
        scrollEnabled={!draggedLead} // Disable scroll while dragging
        decelerationRate="fast"
        snapToInterval={COLUMN_WIDTH + 16} // Snap to columns
        snapToAlignment="start"
      >
        {STAGES.map(renderColumn)}
      </ScrollView>

      {/* Drag Overlay */}
      {draggedLead && (
        <Animated.View 
          style={[
            styles.dragOverlay,
            {
              opacity: dragAnimValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.8],
              }),
            },
          ]}
        >
          <Text style={styles.dragInstruction}>
            Drag to move "{draggedLead.name}" to a new stage
          </Text>
        </Animated.View>
      )}

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
  dropZoneActive: {
    borderWidth: 2,
    borderColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
    elevation: 8,
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
  emptyColumnActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
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
  dragOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dragInstruction: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 32,
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