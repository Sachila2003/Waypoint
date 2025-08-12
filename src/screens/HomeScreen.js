import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Button, PermissionsAndroid, Platform, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; 
import auth from '@react-native-firebase/auth';
import Geolocation from 'react-native-geolocation-service';

// map eke zoom level ekata state ekak hadagannawa
const initialRegion = {
  latitude: 6.9271,   
  longitude: 79.8612,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const HomeScreen = () => {
  // map eke region ekai, userge location ekai thiyaganna states
  const [region, setRegion] = useState(initialRegion);
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null); 

  // location permission illala, location eka ganna function eka
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Waypoint needs access to your location to show you nearby services.',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Location permission granted');
          // Permission hmbuna nm, location ek gnnw
          getCurrentLocation(); 
        } else {
          console.log('Location permission denied');
          Alert.alert("Permission Denied", "Cannot get your location without permission.");
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      getCurrentLocation();
    }
  };

  // current location eka araganna function eka
  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        console.log('SUCCESS: Location found!', position);
        
        const { latitude, longitude } = position.coords;
        const newLocation = { latitude, longitude };
        
        // User ge location eka state eke save karanawa
        setUserLocation(newLocation);
        
        // Map eka user ge location ekata animate karanawa
        mapRef.current?.animateToRegion({
          ...newLocation,
          latitudeDelta: 0.01, // zoom in closer
          longitudeDelta: 0.01,
        }, 1000); 
      },
      (error) => {
        console.log('ERROR: Location error!', error);
        Alert.alert("Error getting location", error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  // screen eka load weddi location permission illanawa
  useEffect(() => {
    requestLocationPermission();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region} // map eka mulinma Colombo pennanawa
        showsUserLocation={true} // userge location eka nil paata thitakin pennanawa
      >
        {/* userge location eke marker ekak daanawa */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title={'You are here'}
            pinColor={'#007BFF'}
          />
        )}
      </MapView>
      <View style={styles.logoutButtonContainer}>
        <Text style={styles.welcomeText}>
          Welcome, {auth().currentUser?.displayName || 'User'}!
        </Text>
        <Button title="Logout" onPress={() => auth().signOut()} color="#841584"/>
      </View> 
    </View>
  );
};

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  logoutButtonContainer: { position: 'absolute', top: 60, right: 20, backgroundColor: 'white', padding: 10, borderRadius: 10, elevation: 5, },
  welcomeText: { fontWeight: 'bold', marginBottom: 5, }
});

export default HomeScreen;