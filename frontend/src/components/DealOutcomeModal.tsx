import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

interface DealOutcomeModalProps {
  visible: boolean;
  leadName: string;
  leadId: string;
  orderValue?: number;
  currency?: string;
  onClose: () => void;
  onConfirm: (dealStatus: 'won' | 'lost', notes?: string) => void;
}

export default function DealOutcomeModal({
  visible,
  leadName,
  leadId,
  orderValue,
  currency = 'INR',
  onClose,
  onConfirm
}: DealOutcomeModalProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<'won' | 'lost' | null>(null);
  const [notes, setNotes] = useState('');

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'GBP': return '£';
      case 'EUR': return '€';
      default: return '₹';
    }
  };

  const handleOutcomeSelect = (outcome: 'won' | 'lost') => {
    setSelectedOutcome(outcome);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleConfirm = () => {
    if (!selectedOutcome) {
      Toast.show({
        type: 'error',
        text1: '⚠️ Selection Required',
        text2: 'Please select Won or Lost for this deal',
        position: 'top',
      });
      return;
    }

    onConfirm(selectedOutcome, notes.trim() || undefined);
    
    // Reset state
    setSelectedOutcome(null);
    setNotes('');
    onClose();

    // Show success feedback
    const outcomeText = selectedOutcome === 'won' ? 'Won! 🎉' : 'Lost 😔';
    Toast.show({
      type: selectedOutcome === 'won' ? 'success' : 'info',
      text1: `✅ Deal Marked as ${outcomeText}`,
      text2: `${leadName} has been moved to Closed - ${selectedOutcome}`,
      position: 'top',
      visibilityTime: 4000,
    });

    if (selectedOutcome === 'won') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleCancel = () => {
    setSelectedOutcome(null);
    setNotes('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="flag-outline" size={24} color="#4F46E5" />
            </View>
            <Text style={styles.modalTitle}>Close Deal</Text>
            <Text style={styles.modalSubtitle}>Mark the outcome for {leadName}</Text>
          </View>

          {/* Deal Value Display */}
          {orderValue && (
            <View style={styles.dealValueContainer}>
              <Ionicons name="cash-outline" size={20} color="#059669" />
              <Text style={styles.dealValueText}>
                Deal Value: {getCurrencySymbol(currency)}{orderValue.toLocaleString()}
              </Text>
            </View>
          )}

          {/* Outcome Selection */}
          <View style={styles.outcomeContainer}>
            <Text style={styles.sectionTitle}>Deal Outcome</Text>
            
            <TouchableOpacity
              style={[
                styles.outcomeButton,
                styles.wonButton,
                selectedOutcome === 'won' && styles.selectedOutcome
              ]}
              onPress={() => handleOutcomeSelect('won')}
            >
              <View style={styles.outcomeContent}>
                <View style={styles.outcomeIcon}>
                  <Ionicons 
                    name="trophy" 
                    size={24} 
                    color={selectedOutcome === 'won' ? '#FFFFFF' : '#059669'} 
                  />
                </View>
                <View style={styles.outcomeTextContainer}>
                  <Text style={[
                    styles.outcomeTitle,
                    selectedOutcome === 'won' && styles.selectedOutcomeText
                  ]}>
                    Won! 🎉
                  </Text>
                  <Text style={[
                    styles.outcomeDescription,
                    selectedOutcome === 'won' && styles.selectedOutcomeDescription
                  ]}>
                    Deal closed successfully
                  </Text>
                </View>
                {selectedOutcome === 'won' && (
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.outcomeButton,
                styles.lostButton,
                selectedOutcome === 'lost' && styles.selectedOutcome
              ]}
              onPress={() => handleOutcomeSelect('lost')}
            >
              <View style={styles.outcomeContent}>
                <View style={styles.outcomeIcon}>
                  <Ionicons 
                    name="close-circle" 
                    size={24} 
                    color={selectedOutcome === 'lost' ? '#FFFFFF' : '#EF4444'} 
                  />
                </View>
                <View style={styles.outcomeTextContainer}>
                  <Text style={[
                    styles.outcomeTitle,
                    selectedOutcome === 'lost' && styles.selectedOutcomeText
                  ]}>
                    Lost 😔
                  </Text>
                  <Text style={[
                    styles.outcomeDescription,
                    selectedOutcome === 'lost' && styles.selectedOutcomeDescription
                  ]}>
                    Deal didn't close
                  </Text>
                </View>
                {selectedOutcome === 'lost' && (
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Notes Section */}
          <View style={styles.notesContainer}>
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any notes about this deal outcome..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.confirmButton,
                !selectedOutcome && styles.disabledButton
              ]} 
              onPress={handleConfirm}
              disabled={!selectedOutcome}
            >
              <Text style={[
                styles.confirmButtonText,
                !selectedOutcome && styles.disabledButtonText
              ]}>
                Close Deal
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  dealValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 24,
  },
  dealValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 8,
  },
  outcomeContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  outcomeButton: {
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    padding: 16,
  },
  wonButton: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  lostButton: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  selectedOutcome: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  outcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  outcomeIcon: {
    marginRight: 12,
  },
  outcomeTextContainer: {
    flex: 1,
  },
  outcomeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  outcomeDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectedOutcomeText: {
    color: '#FFFFFF',
  },
  selectedOutcomeDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  notesContainer: {
    marginBottom: 24,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
});