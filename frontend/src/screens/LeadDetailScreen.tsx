import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';
import Constants from 'expo-constants';

interface Lead {
  id: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  stage: string;
  priority: string;
  notes?: string;
  user_id: string;
  created_at: string;
  last_interaction?: string;
}

interface Activity {
  id: string;
  lead_id: string;
  activity_type: 'call' | 'email' | 'note';
  content: string;
  outcome?: string;
  duration?: number;
  user_id: string;
  created_at: string;
}

export default function LeadDetailScreen({ route, navigation }: any) {
  const { lead: initialLead } = route.params;
  const [lead, setLead] = useState<Lead>(initialLead);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [activityType, setActivityType] = useState<'call' | 'email' | 'note'>('note');
  const [activityContent, setActivityContent] = useState('');
  const [callOutcome, setCallOutcome] = useState('answered');
  const [callDuration, setCallDuration] = useState('');
  
  const { token } = useAuth();
  const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/activities`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      } else {
        console.error('Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (lead.phone) {
      Linking.openURL(`tel:${lead.phone}`);
    } else {
      Alert.alert('No Phone Number', 'This lead does not have a phone number.');
    }
  };

  const handleEmail = () => {
    if (lead.email) {
      Linking.openURL(`mailto:${lead.email}`);
    } else {
      Alert.alert('No Email', 'This lead does not have an email address.');
    }
  };

  const addActivity = async () => {
    if (!activityContent.trim()) {
      Alert.alert('Error', 'Please enter activity details');
      return;
    }

    try {
      const activityData: any = {
        lead_id: lead.id,
        activity_type: activityType,
        content: activityContent.trim(),
      };

      if (activityType === 'call') {
        activityData.outcome = callOutcome;
        if (callDuration) {
          activityData.duration = parseInt(callDuration);
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/activities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      });

      if (response.ok) {
        setShowAddActivity(false);
        setActivityContent('');
        setCallDuration('');
        fetchActivities();
        Alert.alert('Success', 'Activity logged successfully');
      } else {
        Alert.alert('Error', 'Failed to log activity');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return 'call';
      case 'email': return 'mail';
      case 'note': return 'document-text';
      default: return 'document-text';
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

  const filterActivities = () => {
    if (activeTab === 'all') return activities;
    return activities.filter(activity => activity.activity_type === activeTab);
  };

  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, 'MMM d, yyyy HH:mm');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Details</Text>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="pencil" size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Lead Info Card */}
        <View style={styles.leadCard}>
          <View style={styles.leadHeader}>
            <View style={styles.leadInfo}>
              <Text style={styles.leadName}>{lead.name}</Text>
              {lead.company && (
                <Text style={styles.leadCompany}>{lead.company}</Text>
              )}
              <View style={styles.stageContainer}>
                <Text style={styles.stage}>{lead.stage}</Text>
                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(lead.priority) }]} />
              </View>
            </View>
          </View>

          {/* Contact Info */}
          <View style={styles.contactSection}>
            {lead.phone && (
              <View style={styles.contactItem}>
                <Ionicons name="call" size={16} color="#6B7280" />
                <Text style={styles.contactText}>{lead.phone}</Text>
              </View>
            )}
            {lead.email && (
              <View style={styles.contactItem}>
                <Ionicons name="mail" size={16} color="#6B7280" />
                <Text style={styles.contactText}>{lead.email}</Text>
              </View>
            )}
            {lead.address && (
              <View style={styles.contactItem}>
                <Ionicons name="location" size={16} color="#6B7280" />
                <Text style={styles.contactText}>{lead.address}</Text>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Ionicons name="call" size={20} color="#FFFFFF" />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
              <Ionicons name="mail" size={20} color="#FFFFFF" />
              <Text style={styles.actionText}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowAddActivity(true)}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.actionText}>Log Activity</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity Section */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Communication History</Text>
            <Text style={styles.activityCount}>({activities.length})</Text>
          </View>

          {/* Activity Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
            {['all', 'call', 'email', 'note'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}s
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Activity List */}
          <View style={styles.activityList}>
            {filterActivities().map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons 
                    name={getActivityIcon(activity.activity_type) as any} 
                    size={16} 
                    color="#4F46E5" 
                  />
                </View>
                <View style={styles.activityDetails}>
                  <View style={styles.activityMeta}>
                    <Text style={styles.activityType}>
                      {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)}
                    </Text>
                    {activity.outcome && (
                      <Text style={[styles.outcome, { color: getOutcomeColor(activity.outcome) }]}>
                        {activity.outcome.replace('_', ' ')}
                      </Text>
                    )}
                    <Text style={styles.activityDate}>
                      {formatActivityDate(activity.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.activityContent}>{activity.content}</Text>
                  {activity.duration && (
                    <Text style={styles.duration}>{activity.duration} min</Text>
                  )}
                </View>
              </View>
            ))}
            
            {filterActivities().length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No activities yet</Text>
                <Text style={styles.emptySubtext}>Start logging interactions with this lead</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Add Activity Modal */}
      <Modal
        visible={showAddActivity}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddActivity(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Log Activity</Text>
            <TouchableOpacity onPress={addActivity}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Activity Type */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Activity Type</Text>
              <View style={styles.typeButtons}>
                {['call', 'email', 'note'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      activityType === type && styles.activeTypeButton
                    ]}
                    onPress={() => setActivityType(type as any)}
                  >
                    <Ionicons 
                      name={getActivityIcon(type) as any} 
                      size={20} 
                      color={activityType === type ? '#FFFFFF' : '#6B7280'} 
                    />
                    <Text style={[
                      styles.typeButtonText,
                      activityType === type && styles.activeTypeButtonText
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Call-specific fields */}
            {activityType === 'call' && (
              <>
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Call Outcome</Text>
                  <View style={styles.outcomeButtons}>
                    {['answered', 'missed', 'declined', 'callback_needed'].map((outcome) => (
                      <TouchableOpacity
                        key={outcome}
                        style={[
                          styles.outcomeButton,
                          callOutcome === outcome && { backgroundColor: getOutcomeColor(outcome) }
                        ]}
                        onPress={() => setCallOutcome(outcome)}
                      >
                        <Text style={[
                          styles.outcomeButtonText,
                          callOutcome === outcome && { color: '#FFFFFF' }
                        ]}>
                          {outcome.replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Duration (minutes)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={callDuration}
                    onChangeText={setCallDuration}
                    placeholder="e.g. 15"
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}

            {/* Activity Content */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Details</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={activityContent}
                onChangeText={setActivityContent}
                placeholder={`Describe the ${activityType}...`}
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leadHeader: {
    marginBottom: 16,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  leadCompany: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  stageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stage: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  contactSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.3,
    justifyContent: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  activitySection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  activityCount: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  tabContainer: {
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  activityList: {
    minHeight: 200,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityType: {
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
  activityDate: {
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputSection: {
    marginVertical: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  typeButton: {
    flex: 0.3,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  activeTypeButton: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  activeTypeButtonText: {
    color: '#FFFFFF',
  },
  outcomeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  outcomeButton: {
    width: '48%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    marginBottom: 8,
  },
  outcomeButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
});
