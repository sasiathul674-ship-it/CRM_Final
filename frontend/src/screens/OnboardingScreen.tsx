import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import Toast from 'react-native-toast-message';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }: any) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { user, token, completeOnboarding: completeOnboardingAuth } = useAuth();
  const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;
  
  // Step 1: Profile Setup
  const [name, setName] = useState(user?.name || '');
  const [company, setCompany] = useState(user?.company || '');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  
  // Step 2: Business Card
  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  const [website, setWebsite] = useState('');
  
  // Step 3: First Lead (Demo)
  const [demoLeadAdded, setDemoLeadAdded] = useState(false);

  const TEMPLATES = [
    { id: 'professional', name: 'Professional Blue', color: '#4F46E5', description: 'Perfect for corporate networking' },
    { id: 'modern', name: 'Modern Black', color: '#1F2937', description: 'Sleek and tech-forward' },
    { id: 'minimal', name: 'Minimal White', color: '#FFFFFF', description: 'Clean and elegant' },
  ];

  const handleStep1Continue = () => {
    if (!name.trim() || !company.trim() || !title.trim()) {
      Alert.alert('Complete Your Profile', 'Please fill in all required fields to continue.');
      return;
    }
    setCurrentStep(2);
  };

  const handleStep2Continue = async () => {
    setIsLoading(true);
    try {
      // Create business card
      const cardData = {
        name: name.trim(),
        title: title.trim(),
        company: company.trim(),
        phone: phone.trim(),
        email: email.trim(),
        website: website.trim() || undefined,
        template: selectedTemplate,
      };

      const response = await fetch(`${API_BASE_URL}/api/business-card`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      });

      if (response.ok) {
        setCurrentStep(3);
      } else {
        throw new Error('Failed to create business card');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addDemoLead = async () => {
    setIsLoading(true);
    try {
      const leadData = {
        name: 'Sarah Johnson',
        company: 'TechStart Inc',
        phone: '+1 (555) 123-4567',
        email: 'sarah@techstart.com',
        stage: 'New Leads',
        priority: 'high',
        notes: 'Source: Networking Event\n\nMet at Tech Conference 2025. Very interested in our CRM solution for their startup. Follow up within 2 days.',
      };

      const response = await fetch(`${API_BASE_URL}/api/leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });

      if (response.ok) {
        setDemoLeadAdded(true);
      }
    } catch (error) {
      console.error('Demo lead creation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = () => {
    // Show success toast
    Toast.show({
      type: 'success',
      text1: '🚀 Welcome to Strike CRM!',
      text2: 'Your workspace is ready! Let\'s start managing leads.',
      position: 'top',
      visibilityTime: 3000,
    });
    
    // Complete onboarding and navigate to app
    completeOnboardingAuth();
    navigation.replace('App');
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Welcome to Strike!</Text>
              <Text style={styles.stepSubtitle}>Let's set up your professional profile</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your full name"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Company *</Text>
                <TextInput
                  style={styles.input}
                  value={company}
                  onChangeText={setCompany}
                  placeholder="Your company name"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Job Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Sales Manager"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1 (555) 123-4567"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <Text style={styles.helpText}>This helps personalize your experience and creates your digital business card</Text>

            <TouchableOpacity style={styles.continueButton} onPress={handleStep1Continue}>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Create Your Digital Business Card</Text>
              <Text style={styles.stepSubtitle}>Share this anywhere to get leads instantly</Text>
            </View>

            <View style={styles.templateContainer}>
              <Text style={styles.sectionTitle}>Choose Your Template</Text>
              
              {TEMPLATES.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateOption,
                    { backgroundColor: template.color },
                    selectedTemplate === template.id && styles.selectedTemplate,
                    template.id === 'minimal' && { borderWidth: 1, borderColor: '#E5E7EB' }
                  ]}
                  onPress={() => setSelectedTemplate(template.id)}
                >
                  <View style={styles.templateContent}>
                    <Text style={[
                      styles.templateName,
                      { color: template.id === 'minimal' ? '#1F2937' : '#FFFFFF' }
                    ]}>
                      {template.name}
                    </Text>
                    <Text style={[
                      styles.templateDesc,
                      { color: template.id === 'minimal' ? '#6B7280' : 'rgba(255,255,255,0.8)' }
                    ]}>
                      {template.description}
                    </Text>
                  </View>
                  {selectedTemplate === template.id && (
                    <Ionicons 
                      name="checkmark-circle" 
                      size={24} 
                      color={template.id === 'minimal' ? '#4F46E5' : '#FFFFFF'} 
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Website (Optional)</Text>
              <TextInput
                style={styles.input}
                value={website}
                onChangeText={setWebsite}
                placeholder="https://yourwebsite.com"
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => setCurrentStep(1)}
              >
                <Ionicons name="arrow-back" size={20} color="#6B7280" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.continueButton, styles.continueButtonFlex]} 
                onPress={handleStep2Continue}
                disabled={isLoading}
              >
                <Text style={styles.continueButtonText}>
                  {isLoading ? 'Creating...' : 'Create Card'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>You're Almost Ready!</Text>
              <Text style={styles.stepSubtitle}>Let's add a demo lead to show you how Strike works</Text>
            </View>

            <View style={styles.demoCard}>
              <View style={styles.demoHeader}>
                <Ionicons name="person-circle" size={48} color="#4F46E5" />
                <View style={styles.demoInfo}>
                  <Text style={styles.demoName}>Sarah Johnson</Text>
                  <Text style={styles.demoCompany}>TechStart Inc</Text>
                  <Text style={styles.demoPhone}>+1 (555) 123-4567</Text>
                </View>
                <View style={[styles.priorityDot, { backgroundColor: '#EF4444' }]} />
              </View>
              
              <View style={styles.demoDivider} />
              
              <Text style={styles.demoNote}>
                "Met at Tech Conference 2025. Very interested in our CRM solution for their startup. Follow up within 2 days."
              </Text>
              
              <View style={styles.demoActions}>
                <View style={styles.demoActionButton}>
                  <Ionicons name="call" size={16} color="#4F46E5" />
                </View>
                <View style={styles.demoActionButton}>
                  <Ionicons name="mail" size={16} color="#4F46E5" />
                </View>
                <View style={styles.demoActionButton}>
                  <Ionicons name="create" size={16} color="#4F46E5" />
                </View>
              </View>
            </View>

            <Text style={styles.helpText}>
              {demoLeadAdded 
                ? '✅ Demo lead added! You can now drag this lead between stages in your pipeline.'
                : 'This sample lead will help you learn how to manage your pipeline effectively.'
              }
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => setCurrentStep(2)}
              >
                <Ionicons name="arrow-back" size={20} color="#6B7280" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              
              {!demoLeadAdded ? (
                <TouchableOpacity 
                  style={[styles.continueButton, styles.continueButtonFlex]} 
                  onPress={addDemoLead}
                  disabled={isLoading}
                >
                  <Text style={styles.continueButtonText}>
                    {isLoading ? 'Adding...' : 'Add Demo Lead'}
                  </Text>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.continueButton, styles.continueButtonFlex]} 
                  onPress={completeOnboarding}
                >
                  <Text style={styles.continueButtonText}>Start Using Strike</Text>
                  <Ionicons name="rocket" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((step) => (
            <View key={step} style={styles.progressStep}>
              <View style={[
                styles.progressDot,
                currentStep >= step && styles.progressDotActive
              ]}>
                {currentStep > step ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : (
                  <Text style={[
                    styles.progressNumber,
                    currentStep >= step && styles.progressNumberActive
                  ]}>
                    {step}
                  </Text>
                )}
              </View>
              {step < 3 && (
                <View style={[
                  styles.progressLine,
                  currentStep > step && styles.progressLineActive
                ]} />
              )}
            </View>
          ))}
        </View>

        {getStepContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: '#4F46E5',
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  progressNumberActive: {
    color: '#FFFFFF',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#4F46E5',
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  templateContainer: {
    marginBottom: 24,
  },
  templateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedTemplate: {
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  templateContent: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  templateDesc: {
    fontSize: 14,
  },
  demoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  demoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  demoName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  demoCompany: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  demoPhone: {
    fontSize: 13,
    color: '#94A3B8',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  demoDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  demoNote: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  demoActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  demoActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 8,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonFlex: {
    flex: 1,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
});
