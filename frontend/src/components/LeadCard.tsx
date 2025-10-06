import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  if (!dateString) return 'No interactions yet';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'Invalid date';
  }
};

export default function LeadCard({ lead, onPress, isDragging = false }: LeadCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, isDragging && styles.dragging]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.nameSection}>
          <Text style={styles.name}>{lead.name}</Text>
          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(lead.priority) }]} />
        </View>
        {lead.phone && (
          <TouchableOpacity style={styles.phoneButton}>
            <Ionicons name="call" size={16} color="#4F46E5" />
          </TouchableOpacity>
        )}
      </View>
      
      {lead.company && (
        <Text style={styles.company}>{lead.company}</Text>
      )}
      
      {lead.phone && (
        <Text style={styles.phone}>{lead.phone}</Text>
      )}
      
      <View style={styles.footer}>
        <Text style={styles.lastInteraction}>
          {formatLastInteraction(lead.last_interaction)}
        </Text>
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
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    color: '#1F2937',
    flex: 1,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  phoneButton: {
    padding: 4,
  },
  company: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  phone: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  lastInteraction: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
