import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow, format } from 'date-fns';

interface Activity {
  id: string;
  activity_type: 'call' | 'email' | 'note';
  content: string;
  outcome?: string;
  duration?: number;
  created_at: string;
}

interface ActivityCardProps {
  activity: Activity;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'call': return 'call';
    case 'email': return 'mail';
    case 'note': return 'document-text';
    default: return 'document-text';
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'call': return '#10B981';
    case 'email': return '#3B82F6';
    case 'note': return '#8B5CF6';
    default: return '#6B7280';
  }
};

const getOutcomeColor = (outcome?: string) => {
  switch (outcome) {
    case 'answered': return '#10B981';
    case 'missed': return '#EF4444';
    case 'declined': return '#F59E0B';
    case 'callback_needed': return '#8B5CF6';
    default: return '#6B7280';
  }
};

const formatActivityDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  return format(date, 'MMM d, HH:mm');
};

export default function ActivityCard({ activity }: ActivityCardProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${getActivityColor(activity.activity_type)}20` }]}>
        <Ionicons 
          name={getActivityIcon(activity.activity_type) as any} 
          size={16} 
          color={getActivityColor(activity.activity_type)} 
        />
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.type}>
            {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)}
          </Text>
          
          {activity.outcome && (
            <Text style={[styles.outcome, { color: getOutcomeColor(activity.outcome) }]}>
              {activity.outcome.replace('_', ' ')}
            </Text>
          )}
          
          <Text style={styles.date}>
            {formatActivityDate(activity.created_at)}
          </Text>
        </View>
        
        <Text style={styles.activityContent}>{activity.content}</Text>
        
        {activity.duration && (
          <Text style={styles.duration}>{activity.duration} minutes</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  type: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  outcome: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 8,
    textTransform: 'capitalize',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 'auto',
  },
  activityContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  duration: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
