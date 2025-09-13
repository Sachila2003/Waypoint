import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Linking, SafeAreaView } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Icon } from '@rneui/themed';
import axios from 'axios';
import polyline from '@mapbox/polyline';

const GOOGLE_API_KEY = 'AIzaSyDMwiLdNmZp5DtwIQ7LYtktlf6ouAK14gc';

const DirectionsScreen = ({ route, navigation }) => {
  const { startLocation, endLocation, placeDetails, placeType } = route.params;
  const mapRef = useRef(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);
  const [roadName, setRoadName] = useState('');

  useEffect(() => {
    getDirections();
  }, []);

  const getDirections = async () => {
    setIsLoading(true);
    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
    const data = {
      origin: { 
        location: { 
          latLng: { 
            latitude: startLocation.latitude, 
            longitude: startLocation.longitude 
          } 
        } 
      },
      destination: { 
        location: { 
          latLng: { 
            latitude: endLocation.latitude, 
            longitude: endLocation.longitude 
          } 
        } 
      },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      polylineEncoding: 'ENCODED_POLYLINE',
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration,routes.legs.steps',
        }
      });

      if (response.data.routes && response.data.routes.length > 0) {
        const routeData = response.data.routes[0];
        const points = routeData.polyline.encodedPolyline;
        
        if (points) {
          const decodedPoints = polyline.decode(points);
          const coords = decodedPoints.map(point => ({ 
            latitude: point[0], 
            longitude: point[1] 
          }));
          setRouteCoordinates(coords);
          
          const distanceInKm = (routeData.distanceMeters / 1000).toFixed(1);
          const durationInMinutes = Math.round(parseInt(routeData.duration.slice(0, -1)) / 60);
          
          setRouteInfo({ 
            distance: `${distanceInKm} km`, 
            duration: `${durationInMinutes} min`,
            steps: routeData.legs?.[0]?.steps || []
          });
          if (routeData.legs?.[0]?.steps?.length > 0) {
            const firstStep = routeData.legs[0].steps[0];
            setCurrentStep(firstStep);
            
            if (firstStep && typeof firstStep === 'object') {
              const possibleRoadName = firstStep.html_instructions || 
                                     firstStep.instructions || 
                                     firstStep.streetName || 
                                     '';
              setRoadName(possibleRoadName);
            }
          }

          setTimeout(() => {
            if (mapRef.current && coords.length > 0) {
              mapRef.current.fitToCoordinates(coords, {
                edgePadding: { top: 150, right: 50, bottom: 200, left: 50 },
                animated: true,
              });
            }
          }, 500);
        }
      }
    } catch (error) {
      console.error("Directions API Error:", error.response?.data || error.message);
      setRouteInfo({ 
        distance: 'Calculating...', 
        duration: 'Calculating...',
        steps: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceIcon = () => {
    switch (placeType) {
      case 'ATM':
        return 'credit-card';
      case 'Bank':
        return 'bank';
      case 'Fuel':
        return 'local-gas-station';
      default:
        return 'place';
    }
  };

  const getPlaceColor = () => {
    switch (placeType) {
      case 'ATM':
        return '#FF6B6B';
      case 'Bank':
        return '#4ECDC4';
      case 'Fuel':
        return '#FFD166';
      default:
        return '#6A0DAD';
    }
  };

  const renderTextSafely = (content) => {
    if (typeof content === 'string' || typeof content === 'number') {
      return <Text>{content}</Text>;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          ...startLocation,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsTraffic={true}
        showsCompass={true}
      >
        {routeCoordinates.length > 0 && (
          <Polyline 
            coordinates={routeCoordinates} 
            strokeColor={getPlaceColor()} 
            strokeWidth={5} 
          />
        )}
        
        <Marker coordinate={startLocation} title="Your Location">
          <View style={styles.markerContainer}>
            <View style={[styles.markerPin, { backgroundColor: '#4285F4' }]}>
              <Icon name="person-pin" size={24} color="white" />
            </View>
          </View>
        </Marker>
        
        <Marker coordinate={endLocation} title={placeDetails.title}>
          <View style={styles.markerContainer}>
            <View style={[styles.markerPin, { backgroundColor: getPlaceColor() }]}>
              <Icon name={getPlaceIcon()} size={24} color="white" />
            </View>
          </View>
        </Marker>
      </MapView>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Directions to {placeDetails.title || 'Destination'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={getPlaceColor()} />
          <Text style={styles.loadingText}>Finding best route...</Text>
        </View>
      )}

      {currentStep && typeof currentStep === 'object' && (
        <View style={styles.stepContainer}>
          <View style={styles.stepIcon}>
            <Icon name="directions" size={20} color="white" />
          </View>
          <Text style={styles.stepText} numberOfLines={2}>
            {currentStep.html_instructions || currentStep.instructions || 'Continue on route'}
          </Text>
        </View>
      )}

      {routeInfo && (
        <View style={styles.infoContainer}>
          <View style={styles.infoBox}>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoDuration}>{routeInfo.duration}</Text>
              <Text style={styles.infoDistance}>{routeInfo.distance}</Text>
              <Text style={styles.destinationName} numberOfLines={1}>
                {placeDetails.title || 'Destination'}
              </Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.startNavButton, { backgroundColor: getPlaceColor() }]} 
                onPress={() => Linking.openURL(`google.navigation:q=${endLocation.latitude},${endLocation.longitude}`)}
              >
                <Text style={styles.startNavText}>Start</Text>
                <Icon name="navigation" size={16} color="white" style={{ marginLeft: 5 }} />
              </TouchableOpacity>
            </View>
          </View>
          
          {roadName ? (
            <View style={styles.roadInfo}>
              <Icon name="road" size={16} color="#666" />
              <Text style={styles.roadText} numberOfLines={1}>
                {roadName}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#fff'
  },
  map: { 
    ...StyleSheet.absoluteFillObject 
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
  },
  infoBox: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  infoTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  infoDuration: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 2,
  },
  infoDistance: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  destinationName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  buttonContainer: {
    justifyContent: 'center',
  },
  startNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 3,
  },
  startNavText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    position: 'absolute',
    top: 110,
    left: 15,
    right: 15,
  },
  stepIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6A0DAD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  roadInfo: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  roadText: {
    marginLeft: 5,
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
});

export default DirectionsScreen;