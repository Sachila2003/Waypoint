// App.tsx

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'; // <-- IMPORT FirebaseAuthTypes HERE
import { View, ActivityIndicator } from 'react-native';

// Navigators
import AuthNavigator from './src/navigation/AuthNavigator';
import MainAppNavigator from './src/navigation/MainAppNavigator';

// Google Sign-In Config - We will fix this file next
// import { configureGoogleSignIn } from './src/config/googleSignInConfig'; 
// configureGoogleSignIn(); 

const App = () => {
  // We need to type the user state as well
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  // vvv THIS IS THE FIX vvv
  function onAuthStateChanged(userResult: FirebaseAuthTypes.User | null) {
    setUser(userResult);
    if (initializing) {
      setInitializing(false);
    }
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; 
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6A0DAD" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainAppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default App;