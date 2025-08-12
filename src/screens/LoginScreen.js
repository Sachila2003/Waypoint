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

// vvv THIS IS THE IMPORTANT FIX FOR THE ERROR vvv
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
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>LOGO</Text>
            </View>
          </View>
          <Text
            style={styles.title}
          >Getting Started
          </Text>
          <Text
            style={styles.subtitle}
          >Welcome back, glad to see you again
          </Text>
          <Text
            style={styles.inputLabel}
          >E-mail
          </Text>
          <View
            style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#A0A0A0"
              selectionColor={'#6A0DAD'}
            />
          </View>
          <Text
            style={styles.inputLabel}
          >
            Password
          </Text>
          <View
            style={styles.inputWrapper}
          >
            <TextInput
              style={styles.input}
              placeholder="Enter Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
              placeholderTextColor="#A0A0A0"
              selectionColor={'#6A0DAD'}
            />
            <TouchableOpacity
              style={styles.eyeIconContainer}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
              <Icon
                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#707070"
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={() => Alert.alert('Forgot Password?', 'This feature is coming soon!')}>
            <Text
              style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={handleLogin}
            disabled={isEmailLoginLoading}>
            {isEmailLoginLoading ?
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              /> : <Text
                style={styles.signInButtonText}>Sign in
              </Text>}
          </TouchableOpacity>
          <Text
            style={styles.orContinueText}>or continue with
          </Text>
          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton]}
            onPress={onGoogleButtonPress} disabled={isGoogleLoading}>
            <Icon
              name="google"
              size={20} color="#DB4437"
              style={styles.socialIcon}
            />{isGoogleLoading ? <ActivityIndicator
              size="small"
              color="#DB4437"
            /> : <Text
              style={styles.socialButtonText}>
              Sign in with Google</Text>}
          </TouchableOpacity>
          {Platform.OS === 'ios' && (<TouchableOpacity
            style={[styles.socialButton, styles.appleButton]}
            onPress={handleDummyApplePress}
            disabled={isAppleLoading}>
            <Icon
              name="apple"
              size={22}
              color="#000000"
              style={styles.socialIcon}
            />{isAppleLoading ? <ActivityIndicator
              size="small"
              color="#000000" /> : <Text
                style={[styles.socialButtonText,
                { color: '#FFFFFF' }]}>Sign in with Apple</Text>}
          </TouchableOpacity>)}
          <TouchableOpacity
            style={styles.signUpContainer} onPress={onNavigateToRegister}>
            <Text style={styles.signUpText}>Don't have an account? <Text style={styles.signUpLink}>Sign Up here</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#F4F6FC' }, container: { flex: 1 }, scrollContentContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 20 }, logoContainer: { alignItems: 'center', marginBottom: 25, marginTop: Platform.OS === 'ios' ? 10 : 30 }, logo: { width: 100, height: 100, borderRadius: 10, backgroundColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center' }, logoText: { color: '#6A0DAD', fontSize: 16, fontWeight: 'bold' }, title: { fontSize: 28, fontWeight: 'bold', color: '#1A202C', textAlign: 'center', marginBottom: 10 }, subtitle: { fontSize: 16, color: '#4A5568', textAlign: 'center', marginBottom: 35 }, inputLabel: { fontSize: 14, color: '#4A5568', marginBottom: 8, alignSelf: 'flex-start', fontWeight: '500' }, inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E0', width: '100%', marginBottom: 20, height: 52, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.10, shadowRadius: 1.41, elevation: 2 }, input: { flex: 1, paddingHorizontal: 15, fontSize: 16, color: '#1A202C' }, eyeIconContainer: { paddingHorizontal: 15, height: '100%', justifyContent: 'center' }, forgotPasswordButton: { alignSelf: 'flex-end', marginBottom: 25 }, forgotPasswordText: { fontSize: 14, color: '#6A0DAD', fontWeight: '500' }, signInButton: { backgroundColor: '#6A0DAD', width: '100%', paddingVertical: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', minHeight: 52, marginBottom: 20, shadowColor: "#6A0DAD", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 4.65, elevation: 8 }, signInButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' }, orContinueText: { fontSize: 13, color: '#A0AEC0', textAlign: 'center', marginBottom: 20, fontWeight: '500' }, socialButton: { flexDirection: 'row', backgroundColor: '#FFFFFF', width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', minHeight: 52, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 1.00, elevation: 1 }, googleButton: {}, appleButton: { backgroundColor: '#000000', borderColor: '#000000' }, socialIcon: { marginRight: 10 }, socialButtonText: { fontSize: 15, fontWeight: '500', color: '#2D3748' }, signUpContainer: { marginTop: 25, alignItems: 'center' }, signUpText: { fontSize: 14, color: '#4A5568' }, signUpLink: { color: '#6A0DAD', fontWeight: 'bold' } });

export default LoginScreen;