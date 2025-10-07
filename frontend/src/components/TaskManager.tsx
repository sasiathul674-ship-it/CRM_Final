import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Task } from '../services/api';
import DatePickerComponent from './DatePickerComponent';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

interface TaskManagerProps {
  leadId?: string;
  showOnlyPending?: boolean;
  maxItems?: number;
  showCreateButton?: boolean;
  onTaskUpdate?: () => void;
}

const TASK_TYPES = [
  { id: 'call', name: 'Call', icon: 'call', color: '#10B981' },
  { id: 'email', name: 'Email', icon: 'mail', color: '#3B82F6' },
  { id: 'meeting', name: 'Meeting', icon: 'people', color: '#8B5CF6' },
  { id: 'follow_up', name: 'Follow Up', icon: 'time', color: '#F59E0B' },
  { id: 'note', name: 'Note', icon: 'document-text', color: '#6B7280' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: '#EF4444' },
];

const PRIORITIES = [
  { id: 'low', name: 'Low', color: '#10B981' },
  { id: 'medium', name: 'Medium', color: '#F59E0B' },
  { id: 'high', name: 'High', color: '#EF4444' },
];

export default function TaskManager({ 
  leadId, 
  showOnlyPending = false, 
  maxItems, 
  showCreateButton = true,
  onTaskUpdate 
}: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state for new task
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    task_type: 'call',
    priority: 'medium',
    due_date: ''
  });

  const { token } = useAuth();

  useEffect(() => {
    fetchTasks();
  }, [leadId, showOnlyPending]);

  const fetchTasks = async () => {
    if (!token) {
      console.log('🔑 TaskManager: No token available');
      return;
    }
    
    try {
      console.log('📋 TaskManager: Fetching tasks...', { leadId, showOnlyPending });
      
      let tasksData: Task[];
      if (leadId) {
        console.log('📋 TaskManager: Fetching tasks for lead:', leadId);
        tasksData = await apiService.getLeadTasks(token, leadId);
      } else {
        const status = showOnlyPending ? 'pending' : undefined;
        console.log('📋 TaskManager: Fetching all tasks with status:', status);
        tasksData = await apiService.getAllTasks(token, status);
      }
      
      console.log('📋 TaskManager: Raw tasks data:', tasksData);
      
      // Filter and sort tasks
      let filteredTasks = tasksData || [];
      if (showOnlyPending) {
        filteredTasks = filteredTasks.filter(task => task.status === 'pending');
      }
      
      console.log('📋 TaskManager: Filtered tasks:', filteredTasks);
      
      // Sort by priority and due date
      filteredTasks.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }
        
        // Then by due date
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      if (maxItems) {
        filteredTasks = filteredTasks.slice(0, maxItems);
      }
      
      console.log('📋 TaskManager: Final tasks to display:', filteredTasks);
      setTasks(filteredTasks);
    } catch (error) {
      console.error('📋 TaskManager Error:', error);
      Toast.show({
        type: 'error',
        text1: '❌ Failed to load tasks',
        text2: 'Please check your connection',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!token || !taskForm.title.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a task title',
        visibilityTime: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const taskData: Partial<Task> = {
        ...taskForm,
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || undefined,
        lead_id: leadId,
        status: 'pending',
        due_date: taskForm.due_date || undefined,
      };

      await apiService.createTask(token, taskData);
      await fetchTasks();
      setShowCreateModal(false);
      setTaskForm({
        title: '',
        description: '',
        task_type: 'call',
        priority: 'medium',
        due_date: ''
      });
      
      Toast.show({
        type: 'success',
        text1: '✅ Task Created!',
        text2: `${taskData.title} has been added to your tasks.`,
        visibilityTime: 3000,
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onTaskUpdate?.();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to create task',
        visibilityTime: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: 'completed' | 'cancelled') => {
    if (!token) return;

    try {
      await apiService.updateTaskStatus(token, taskId, status);
      await fetchTasks();
      
      Haptics.notificationAsync(
        status === 'completed' 
          ? Haptics.NotificationFeedbackType.Success 
          : Haptics.NotificationFeedbackType.Warning
      );
      
      // Show toast notification
      Toast.show({
        type: status === 'completed' ? 'success' : 'info',
        text1: status === 'completed' ? '✅ Task Completed!' : '❌ Task Cancelled',
        text2: status === 'completed' ? 'Great job! Task marked as done.' : 'Task has been cancelled.',
        position: 'bottom',
        visibilityTime: 3000,
      });
      
      onTaskUpdate?.();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: '❌ Error',
        text2: error.message || 'Failed to update task',
        position: 'bottom',
      });
    }
  };

  const getTaskTypeIcon = (type: string) => {
    const taskType = TASK_TYPES.find(t => t.id === type);
    return taskType ? taskType.icon : 'document-text';
  };

  const getTaskTypeColor = (type: string) => {
    const taskType = TASK_TYPES.find(t => t.id === type);
    return taskType ? taskType.color : '#6B7280';
  };

  const getPriorityColor = (priority: string) => {
    const p = PRIORITIES.find(p => p.id === priority);
    return p ? p.color : '#6B7280';
  };

  const isOverdue = (task: Task) => {
    if (!task.due_date) return false;
    return new Date(task.due_date) < new Date() && task.status === 'pending';
  };

  const renderTaskItem = (task: Task) => {
    const isTaskOverdue = isOverdue(task);
    
    return (
      <View key={task.id} style={[
        styles.taskItem, 
        isTaskOverdue && styles.overdueTask,
        task.status === 'completed' && styles.completedTask
      ]}>
        <View style={styles.taskHeader}>
          <View style={styles.taskIconContainer}>
            <View style={[
              styles.taskIcon, 
              { backgroundColor: getTaskTypeColor(task.task_type) + '20' }
            ]}>
              <Ionicons 
                name={getTaskTypeIcon(task.task_type) as any} 
                size={16} 
                color={getTaskTypeColor(task.task_type)} 
              />
            </View>
            <View style={[
              styles.priorityDot,
              { backgroundColor: getPriorityColor(task.priority) }
            ]} />
          </View>
          
          <View style={styles.taskContent}>
            <Text style={[
              styles.taskTitle,
              task.status === 'completed' && styles.completedText
            ]}>
              {task.title}
            </Text>
            
            {task.description && (
              <Text style={[
                styles.taskDescription,
                task.status === 'completed' && styles.completedText
              ]}>
                {task.description}
              </Text>
            )}
            
            <View style={styles.taskMeta}>
              {task.due_date && (
                <Text style={[
                  styles.dueDate,
                  isTaskOverdue && styles.overdueText
                ]}>
                  Due {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                </Text>
              )}
              
              <Text style={styles.taskAge}>
                Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
              </Text>
            </View>
          </View>
          
          {task.status === 'pending' && (
            <View style={styles.taskActions}>
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => handleUpdateTaskStatus(task.id, 'completed')}
              >
                <Ionicons name="checkmark" size={16} color="#10B981" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleUpdateTaskStatus(task.id, 'cancelled')}
              >
                <Ionicons name="close" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
          
          {task.status === 'completed' && (
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            </View>
          )}
          
          {task.status === 'cancelled' && (
            <View style={styles.statusBadge}>
              <Ionicons name="close-circle" size={16} color="#EF4444" />
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCreateModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Task</Text>
          <TouchableOpacity 
            onPress={handleCreateTask} 
            disabled={!taskForm.title.trim() || isSubmitting}
          >
            <Text style={[
              styles.modalSave,
              (!taskForm.title.trim() || isSubmitting) && styles.modalSaveDisabled
            ]}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Task Title *</Text>
            <TextInput
              style={styles.formInput}
              value={taskForm.title}
              onChangeText={(text) => setTaskForm({...taskForm, title: text})}
              placeholder="Enter task title..."
              autoFocus
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.multilineInput]}
              value={taskForm.description}
              onChangeText={(text) => setTaskForm({...taskForm, description: text})}
              placeholder="Add task details..."
              multiline
              numberOfLines={3}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Task Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {TASK_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeOption,
                    { borderColor: type.color },
                    taskForm.task_type === type.id && { backgroundColor: type.color }
                  ]}
                  onPress={() => setTaskForm({...taskForm, task_type: type.id})}
                >
                  <Ionicons 
                    name={type.icon as any} 
                    size={16} 
                    color={taskForm.task_type === type.id ? '#FFFFFF' : type.color} 
                  />
                  <Text style={[
                    styles.typeOptionText,
                    { color: taskForm.task_type === type.id ? '#FFFFFF' : type.color }
                  ]}>
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((priority) => (
                <TouchableOpacity
                  key={priority.id}
                  style={[
                    styles.priorityOption,
                    { borderColor: priority.color },
                    taskForm.priority === priority.id && { backgroundColor: priority.color }
                  ]}
                  onPress={() => setTaskForm({...taskForm, priority: priority.id})}
                >
                  <Text style={[
                    styles.priorityOptionText,
                    { color: taskForm.priority === priority.id ? '#FFFFFF' : priority.color }
                  ]}>
                    {priority.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Due Date (Optional)</Text>
            <TouchableOpacity 
              style={[styles.formInput, styles.dateInputButton]}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.dateInputContainer}>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <Text style={[styles.dateInputText, taskForm.due_date && styles.dateSelectedText]}>
                  {taskForm.due_date ? new Date(taskForm.due_date).toLocaleDateString() : 'Select due date'}
                </Text>
              </View>
              {taskForm.due_date && (
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    setTaskForm({...taskForm, due_date: ''});
                  }}
                  style={styles.clearDateButton}
                >
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showCreateButton && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {leadId ? 'Lead Tasks' : 'Tasks'} 
            {tasks.length > 0 && (
              <Text style={styles.taskCount}> ({tasks.length})</Text>
            )}
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color="#4F46E5" />
            <Text style={styles.addButtonText}>Add Task</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-done" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>
            {showOnlyPending ? 'No pending tasks' : 'No tasks yet'}
          </Text>
          {showCreateButton && (
            <TouchableOpacity 
              style={styles.createFirstButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.createFirstText}>Create First Task</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {tasks.map(renderTaskItem)}
        </ScrollView>
      )}
      
      {renderCreateModal()}
      
      {/* Date Picker for Due Date */}
      <DatePickerComponent
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelectDate={(date) => {
          setTaskForm({...taskForm, due_date: date});
        }}
        mode="single"
        title="Select Due Date"
        minDate={new Date().toISOString().split('T')[0]} // Can't select past dates
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  taskCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  taskItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  overdueTask: {
    borderColor: '#FEF2F2',
    backgroundColor: '#FFFBFA',
  },
  completedTask: {
    opacity: 0.7,
    borderColor: '#F0FDF4',
    backgroundColor: '#F9FDF9',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskIconContainer: {
    marginRight: 12,
    alignItems: 'center',
  },
  taskIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 20,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dueDate: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
    marginRight: 12,
  },
  overdueText: {
    color: '#EF4444',
    fontWeight: '700',
  },
  taskAge: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    marginRight: 8,
  },
  cancelButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  statusBadge: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
    marginBottom: 16,
  },
  createFirstButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  createFirstText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
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
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  typeOptionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  priorityRow: {
    flexDirection: 'row',
  },
  priorityOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateInputText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  dateSelectedText: {
    color: '#374151',
  },
  clearDateButton: {
    padding: 4,
  },
});