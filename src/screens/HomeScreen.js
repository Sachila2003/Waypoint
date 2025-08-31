import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, PermissionsAndroid, Platform, Alert, ActivityIndicator, TouchableOpacity, Linking, Dimensions, FlatList, Image } from 'react-native';
import { useRoute } from '@react-navigation/native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { SearchBar, Button, Icon } from '@rneui/themed';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const GOOGLE_API_KEY = 'AIzaSyDMwiLdNmZp5DtwIQ7LYtktlf6ouAK14gc';

const HomeScreen = ({ navigation }) => {
  const route = useRoute();
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef(null);
  const flatListRef = useRef(null);
  const searchRef = useRef(null);

  const [mapVisible, setMapVisible] = useState(false);
  const [currentRegion, setCurrentRegion] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeFilters, setActiveFilters] = useState({ atm: true, bank: true, fuel: true });
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [locationPermission, setLocationPermission] = useState(false);
  const [userPreferences, setUserPreferences] = useState({});
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const initialize = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: "Location Permission",
              message: "This app needs access to your location to find nearby places",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK"
            }
          );
          
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            setLocationPermission(true);
            findNearby(false);
          } else {
            setLocationPermission(false);
            Alert.alert("Permission Denied", "Location permission is needed to find nearby places");
          }
        } catch (err) {
          console.warn(err);
        }
      } else {
        findNearby(false);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    filterPlaces();
  }, [activeFilters, places]);

  useEffect(() => {
    if (selectedCategory && searchRef.current) {
      searchRef.current.focus();
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (route.params?.searchQuery) {
      const newQueryFromHistory = route.params.searchQuery;
      handleSearchFromHistory(newQueryFromHistory); 
      navigation.setParams({ searchQuery: undefined }); 
    }
  }, [route.params?.searchQuery]);
  //ai suggestions
  useEffect(() => {
    const findUserPreference = async () => {
      const user = auth().currentUser;
      if (!user) {
        return;
      }
      try {
        const historySnapshot = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('searches')
        .orderBy('timestamp', 'desc')
        .limit(30)
        .get();

        if (historySnapshot.empty) {
          console.log("AI Suggestions: User has no search history yet.");
          return;
        }
        const categoriesCount = {};
        historySnapshot.forEach(doc => {
          const query = doc.data().query || '';

          if (query.includes(' in ')) {
            const category = query.split(' in ')[0].trim();
            if (category) {
              categoriesCount[category] = (categoriesCount[category] || 0) + 1;
            }
          }
        });
        let topCategory = null;
        let maxCount = 0;

        for (const category in categoriesCount) {
          if (categoriesCount[category] > maxCount && category.toLowerCase() !== 'place near me') {
            maxCount = categoriesCount[category];
            topCategory = category;
          }
        }
        if (topCategory) {
          console.log("AI Suggestions: User's top preference found ->", topCategory);
          setUserPreferences(topCategory);
          
        } else {
          console.log("AI Suggestions: No user preference found.");
        }
        
      } catch (error) {
        console.error("AI Suggestions Error:", error);
      }
    }
    findUserPreference();
  }, []);

  const filterPlaces = () => {
    const noFiltersActive = !activeFilters.atm && !activeFilters.bank && !activeFilters.fuel;

    const newFilteredPlaces = places.filter(place => {
      if (noFiltersActive) return true;
      if (activeFilters.atm && place.type === 'atm') return true;
      if (activeFilters.bank && place.type === 'bank') return true;
      if (activeFilters.fuel && place.type === 'gas_station') return true;
      return false;
    });
    
    setFilteredPlaces(newFilteredPlaces);
  };

  const fetchPlaces = async (region, query = '') => {
    if (!region) return;
    setIsLoading(true);
    setPlaces([]);

    try {
      const { latitude, longitude } = region;
      let url = '';

      if (query && query.trim() !== "") {
        url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${latitude},${longitude}&radius=20000&key=${GOOGLE_API_KEY}`;
      } else {
        url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=3000&type=atm|bank|gas_station&key=${GOOGLE_API_KEY}`;
      }

      const response = await axios.get(url);

      if (response.data.status === 'OK') {
        const placesWithPhotos = await Promise.all(
          response.data.results.map(async (place) => {
            let photoUrl = null;
            
            if (place.photos && place.photos.length > 0) {
              const photoReference = place.photos[0].photo_reference;
              photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`;
            }

            return {
              id: place.place_id,
              coordinate: { latitude: place.geometry.location.lat, longitude: place.geometry.location.lng },
              title: place.name,
              description: place.vicinity,
              type: place.types.includes('atm') ? 'atm' : 
                    place.types.includes('bank') ? 'bank' : 'gas_station',
              rating: place.rating,
              openNow: place.opening_hours?.open_now,
              photo: photoUrl,
              totalRatings: place.user_ratings_total
            };
          })
        );

        setPlaces(placesWithPhotos);
        filterPlaces();

        if (placesWithPhotos.length > 0 && mapRef.current) {
          setTimeout(() => {
            const coordinates = placesWithPhotos.map(p => p.coordinate);
            mapRef.current.fitToCoordinates(coordinates, {
              edgePadding: { top: 150, right: 50, bottom: 200, left: 50 },
              animated: true,
            });
          }, 500);
        }

      } else {
        setPlaces([]);
        if (response.data.status === 'ZERO_RESULTS') {
          Alert.alert("No Results", `No matching "${query || 'places'}" found in this area.`);
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

const executeSearch = (searchTerm) => {
  console.log("Executing search for: ", searchTerm);
}

const handleSearch = async () => {
  const locationQuery = search.trim();
  if (!locationQuery || locationQuery === '') {
    Alert.alert("Empty Search", "Please enter a location to search.");
    return;
  }
  if (!selectedCategory) {
    Alert.alert("Select a Category", "Please select a category (ATM, Bank, or Fuel) before searching.");
    return;
  }

  setIsLoading(true);
  const fullQuery = `${selectedCategory} in ${locationQuery}`;
  setLastSearchedQuery(fullQuery);
  setSearchQuery(locationQuery); // Add this line to sync the searchQuery state

  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationQuery)}+Sri+Lanka&key=${GOOGLE_API_KEY}`;
    const geocodeResponse = await axios.get(geocodeUrl);

    if (geocodeResponse.data.status === 'OK' && geocodeResponse.data.results.length > 0) {
      const { lat, lng } = geocodeResponse.data.results[0].geometry.location;
      const region = { latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 };

      setCurrentRegion(region);
      setMapVisible(true);
      
      // Save search history
      const user = auth().currentUser;
      if(user){
        firestore()
        .collection('userHistory')
        .doc(user.uid)
        .collection('searches')
        .add({
          query: fullQuery,
          region: region,
          timestamp: firestore.FieldValue.serverTimestamp(),
        })
        .then(() => {
          console.log('Search history saved!')
        })
        .catch(error => {
          console.log('Error saving search history:', error);
        });
      }
      
      fetchPlaces(region, `${selectedCategory} in ${search.trim()}`);
    } else {
      Alert.alert("Not Found", `Could not find "${locationQuery}".`);
      setIsLoading(false);
    }
  } catch (error) {
    console.error("Search Error:", error);
    setIsLoading(false);
  }
};
  const handleSearchFromHistory = (queryFromHistory) => {
    setSearchQuery(queryFromHistory);
    console.log("Search from history for: ", queryFromHistory);
    handleSearch();
  }

  const findNearby = async (showMap = true) => {
    try {
      if (Platform.OS === 'android' && !locationPermission) {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return Alert.alert("Permission Denied", "Location permission is needed to find nearby places");
        } else {
          setLocationPermission(true);
        }
      }
      
      setIsLoading(true);
      const region = await getCurrentLocation();
      await fetchPlaces(region);

      if (showMap) {
        setCurrentRegion(region);
        setMapVisible(true);
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Error", "Could not get your location.");
    } finally {
      setIsLoading(false);
    }
  };

  const openDirections = (lat, lng) => {
    const url = `google.navigation:q=${lat},${lng}`;
    Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`));
  };

  const onCardPress = (item) => {
    setSelectedPlace(item);
    if (mapRef.current) {
      mapRef.current.animateToRegion({ 
        ...item.coordinate, 
        latitudeDelta: 0.01, 
        longitudeDelta: 0.01 
      }, 800);
    }
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
      {item.photo && (
        <Image source={{ uri: item.photo }} style={styles.cardImage} />
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Icon name={getMarkerIcon(item.type)} size={20} color={getMarkerColor(item.type)} />
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            {item.rating && (
              <View style={styles.ratingContainer}>
                <Icon name="star" size={14} color="#FFD700" />
                <Text style={styles.ratingText}>{item.rating}</Text>
                {item.totalRatings && (
                  <Text style={styles.ratingCount}>({item.totalRatings})</Text>
                )}
              </View>
            )}
          </View>
        </View>
        <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardFooter}>
          {item.openNow !== undefined && (
            <Text style={[styles.statusText, item.openNow ? styles.openText : styles.closedText]}>
              {item.openNow ? 'Open Now' : 'Closed'}
            </Text>
          )}
          <Button
            title="Directions"
            onPress={() => openDirections(item.coordinate.latitude, item.coordinate.longitude)}
            buttonStyle={styles.directionsButton}
            titleStyle={{ fontSize: 12, fontWeight: 'bold' }}
            icon={{ name: 'directions', color: 'white', size: 14 }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMapCard = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.mapCard,
        selectedPlace?.id === item.id && styles.selectedMapCard
      ]}
      onPress={() => onCardPress(item)}
    >
      {item.photo && (
        <Image source={{ uri: item.photo }} style={styles.mapCardImage} />
      )}
      <View style={styles.mapCardContent}>
        <View style={styles.mapCardHeader}>
          <Icon name={getMarkerIcon(item.type)} size={20} color={getMarkerColor(item.type)} />
          <View style={styles.mapCardTitleContainer}>
            <Text style={styles.mapCardTitle} numberOfLines={1}>{item.title}</Text>
          </View>
        </View>
        <Text style={styles.mapCardDescription} numberOfLines={2}>{item.description}</Text>
        {item.rating && (
            <View style={styles.mapCardRatingContainer}>
              <Icon name="star" size={14} color="#FFD700" />
              <Text style={styles.mapCardRatingText}>{item.rating}</Text>
              {item.totalRatings && (
                <Text style={styles.mapCardRatingCount}>({item.totalRatings})</Text>
              )}
            </View>
        )}
        <View style={styles.mapCardFooter}>
          {item.openNow !== undefined && (
            <Text style={[styles.mapCardStatusText, item.openNow ? styles.openText : styles.closedText]}>
              {item.openNow ? 'Open Now' : 'Closed'}
            </Text>
          )}
          <Button
            title="Directions"
            onPress={() => openDirections(item.coordinate.latitude, item.coordinate.longitude)}
            buttonStyle={styles.mapCardDirectionsButton}
            titleStyle={{ fontSize: 12, fontWeight: 'bold' }}
            icon={{ name: 'directions', color: 'white', size: 14 }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  const getMarkerIcon = (type) => { 
    return type === 'atm' ? 'local-atm' : type === 'bank' ? 'account-balance' : 'local-gas-station'; 
  };
  
  const getMarkerColor = (type) => { 
    return type === 'atm' ? '#007BFF' : type === 'bank' ? '#28a745' : '#dc3545'; 
  };

  const toggleFilter = (filterType) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };

  if (!mapVisible) {
    return (
      <View style={styles.searchContainer}>
        <View style={styles.searchSection}>
          <SearchBar
            ref={searchRef}
            placeholder="Search for a city in Sri Lanka..."
            onChangeText={setSearch}
            value={search}
            onSubmitEditing={handleSearch}
            containerStyle={styles.searchBarContainer}
            inputContainerStyle={styles.searchInputContainer}
            round
            searchIcon={{ color: '#6A0DAD' }}
          />
          <Text style={styles.orText}>- OR -</Text>
          <Button
            title={search.trim() !== "" ? `Search for "${search}"` : "Find Places Near Me"}
            onPress={search.trim() !== "" ? handleSearch : findNearby}
            icon={{ 
              name: search.trim() !== "" ? 'search' : 'my-location', 
              color: 'white', 
              size: 20 
            }}
            buttonStyle={styles.findButton}
            titleStyle={styles.findButtonText}
          />
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6A0DAD" />
            <Text style={styles.loadingText}>Finding locations...</Text>
          </View>
        )}

        <View style={styles.featureSection}>
          <Text style={styles.featureTitle}>Find What You Need</Text>
          <View style={styles.featureGrid}>
            <TouchableOpacity
              style={[styles.featureItem, selectedCategory === 'atm' && styles.featureItemSelected]}
              onPress={() => setSelectedCategory('atm')}
            >
              <View style={[styles.featureIcon, { backgroundColor: '#E3F2FD' }]}>
                <Icon name="local-atm" size={30} color="#007BFF" />
              </View>
              <Text style={styles.featureText}>ATMs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.featureItem, selectedCategory === 'bank' && styles.featureItemSelected]}
              onPress={() => setSelectedCategory('bank')}
            >
              <View style={[styles.featureIcon, { backgroundColor: '#E8F5E9' }]}>
                <Icon name="account-balance" size={30} color="#28a745" />
              </View>
              <Text style={styles.featureText}>Banks</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.featureItem, selectedCategory === 'fuel' && styles.featureItemSelected]}
              onPress={() => setSelectedCategory('fuel')}
            >
              <View style={[styles.featureIcon, { backgroundColor: '#FFEBEE' }]}>
                <Icon name="local-gas-station" size={30} color="#dc3545" />
              </View>
              <Text style={styles.featureText}>Fuel Stations</Text>
            </TouchableOpacity>
          </View>
        </View>

        {filteredPlaces.length > 0 && (
          <View style={styles.resultsSection}>
            <View style={styles.filterBar}>
              <Text style={styles.resultsTitle}>Nearby Places</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity 
                  style={[styles.filterBtn, activeFilters.atm && styles.filterBtnActive]} 
                  onPress={() => toggleFilter('atm')}
                >
                  <Text style={[styles.filterBtnText, activeFilters.atm && styles.filterBtnTextActive]}>ATMs</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterBtn, activeFilters.bank && styles.filterBtnActive]} 
                  onPress={() => toggleFilter('bank')}
                >
                  <Text style={[styles.filterBtnText, activeFilters.bank && styles.filterBtnTextActive]}>Banks</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterBtn, activeFilters.fuel && styles.filterBtnActive]} 
                  onPress={() => toggleFilter('fuel')}
                >
                  <Text style={[styles.filterBtnText, activeFilters.fuel && styles.filterBtnTextActive]}>Fuel</Text>
                </TouchableOpacity>
              </View>
            </View>
            <FlatList
              data={filteredPlaces}
              renderItem={renderPlaceCard}
              keyExtractor={item => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.carousel}
              contentContainerStyle={styles.carouselContent}
            />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={currentRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {places.map(marker => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            onPress={() => onMarkerPress(marker)}
          >
            <View style={[
              styles.markerContainer, 
              { backgroundColor: getMarkerColor(marker.type) }, 
              selectedPlace?.id === marker.id && styles.selectedMarker
            ]}>
              <Icon name={getMarkerIcon(marker.type)} size={18} color="white" />
            </View>
          </Marker>
        ))}
      </MapView>

      <TouchableOpacity style={styles.backButton} onPress={() => { setMapVisible(false); setPlaces([]); setSearch(""); }}>
        <Icon name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <View style={styles.searchOnMap}>
        <SearchBar 
          placeholder={lastSearchedQuery || "Search again..."} 
          onChangeText={setSearch} 
          value={search} 
          onSubmitEditing={handleSearch} 
          containerStyle={styles.mapSearchContainer} 
          inputContainerStyle={styles.mapSearchInput} 
          round 
        />
      </View>

      {isLoading && (
        <View style={styles.mapLoading}>
          <ActivityIndicator size="large" color="#6A0DAD" />
          <Text style={styles.mapLoadingText}>Loading...</Text>
        </View>
      )}

      {places.length > 0 && !isLoading && (
        <FlatList
          ref={flatListRef}
          data={places}
          renderItem={renderMapCard}
          keyExtractor={item => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.mapCarousel}
          contentContainerStyle={styles.mapCarouselContent}
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    elevation: 2,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6A0DAD',
    marginLeft: 10,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0E6FF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  locationText: {
    color: '#6A0DAD',
    fontSize: 14,
    fontWeight: '500',
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
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    height: 50,
  },
  orText: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
  },
  findButton: {
    backgroundColor: '#6A0DAD',
    borderRadius: 25,
    paddingVertical: 15,
    height: 50,
    elevation: 2,
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
    fontSize: 16,
  },
  featureSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    marginHorizontal: 20,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  featureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  featureItem: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
  },
  featureItemSelected: {
    backgroundColor: '#F0E6FF',
    transform: [{ scale: 1.05 }],
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
  },
  resultsSection: {
    marginTop: 20,
    padding: 10,
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButtons: {
    flexDirection: 'row',
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#F0F2F5',
    marginLeft: 8,
  },
  filterBtnActive: {
    backgroundColor: '#6A0DAD',
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  filterBtnTextActive: {
    color: 'white',
  },
  carousel: {
    paddingHorizontal: 10,
  },
  carouselContent: {
    paddingHorizontal: 10,
    height: screenHeight * 0.32,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: screenWidth * 0.80,
    height: screenHeight * 0.32,
    marginRight: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  cardContent: {
    padding: 15,
  },
  selectedCard: {
    borderColor: '#6A0DAD',
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flex: 1,
    marginLeft: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    color: '#666',
  },
  ratingCount: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
    paddingHorizontal: 12,
    height: 32,
  },
  mapCarousel: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  mapCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: screenWidth * 0.80,
    height: 250,
    marginRight: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  selectedMapCard: {
    borderColor: '#6A0DAD',
    borderWidth: 2.5,
  },
  mapCardImage: {
    width: '100%',
    height: 120,
  },
  mapCardContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  mapCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapCardTitleContainer: {
    flex: 1,
    marginLeft: 10,
  },
  mapCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  mapCardDescription: {
    fontSize: 13,
    color: '#666',
    marginVertical: 4,
  },
  mapCardRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  mapCardRatingText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
    color: '#555',
  },
  mapCardRatingCount: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  mapCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  mapCardStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  mapCardDirectionsButton: {
    backgroundColor: '#6A0DAD',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 35,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
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
    transform: [{ scale: 1.2 }],
  },
  searchOnMap: {
    position: 'absolute',
    top: 60,
    left: 70,
    right: 20,
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
    borderRadius: 25,
    height: 45,
    elevation: 3,
  },
  mapLoading: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
  },
  mapLoadingText: {
    marginTop: 10,
    color: '#6A0DAD',
    fontWeight: '600',
  },
});

export default HomeScreen;