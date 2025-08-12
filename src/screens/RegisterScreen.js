import React, { useState } from 'react';
import { View, SafeAreaView, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

const RegisterScreen = ({ onRegisterSuccess = () => {}, onNavigateToLogin = () => {} }) => {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [isRegisterLoading, setIsRegisterLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isAppleLoading, setIsAppleLoading] = useState(false);

    const handleRegister = async () => {
        if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long.');
            return;
        }

        setIsRegisterLoading(true);

        try {
            const userCredential = await auth().createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({
                displayName: fullName
            });
            console.log('User account created & signed in!', userCredential.user);
            Alert.alert(
                'Success!',
                'Your account has been created successfully. Please login to continue.',
                [{ text: 'OK', onPress: onRegisterSuccess }]
            );
        } catch (error) {
            let errorMessage = 'Something went wrong. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'That email address is already in use!';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'That email address is invalid!';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'The password is too weak.';
            }
            console.error(error);
            Alert.alert('Registration Failed', errorMessage);
        } finally {
            setIsRegisterLoading(false);
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
    const handleDummyAppleSignUp = () => { /* ... */ };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <View style={styles.logoContainer}><View style={styles.logoPlaceholderSmall}><Text style={styles.logoText}>LOGO</Text></View></View>
                    <Text style={styles.title}>Create an account</Text>
                    <Text style={styles.subtitle}>Join GeoLocate Pro and start exploring</Text>
                    
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <View style={styles.inputWrapper}><TextInput style={styles.input} placeholder="Enter your full name" value={fullName} onChangeText={setFullName} placeholderTextColor="#A0A0A0" selectionColor={'#6A0DAD'}/></View>
                    <Text style={styles.inputLabel}>Username</Text>
                    <View style={styles.inputWrapper}><TextInput style={styles.input} placeholder="Enter your username" value={username} onChangeText={setUsername} autoCapitalize="none" placeholderTextColor="#A0A0A0" selectionColor={'#6A0DAD'}/></View>
                    <Text style={styles.inputLabel}>Email</Text>
                    <View style={styles.inputWrapper}><TextInput style={styles.input} placeholder="Enter your email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#A0A0A0" selectionColor={'#6A0DAD'}/></View>
                    <Text style={styles.inputLabel}>Mobile Number</Text>
                    <View style={styles.inputWrapper}><TextInput style={styles.input} placeholder="Enter your mobile number" value={mobileNumber} onChangeText={setMobileNumber} keyboardType="phone-pad" placeholderTextColor="#A0A0A0" selectionColor={'#6A0DAD'}/></View>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.inputWrapper}><TextInput style={styles.input} placeholder="Create a password" value={password} onChangeText={setPassword} secureTextEntry={!isPasswordVisible} selectionColor={'#6A0DAD'}/><TouchableOpacity style={styles.eyeIconContainer} onPress={() => setIsPasswordVisible(!isPasswordVisible)}><Icon name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={22} color="#707070"/></TouchableOpacity></View>
                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <View style={styles.inputWrapper}><TextInput style={styles.input} placeholder="Confirm your password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!isConfirmPasswordVisible} selectionColor={'#6A0DAD'}/><TouchableOpacity style={styles.eyeIconContainer} onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}><Icon name={isConfirmPasswordVisible ? "eye-off-outline" : "eye-outline"} size={22} color="#707070"/></TouchableOpacity></View>
                    
                    <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={isRegisterLoading}>
                        {isRegisterLoading ? <ActivityIndicator size="small" color="#FFFFFF"/> : <Text style={styles.registerButtonText}>Sign Up</Text>}
                    </TouchableOpacity>

                    {/* Dummy Social Buttons */}
                    <Text style={styles.orContinueText}>or sign up with</Text>
                    <TouchableOpacity style={[styles.socialButton, styles.googleButton]} onPress={onGoogleButtonPress} disabled={isGoogleLoading}><Icon name="google" size={20} color="#DB4437" style={styles.socialIcon}/>{isGoogleLoading ? <ActivityIndicator size="small" color="#DB4437"/> : <Text style={styles.socialButtonText}>Sign up with Google</Text>}</TouchableOpacity>
                    {Platform.OS === 'ios' && (<TouchableOpacity style={[styles.socialButton, styles.appleButton]} onPress={handleDummyAppleSignUp} disabled={isAppleLoading}><Icon name="apple" size={22} color="#000000" style={styles.socialIcon}/>{isAppleLoading ? <ActivityIndicator size="small" color="#000000"/> : <Text style={styles.socialButtonText}>Sign up with Apple</Text>}</TouchableOpacity>)}
                    <TouchableOpacity style={styles.loginLinkContainer} onPress={onNavigateToLogin}><Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkTextBold}>Sign In</Text></Text></TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#F4F6FC' },
    container: { flex:1 },
    scrollContentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingVertical: 20
    },
    logoContainer: { 
        alignItems: 'center', 
        marginBottom: 20,
        marginTop: Platform.OS === 'ios' ? 5 : 15 },
    logoPlaceholderSmall: { 
        width: 60, 
        height: 60, 
        borderRadius: 10, 
        backgroundColor: '#E0E7FF', 
        alignItems: 'center', 
        justifyContent: 'center'
    },
    logoText: {
        color: '#6A0DAD', 
        fontSize: 14, 
        fontWeight: 'bold'
    },
    title: {
        fontSize:26, 
        fontWeight:'bold', 
        color:'#1A202C', 
        textAlign:'center', 
        marginBottom:9
    },
    subtitle: {
        fontSize:15, 
        color:'#4A5568', 
        textAlign:'center', 
        marginBottom: 25
    },
    inputLabel: {
        fontSize:14, 
        color:'#4A5568', 
        alignSelf:'flex-start', 
        fontWeight:'500', 
        marginBottom: 8
    },
    inputWrapper: {
        flexDirection:'row', 
        alignItems:'center', 
        backgroundColor:'#FFFFFF', 
        borderRadius:10, 
        borderWidth:1, 
        borderColor:'#CBD5E0', 
        width:'100%', 
        marginBottom:15, 
        height:52, 
        shadowColor:"#000", 
        shadowOffset:{width:0,height:1,}, 
        shadowOpacity:0.08, 
        shadowRadius:1.00, 
        elevation:1
     },
    input: {
         flex:1, 
         paddingHorizontal:15, 
         fontSize:16, 
         color:'#1A202C' },
    eyeIconContainer: {
         paddingHorizontal:15,
         justifyContent: 'center'
     },
    registerButton: {
         backgroundColor:'#6A0DAD', 
         width:'100%', 
         paddingVertical:15, 
         borderRadius:10, 
        alignItems:'center', 
        justifyContent:'center', 
        minHeight:52, 
        marginBottom:20, 
        shadowColor:"#6A0DAD", 
        shadowOffset:{width:0,height:4,}, 
        shadowOpacity:0.30, 
        shadowRadius:4.65, 
        elevation:8
     },
    registerButtonText: { 
        color:'#FFFFFF', 
        fontSize:16,
        fontWeight:'600'
     },
    orContinueText: { 
        fontSize:13, 
        color:'#A0AEC0', 
        textAlign:'center', 
        marginBottom:20, 
        fontWeight:'500'
     },
    socialButton: { 
        flexDirection:'row', 
        backgroundColor:'#FFFFFF', 
        width:'100%', 
        paddingVertical:14, 
        borderRadius:10, 
        alignItems:'center', 
        justifyContent:'center', 
        marginBottom: 12, 
        borderWidth:1, 
        borderColor:'#E2E8F0', 
        minHeight:52, 
        shadowColor:"#000", 
        shadowOffset:{width:0,height:1,}, 
        shadowOpacity:0.08, 
        shadowRadius:1.00, 
        elevation:1
     },
    googleButton:{},
    appleButton: {
         backgroundColor:'#000000',
         borderColor:'#000000'
     },
    socialIcon: {
         marginRight:10
     },
    socialButtonText: {
         fontSize:15,
         fontWeight:'500',
         color:'#2D3748'
     },
    loginLinkContainer: {
         marginTop:20,
         alignItems:'center'
     },
    loginLinkText: {
         fontSize:14,
         color:'#4A5568'
     },
    loginLinkTextBold: {
         fontWeight: 'bold' 
        } });

export default RegisterScreen;