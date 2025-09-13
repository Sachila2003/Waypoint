import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { View, ActivityIndicator } from 'react-native';


import AuthNavigator from './src/navigation/AuthNavigator';
import MainAppNavigator from './src/navigation/MainAppNavigator';

import { LocationProvider } from './src/contexts/LocationContext';
import { configureGoggleSignIn } from './src/config/googleSignInConfig';

const AppContent = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  function onAuthStateChanged(userResult: FirebaseAuthTypes.User | null) {
    setUser(userResult);
    if (initializing) setInitializing(false);
  }
  // useEffect(() => {
  //   GoogleSignin.configure({
  //     webClientId: '233655277425-9fkkq7o117r52pbs3sie5s3podovvroe.apps.googleusercontent.com',
  //   });
  // }, []);

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
  useEffect(() => {
    console.log("Configuring Google Sign-In...");
    configureGoggleSignIn(); 
  }, []);

  return (
    <LocationProvider>
      <AppContent />
    </LocationProvider>
  );
};

export default App;