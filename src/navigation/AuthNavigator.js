import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      <Stack.Screen name="Welcome">
        {(props) => (
          <WelcomeScreen 
            {...props} 
            onGetStarted={() => props.navigation.navigate('Login')} 
          />
        )}
      </Stack.Screen>
    
      <Stack.Screen name="Login">
        {(props) => (
          <LoginScreen 
            {...props}
            onNavigateToRegister={() => props.navigation.navigate('Register')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {(props) => (
          <RegisterScreen 
            {...props}
            onNavigateToLogin={() => props.navigation.navigate('Login')}
            onRegisterSuccess={() => props.navigation.navigate('Login')} 
          />
        )}
      </Stack.Screen>

    </Stack.Navigator>
  );
};

export default AuthNavigator;