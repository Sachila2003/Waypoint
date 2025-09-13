import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { View, ActivityIndicator } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import AuthNavigator from './src/navigation/AuthNavigator';
import MainAppNavigator from './src/navigation/MainAppNavigator';

import { LocationProvider } from './src/contexts/LocationContext';

const AppContent = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  function onAuthStateChanged(userResult: FirebaseAuthTypes.User | null) {
    setUser(userResult);
    if (initializing) setInitializing(false);
  }
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '266909651460-2i8ukrs6kgo8d3qmd482fbbjoee7a9ae.apps.googleusercontent.com',
    });
  }, []);

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
    <LocationProvider>
      <AppContent />
    </LocationProvider>
  );
};

export default App;