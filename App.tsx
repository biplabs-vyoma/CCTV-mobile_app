import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet, StatusBar, BackHandler } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SplashScreen } from './src/screens/splash/SplashScreen';
import { useAuth, AuthProvider } from './src/context/AuthContext';
import { performVersionCheck } from './src/services/VersionService';
import { CustomAlert } from './src/components/CustomAlert';
import { AlertProvider } from './src/context/AlertContext';
import { COLORS } from './src/constants/theme';

// 1. Initial Gatekeeper
function AppInner(): React.JSX.Element {
  const { isLoading: isAuthLoading } = useAuth();
  const [isVersionVerified, setIsVersionVerified] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    const initializeApp = async () => {
      const result = await performVersionCheck();

      if (result.success) {
        setIsVersionVerified(true);
      } else {
        setAlertMessage(result.error || `A new version (${result.expectedVersion}) is available. Please update the app to continue.`);
        setShowAlert(true);
      }
    };

    initializeApp();
  }, []);

  const handleExit = () => {
    BackHandler.exitApp();
  };

  // 1. Initial Gatekeeper: Only render basic SplashScreen while checking version or loading user data
  if (!isVersionVerified || isAuthLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#2563eb' }}>
        <SplashScreen />
        <CustomAlert
          visible={showAlert}
          title="Update Required"
          message={alertMessage}
          type="warning"
          confirmText="Exit App"
          onClose={handleExit}
        />
      </View>
    );
  }

  // 2. Main App: Only rendered after version is verified AND user data is loaded
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <AuthProvider>
        <AlertProvider>
          <AppInner />
        </AlertProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
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
