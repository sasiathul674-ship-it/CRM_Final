import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../contexts/AuthContext';
import Constants from 'expo-constants';

interface BusinessCard {
  id: string;
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website?: string;
  template: string;
  user_id: string;
  created_at: string;
}

const TEMPLATES = [
  { id: 'professional', name: 'Professional Blue', color: '#4F46E5' },
  { id: 'modern', name: 'Modern Black', color: '#1F2937' },
  { id: 'minimal', name: 'Minimal White', color: '#FFFFFF' },
];

export default function BusinessCardScreen() {
  const [businessCard, setBusinessCard] = useState<BusinessCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  
  const { user, token } = useAuth();
  const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

  useEffect(() => {
    fetchBusinessCard();
  }, []);

  useEffect(() => {
    if (user && !name) {
      setName(user.name || '');
      setEmail(user.email || '');
      setCompany(user.company || '');
    }
  }, [user]);

  const fetchBusinessCard = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/business-card`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBusinessCard(data);
      } else if (response.status !== 404) {
        console.error('Failed to fetch business card');
      }
    } catch (error) {
      console.error('Error fetching business card:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = async () => {
    if (!name.trim() || !title.trim() || !company.trim() || !phone.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
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
        const newCard = await response.json();
        setBusinessCard(newCard);
        setShowCreateModal(false);
        Alert.alert('Success', 'Business card created successfully!');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || 'Failed to create business card');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
      console.error('Create card error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateVCardData = (card: BusinessCard) => {
    return `BEGIN:VCARD
VERSION:3.0
FN:${card.name}
ORG:${card.company}
TITLE:${card.title}
TEL:${card.phone}
EMAIL:${card.email}
${card.website ? `URL:${card.website}
` : ''}END:VCARD`;
  };

  const getTemplateStyle = (templateId: string) => {
    switch (templateId) {
      case 'professional':
        return {
          backgroundColor: '#4F46E5',
          textColor: '#FFFFFF',
          accentColor: '#EEF2FF',
        };
      case 'modern':
        return {
          backgroundColor: '#1F2937',
          textColor: '#FFFFFF', 
          accentColor: '#F9FAFB',
        };
      case 'minimal':
        return {
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937',
          accentColor: '#F3F4F6',
          borderColor: '#E5E7EB',
        };
      default:
        return {
          backgroundColor: '#4F46E5',
          textColor: '#FFFFFF',
          accentColor: '#EEF2FF',
        };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Business Card</Text>
        {businessCard && (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="pencil" size={20} color="#4F46E5" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {businessCard ? (
          <View style={styles.cardContainer}>
            {/* Business Card Preview */}
            <View style={[
              styles.businessCard,
              { 
                backgroundColor: getTemplateStyle(businessCard.template).backgroundColor,
                ...(businessCard.template === 'minimal' && {
                  borderWidth: 1,
                  borderColor: getTemplateStyle(businessCard.template).borderColor,
                })
              }
            ]}>
              <View style={styles.cardContent}>
                <Text style={[
                  styles.cardName,
                  { color: getTemplateStyle(businessCard.template).textColor }
                ]}>
                  {businessCard.name}
                </Text>
                <Text style={[
                  styles.cardTitle,
                  { color: getTemplateStyle(businessCard.template).textColor }
                ]}>
                  {businessCard.title}
                </Text>
                <Text style={[
                  styles.cardCompany,
                  { color: getTemplateStyle(businessCard.template).textColor }
                ]}>
                  {businessCard.company}
                </Text>
                
                <View style={styles.cardDivider} />
                
                <Text style={[
                  styles.cardContact,
                  { color: getTemplateStyle(businessCard.template).textColor }
                ]}>
                  {businessCard.phone}
                </Text>
                <Text style={[
                  styles.cardContact,
                  { color: getTemplateStyle(businessCard.template).textColor }
                ]}>
                  {businessCard.email}
                </Text>
                {businessCard.website && (
                  <Text style={[
                    styles.cardContact,
                    { color: getTemplateStyle(businessCard.template).textColor }
                  ]}>
                    {businessCard.website}
                  </Text>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setShowQRModal(true)}
              >
                <Ionicons name="qr-code" size={20} color="#FFFFFF" />
                <Text style={styles.actionText}>Show QR Code</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share" size={20} color="#FFFFFF" />
                <Text style={styles.actionText}>Share Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Create Your Digital Business Card</Text>
            <Text style={styles.emptyText}>
              Share your contact information instantly with QR codes and direct links
            </Text>
            
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.createButtonText}>Create Business Card</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Create/Edit Business Card Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {businessCard ? 'Edit' : 'Create'} Business Card
            </Text>
            <TouchableOpacity onPress={handleCreateCard} disabled={isSubmitting}>
              <Text style={[styles.saveText, isSubmitting && { opacity: 0.5 }]}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Job Title *</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Sales Manager"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Company *</Text>
              <TextInput
                style={styles.textInput}
                value={company}
                onChangeText={setCompany}
                placeholder="Company name"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Phone *</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Website</Text>
              <TextInput
                style={styles.textInput}
                value={website}
                onChangeText={setWebsite}
                placeholder="https://yourwebsite.com"
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Template</Text>
              <View style={styles.templateContainer}>
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
                    <Text style={[
                      styles.templateName,
                      { color: template.id === 'minimal' ? '#1F2937' : '#FFFFFF' }
                    ]}>
                      {template.name}
                    </Text>
                    {selectedTemplate === template.id && (
                      <Ionicons 
                        name="checkmark-circle" 
                        size={20} 
                        color={template.id === 'minimal' ? '#4F46E5' : '#FFFFFF'} 
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalContent}>
            <View style={styles.qrHeader}>
              <Text style={styles.qrTitle}>Share Your Contact</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {businessCard && (
              <View style={styles.qrContainer}>
                <QRCode
                  value={generateVCardData(businessCard)}
                  size={200}
                  color="#1F2937"
                  backgroundColor="#FFFFFF"
                />
                <Text style={styles.qrInstructions}>
                  Scan this QR code to save contact details
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  cardContainer: {
    alignItems: 'center',
  },
  businessCard: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContent: {
    alignItems: 'center',
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  cardCompany: {
    fontSize: 14,
    marginBottom: 16,
  },
  cardDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 16,
  },
  cardContact: {
    fontSize: 14,
    marginBottom: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
    justifyContent: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 32,
  },
  createButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    marginVertical: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
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
  templateContainer: {
    gap: 12,
  },
  templateOption: {
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedTemplate: {
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  templateName: {
    fontSize: 16,
    fontWeight: '500',
  },
  // QR Modal styles
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 24,
    maxWidth: 320,
    width: '100%',
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrInstructions: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
});
