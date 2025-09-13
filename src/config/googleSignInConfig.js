import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const configureGoggleSignIn = () => {
    GoogleSignin.configure({
        webClientId: '266909651460-2i8ukrs6kgo8d3qmd482fbbjoee7a9ae.apps.googleusercontent.com',
    });
};  