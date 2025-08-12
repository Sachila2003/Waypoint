// src/screens/HomeScreen.js
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, Button, PermissionsAndroid, Platform, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import auth from '@react-native-firebase/auth';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';

// map eka mulinma lankawa pennanna set karanawa
const initialRegion = {
  latitude: 7.8731,
  longitude: 80.7718,
  latitudeDelta: 3.5, 
  longitudeDelta: 3.5,
};

const HomeScreen = () => {
  const [region, setRegion] = useState(initialRegion);
  const mapRef = useRef(null);

  const [markers, setMarkers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPlaces = async (currentRegion) => {
    setIsLoading(true);
    setMarkers([]);

    const { latitude, longitude, latitudeDelta, longitudeDelta } = currentRegion;
    const south = latitude - latitudeDelta / 2;
    const west = longitude - longitudeDelta / 2;
    const north = latitude + latitudeDelta / 2;
    const east = longitude + longitudeDelta / 2;

    // --- CHANGE 1: Query eka wenas kala ATM, Bank, Fuel okkoma ganna ---
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"~"atm|bank|fuel"](${south},${west},${north},${east});
        way["amenity"~"atm|bank|fuel"](${south},${west},${north},${east});
        relation["amenity"~"atm|bank|fuel"](${south},${west},${north},${east});
      );
      out center;
    `;

    try {
      const response = await axios.post('https://overpass-api.de/api/interpreter', `data=${encodeURIComponent(query)}`);

      const newMarkers = response.data.elements.map(element => ({
        id: element.id,
        coordinate: { latitude: element.lat || element.center.lat, longitude: element.lon || element.center.lon },
        title: element.tags?.name || element.tags.amenity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: element.tags?.operator || 'Details not available',
        type: element.tags.amenity, // type eka save karagannawa (atm, bank, fuel)
      }));

      console.log(`Found ${newMarkers.length} places.`);
      setMarkers(newMarkers);

    } catch (error) {
      console.error("Overpass API Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Location ganna eka wenama function ekak kala 
  const goToMyLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.02, // Close zoom
          longitudeDelta: 0.02,
        }, 1000);
      },
      (error) => { Alert.alert("Error", error.message); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          { title: 'Location Permission', message: 'Waypoint needs access to your location.', buttonPositive: 'OK' }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Location permission denied');
        }
      }
    };
    requestLocationPermission();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region} // Map eka mulinma Lankawa pennanawa
        showsUserLocation={true}
        onRegionChangeComplete={(newRegion) => fetchPlaces(newRegion)}
      >
        {markers.map(marker => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            pinColor={marker.type === 'atm' ? 'gold' : marker.type === 'bank' ? 'blue' : 'red'} // Type ekata anuwa color eka wenas karanawa
          />
        ))}
      </MapView>

      {/* --- CHANGE 4: "Go to My Location" button එකක් එකතු කලා --- */}
      <TouchableOpacity style={styles.myLocationButton} onPress={goToMyLocation}>
        <Text style={styles.myLocationButtonText}>📍</Text>
      </TouchableOpacity>

      {/* Data load weddi loading indicator ekak pennanawa */}
      {isLoading && (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="large" color="#6A0DAD" />
          <Text>Finding nearby places...</Text>
        </View>
      )}
      <View style={styles.logoutButtonContainer}>
        <Text style={styles.welcomeText}>Welcome, {auth().currentUser?.displayName || 'User'}!</Text>
        <Button title="Logout" onPress={() => auth().signOut()} color="#841584" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  logoutButtonContainer: { position: 'absolute', top: 50, right: 10, backgroundColor: 'white', padding: 8, borderRadius: 10, elevation: 5, },
  welcomeText: { fontWeight: 'bold', marginBottom: 5, },
  loadingIndicator: { /* ... */ },
  myLocationButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 15,
    elevation: 5,
  },
  myLocationButtonText: {
    fontSize: 20,
  }
});

export default HomeScreen;