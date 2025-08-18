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
  const [markers, setMarkers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    atm: true,
    bank: true,
    fuel: true,
  });

  const updateSearch = (text) => {
    setSearch(text);
  };
  const fetchPlaces = async (currentRegion) => {
    console.log("Fetching places for region:", currentRegion);
  };

  const goToMyLocation = () => {
    console.log("Go to my location pressed");
  };

  const toggleFilter = (filter) => {
    setActiveFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
  };

  const filteredMarkers = markers.filter(marker => {
    if (activeFilters.atm && marker.type === 'atm') return true;
    if (activeFilters.bank && marker.type === 'bank') return true;
    if (activeFilters.fuel && marker.type === 'fuel') return true;
    return false;
  });

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        onRegionChangeComplete={(newRegion) => fetchPlaces(newRegion)}
      >
        {filteredMarkers.map(marker => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            pinColor={marker.type === 'atm' ? 'gold' : marker.type === 'bank' ? 'blue' : 'red'}
          />
        ))}
      </MapView>

      <View style={styles.header}>
        <SearchBar
          placeholder="Search for a city..."
          onChangeText={updateSearch}
          value={search}
          lightTheme
          round
          containerStyle={styles.searchBarContainer}
          inputContainerStyle={styles.searchBarInput}
        />
      </View>

      <View style={styles.filterContainer}>
        <Button
          title="ATM"
          onPress={() => toggleFilter('atm')}
          icon={{ name: 'local-atm', color: activeFilters.atm ? 'white' : 'black' }}
          buttonStyle={[styles.filterButton, activeFilters.atm && styles.filterButtonActive]}
          titleStyle={{color: activeFilters.atm ? 'white' : 'black'}}
        />
        <Button
          title="Bank"
          onPress={() => toggleFilter('bank')}
          icon={{ name: 'account-balance', color: activeFilters.bank ? 'white' : 'black' }}
          buttonStyle={[styles.filterButton, activeFilters.bank && styles.filterButtonActive]}
          titleStyle={{color: activeFilters.bank ? 'white' : 'black'}}
        />
        <Button
          title="Fuel"
          onPress={() => toggleFilter('fuel')}
          icon={{ name: 'local-gas-station', color: activeFilters.fuel ? 'white' : 'black' }}
          buttonStyle={[styles.filterButton, activeFilters.fuel && styles.filterButtonActive]}
          titleStyle={{color: activeFilters.fuel ? 'white' : 'black'}}
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
  header: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
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
});

export default HomeScreen;