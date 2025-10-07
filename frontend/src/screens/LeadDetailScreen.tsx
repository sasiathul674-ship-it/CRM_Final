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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Lead, Activity } from '../services/api';
import * as Haptics from 'expo-haptics';

const STAGES = [
  { id: 'New Leads', name: 'New Leads', color: '#3B82F6', icon: 'person-add' },
  { id: 'Contacted', name: 'Contacted', color: '#F59E0B', icon: 'call' },
  { id: 'Follow-up', name: 'Follow-up', color: '#EF4444', icon: 'time' },
  { id: 'Negotiation', name: 'Negotiation', color: '#8B5CF6', icon: 'chatbubbles' },
  { id: 'Closed', name: 'Closed', color: '#10B981', icon: 'checkmark-circle' },
];

const PRIORITIES = [
  { id: 'low', name: 'Low', color: '#10B981' },
  { id: 'medium', name: 'Medium', color: '#F59E0B' },
  { id: 'high', name: 'High', color: '#EF4444' },
];

const CALL_OUTCOMES = [
  { id: 'answered', label: 'Connected', icon: 'checkmark-circle', color: '#10B981' },
  { id: 'missed', label: 'No Answer', icon: 'close-circle', color: '#EF4444' },
  { id: 'declined', label: 'Declined', icon: 'remove-circle', color: '#F59E0B' },
  { id: 'callback_needed', label: 'Callback', icon: 'call', color: '#8B5CF6' },
];

export default function LeadDetailScreen({ route, navigation }: any) {
  const { leadId, lead: passedLead } = route.params;
  const [lead, setLead] = useState<Lead | null>(passedLead || null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(!passedLead);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);
  
  const { token } = useAuth();

  useEffect(() => {
    if (!passedLead) {
      fetchLeadDetails();
    } else {
      initializeEditForm(passedLead);
    }
    fetchActivities();
  }, [leadId]);

  const initializeEditForm = (leadData: Lead) => {
    setEditForm({
      name: leadData.name || '',
      company: leadData.company || '',
      phone: leadData.phone || '',
      email: leadData.email || '',
      address: leadData.address || '',
      stage: leadData.stage || '',
      priority: leadData.priority || '',
      notes: leadData.notes || ''
    });
  };

  const fetchLeadDetails = async () => {
    if (!token) return;
    
    try {
      const leadData = await apiService.getLead(token, leadId);
      setLead(leadData);
      initializeEditForm(leadData);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load lead details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    if (!token) return;
    
    try {
      const activitiesData = await apiService.getLeadActivities(token, leadId);
      setActivities(activitiesData);
    } catch (error: any) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!token || !lead) return;
    
    setIsSubmitting(true);
    try {
      const updatedLead = await apiService.updateLead(token, lead.id, editForm);
      setLead(updatedLead);
      setEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Lead updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStageChange = async (newStage: string) => {
    if (!token || !lead) return;
    
    setUpdatingStage(true);
    try {
      await apiService.updateLeadStage(token, lead.id, newStage);
      setLead({ ...lead, stage: newStage });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update stage');
    } finally {
      setUpdatingStage(false);
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
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              // Suggest logging call
              setTimeout(() => {
                setActivityType('call');
                setShowAddActivity(true);
              }, 1000);
            }
          }
        ]
      );
    } else {
      Alert.alert('No Phone Number', 'This lead does not have a phone number.');
    }
  };

  const handleEmail = () => {
    if (lead?.email) {
      const subject = `Follow up - ${lead.name}`;
      const body = `Hi ${lead.name},\n\nI wanted to follow up on our conversation...\n\nBest regards`;
      Linking.openURL(`mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Suggest logging email
      setTimeout(() => {
        setActivityType('email');
        setActivityContent(subject);
        setShowAddActivity(true);
      }, 1000);
    } else {
      Alert.alert('No Email', 'This lead does not have an email address.');
    }
  };

  const handleAddActivity = async () => {
    if (!token || !activityContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      const activityData = {
        lead_id: leadId,
        activity_type: activityType,
        content: activityContent,
        outcome: activityType === 'call' ? callOutcome : undefined,
        duration: activityType === 'call' && callDuration ? parseInt(callDuration) : undefined,
      };
      
      await apiService.createActivity(token, activityData);
      await fetchActivities();
      setShowAddActivity(false);
      setActivityContent('');
      setCallDuration('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to add activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const p = PRIORITIES.find(p => p.id === priority);
    return p ? p.color : '#6B7280';
  };

  const getStageColor = (stage: string) => {
    const s = STAGES.find(s => s.id === stage);
    return s ? s.color : '#6B7280';
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Details</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => {
            if (editing) {
              setEditing(false);
            } else {
              setEditing(true);
              initializeEditForm(lead!);
            }
          }}
        >
          <Ionicons name={editing ? "close" : "create"} size={20} color="#4F46E5" />
          <Text style={styles.editButtonText}>{editing ? "Cancel" : "Edit"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLeadCard = () => (
    <View style={styles.leadCard}>
      <View style={styles.leadHeader}>
        <View style={styles.leadInfo}>
          {editing ? (
            <TextInput
              style={styles.editInput}
              value={editForm.name}
              onChangeText={(text) => setEditForm({...editForm, name: text})}
              placeholder="Lead name"
            />
          ) : (
            <Text style={styles.leadName}>{lead?.name}</Text>
          )}
          
          {editing ? (
            <TextInput
              style={styles.editInput}
              value={editForm.company}
              onChangeText={(text) => setEditForm({...editForm, company: text})}
              placeholder="Company name"
            />
          ) : (
            lead?.company && <Text style={styles.leadCompany}>{lead.company}</Text>
          )}
        </View>
        
        <View style={styles.leadMeta}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(lead?.priority || 'medium') + '20' }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(lead?.priority || 'medium') }]}>
              {lead?.priority?.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Contact Info */}
      <View style={styles.contactSection}>
        <View style={styles.contactRow}>
          <Ionicons name="call" size={16} color="#6B7280" />
          {editing ? (
            <TextInput
              style={[styles.editInput, styles.contactInput]}
              value={editForm.phone}
              onChangeText={(text) => setEditForm({...editForm, phone: text})}
              placeholder="Phone number"
            />
          ) : (
            <TouchableOpacity style={styles.contactInfo} onPress={handleCall}>
              <Text style={styles.contactText}>{lead?.phone || 'No phone'}</Text>
              {lead?.phone && <Ionicons name="call" size={16} color="#4F46E5" />}
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.contactRow}>
          <Ionicons name="mail" size={16} color="#6B7280" />
          {editing ? (
            <TextInput
              style={[styles.editInput, styles.contactInput]}
              value={editForm.email}
              onChangeText={(text) => setEditForm({...editForm, email: text})}
              placeholder="Email address"
            />
          ) : (
            <TouchableOpacity style={styles.contactInfo} onPress={handleEmail}>
              <Text style={styles.contactText}>{lead?.email || 'No email'}</Text>
              {lead?.email && <Ionicons name="mail" size={16} color="#4F46E5" />}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stage Selector */}
      <View style={styles.stageSection}>
        <Text style={styles.sectionTitle}>Stage</Text>
        {editing ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stageSelector}>
            {STAGES.map((stage) => (
              <TouchableOpacity
                key={stage.id}
                style={[
                  styles.stageOption,
                  { borderColor: stage.color },
                  editForm.stage === stage.id && { backgroundColor: stage.color }
                ]}
                onPress={() => setEditForm({...editForm, stage: stage.id})}
              >
                <Ionicons 
                  name={stage.icon as any} 
                  size={16} 
                  color={editForm.stage === stage.id ? '#FFFFFF' : stage.color} 
                />
                <Text style={[
                  styles.stageOptionText,
                  { color: editForm.stage === stage.id ? '#FFFFFF' : stage.color }
                ]}>
                  {stage.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stageSelector}>
            {STAGES.map((stage) => (
              <TouchableOpacity
                key={stage.id}
                style={[
                  styles.stageOption,
                  { borderColor: stage.color },
                  lead?.stage === stage.id && { backgroundColor: stage.color }
                ]}
                onPress={() => !updatingStage && handleStageChange(stage.id)}
                disabled={updatingStage}
              >
                {updatingStage && lead?.stage === stage.id ? (
                  <ActivityIndicator size="small" color={stage.color} />
                ) : (
                  <>
                    <Ionicons 
                      name={stage.icon as any} 
                      size={16} 
                      color={lead?.stage === stage.id ? '#FFFFFF' : stage.color} 
                    />
                    <Text style={[
                      styles.stageOptionText,
                      { color: lead?.stage === stage.id ? '#FFFFFF' : stage.color }
                    ]}>
                      {stage.name}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {editing && (
        <View style={styles.editActions}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSaveEdit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {['overview', 'tasks', 'timeline'].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderActivityTimeline = () => (
    <View style={styles.timelineContainer}>
      <View style={styles.timelineHeader}>
        <Text style={styles.sectionTitle}>Activity Timeline</Text>
        <TouchableOpacity 
          style={styles.addActivityButton}
          onPress={() => setShowAddActivity(true)}
        >
          <Ionicons name="add-circle" size={20} color="#4F46E5" />
          <Text style={styles.addActivityText}>Add</Text>
        </TouchableOpacity>
      </View>
      
      {activities.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No activities yet</Text>
          <TouchableOpacity 
            style={styles.addFirstActivityButton}
            onPress={() => setShowAddActivity(true)}
          >
            <Text style={styles.addFirstActivityText}>Add First Activity</Text>
          </TouchableOpacity>
        </View>
      ) : (
        activities.map((activity, index) => (
          <View key={activity.id} style={styles.timelineItem}>
            <View style={styles.timelineIcon}>
              <Ionicons 
                name={
                  activity.activity_type === 'call' ? 'call' : 
                  activity.activity_type === 'email' ? 'mail' : 'document-text'
                } 
                size={16} 
                color="#4F46E5" 
              />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineText}>{activity.content}</Text>
              <Text style={styles.timelineDate}>
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading lead details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!lead) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Lead not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {renderHeader()}
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderLeadCard()}
          {renderTabs()}
          
          {activeTab === 'timeline' && renderActivityTimeline()}
          {activeTab === 'overview' && (
            <View style={styles.overviewContainer}>
              <Text style={styles.sectionTitle}>Lead Overview</Text>
              <Text style={styles.overviewText}>
                Created {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
              </Text>
              {lead.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesTitle}>Notes:</Text>
                  <Text style={styles.notesText}>{lead.notes}</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Quick Action Buttons */}
        {!editing && (
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={handleCall}>
              <Ionicons name="call" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.emailButton]} onPress={handleEmail}>
              <Ionicons name="mail" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.noteButton]}
              onPress={() => {
                setActivityType('note');
                setShowAddActivity(true);
              }}
            >
              <Ionicons name="document-text" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Note</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add Activity Modal */}
        <Modal
          visible={showAddActivity}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddActivity(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddActivity(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Activity</Text>
              <TouchableOpacity onPress={handleAddActivity} disabled={!activityContent.trim()}>
                <Text style={[styles.modalSave, !activityContent.trim() && styles.modalSaveDisabled]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.activityTypeSelector}>
                {['note', 'call', 'email'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.activityTypeOption,
                      activityType === type && styles.activeActivityType
                    ]}
                    onPress={() => setActivityType(type as any)}
                  >
                    <Ionicons 
                      name={type === 'call' ? 'call' : type === 'email' ? 'mail' : 'document-text'} 
                      size={16} 
                      color={activityType === type ? '#FFFFFF' : '#6B7280'} 
                    />
                    <Text style={[
                      styles.activityTypeText,
                      activityType === type && styles.activeActivityTypeText
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TextInput
                style={styles.activityInput}
                placeholder={`Enter ${activityType} details...`}
                value={activityContent}
                onChangeText={setActivityContent}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              
              {activityType === 'call' && (
                <View style={styles.callExtras}>
                  <Text style={styles.callExtraLabel}>Call Outcome:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {CALL_OUTCOMES.map((outcome) => (
                      <TouchableOpacity
                        key={outcome.id}
                        style={[
                          styles.outcomeOption,
                          { borderColor: outcome.color },
                          callOutcome === outcome.id && { backgroundColor: outcome.color }
                        ]}
                        onPress={() => setCallOutcome(outcome.id)}
                      >
                        <Text style={[
                          styles.outcomeText,
                          { color: callOutcome === outcome.id ? '#FFFFFF' : outcome.color }
                        ]}>
                          {outcome.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  
                  <TextInput
                    style={styles.durationInput}
                    placeholder="Duration (minutes)"
                    value={callDuration}
                    onChangeText={setCallDuration}
                    keyboardType="numeric"
                  />
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  editButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  scrollView: {
    flex: 1,
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  leadCompany: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  leadMeta: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  contactSection: {
    marginBottom: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    marginLeft: 12,
  },
  contactInput: {
    flex: 1,
    marginLeft: 12,
    marginBottom: 0,
  },
  contactText: {
    fontSize: 16,
    color: '#374151',
  },
  stageSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  stageSelector: {
    maxHeight: 50,
  },
  stageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  stageOptionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  editActions: {
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  timelineContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addActivityText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  overviewContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
  },
  overviewText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  notesSection: {
    marginTop: 16,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  callButton: {
    backgroundColor: '#10B981',
  },
  emailButton: {
    backgroundColor: '#3B82F6',
  },
  noteButton: {
    backgroundColor: '#8B5CF6',
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 16,
  },
  addFirstActivityButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  addFirstActivityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#374151',
    marginTop: 16,
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  modalSaveDisabled: {
    color: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  activityTypeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  activityTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  activeActivityType: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  activityTypeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeActivityTypeText: {
    color: '#FFFFFF',
  },
  activityInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 120,
    marginBottom: 20,
  },
  callExtras: {
    marginTop: 20,
  },
  callExtraLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  outcomeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  outcomeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  durationInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 16,
  },
});