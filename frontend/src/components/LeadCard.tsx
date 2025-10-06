import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { Lead } from '../services/api';

interface LeadCardProps {
  lead: Lead;
  onPress: () => void;
  onMoveToStage: (stage: string) => void;
  availableStages: Array<{ id: string; name: string; color: string; icon: string }>;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return '#EF4444';
    case 'medium': return '#F59E0B';
    case 'low': return '#10B981';
    default: return '#6B7280';
  }
};

const formatLastInteraction = (dateString?: string) => {
  if (!dateString) return 'No contact yet';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'Recently added';
  }
};

export default function LeadCard({ lead, onPress, onMoveToStage, availableStages }: LeadCardProps) {
  const [showQuickActions, setShowQuickActions] = useState(false);
  
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

  const handleLongPress = () => {
    const stageOptions = availableStages.map(stage => ({
      text: `Move to ${stage.name}`,
      onPress: () => onMoveToStage(stage.id),
    }));

    Alert.alert(
      `Move ${lead.name}`,
      'Choose a new stage for this lead:',
      [
        ...stageOptions,
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const toggleQuickActions = (e: any) => {
    e.stopPropagation();
    setShowQuickActions(!showQuickActions);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      {/* Priority Strip */}
      <View style={[styles.priorityStrip, { backgroundColor: getPriorityColor(lead.priority) }]} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.nameSection}>
          <Text style={styles.name} numberOfLines={1}>{lead.name}</Text>
          <View style={styles.priorityContainer}>
            <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(lead.priority) }]} />
            <Text style={[styles.priorityText, { color: getPriorityColor(lead.priority) }]}>
              {lead.priority.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.moreButton} onPress={toggleQuickActions}>
          <Ionicons 
            name={showQuickActions ? "close" : "ellipsis-horizontal"} 
            size={16} 
            color="#6B7280" 
          />
        </TouchableOpacity>
      </View>
      
      {/* Company */}
      {lead.company && (
        <Text style={styles.company} numberOfLines={1}>{lead.company}</Text>
      )}
      
      {/* Contact Info */}
      <View style={styles.contactSection}>
        {lead.phone && (
          <View style={styles.contactItem}>
            <Ionicons name="call" size={12} color="#3B82F6" />
            <Text style={styles.contactText} numberOfLines={1}>{lead.phone}</Text>
          </View>
        )}
        {lead.email && (
          <View style={styles.contactItem}>
            <Ionicons name="mail" size={12} color="#3B82F6" />
            <Text style={styles.contactText} numberOfLines={1}>{lead.email}</Text>
          </View>
        )}
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.lastInteraction} numberOfLines={1}>
          {formatLastInteraction(lead.last_interaction)}
        </Text>
      </View>
      
      {/* Quick Actions */}
      {showQuickActions && (
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={handleCall}>
            <Ionicons name="call" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.emailButton]} onPress={handleEmail}>
            <Ionicons name="mail" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={onPress}>
            <Ionicons name="create" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  priorityStrip: {
    height: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 12,
    paddingBottom: 8,
  },
  nameSection: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  moreButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  company: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  contactSection: {
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  lastInteraction: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  quickActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButton: {
    backgroundColor: '#10B981',
  },
  emailButton: {
    backgroundColor: '#3B82F6',
  },
  editButton: {
    backgroundColor: '#8B5CF6',
  },
});
