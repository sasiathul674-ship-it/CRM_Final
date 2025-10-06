import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import KanbanColumn from './KanbanColumn';

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

interface KanbanBoardProps {
  leads: Lead[];
  onLeadPress: (lead: Lead) => void;
  refreshControl?: React.ReactElement;
}

const STAGES = [
  { id: 'New Leads', name: 'New Leads', color: '#3B82F6' },
  { id: 'Contacted', name: 'Contacted', color: '#F59E0B' },
  { id: 'Follow-up', name: 'Follow-up', color: '#EF4444' },
  { id: 'Negotiation', name: 'Negotiation', color: '#8B5CF6' },
  { id: 'Closed', name: 'Closed', color: '#10B981' },
];

export default function KanbanBoard({ leads, onLeadPress, refreshControl }: KanbanBoardProps) {
  const getLeadsByStage = (stage: string) => {
    return leads.filter(lead => lead.stage === stage);
  };

  return (
    <ScrollView 
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={refreshControl}
    >
      {STAGES.map((stage) => (
        <KanbanColumn
          key={stage.id}
          title={stage.name}
          color={stage.color}
          leads={getLeadsByStage(stage.id)}
          onLeadPress={onLeadPress}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingRight: 32,
  },
});
