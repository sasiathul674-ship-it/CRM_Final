import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AuthProvider } from '../src/contexts/AuthContext';
import AuthNavigator from '../src/navigation/AuthNavigator';
import AppNavigator from '../src/navigation/AppNavigator';
import LoadingScreen from '../src/components/LoadingScreen';

export default function Index() {
  return (
    <AuthProvider>
      <View style={styles.container}>
        <AuthNavigator />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
