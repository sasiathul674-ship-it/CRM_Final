import React, { useRef, useState } from 'react';
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
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { formatDistanceToNow } from 'date-fns';
import * as Haptics from 'expo-haptics';

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

interface DraggableLeadCardProps {
  lead: Lead;
  onPress: () => void;
  onDragStart: () => void;
  onDragMove: (event: any, gestureState: any) => void;
  onDragEnd: () => void;
  isBeingDragged: boolean;
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

export default function DraggableLeadCard({ 
  lead, 
  onPress, 
  onDragStart, 
  onDragMove, 
  onDragEnd, 
  isBeingDragged 
}: DraggableLeadCardProps) {
  const [showKebabMenu, setShowKebabMenu] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const kebabMenuAnim = useRef(new Animated.Value(0)).current;

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

  const onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    { 
      useNativeDriver: true,
      listener: onDragMove,
    }
  );

  const onHandlerStateChange = (event: any) => {
    const { state } = event.nativeEvent;

    switch (state) {
      case State.BEGAN:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onDragStart();
        
        // Scale up animation
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }).start();
        break;

      case State.END:
      case State.CANCELLED:
      case State.FAILED:
        onDragEnd();
        
        // Reset position and scale
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
        break;
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      minDist={10}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { translateX },
              { translateY },
              { scale: scaleAnim },
            ],
          },
          isBeingDragged && styles.dragging,
        ]}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={onPress}
          activeOpacity={0.9}
          disabled={isBeingDragged}
        >
          {/* Priority Strip */}
          <View style={[styles.priorityStrip, { backgroundColor: getPriorityColor(lead.priority) }]} />
          
          {/* Drag Handle */}
          <View style={styles.dragHandle}>
            <View style={styles.dragDots}>
              <View style={styles.dragDot} />
              <View style={styles.dragDot} />
            </View>
          </View>
          
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
          </View>
          
          {/* Company */}
          {lead.company && (
            <Text style={styles.company} numberOfLines={1}>{lead.company}</Text>
          )}
          
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
          
          {/* Order Value */}
          {lead.order_value && (
            <View style={styles.orderValueContainer}>
              <Ionicons name="cash-outline" size={14} color="#059669" />
              <Text style={styles.orderValueText}>
                ${lead.order_value.toLocaleString()}
              </Text>
            </View>
          )}
          
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.lastInteraction} numberOfLines={1}>
              {formatLastInteraction(lead.last_interaction)}
            </Text>
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
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
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
  dragging: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
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
  dragHandle: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  dragDots: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  dragDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginVertical: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
    paddingRight: 20, // Space for drag handle
  },
  nameSection: {
    flex: 1,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastInteraction: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    flex: 1,
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
});