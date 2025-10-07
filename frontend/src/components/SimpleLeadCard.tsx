import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useLeads } from '../hooks/useLeads';
import Toast from 'react-native-toast-message';

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
  order_value?: number;
  currency?: string;
}

interface SimpleLeadCardProps {
  lead: Lead;
  onPress: () => void;
  onStageChange?: (leadId: string, newStage: string) => void;
}

const STAGES = [
  { id: 'New Leads', name: 'New Leads', color: '#3B82F6' },
  { id: 'Contacted', name: 'Contacted', color: '#F59E0B' },
  { id: 'Follow-up', name: 'Follow-up', color: '#EF4444' },
  { id: 'Negotiation', name: 'Negotiation', color: '#8B5CF6' },
  { id: 'Closed', name: 'Closed', color: '#10B981' },
];

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

const formatLastInteraction = (dateString?: string) => {
  if (!dateString) return 'No contact yet';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'Invalid date';
  }
};

export default function SimpleLeadCard({ 
  lead, 
  onPress, 
  onStageChange
}: SimpleLeadCardProps) {
  const [showStageModal, setShowStageModal] = useState(false);
  const { updateLeadStage } = useLeads();

  const handleCall = (e: any) => {
    e.stopPropagation();
    if (lead.phone) {
      Linking.openURL(`tel:${lead.phone}`);
    } else {
      Alert.alert('No Phone Number', 'This lead does not have a phone number.');
    }
  };

  const handleEmail = (e: any) => {
    e.stopPropagation();
    if (lead.email) {
      Linking.openURL(`mailto:${lead.email}`);
    } else {
      Alert.alert('No Email', 'This lead does not have an email address.');
    }
  };

  const handleStageSelect = async (newStage: string) => {
    setShowStageModal(false);
    
    if (newStage === lead.stage) return;

    const success = await updateLeadStage(lead.id, newStage);
    
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: '✅ Stage Updated',
        text2: `${lead.name} moved to ${newStage}`,
        position: 'bottom',
        visibilityTime: 2000,
      });
      
      // Trigger deal closure modal for "Closed" stage
      if (newStage === 'Closed' && onStageChange) {
        onStageChange(lead.id, newStage);
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: '❌ Failed to Update',
        text2: 'Please try again',
        position: 'top',
      });
    }
  };

  const handleStagePress = (e: any) => {
    e.stopPropagation();
    setShowStageModal(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/* Priority Strip */}
        <View style={[styles.priorityStrip, { backgroundColor: getPriorityColor(lead.priority) }]} />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.nameSection}>
            <Text style={styles.name} numberOfLines={1}>{lead.name}</Text>
            {lead.company && <Text style={styles.company} numberOfLines={1}>{lead.company}</Text>}
          </View>
          
          <View style={styles.rightSection}>
            {/* Order Value */}
            {lead.order_value && (
              <View style={styles.orderValueContainer}>
                <Ionicons name="cash-outline" size={12} color="#059669" />
                <Text style={styles.orderValueText}>
                  {getCurrencySymbol(lead.currency)}{lead.order_value.toLocaleString()}
                </Text>
              </View>
            )}
            
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(lead.priority) + '20' }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(lead.priority) }]}>
                {lead.priority?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Contact Info */}
        <View style={styles.contactSection}>
          {lead.phone && (
            <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
              <Ionicons name="call" size={12} color="#10B981" />
              <Text style={styles.contactText} numberOfLines={1}>{lead.phone}</Text>
            </TouchableOpacity>
          )}
          {lead.email && (
            <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
              <Ionicons name="mail" size={12} color="#3B82F6" />
              <Text style={styles.contactText} numberOfLines={1}>{lead.email}</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Stage & Actions Footer */}
        <View style={styles.footer}>
          <Text style={styles.lastInteraction} numberOfLines={1}>
            {formatLastInteraction(lead.last_interaction)}
          </Text>
          
          <View style={styles.footerActions}>
            {/* Stage Button */}
            <TouchableOpacity 
              style={[styles.stageButton, { backgroundColor: STAGES.find(s => s.id === lead.stage)?.color + '20' }]}
              onPress={handleStagePress}
            >
              <Text style={[styles.stageButtonText, { color: STAGES.find(s => s.id === lead.stage)?.color }]}>
                {lead.stage}
              </Text>
              <Ionicons 
                name="chevron-down" 
                size={12} 
                color={STAGES.find(s => s.id === lead.stage)?.color} 
              />
            </TouchableOpacity>
            
            {/* Quick Actions */}
            <View style={styles.quickActions}>
              {lead.phone && (
                <TouchableOpacity style={styles.quickActionButton} onPress={handleCall}>
                  <Ionicons name="call" size={14} color="#10B981" />
                </TouchableOpacity>
              )}
              {lead.email && (
                <TouchableOpacity style={styles.quickActionButton} onPress={handleEmail}>
                  <Ionicons name="mail" size={14} color="#3B82F6" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Stage Selection Modal */}
      <Modal
        visible={showStageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Move "{lead.name}" to:</Text>
              <TouchableOpacity onPress={() => setShowStageModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {STAGES.map((stage) => (
              <TouchableOpacity
                key={stage.id}
                style={[
                  styles.stageOption,
                  lead.stage === stage.id && styles.currentStageOption,
                  { borderColor: stage.color }
                ]}
                onPress={() => handleStageSelect(stage.id)}
              >
                <View style={[styles.stageDot, { backgroundColor: stage.color }]} />
                <Text style={[
                  styles.stageOptionText,
                  lead.stage === stage.id && { color: stage.color, fontWeight: '600' }
                ]}>
                  {stage.name}
                </Text>
                {lead.stage === stage.id && (
                  <Ionicons name="checkmark" size={20} color={stage.color} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    marginHorizontal: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative',
  },
  priorityStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
  },
  nameSection: {
    flex: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  company: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  orderValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  orderValueText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 3,
  },
  contactSection: {
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 2,
  },
  contactText: {
    fontSize: 13,
    color: '#475569',
    marginLeft: 6,
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  lastInteraction: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  stageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  stageButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  stageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  currentStageOption: {
    backgroundColor: '#F8FAFC',
  },
  stageDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  stageOptionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
});