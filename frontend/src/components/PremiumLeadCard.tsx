import React, { useState, useRef } from 'react';
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

interface Stage {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface PremiumLeadCardProps {
  lead: Lead;
  onPress: () => void;
  onStageMove: (toStage: string) => void;
  availableStages: Stage[];
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return '#EF4444';
    case 'medium': return '#F59E0B';
    case 'low': return '#10B981';
    default: return '#6B7280';
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'high': return 'High Priority';
    case 'medium': return 'Medium Priority';
    case 'low': return 'Low Priority';
    default: return 'Normal Priority';
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

export default function PremiumLeadCard({ lead, onPress, onStageMove, availableStages }: PremiumLeadCardProps) {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const quickActionsAnim = useRef(new Animated.Value(0)).current;

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
    // Show stage move options
    const stageOptions = availableStages
      .filter(stage => stage.id !== lead.stage)
      .map(stage => ({
        text: `Move to ${stage.name}`,
        onPress: () => onStageMove(stage.id),
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

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleQuickActions = () => {
    const toValue = showQuickActions ? 0 : 1;
    setShowQuickActions(!showQuickActions);
    
    Animated.timing(quickActionsAnim, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          animatePress();
          onPress();
        }}
        onLongPress={handleLongPress}
        activeOpacity={0.9}
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
          
          <TouchableOpacity
            style={styles.moreButton}
            onPress={(e) => {
              e.stopPropagation();
              toggleQuickActions();
            }}
          >
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
      </TouchableOpacity>
      
      {/* Quick Actions Overlay */}
      {showQuickActions && (
        <Animated.View 
          style={[
            styles.quickActions,
            {
              opacity: quickActionsAnim,
              transform: [
                {
                  scale: quickActionsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={handleCall}>
            <Ionicons name="call" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.emailButton]} onPress={handleEmail}>
            <Ionicons name="mail" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Email</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={onPress}>
            <Ionicons name="create" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
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
    marginBottom: 12,
  },
  contactSection: {
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
    paddingTop: 8,
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
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    justifyContent: 'center',
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
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
});
