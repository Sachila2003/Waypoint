import React from 'react';
import { Dimensions, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Video from 'react-native-video';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Video
        source={require('../assets/animations/welcomeVideo.mp4')}
        style={styles.backgroundVideo}
        muted={true}
        repeat={true}
        resizeMode='cover'
        rate={1.0}
        ignoreSilentSwitch='obey'
      />

      <View style={styles.overlayContent}>
        <Text style={styles.appName}>GeoLocate Pro</Text>
        <Text style={styles.tagline}>Your ATM, Bank & Fueling Station Finder</Text>

        <TouchableOpacity style={styles.getStartedButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.getStartedButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  lottieAnimation: {
    width: width,
    height: height,
    position: 'absolute',
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: height * 0.12,
  },
  appName: {
    fontFamily:'poppins-bold',
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 8,
    position:'static',
  },
  tagline: {
    fontSize: 18,
    color: '#EFEFEF',
    textAlign: 'center',
    marginBottom: 60,
    paddingHorizontal: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  getStartedButton: {
    backgroundColor: '#6A0DAD',
    paddingVertical: 16,
    paddingHorizontal: 70,
    borderRadius: 30, 
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});



export default WelcomeScreen;