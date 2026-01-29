import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import { useVersionCheck } from './src/hooks/useVersionCheck';
import { CustomAlert } from './src/components/CustomAlert';
import { COLORS } from './src/constants/theme';

function AppContent(): React.JSX.Element {
  const { isChecking, showAlert, alertMessage, handleExit } = useVersionCheck();

  // Show loading screen while checking version
  
  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS?.primary || '#2563eb'} />
      </View>
    );
  }

  return (
    <>
      <AuthProvider>
        <AlertProvider>
          <SafeAreaProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </AlertProvider>
      </AuthProvider>

      {/* Version Mismatch Alert */}
      <CustomAlert
        visible={showAlert}
        title="Update Required"
        message={alertMessage}
        type="warning"
        confirmText="Exit"
        onClose={handleExit}
        onConfirm={undefined} // No cancel button, only Exit
      />
    </>
  );
}

function App(): React.JSX.Element {
  return <AppContent />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS?.background || '#fff',
  },
});

export default App;
