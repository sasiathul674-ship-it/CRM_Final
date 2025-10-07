import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, CalendarProps } from 'react-native-calendars';
import * as Haptics from 'expo-haptics';

interface DatePickerComponentProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  selectedDate?: string;
  mode?: 'single' | 'range';
  title?: string;
  minDate?: string;
  maxDate?: string;
}

const { width, height } = Dimensions.get('window');

export default function DatePickerComponent({
  visible,
  onClose,
  onSelectDate,
  selectedDate,
  mode = 'single',
  title = 'Select Date',
  minDate,
  maxDate
}: DatePickerComponentProps) {
  const [currentSelectedDate, setCurrentSelectedDate] = useState<string>(selectedDate || '');
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');

  const handleDayPress = (day: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (mode === 'single') {
      setCurrentSelectedDate(day.dateString);
    } else if (mode === 'range') {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        // Start new range
        setRangeStart(day.dateString);
        setRangeEnd('');
      } else if (rangeStart && !rangeEnd) {
        // Complete the range
        if (new Date(day.dateString) >= new Date(rangeStart)) {
          setRangeEnd(day.dateString);
        } else {
          // If selected date is before start, make it the new start
          setRangeStart(day.dateString);
          setRangeEnd('');
        }
      }
    }
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (mode === 'single') {
      onSelectDate(currentSelectedDate);
    } else if (mode === 'range') {
      if (rangeStart && rangeEnd) {
        onSelectDate(`${rangeStart}_${rangeEnd}`);
      } else if (rangeStart) {
        onSelectDate(`${rangeStart}_${rangeStart}`);
      }
    }
    onClose();
  };

  const handleCancel = () => {
    // Reset selections
    setCurrentSelectedDate(selectedDate || '');
    setRangeStart('');
    setRangeEnd('');
    onClose();
  };

  const getMarkedDates = () => {
    const marked: any = {};

    if (mode === 'single' && currentSelectedDate) {
      marked[currentSelectedDate] = {
        selected: true,
        selectedColor: '#4F46E5',
        selectedTextColor: '#FFFFFF'
      };
    } else if (mode === 'range') {
      if (rangeStart) {
        marked[rangeStart] = {
          startingDay: true,
          color: '#4F46E5',
          textColor: '#FFFFFF'
        };
      }
      if (rangeEnd) {
        marked[rangeEnd] = {
          endingDay: true,
          color: '#4F46E5',
          textColor: '#FFFFFF'
        };
      }
      if (rangeStart && rangeEnd) {
        // Mark all dates in between
        const start = new Date(rangeStart);
        const end = new Date(rangeEnd);
        const current = new Date(start);
        current.setDate(current.getDate() + 1);
        
        while (current < end) {
          const dateString = current.toISOString().split('T')[0];
          marked[dateString] = {
            color: '#EEF2FF',
            textColor: '#4F46E5'
          };
          current.setDate(current.getDate() + 1);
        }
      }
    }

    return marked;
  };

  const formatSelectedRange = () => {
    if (mode === 'single') {
      return currentSelectedDate ? new Date(currentSelectedDate).toLocaleDateString() : 'No date selected';
    } else if (mode === 'range') {
      if (rangeStart && rangeEnd) {
        return `${new Date(rangeStart).toLocaleDateString()} - ${new Date(rangeEnd).toLocaleDateString()}`;
      } else if (rangeStart) {
        return `${new Date(rangeStart).toLocaleDateString()} - Select end date`;
      } else {
        return 'No range selected';
      }
    }
  };

  const canConfirm = () => {
    if (mode === 'single') {
      return !!currentSelectedDate;
    } else if (mode === 'range') {
      return !!rangeStart; // Allow single date ranges
    }
    return false;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              {mode === 'range' ? 'Select date range' : 'Select a date'}
            </Text>
          </View>
          
          <TouchableOpacity 
            onPress={handleConfirm} 
            style={[styles.headerButton, !canConfirm() && styles.disabledButton]}
            disabled={!canConfirm()}
          >
            <Text style={[styles.confirmText, !canConfirm() && styles.disabledText]}>
              Confirm
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selected Date Display */}
        <View style={styles.selectedDateContainer}>
          <View style={styles.selectedDateCard}>
            <Ionicons name="calendar-outline" size={20} color="#4F46E5" />
            <Text style={styles.selectedDateText}>
              {formatSelectedRange()}
            </Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={getMarkedDates()}
            markingType={mode === 'range' ? 'period' : 'simple'}
            minDate={minDate}
            maxDate={maxDate}
            theme={{
              backgroundColor: '#FFFFFF',
              calendarBackground: '#FFFFFF',
              textSectionTitleColor: '#6B7280',
              selectedDayBackgroundColor: '#4F46E5',
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: '#4F46E5',
              dayTextColor: '#374151',
              textDisabledColor: '#D1D5DB',
              dotColor: '#4F46E5',
              selectedDotColor: '#FFFFFF',
              arrowColor: '#4F46E5',
              disabledArrowColor: '#D1D5DB',
              monthTextColor: '#1F2937',
              indicatorColor: '#4F46E5',
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayHeaderFontFamily: 'System',
              textDayFontWeight: '400',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            style={styles.calendar}
          />
        </View>

        {/* Quick Select Options */}
        <View style={styles.quickSelectContainer}>
          <Text style={styles.quickSelectTitle}>Quick Select:</Text>
          <View style={styles.quickSelectRow}>
            <TouchableOpacity 
              style={styles.quickSelectButton}
              onPress={() => {
                const today = new Date().toISOString().split('T')[0];
                if (mode === 'single') {
                  setCurrentSelectedDate(today);
                } else {
                  setRangeStart(today);
                  setRangeEnd(today);
                }
              }}
            >
              <Text style={styles.quickSelectText}>Today</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickSelectButton}
              onPress={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];
                if (mode === 'single') {
                  setCurrentSelectedDate(tomorrowStr);
                } else {
                  setRangeStart(tomorrowStr);
                  setRangeEnd(tomorrowStr);
                }
              }}
            >
              <Text style={styles.quickSelectText}>Tomorrow</Text>
            </TouchableOpacity>
            
            {mode === 'range' && (
              <>
                <TouchableOpacity 
                  style={styles.quickSelectButton}
                  onPress={() => {
                    const today = new Date();
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    setRangeStart(weekAgo.toISOString().split('T')[0]);
                    setRangeEnd(today.toISOString().split('T')[0]);
                  }}
                >
                  <Text style={styles.quickSelectText}>Last 7 Days</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.quickSelectButton}
                  onPress={() => {
                    const today = new Date();
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    setRangeStart(monthStart.toISOString().split('T')[0]);
                    setRangeEnd(today.toISOString().split('T')[0]);
                  }}
                >
                  <Text style={styles.quickSelectText}>This Month</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerButton: {
    minWidth: 60,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  selectedDateContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  selectedDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedDateText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  calendarContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  calendar: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickSelectContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  quickSelectTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  quickSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickSelectButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  quickSelectText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
});