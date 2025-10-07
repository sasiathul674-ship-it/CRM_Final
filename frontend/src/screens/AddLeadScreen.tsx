import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const LEAD_SOURCES = ['Website', 'Referral', 'Cold Call', 'Social Media', 'Email Campaign', 'Other'];
const PRIORITIES = ['low', 'medium', 'high'];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return '#EF4444';
    case 'medium': return '#F59E0B';
    case 'low': return '#10B981';
    default: return '#6B7280';
  }
};

export default function AddLeadScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [leadSource, setLeadSource] = useState('Website');
  const [priority, setPriority] = useState('medium');
  const [dealValue, setDealValue] = useState('');
  const [notes, setNotes] = useState('');
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const { token } = useAuth();

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!name.trim()) {
      newErrors.name = 'Lead name is required';
    }
    
    if (!phone.trim() && !email.trim()) {
      newErrors.contact = 'Either phone number or email is required';
    }
    
    if (phone.trim() && !/^[\+]?[\s\-\(\)0-9]{10,}$/.test(phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const leadData = {
        name: name.trim(),
        company: company.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        stage: 'New Leads',
        priority,
        order_value: dealValue ? parseFloat(dealValue) : undefined,
        notes: notes.trim() ? `Source: ${leadSource}\n\n${notes.trim()}` : `Source: ${leadSource}`,
      };

      const newLead = await apiService.createLead(token!, leadData);
      
      if (newLead) {
        Alert.alert(
          '✅ Lead Added Successfully!',
          `${newLead.name} has been added to your pipeline.`,
          [
            {
              text: 'Add Another',
              onPress: () => {
                // Reset form
                setName('');
                setCompany('');
                setPhone('');
                setEmail('');
                setAddress('');
                setDealValue('');
                setNotes('');
                setPriority('medium');
                setLeadSource('Website');
                setShowMoreDetails(false);
                setErrors({});
              }
            },
            {
              text: 'View Pipeline',
              style: 'default',
              onPress: () => navigation.goBack()
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create lead. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors({...errors, [field]: undefined});
    }
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.title}>Add New Lead</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Required Fields */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Lead Name *</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    clearError('name');
                  }}
                  placeholder="Enter lead's full name"
                  autoCapitalize="words"
                  autoFocus
                  editable={!isSubmitting}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Company *</Text>
                <TextInput
                  style={styles.input}
                  value={company}
                  onChangeText={setCompany}
                  placeholder="Company or organization name"
                  autoCapitalize="words"
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Phone {!email.trim() && '*'}</Text>
                  <TextInput
                    style={[styles.input, errors.phone && styles.inputError]}
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text);
                      clearError('phone');
                      clearError('contact');
                    }}
                    placeholder="+1 (555) 123-4567"
                    keyboardType="phone-pad"
                    editable={!isSubmitting}
                  />
                  {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                </View>
                
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Email {!phone.trim() && '*'}</Text>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      clearError('email');
                      clearError('contact');
                    }}
                    placeholder="name@company.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isSubmitting}
                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>
              </View>
              
              {errors.contact && <Text style={styles.errorText}>{errors.contact}</Text>}
            </View>

            {/* More Details Toggle */}
            <TouchableOpacity 
              style={styles.toggleSection}
              onPress={() => setShowMoreDetails(!showMoreDetails)}
            >
              <Text style={styles.toggleText}>More Details</Text>
              <Ionicons 
                name={showMoreDetails ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#4F46E5" 
              />
            </TouchableOpacity>

            {/* Optional Fields */}
            {showMoreDetails && (
              <View style={styles.section}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Lead Source</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.optionRow}>
                      {LEAD_SOURCES.map((source) => (
                        <TouchableOpacity
                          key={source}
                          style={[
                            styles.optionButton,
                            leadSource === source && styles.optionButtonSelected
                          ]}
                          onPress={() => setLeadSource(source)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              leadSource === source && styles.optionTextSelected
                            ]}
                          >
                            {source}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Priority Level</Text>
                  <View style={styles.priorityRow}>
                    {PRIORITIES.map((priorityOption) => (
                      <TouchableOpacity
                        key={priorityOption}
                        style={[
                          styles.priorityButton,
                          priority === priorityOption && {
                            backgroundColor: getPriorityColor(priorityOption),
                            borderColor: getPriorityColor(priorityOption),
                          }
                        ]}
                        onPress={() => setPriority(priorityOption)}
                      >
                        <View style={[
                          styles.priorityDot, 
                          { backgroundColor: getPriorityColor(priorityOption) }
                        ]} />
                        <Text
                          style={[
                            styles.priorityText,
                            priority === priorityOption && styles.priorityTextSelected
                          ]}
                        >
                          {priorityOption.charAt(0).toUpperCase() + priorityOption.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>Expected Deal Value</Text>
                    <View style={styles.currencyInput}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={styles.currencyField}
                        value={dealValue}
                        onChangeText={setDealValue}
                        placeholder="5,000"
                        keyboardType="numeric"
                        editable={!isSubmitting}
                      />
                    </View>
                  </View>
                  
                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>Address</Text>
                    <TextInput
                      style={styles.input}
                      value={address}
                      onChangeText={setAddress}
                      placeholder="City, State"
                      editable={!isSubmitting}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Additional notes about this lead..."
                    multiline
                    numberOfLines={3}
                    editable={!isSubmitting}
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting || !name.trim() || (!phone.trim() && !email.trim())}
            >
              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.submitButtonText}>Creating Lead...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.submitButtonText}>Create Lead</Text>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: -8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginVertical: 8,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4F46E5',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  optionButtonSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  optionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  priorityTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  currencySymbol: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginRight: 8,
  },
  currencyField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
