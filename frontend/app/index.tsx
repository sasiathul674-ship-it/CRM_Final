import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AuthProvider } from '../src/contexts/AuthContext';
import AuthNavigator from '../src/navigation/AuthNavigator';
import AppNavigator from '../src/navigation/AppNavigator';
import LoadingScreen from '../src/components/LoadingScreen';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <AuthProvider>
      <View style={styles.container}>
        {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
