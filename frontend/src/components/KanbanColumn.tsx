import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import LeadCard from './LeadCard';

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

interface KanbanColumnProps {
  title: string;
  leads: Lead[];
  onLeadPress: (lead: Lead) => void;
  backgroundColor?: string;
}

const getStageColor = (stage: string) => {
  switch (stage) {
    case 'New Leads': return '#EFF6FF';
    case 'Contacted': return '#FEF3C7';
    case 'Follow-up': return '#FECACA';
    case 'Negotiation': return '#D1FAE5';
    case 'Closed': return '#E0E7FF';
    default: return '#F9FAFB';
  }
};

export default function KanbanColumn({ title, leads, onLeadPress }: KanbanColumnProps) {
  const backgroundColor = getStageColor(title);
  
  return (
    <View style={[styles.column, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.badge}>
          <Text style={styles.count}>{leads.length}</Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onPress={() => onLeadPress(lead)}
          />
        ))}
        
        {leads.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No leads</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: 180,
    marginRight: 12,
    borderRadius: 12,
    padding: 8,
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  badge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  count: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
