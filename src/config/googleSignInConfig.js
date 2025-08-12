import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const configureGoggleSignIn = () => {
    GoogleSignin.configure({
        webClientId: '965319922400-vjmnej4jn5kka99pbmclm68v6g14s5q4.apps.googleusercontent.com',
    });
};