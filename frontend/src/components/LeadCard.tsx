import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

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

interface LeadCardProps {
  lead: Lead;
  onPress: () => void;
  isDragging?: boolean;
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
    return 'Invalid date';
  }
};

export default function LeadCard({ lead, onPress, isDragging = false }: LeadCardProps) {
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

  return (
    <TouchableOpacity
      style={[styles.card, isDragging && styles.dragging]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.nameSection}>
          <Text style={styles.name} numberOfLines={1}>{lead.name}</Text>
          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(lead.priority) }]} />
        </View>
      </View>
      
      {lead.company && (
        <Text style={styles.company} numberOfLines={1}>{lead.company}</Text>
      )}
      
      {lead.phone && (
        <Text style={styles.phone} numberOfLines={1}>{lead.phone}</Text>
      )}
      
      <View style={styles.footer}>
        <Text style={styles.lastInteraction} numberOfLines={1}>
          {formatLastInteraction(lead.last_interaction)}
        </Text>
      </View>
      
      <View style={styles.actions}>
        {lead.phone && (
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Ionicons name="call" size={16} color="#4F46E5" />
          </TouchableOpacity>
        )}
        {lead.email && (
          <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
            <Ionicons name="mail" size={16} color="#4F46E5" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton} onPress={onPress}>
          <Ionicons name="create-outline" size={16} color="#4F46E5" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dragging: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.3,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
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
  company: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  phone: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 8,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginBottom: 8,
  },
  lastInteraction: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
