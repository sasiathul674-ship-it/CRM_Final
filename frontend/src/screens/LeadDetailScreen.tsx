import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Lead, Activity } from '../services/api';

const CALL_OUTCOMES = [
  { id: 'answered', label: 'Connected', icon: 'checkmark-circle', color: '#10B981' },
  { id: 'missed', label: 'No Answer', icon: 'close-circle', color: '#EF4444' },
  { id: 'declined', label: 'Declined', icon: 'remove-circle', color: '#F59E0B' },
  { id: 'callback_needed', label: 'Callback', icon: 'call', color: '#8B5CF6' },
];

const EMAIL_TEMPLATES = [
  { id: 'follow-up', subject: 'Following up on our conversation', body: 'Hi {name},\n\nI wanted to follow up on our recent conversation about...' },
  { id: 'thank-you', subject: 'Thank you for your time', body: 'Hi {name},\n\nThank you for taking the time to speak with me today...' },
  { id: 'proposal', subject: 'Proposal Request', body: 'Hi {name},\n\nAs discussed, I\'m sending over the proposal for...' },
];

const STAGES = [
  { id: 'New Leads', name: 'New Leads', color: '#3B82F6' },
  { id: 'Contacted', name: 'Contacted', color: '#F59E0B' },
  { id: 'Follow-up', name: 'Follow-up', color: '#EF4444' },
  { id: 'Negotiation', name: 'Negotiation', color: '#8B5CF6' },
  { id: 'Closed', name: 'Closed', color: '#10B981' },
];

const PRIORITIES = [
  { id: 'low', name: 'Low', color: '#10B981' },
  { id: 'medium', name: 'Medium', color: '#F59E0B' },
  { id: 'high', name: 'High', color: '#EF4444' },
];

export default function LeadDetailScreen({ route, navigation }: any) {
  const { leadId, lead: passedLead } = route.params;
  const [lead, setLead] = useState<Lead | null>(passedLead || null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState('timeline');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    stage: '',
    priority: '',
    notes: ''
  });
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [activityType, setActivityType] = useState<'call' | 'email' | 'note'>('note');
  const [activityContent, setActivityContent] = useState('');
  const [callOutcome, setCallOutcome] = useState('answered');
  const [callDuration, setCallDuration] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);
  
  const { token } = useAuth();

  useEffect(() => {
    fetchLeadDetails();
    fetchActivities();
  }, [leadId]);

  const fetchLeadDetails = async () => {
    if (!token) return;
    
    try {
      const leadData = await apiService.getLead(token, leadId);
      setLead(leadData);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load lead details');
      navigation.goBack();
    }
  };

  const fetchActivities = async () => {
    if (!token) return;
    
    try {
      const activitiesData = await apiService.getLeadActivities(token, leadId);
      setActivities(activitiesData);
    } catch (error: any) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (lead?.phone) {
      Alert.alert(
        'Call Lead',
        `Call ${lead.name} at ${lead.phone}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Call Now',
            onPress: () => {
              Linking.openURL(`tel:${lead.phone}`);
              // Suggest logging call after
              setTimeout(() => {
                Alert.alert(
                  'Log Call',
                  'Would you like to log this call?',
                  [
                    { text: 'Skip', style: 'cancel' },
                    {
                      text: 'Log Call',
                      onPress: () => {
                        setActivityType('call');
                        setShowAddActivity(true);
                      }
                    }
                  ]
                );
              }, 1000);
            }
          },
        ]
      );
    } else {
      Alert.alert('No Phone Number', 'This lead does not have a phone number.');
    }
  };

  const handleEmail = () => {
    if (lead?.email) {
      Alert.alert(
        'Send Email',
        'Choose an option:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Email App',
            onPress: () => Linking.openURL(`mailto:${lead.email}`)
          },
          {
            text: 'Use Template',
            onPress: () => {
              setActivityType('email');
              setShowAddActivity(true);
            }
          },
        ]
      );
    } else {
      Alert.alert('No Email', 'This lead does not have an email address.');
    }
  };

  const addActivity = async () => {
    if (!activityContent.trim()) {
      Alert.alert('Error', 'Please enter activity details');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const activityData: any = {
        lead_id: leadId,
        activity_type: activityType,
        content: activityType === 'email' && emailSubject 
          ? `Subject: ${emailSubject}\n\n${activityContent.trim()}`
          : activityContent.trim(),
      };

      if (activityType === 'call') {
        activityData.outcome = callOutcome;
        if (callDuration) {
          activityData.duration = parseInt(callDuration);
        }
      }

      await apiService.createActivity(token!, activityData);
      
      setShowAddActivity(false);
      setActivityContent('');
      setEmailSubject('');
      setCallDuration('');
      fetchActivities();
      
      Alert.alert('Success', 'Activity logged successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to log activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const useEmailTemplate = (template: any) => {
    setEmailSubject(template.subject);
    setActivityContent(template.body.replace('{name}', lead?.name || 'there'));
  };

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
    const outcomeObj = CALL_OUTCOMES.find(o => o.id === outcome);
    return outcomeObj?.color || '#6B7280';
  };

  const filterActivities = () => {
    if (activeTab === 'timeline') return activities;
    if (activeTab === 'calls') return activities.filter(a => a.activity_type === 'call');
    if (activeTab === 'emails') return activities.filter(a => a.activity_type === 'email');
    if (activeTab === 'notes') return activities.filter(a => a.activity_type === 'note');
    return activities;
  };

  if (loading || !lead) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading lead details...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Ionicons name="create" size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Contact Card */}
        <View style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{lead.name}</Text>
              {lead.company && (
                <Text style={styles.contactCompany}>{lead.company}</Text>
              )}
              <View style={styles.stageContainer}>
                <Text style={styles.stage}>{lead.stage}</Text>
                <View style={[styles.priorityDot, { 
                  backgroundColor: lead.priority === 'high' ? '#EF4444' : 
                                 lead.priority === 'medium' ? '#F59E0B' : '#10B981' 
                }]} />
              </View>
            </View>
          </View>

          {/* Contact Methods */}
          <View style={styles.contactMethods}>
            {lead.phone && (
              <View style={styles.contactMethod}>
                <Ionicons name="call" size={16} color="#6B7280" />
                <TouchableOpacity onPress={handleCall}>
                  <Text style={styles.contactMethodText}>{lead.phone}</Text>
                </TouchableOpacity>
              </View>
            )}
            {lead.email && (
              <View style={styles.contactMethod}>
                <Ionicons name="mail" size={16} color="#6B7280" />
                <TouchableOpacity onPress={handleEmail}>
                  <Text style={styles.contactMethodText}>{lead.email}</Text>
                </TouchableOpacity>
              </View>
            )}
            {lead.address && (
              <View style={styles.contactMethod}>
                <Ionicons name="location" size={16} color="#6B7280" />
                <Text style={styles.contactMethodText}>{lead.address}</Text>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.actionButton, styles.callAction]} onPress={handleCall}>
              <Ionicons name="call" size={18} color="#FFFFFF" />
              <Text style={styles.actionText}>Call Now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.emailAction]} onPress={handleEmail}>
              <Ionicons name="mail" size={18} color="#FFFFFF" />
              <Text style={styles.actionText}>Email</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.noteAction]} 
              onPress={() => {
                setActivityType('note');
                setShowAddActivity(true);
              }}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.actionText}>Add Note</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity Tabs */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { id: 'timeline', label: 'All Activity', count: activities.length },
              { id: 'calls', label: 'Calls', count: activities.filter(a => a.activity_type === 'call').length },
              { id: 'emails', label: 'Emails', count: activities.filter(a => a.activity_type === 'email').length },
              { id: 'notes', label: 'Notes', count: activities.filter(a => a.activity_type === 'note').length },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                  {tab.label} ({tab.count})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Activity List */}
        <View style={styles.activityList}>
          {filterActivities().map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: `${getActivityColor(activity.activity_type)}20` }]}>
                <Ionicons 
                  name={getActivityIcon(activity.activity_type) as any} 
                  size={16} 
                  color={getActivityColor(activity.activity_type)} 
                />
              </View>
              
              <View style={styles.activityDetails}>
                <View style={styles.activityMeta}>
                  <Text style={styles.activityType}>
                    {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)}
                  </Text>
                  {activity.outcome && (
                    <View style={styles.outcomeContainer}>
                      <View style={[styles.outcomeIndicator, { backgroundColor: getOutcomeColor(activity.outcome) }]} />
                      <Text style={[styles.outcome, { color: getOutcomeColor(activity.outcome) }]}>
                        {CALL_OUTCOMES.find(o => o.id === activity.outcome)?.label || activity.outcome}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.activityDate}>
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </Text>
                </View>
                
                <Text style={styles.activityContent}>{activity.content}</Text>
                
                {activity.duration && (
                  <Text style={styles.duration}>{activity.duration} minutes</Text>
                )}
              </View>
            </View>
          ))}
          
          {filterActivities().length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No {activeTab === 'timeline' ? 'activities' : activeTab} yet</Text>
              <Text style={styles.emptySubtext}>Start logging interactions with this lead</Text>
            </View>
          )}
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
            <TouchableOpacity onPress={addActivity} disabled={isSubmitting}>
              <Text style={[styles.saveText, isSubmitting && { opacity: 0.5 }]}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Activity Type */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Activity Type</Text>
              <View style={styles.typeButtons}>
                {(['call', 'email', 'note'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      activityType === type && styles.activeTypeButton
                    ]}
                    onPress={() => setActivityType(type)}
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
                    {CALL_OUTCOMES.map((outcome) => (
                      <TouchableOpacity
                        key={outcome.id}
                        style={[
                          styles.outcomeButton,
                          callOutcome === outcome.id && { backgroundColor: outcome.color }
                        ]}
                        onPress={() => setCallOutcome(outcome.id)}
                      >
                        <Ionicons name={outcome.icon as any} size={16} color={callOutcome === outcome.id ? '#FFFFFF' : outcome.color} />
                        <Text style={[
                          styles.outcomeButtonText,
                          callOutcome === outcome.id && { color: '#FFFFFF' }
                        ]}>
                          {outcome.label}
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

            {/* Email-specific fields */}
            {activityType === 'email' && (
              <>
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Email Templates</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.templateButtons}>
                      {EMAIL_TEMPLATES.map((template) => (
                        <TouchableOpacity
                          key={template.id}
                          style={styles.templateButton}
                          onPress={() => useEmailTemplate(template)}
                        >
                          <Text style={styles.templateButtonText}>{template.subject}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Subject</Text>
                  <TextInput
                    style={styles.textInput}
                    value={emailSubject}
                    onChangeText={setEmailSubject}
                    placeholder="Email subject..."
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

// [Rest of styles remain the same as they're comprehensive...]
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
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
  contactCard: {
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
  contactHeader: {
    marginBottom: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  contactCompany: {
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
  contactMethods: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    marginBottom: 16,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactMethodText: {
    fontSize: 16,
    color: '#4F46E5',
    marginLeft: 12,
    textDecorationLine: 'underline',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  callAction: {
    backgroundColor: '#10B981',
  },
  emailAction: {
    backgroundColor: '#3B82F6',
  },
  noteAction: {
    backgroundColor: '#8B5CF6',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 8,
  },
  activeTab: {
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    flexWrap: 'wrap',
  },
  activityType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  outcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  outcomeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  outcome: {
    fontSize: 12,
    fontWeight: '500',
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
    gap: 8,
  },
  typeButton: {
    flex: 1,
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
    gap: 8,
  },
  outcomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    minWidth: '48%',
  },
  outcomeButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 4,
  },
  templateButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  templateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  templateButtonText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
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
