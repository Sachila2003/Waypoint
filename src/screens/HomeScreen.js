// src/screens/HomeScreen.js
import React from 'react';
import { View, StyleSheet, Text, Button } from 'react-native';
// PROVIDER_GOOGLE එක import කරගන්නවා
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; 
import auth from '@react-native-firebase/auth';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      {/* MapView එකට provider එක GOOGLE කියලා දෙනවා */}
      <MapView
        provider={PROVIDER_GOOGLE} 
        style={styles.map}
        initialRegion={{
          latitude: 6.9271,    // Colombo
          longitude: 79.8612,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {/* Example Marker එකක් දානවා */}
        <Marker
            coordinate={{ latitude: 6.9271, longitude: 79.8612 }}
            title={"Colombo"}
        />
      </MapView>
      
      <View style={styles.logoutButtonContainer}>
          <Text style={styles.welcomeText}>
            Welcome, {auth().currentUser?.displayName || 'User'}!
          </Text>
          <Button title="Logout" onPress={() => auth().signOut()} color="#841584" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  logoutButtonContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    elevation: 5,
  },
  welcomeText: {
    fontWeight: 'bold',
    marginBottom: 5,
  }
});

export default HomeScreen;