// App.tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { View, ActivityIndicator } from 'react-native';

// Import Navigators
import AuthNavigator from './src/navigation/AuthNavigator';
import MainAppNavigator from './src/navigation/MainAppNavigator';

// Import our new Context Provider
import { LocationProvider } from './src/contexts/LocationContext';

const AppContent = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  function onAuthStateChanged(userResult: FirebaseAuthTypes.User | null) {
    setUser(userResult);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber;
  }, []);

  if (initializing) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  return (
    <NavigationContainer>
      {user ? <MainAppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const App = () => {
  return (
    // vvv THIS IS THE FIX vvv
    // LocationProvider should wrap the entire app content that needs location data.
    <LocationProvider>
      <AppContent />
    </LocationProvider>
  );
};

export default App;