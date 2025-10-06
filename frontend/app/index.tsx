import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import AuthNavigator from '../src/navigation/AuthNavigator';
import AppNavigator from '../src/navigation/AppNavigator';
import LoadingScreen from '../src/components/LoadingScreen';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}

export default function Index() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <View style={styles.container}>
          <AppContent />
        </View>
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
