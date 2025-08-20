import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, PermissionsAndroid, Platform, Alert, ActivityIndicator, TouchableOpacity, Linking, Dimensions, FlatList } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import auth from '@react-native-firebase/auth';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';
import { SearchBar, Button, Icon } from '@rneui/themed';

const { width: screenWidth } = Dimensions.get('window');
const GOOGLE_API_KEY = 'AIzaSyDMwiLdNmZp5DtwIQ7LYtktlf6ouAK14gc';

const HomeScreen = ({ navigation }) => {
  const mapRef = useRef(null);
  const flatListRef = useRef(null);

  const [mapVisible, setMapVisible] = useState(false);
  const [currentRegion, setCurrentRegion] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");

  useEffect(() => {
    if (mapVisible && currentRegion) {
      setIsLoading(true); 
      fetchPlaces(currentRegion);
    }
  }, [mapVisible, currentRegion]);

  const fetchPlaces = async (region, query = '') => {
    if (!region) return;
    setIsLoading(true);
    setPlaces([]);
    
    try {
      const { latitude, longitude } = region;
      let url = '';
      
      if (query && query.trim() !== "") {
        url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${latitude},${longitude}&radius=20000&type=atm|bank|gas_station&key=${GOOGLE_API_KEY}`;
      } else {
        url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=3000&type=atm|bank|gas_station&key=${GOOGLE_API_KEY}`;
      }
      
      const response = await axios.get(url);
      
      if (response.data.status === 'OK') {
        const placesData = response.data.results.map(place => ({
          id: place.place_id,
          coordinate: { latitude: place.geometry.location.lat, longitude: place.geometry.location.lng },
          title: place.name,
          description: place.vicinity,
          type: place.types.includes('atm') ? 'atm' : place.types.includes('bank') ? 'bank' : 'gas_station',
          rating: place.rating,
          openNow: place.opening_hours?.open_now,
        }));
        setPlaces(placesData);
      } else {
        setPlaces([]);
        if (response.data.status !== 'ZERO_RESULTS') {
            Alert.alert("API Error", `Google Places API returned: ${response.data.status}. ${response.data.error_message || ''}`);
        }
      }
    } catch (error) {
      console.error("Google Places API Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const region = { latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 };
          setUserLocation({ latitude, longitude });
          resolve(region);
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };

  const handleSearch = async () => {
    const query = search.trim();
    if (query === "") return;
    setIsLoading(true);
    setLastSearchedQuery(query);
    
    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}+Sri+Lanka&key=${GOOGLE_API_KEY}`;
      const geocodeResponse = await axios.get(geocodeUrl);
      if (geocodeResponse.data.status === 'OK' && geocodeResponse.data.results.length > 0) {
        const { lat, lng } = geocodeResponse.data.results[0].geometry.location;
        const region = { latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 };
        setCurrentRegion(region);
        setMapVisible(true);
      } else {
        Alert.alert("Not Found", "Could not find the location.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Search Error:", error);
      setIsLoading(false);
    }
  };

  const findNearby = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return Alert.alert("Permission Denied");
      }
      setIsLoading(true);
      const region = await getCurrentLocation();
      setCurrentRegion(region);
      setLastSearchedQuery("");
      setMapVisible(true);
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Error", "Could not get your location.");
    }
  };

  const openDirections = (lat, lng) => {
    const url = `google.navigation:q=${lat},${lng}`;
    Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`));
  };
  
  const onCardPress = (item) => {
    setSelectedPlace(item);
    mapRef.current?.animateToRegion({ ...item.coordinate, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 800);
  };
  
  const onMarkerPress = (marker) => {
      setSelectedPlace(marker);
      const markerIndex = places.findIndex(p => p.id === marker.id);
      if (flatListRef.current && markerIndex > -1) {
        flatListRef.current.scrollToIndex({ index: markerIndex, animated: true, viewPosition: 0.5 });
      }
  };

  const renderPlaceCard = ({ item }) => (
    <TouchableOpacity 
      style={[styles.card, selectedPlace?.id === item.id && styles.selectedCard]}
      onPress={() => onCardPress(item)}
    >
      <View style={styles.cardHeader}>
        <Icon name={getMarkerIcon(item.type)} size={20} color={getMarkerColor(item.type)} />
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          {item.rating && (<View style={styles.ratingContainer}><Icon name="star" size={14} color="#FFD700" /><Text style={styles.ratingText}>{item.rating}</Text></View>)}
        </View>
      </View>
      <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
      <View style={styles.cardFooter}>
        {item.openNow !== undefined && (<Text style={[styles.statusText, item.openNow ? styles.openText : styles.closedText]}>{item.openNow ? 'Open Now' : 'Closed'}</Text>)}
        <Button
          title="Directions"
          onPress={() => openDirections(item.coordinate.latitude, item.coordinate.longitude)}
          buttonStyle={styles.directionsButton}
          titleStyle={{ fontSize: 12, fontWeight: 'bold' }}
          icon={{ name: 'directions', color: 'white', size: 14 }}
        />
      </View>
    </TouchableOpacity>
  );

  const getMarkerIcon = (type) => { return type === 'atm' ? 'local-atm' : type === 'bank' ? 'account-balance' : 'local-gas-station'; };
  const getMarkerColor = (type) => { return type === 'atm' ? '#007BFF' : type === 'bank' ? '#28a745' : '#dc3545'; };

  if (!mapVisible) {
    return (
      <View style={styles.searchContainer}>
        <View style={styles.header}>
          <View style={styles.logo}><Icon name="map" size={28} color="#6A0DAD" /><Text style={styles.logoText}>Waypoint</Text></View>
          <TouchableOpacity style={styles.locationTag} onPress={findNearby}><Icon name="location-on" size={16} color="#6A0DAD" /><Text style={styles.locationText}>{userLocation ? 'Your Location' : 'Sri Lanka'}</Text></TouchableOpacity>
        </View>
        <View style={styles.searchSection}>
          <SearchBar placeholder="Search for a city in Sri Lanka..." onChangeText={setSearch} value={search} onSubmitEditing={handleSearch} containerStyle={styles.searchBarContainer} inputContainerStyle={styles.searchInputContainer} round />
          <Text style={styles.orText}>- OR -</Text>
          <Button title="Find Places Near Me" onPress={findNearby} icon={{ name: 'my-location', color: 'white', size: 20 }} buttonStyle={styles.findButton} titleStyle={styles.findButtonText} />
        </View>
        {isLoading && (<View style={styles.loadingContainer}><ActivityIndicator size="large" color="#6A0DAD" /><Text style={styles.loadingText}>Finding locations...</Text></View>)}
        <View style={styles.featureSection}>
          <Text style={styles.featureTitle}>Find What You Need</Text>
          <View style={styles.featureGrid}>
            <View style={styles.featureItem}><Icon name="local-atm" size={30} color="#007BFF" /><Text style={styles.featureText}>ATMs</Text></View>
            <View style={styles.featureItem}><Icon name="account-balance" size={30} color="#28a745" /><Text style={styles.featureText}>Banks</Text></View>
            <View style={styles.featureItem}><Icon name="local-gas-station" size={30} color="#dc3545" /><Text style={styles.featureText}>Fuel Stations</Text></View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={currentRegion}
        showsUserLocation={true}
      >
        {places.map(marker => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            onPress={() => onMarkerPress(marker)}
          >
            <View style={[ styles.markerContainer, {backgroundColor: getMarkerColor(marker.type)}, selectedPlace?.id === marker.id && styles.selectedMarker ]}>
              <Icon name={getMarkerIcon(marker.type)} size={18} color="white" />
            </View>
          </Marker>
        ))}
      </MapView>
      <TouchableOpacity style={styles.backButton} onPress={() => {setMapVisible(false); setPlaces([]); setSearch("");}}>
        <Icon name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <View style={styles.searchOnMap}>
        <SearchBar placeholder={lastSearchedQuery || "Search again..."} onChangeText={setSearch} value={search} onSubmitEditing={handleSearch} containerStyle={styles.mapSearchContainer} inputContainerStyle={styles.mapSearchInput} round />
      </View>
      {isLoading && (<View style={styles.mapLoading}><ActivityIndicator size="large" /><Text style={styles.mapLoadingText}>Loading...</Text></View>)}
      {places.length > 0 && !isLoading && (
        <FlatList
          ref={flatListRef}
          data={places}
          renderItem={renderPlaceCard}
          keyExtractor={item => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.carousel}
          contentContainerStyle={{paddingRight: 20, paddingLeft: 10}}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  searchContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6A0DAD',
    marginLeft: 10,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0E6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationText: {
    color: '#6A0DAD',
    fontSize: 14,
    marginLeft: 5,
  },
  searchSection: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: 10,
  },
  searchBarContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    padding: 0,
  },
  searchInputContainer: {
    backgroundColor: '#EFEFEF',
    borderRadius: 30,
    height: 50,
  },
  orText: {
    textAlign: 'center',
    marginVertical: 15,
    color: '#888',
  },
  findButton: {
    backgroundColor: '#6A0DAD',
    borderRadius: 30,
    paddingVertical: 15,
    height: 50,
  },
  findButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    color: '#6A0DAD',
  },
  featureSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: 'white',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  featureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  featureItem: {
    alignItems: 'center',
  },
  featureText: {
    marginTop: 8,
    fontSize: 14,
    color: '#555',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 15,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    elevation: 5,
    zIndex: 10,
  },
  markerContainer: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
    elevation: 5,
  },
  selectedMarker: {
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  searchOnMap: {
    position: 'absolute',
    top: 50,
    left: 60,
    right: 15,
    zIndex: 10,
  },
  mapSearchContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    padding: 0,
  },
  mapSearchInput: {
    backgroundColor: 'white',
    borderRadius: 30,
    height: 40,
  },
  carousel: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    height: 160,
    width: screenWidth * 0.7,
    marginRight: 10,
    justifyContent: 'space-between',
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  selectedCard: {
    borderColor: '#6A0DAD',
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#666',
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  openText: {
    color: '#28a745',
  },
  closedText: {
    color: '#dc3545',
  },
  directionsButton: {
    backgroundColor: '#6A0DAD',
    borderRadius: 8,
    paddingVertical: 5,
    height: 30,
    width: 100,
  },
  mapLoading: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  mapLoadingText: {
    marginTop: 10,
    color: '#6A0DAD',
  },
  noResultsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 10,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
});

export default HomeScreen;