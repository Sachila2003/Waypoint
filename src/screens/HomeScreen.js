import React, { useState, useEffect, useRef } from 'react';
import {
  View, StyleSheet, Text, PermissionsAndroid, Platform, Alert, ActivityIndicator, TouchableOpacity
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import auth from '@react-native-firebase/auth';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';
import { SearchBar, Button, Icon } from '@rneui/themed';

const initialRegion = {
  latitude: 7.8731,
  longitude: 80.7718,
  latitudeDelta: 3.5,
  longitudeDelta: 3.5,
};

const HomeScreen = () => {
  const mapRef = useRef(null);
  const [allPlaces, setAllPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    atm: true,
    bank: true,
    fuel: true,
  });
  const [userLocation, setUserLocation] = useState(null);

  // App eka load weddi permission illanawa
  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'Waypoint needs access to your location.',
              buttonPositive: 'OK',
            },
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Location permission granted');
            getCurrentLocation();
          } else {
            console.log('Location permission denied');
            fetchPlaces(initialRegion);
          }
        } catch (err) {
          console.warn(err);
        }
      } else {
        getCurrentLocation();
      }
    };

    requestLocationPermission();
  }, []);

  useEffect(() => {
    const newFilteredPlaces = allPlaces.filter(place => {
      if (activeFilters.atm && place.type === 'atm') return true;
      if (activeFilters.bank && place.type === 'bank') return true;
      if (activeFilters.fuel && place.type === 'fuel') return true;
      return false;
    });
    setFilteredPlaces(newFilteredPlaces);
  }, [activeFilters, allPlaces]);


  const handleSearch = async () => {
    if (search.trim() === "") return;
    setIsLoading(true);
    setAllPlaces([]);
    try {
      const apiKey = 'AIzaSyDMwiLdNmZp5DtwIQ7LYtktlf6ouAK14gc';
      const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${search}, Sri Lanka&key=${apiKey}`);

      if (response.data.results.length > 0) {
        const { lat, lng } = response.data.results[0].geometry.location;
        const searchRegion = { latitude: lat, longitude: lng };

        mapRef.current?.animateToRegion({ ...searchRegion, latitudeDelta: 0.1, longitudeDelta: 0.1 }, 1000);
        await fetchPlaces(searchRegion);
      } else {
        Alert.alert("Not Found", "Could not find the location.");
      }
    } catch (error) {
      console.error("Geocoding API Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlaces = async (centerRegion) => {
    setIsLoading(true);
    const radius = 5000;
    const { latitude, longitude } = centerRegion;
    const query = `[out:json][timeout:25];(node(around:${radius},${latitude},${longitude})["amenity"~"atm|bank|fuel"];);out center;`;

    try {
      const response = await axios.post('https://overpass-api.de/api/interpreter', `data=${encodeURIComponent(query)}`);
      const newPlaces = response.data.elements.map(element => ({
        id: element.id,
        coordinate: { latitude: element.lat, longitude: element.lon },
        title: element.tags?.name || element.tags.amenity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: element.tags?.operator || 'Details not available',
        type: element.tags.amenity,
      }));
      setAllPlaces(newPlaces);
    } catch (error) {
      console.error("Overpass API Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentLocation = { latitude, longitude };
        setUserLocation(currentLocation);
        mapRef.current?.animateToRegion({ ...currentLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 1000);
        fetchPlaces(currentLocation);
      },
      (error) => {
        console.log(error);
        fetchPlaces(initialRegion);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };
  
  const goToMyLocation = () => {
      if (userLocation) {
          mapRef.current?.animateToRegion({ ...userLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 1000);
      } else {
          getCurrentLocation();
      }
  };

  const toggleFilter = (filter) => { setActiveFilters(prev => ({ ...prev, [filter]: !prev[filter] })); };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
      >
       {filteredPlaces.map(marker => (
         <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
         >
            <View style={[styles.markerContainer, {backgroundColor: marker.type === 'atm' ? '#007BFF' : marker.type === 'bank' ? '#28a745' : '#dc3545'}]}>
               <Icon 
                   name={ marker.type === 'atm' ? 'local-atm' : marker.type === 'bank' ? 'account-balance' : 'local-gas-station' } 
                   size={22} 
                   color="white" 
               />
            </View>
         </Marker>
       ))}
      </MapView>

      <View style={styles.header}>
        <SearchBar
          placeholder="Search for a city in Sri Lanka..."
          onChangeText={setSearch}
          value={search}
          lightTheme
          round
          containerStyle={styles.searchBarContainer}
          inputContainerStyle={styles.searchBarInput}
          onSubmitEditing={handleSearch}
        />
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A0DAD" />
          <Text>Finding places...</Text>
        </View>
      )}

      <View style={styles.filterContainer}>
        <Button
          title="ATM"
          onPress={() => toggleFilter('atm')}
          icon={{ name: 'local-atm', color: activeFilters.atm ? 'white' : 'black' }}
          buttonStyle={[styles.filterButton, activeFilters.atm && styles.filterButtonActive]}
          titleStyle={{ color: activeFilters.atm ? 'white' : 'black' }}
        />
        <Button
          title="Bank"
          onPress={() => toggleFilter('bank')}
          icon={{ name: 'account-balance', color: activeFilters.bank ? 'white' : 'black' }}
          buttonStyle={[styles.filterButton, activeFilters.bank && styles.filterButtonActive]}
          titleStyle={{ color: activeFilters.bank ? 'white' : 'black' }}
        />
        <Button
          title="Fuel"
          onPress={() => toggleFilter('fuel')}
          icon={{ name: 'local-gas-station', color: activeFilters.fuel ? 'white' : 'black' }}
          buttonStyle={[styles.filterButton, activeFilters.fuel && styles.filterButtonActive]}
          titleStyle={{ color: activeFilters.fuel ? 'white' : 'black' }}
        />
      </View>

      <TouchableOpacity style={styles.myLocationButton} onPress={goToMyLocation}>
        <Icon name="my-location" color="black" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  markerContainer: {
    padding: 8,
    borderRadius: 24,
    borderColor: 'white',
    borderWidth: 2,
    elevation: 5,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
  },
  searchBarContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  searchBarInput: {
    backgroundColor: '#fff',
  },
  filterContainer: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 10,
  },
  filterButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  filterButtonActive: {
    backgroundColor: '#6A0DAD',
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 10,
    elevation: 5,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    borderRadius: 10,
    elevation: 6,
  },
});

export default HomeScreen;