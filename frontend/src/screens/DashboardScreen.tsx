import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Modal,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: any) {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    total_leads: 0,
    this_week_calls: 0,
    this_week_emails: 0,
    leads_by_stage: {},
    recent_activities: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState('Today');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date()
  });

  const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

  const dateFilters = ['Today', 'Yesterday', 'This Week', 'This Month', 'Custom'];

  useEffect(() => {
    if (token) {
      fetchDashboardStats();
    }
  }, [token, selectedDateFilter]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardStats();
    setRefreshing(false);
  }, []);

  const handleTilePress = (tileType: string, value: number) => {
    switch (tileType) {
      case 'leads':
        navigation.navigate('Leads');
        break;
      case 'calls':
        // Navigate to calls log or activity screen
        console.log('Navigate to calls');
        break;
      case 'emails':
        // Navigate to emails log or activity screen  
        console.log('Navigate to emails');
        break;
      case 'cards':
        navigation.navigate('Card');
        break;
    }
  };

  const handleDateFilterPress = (filter: string) => {
    if (filter === 'Custom') {
      setShowDatePicker(true);
    } else {
      setSelectedDateFilter(filter);
    }
  };

  const formatDateRange = () => {
    const today = new Date();
    switch (selectedDateFilter) {
      case 'Today':
        return today.toLocaleDateString();
      case 'Yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toLocaleDateString();
      case 'This Week':
        const startWeek = new Date(today);
        startWeek.setDate(today.getDate() - today.getDay());
        return `${startWeek.toLocaleDateString()} - ${today.toLocaleDateString()}`;
      case 'This Month':
        return today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'Custom':
        return `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`;
      default:
        return today.toLocaleDateString();
    }
  };

  const DashboardTile = ({ 
    title, 
    value, 
    icon, 
    color, 
    onPress,
    trend 
  }: {
    title: string;
    value: number | string;
    icon: string;
    color: string;
    onPress: () => void;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <TouchableOpacity style={[styles.tile, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.tileHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
        <View style={styles.tileContent}>
          <Text style={styles.tileValue}>{value}</Text>
          <Text style={styles.tileTitle}>{title}</Text>
          {trend && (
            <View style={styles.trendContainer}>
              <Ionicons 
                name={trend.isPositive ? 'trending-up' : 'trending-down'} 
                size={12} 
                color={trend.isPositive ? '#10B981' : '#EF4444'} 
              />
              <Text style={[styles.trendText, { 
                color: trend.isPositive ? '#10B981' : '#EF4444' 
              }]}>
                {Math.abs(trend.value)}%
              </Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good morning, {user?.name?.split(' ')[0]}!</Text>
            <Text style={styles.subtitle}>Here's your business overview</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#374151" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Filter Bar */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Showing data for: {formatDateRange()}</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContent}
        >
          {dateFilters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                selectedDateFilter === filter && styles.activeFilterChip
              ]}
              onPress={() => handleDateFilterPress(filter)}
            >
              <Text style={[
                styles.filterChipText,
                selectedDateFilter === filter && styles.activeFilterChipText
              ]}>
                {filter}
              </Text>
              {selectedDateFilter === filter && filter !== 'Custom' && (
                <TouchableOpacity 
                  onPress={() => setSelectedDateFilter('Today')}
                  style={styles.filterRemoveButton}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Dashboard Tiles */}
        <View style={styles.tilesContainer}>
          <DashboardTile
            title="Total Leads"
            value={loading ? '...' : stats.total_leads}
            icon="people"
            color="#4F46E5"
            onPress={() => handleTilePress('leads', stats.total_leads)}
            trend={{ value: 12, isPositive: true }}
          />
          
          <DashboardTile
            title="Calls This Week"
            value={loading ? '...' : stats.this_week_calls}
            icon="call"
            color="#10B981"
            onPress={() => handleTilePress('calls', stats.this_week_calls)}
            trend={{ value: 8, isPositive: true }}
          />
          
          <DashboardTile
            title="Emails Sent"
            value={loading ? '...' : stats.this_week_emails}
            icon="mail"
            color="#F59E0B"
            onPress={() => handleTilePress('emails', stats.this_week_emails)}
            trend={{ value: 5, isPositive: false }}
          />
          
          <DashboardTile
            title="Cards Shared"
            value="0"
            icon="card"
            color="#8B5CF6"
            onPress={() => handleTilePress('cards', 0)}
            trend={{ value: 0, isPositive: true }}
          />
        </View>

        {/* Pipeline Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pipeline Overview</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Leads')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pipelineContainer}>
            {Object.entries(stats.leads_by_stage || {}).map(([stage, count]: [string, any]) => (
              <View key={stage} style={styles.pipelineItem}>
                <View style={styles.pipelineCount}>
                  <Text style={styles.pipelineNumber}>{count}</Text>
                </View>
                <Text style={styles.pipelineStage}>{stage}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {stats.recent_activities && stats.recent_activities.length > 0 ? (
            <View style={styles.activityContainer}>
              {stats.recent_activities.slice(0, 5).map((activity: any, index: number) => (
                <View key={index} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons 
                      name={
                        activity.activity_type === 'call' ? 'call' : 
                        activity.activity_type === 'email' ? 'mail' : 'document-text'
                      } 
                      size={16} 
                      color="#6B7280" 
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>
                      {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)} - {activity.content}
                    </Text>
                    <Text style={styles.activityDate}>
                      {new Date(activity.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No recent activities</Text>
              <Text style={styles.emptySubtext}>Start by adding your first lead</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date Range</Text>
            {/* Add date picker implementation here */}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setSelectedDateFilter('Custom');
                setShowDatePicker(false);
              }}
            >
              <Text style={styles.modalButtonText}>Apply</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: '1%',
    marginBottom: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  activityItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  activityText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  activityDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});
