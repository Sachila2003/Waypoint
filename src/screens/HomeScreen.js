import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, PermissionsAndroid, Platform, Alert, ActivityIndicator, TouchableOpacity, Linking, Dimensions, FlatList } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import auth from '@react-native-firebase/auth';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';
import { SearchBar, Button, Icon } from '@rneui/themed';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const mapRef = useRef(null);
  
  // --- NEW STATE: To control map visibility ---
  const [mapVisible, setMapVisible] = useState(false);
  const [currentRegion, setCurrentRegion] = useState(null);

  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchPlaces = async (region) => {
    if (!region) return;
    setIsLoading(true);
    const { latitude, longitude, latitudeDelta } = region;
    const radius = Math.max(2000, (latitudeDelta * 111 * 1000) / 2); // Min 2km radius
    const query = `[out:json][timeout:25];(node(around:${radius},${latitude},${longitude})["amenity"~"atm|bank|fuel"];);out center;`;
    try {
      const response = await axios.post('https://overpass-api.de/api/interpreter', `data=${encodeURIComponent(query)}`);
      const newPlaces = response.data.elements.map(element => ({
        id: element.id,
        coordinate: { latitude: element.lat, longitude: element.lon },
        title: element.tags?.name || element.tags.amenity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: element.tags?.operator || 'Details not available',
        type: element.tags.amenity,
      }));
      setPlaces(newPlaces);
    } catch (error) {
      console.error("Overpass API Error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = async (searchText) => {
    const query = searchText || search;
    if (query.trim() === "") return;
    setIsLoading(true);
    setPlaces([]);
    try {
      const apiKey = 'AIzaSyDMwiLdNmZp5DtwIQ7LYtktlf6ouAK14gc'; 
      const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${query}, Sri Lanka&key=${apiKey}`);
      if (response.data.results.length > 0) {
        const { lat, lng } = response.data.results[0].geometry.location;
        const region = { latitude: lat, longitude: lng, latitudeDelta: 0.1, longitudeDelta: 0.1 };
        setCurrentRegion(region);
        setMapVisible(true); // Show the map
        await fetchPlaces(region);
      } else {
        Alert.alert("Not Found", "Could not find the location.");
      }
    } catch (error) {
      console.error("Geocoding API Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const findNearby = () => {
    const requestPermissionAndFetch = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert("Permission Denied");
          return;
        }
      }
      setIsLoading(true);
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const region = { latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 };
          setCurrentRegion(region);
          setMapVisible(true); // Show the map
          fetchPlaces(region);
        },
        (error) => {
          setIsLoading(false);
          Alert.alert("Error", "Could not get your location.");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    };
    requestPermissionAndFetch();
  };

  const renderPlaceCard = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.cardDescription} numberOfLines={1}>{item.description}</Text>
      <Button
        title="Get Directions"
        onPress={() => openDirections(item.coordinate.latitude, item.coordinate.longitude)}
        buttonStyle={styles.directionsButton}
        titleStyle={{ fontSize: 14 }}
      />
    </View>
  );

  // --- NEW: This is the Search View (when map is not visible) ---
  if (!mapVisible) {
    return (
      <View style={styles.searchContainer}>
        <Text style={styles.title}>Waypoint</Text>
        <SearchBar
          placeholder="Search for a city or place..."
          onChangeText={setSearch}
          value={search}
          onSubmitEditing={() => handleSearch(search)}
          containerStyle={styles.searchBarStandalone}
          inputContainerStyle={{backgroundColor: '#EFEFEF'}}
          round
        />
        <Button
          title="Find Near Me"
          onPress={findNearby}
          icon={{ name: 'my-location', color: 'white' }}
          buttonStyle={styles.findButton}
        />
        {isLoading && <ActivityIndicator size="large" color="#6A0DAD" />}
      </View>
    );
  }

  // --- This is the Map View (when map is visible) ---
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={currentRegion}
        showsUserLocation={true}
        onRegionChangeComplete={fetchPlaces}
      >
        {places.map(marker => (<Marker key={marker.id} coordinate={marker.coordinate} /* ... */ />))}
      </MapView>

      <TouchableOpacity style={styles.backButton} onPress={() => setMapVisible(false)}>
        <Icon name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <FlatList
        data={places}
        renderItem={renderPlaceCard}
        keyExtractor={item => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.carouselStyle}
        contentContainerStyle={{ paddingHorizontal: 10 }}
      />
       {isLoading && <View style={styles.loadingOnMap}><ActivityIndicator size="large" color="#6A0DAD" /></View>}
    </View>
  );
};

const styles = StyleSheet.create({
  // --- Styles for both views ---
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  loadingOnMap: { position: 'absolute', top: '50%', alignSelf: 'center' },
  carouselStyle: { position: 'absolute', bottom: 30 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 15, height: 120, width: screenWidth * 0.7, marginRight: 10, justifyContent: 'space-between', elevation: 6 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardDescription: { fontSize: 13, color: '#444' },
  directionsButton: { backgroundColor: '#6A0DAD', borderRadius: 8, paddingVertical: 5 },

  // --- Styles for Search View ---
  searchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5'
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6A0DAD',
    marginBottom: 30,
  },
  searchBarStandalone: {
    width: '100%',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 0,
  },
  findButton: {
    backgroundColor: '#6A0DAD',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginTop: 20,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    elevation: 5,
  }
});

export default HomeScreen;