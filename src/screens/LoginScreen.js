import React, { useState } from 'react';
import {
  View,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

const LoginScreen = ({ onLoginSuccess = () => { }, onNavigateToRegister = () => { } }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isEmailLoginLoading, setIsEmailLoginLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    setIsEmailLoginLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email.trim(), password);
      console.log('User signed in successfully!');
      // Call the onLoginSuccess prop passed from AuthNavigator
      onLoginSuccess();
    } catch (error) {
      let errorMessage = 'An unknown error occurred. Please try again.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        errorMessage = 'No user found with this email. Please check your email or register.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      }
      console.error("Login Error:", error);
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsEmailLoginLoading(false);
    }
  };

  const onGoogleButtonPress = async () => {
    setIsGoogleLoading(true);
    try {
      //check if play services is available
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true});
        //get the users id token
        const {idToken} = await GoogleSignin.signIn();

        const googleCredential = auth.GoogleAuthProvider.credential(idToken);
        await auth().signInWithCredential(googleCredential);
        console.log('Signed in with Google!');
    } catch (error) {
        console.error("Google Sign In Error", error);
        Alert.alert('Google Sign-In Failed', 'Something went wrong. Please try again.');
    } finally {
        setIsGoogleLoading(false);
    }
  };
  const handleDummyApplePress = () => { /* ... */ };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContentContainer} 
          keyboardShouldPersistTaps="handled" 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Icon name="map-marker-radius" size={40} color="#6A0DAD" />
              <Text style={styles.appName}>Waypoint</Text>
            </View>
          </View>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Icon name="email-outline" size={20} color="#6A0DAD" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#A0A0A0"
                  selectionColor={'#6A0DAD'}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock-outline" size={20} color="#6A0DAD" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                  placeholderTextColor="#A0A0A0"
                  selectionColor={'#6A0DAD'}
                />
                <TouchableOpacity
                  style={styles.eyeIconContainer}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <Icon
                    name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#707070"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => Alert.alert('Forgot Password?', 'This feature is coming soon!')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.signInButton, isEmailLoginLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isEmailLoginLoading}
            >
              {isEmailLoginLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton, isGoogleLoading && styles.buttonDisabled]}
              onPress={onGoogleButtonPress} 
              disabled={isGoogleLoading}
            >
              <Icon name="google" size={20} color="#DB4437" style={styles.socialIcon} />
              {isGoogleLoading ? (
                <ActivityIndicator size="small" color="#DB4437" />
              ) : (
                <Text style={[styles.socialButtonText, styles.googleButtonText]}>Google</Text>
              )}
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.socialButton, styles.appleButton, isAppleLoading && styles.buttonDisabled]}
                onPress={handleDummyApplePress}
                disabled={isAppleLoading}
              >
                <Icon name="apple" size={22} color="#FFFFFF" style={styles.socialIcon} />
                {isAppleLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.socialButtonText, styles.appleButtonText]}>Apple</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onNavigateToRegister}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  container: { 
    flex: 1 
  },
  scrollContentContainer: { 
    flexGrow: 1, 
    paddingHorizontal: 24, 
    paddingVertical: 16 
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: Platform.OS === 'ios' ? 10 : 20
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 10
  },
  appName: {
    color: '#6A0DAD',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8
  },
  headerContainer: {
    marginBottom: 30
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center'
  },
  formContainer: {
    marginBottom: 20
  },
  inputGroup: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    height: 56,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2
  },
  inputIcon: {
    paddingHorizontal: 16
  },
  input: {
    flex: 1,
    paddingRight: 15,
    fontSize: 16,
    color: '#1A202C'
  },
  eyeIconContainer: {
    paddingHorizontal: 16,
    justifyContent: 'center'
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 20
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#6A0DAD',
    fontWeight: '500'
  },
  signInButton: {
    backgroundColor: '#6A0DAD',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginTop: 8,
    shadowColor: "#6A0DAD",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8
  },
  buttonDisabled: {
    opacity: 0.7
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0'
  },
  dividerText: {
    fontSize: 14,
    color: '#718096',
    paddingHorizontal: 10,
    fontWeight: '500'
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 12
  },
  socialButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.00,
    elevation: 1
  },
  googleButton: {},
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000'
  },
  socialIcon: {
    marginRight: 8
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '500'
  },
  googleButtonText: {
    color: '#2D3748'
  },
  appleButtonText: {
    color: '#FFFFFF'
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20
  },
  signUpText: {
    fontSize: 15,
    color: '#718096'
  },
  signUpLink: {
    fontWeight: 'bold',
    color: '#6A0DAD'
  }
});
export default LoginScreen;