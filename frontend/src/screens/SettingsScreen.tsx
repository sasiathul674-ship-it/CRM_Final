import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import Toast from 'react-native-toast-message';

export default function SettingsScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  // Test function to verify button works
  const testButtonPress = () => {
    console.log('🔧 Test button pressed - this should work!');
    Toast.show({
      type: 'success',
      text1: '✅ Button Works!',
      text2: 'The TouchableOpacity is functioning correctly',
      position: 'top',
      visibilityTime: 3000,
    });
  };

  const handleLogout = () => {
    console.log('🚪 Logout button pressed!'); // Debug log
    
    // First show a toast to confirm the button is working
    Toast.show({
      type: 'info',
      text1: '🚪 Logout Button Clicked',
      text2: 'Processing logout request...',
      position: 'top',
      visibilityTime: 2000,
    });
    
    // Show direct Alert confirmation - much clearer UX
    Alert.alert(
      '🚪 Confirm Logout',
      'Are you sure you want to logout from Strike CRM?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            console.log('🚪 Logout cancelled by user');
            Toast.show({
              type: 'info',
              text1: '↩️ Logout Cancelled',
              text2: 'You remain logged in',
              position: 'bottom',
              visibilityTime: 2000,
            });
          }
        },
        {
          text: 'Yes, Logout',
          style: 'destructive',
          onPress: () => {
            console.log('🚪 User confirmed logout - executing logout...');
            console.log('🚪 Logout function available:', typeof logout);
            
            try {
              // Show logout success toast before actually logging out
              Toast.show({
                type: 'success',
                text1: '✅ Logging Out...',
                text2: 'Please wait...',
                position: 'top',
                visibilityTime: 1500,
              });
              
              // Execute logout immediately
              logout();
              console.log('🚪 Logout function called successfully');
            } catch (error) {
              console.error('🚪 Logout error:', error);
              Toast.show({
                type: 'error',
                text1: '❌ Logout Failed',
                text2: 'Please try again',
                position: 'top',
                visibilityTime: 3000,
              });
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              {user?.company && (
                <Text style={styles.profileCompany}>{user.company}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              console.log('Edit Profile pressed!');
              Toast.show({
                type: 'info',
                text1: '👤 Edit Profile',
                text2: 'Profile editing functionality coming soon!',
                position: 'top',
                visibilityTime: 3000,
              });
            }}
          >
            <Ionicons name="person-outline" size={20} color="#6B7280" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              console.log('Business Card pressed!');
              navigation.navigate('Card');
              Toast.show({
                type: 'success',
                text1: '💳 Business Card',
                text2: 'Redirecting to Business Card section...',
                position: 'bottom',
                visibilityTime: 2000,
              });
            }}
          >
            <Ionicons name="card-outline" size={20} color="#6B7280" />
            <Text style={styles.menuText}>Business Card Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              console.log('Export Data pressed!');
              Toast.show({
                type: 'info',
                text1: '📊 Export Data',
                text2: 'CSV export for leads, tasks, and activities will be available soon.',
                position: 'top',
                visibilityTime: 4000,
              });
            }}
          >
            <Ionicons name="download-outline" size={20} color="#6B7280" />
            <Text style={styles.menuText}>Export Data</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </View>
      </View>
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
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: '#F9FAFB',
    marginHorizontal: 24,
    borderRadius: 8,
    padding: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  profileCompany: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  logoutText: {
    color: '#EF4444',
  },
});
