import React from 'react';
import { View,Text,Button, StyleSheet} from 'react-native';
import auth from '@react-native-firebase/auth';

const ProfileScreen = ({ navigation}) => {
    const user = auth().currentUser;

    return (
        <View style={Styles.container}>
            <Text style={styels.title}>My Profile</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.info}>Display Name: {user?.displayName || 'Not set'}</Text>

            <View style={styles.buttonContainer}>
                <Button title="Sign Out" onPress={() => auth().signOut()} color="dc3545"/>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, alignItem: 'center', justifyContent: 'center', padding: 20},
    titile: { fontSize: 24, fontWeight: 'bold', marginBottom: 20},
    email: { fontSize: 18, marginBottom: 10, color: '#555'},
    info: { fontSize: 16, marginBottom: 30},
    buttonContainer: { width: '80%', marginTop: 20}
});

export default ProfileScreen;