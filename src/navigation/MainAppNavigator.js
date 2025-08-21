import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useLocation } from '../contexts/LocationContext';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Icon } from '@rneui/themed';

const Stack = createNativeStackNavigator();

const CustomHeaderTitle = () => {
    const { locationName } = useLocation();
    return (
        <View style={styles.headerContainer}>
        <Icon name="map" type="material-community" size={24} color="#6A0DAD" />
        <View>
            <Text style={styles.headerTitleText}>Waypoint</Text>
            <View style={styles.headerLocationContainer}>
                <Icon name="location-pin" type="material" size={12} color="#555" />
                <Text style={styles.headerLocationText}>{locationName}</Text>
            </View>
        </View>
    </View>
    );
};

const MainAppNavigator = () => {
  return (
    <Stack.Navigator
        screenOptions={{
            headerTitleAlign: 'center',
            headerStyle: {
                backgroundColor: 'white',
            },
            headerTintColor: '#333',
        }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={({ navigation }) => ({
          headerTitle: () => <CustomHeaderTitle />,
          headerLeft: () => null, 
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => navigation.navigate('Profile')}
              style={{ marginRight: 15 }}
            >
              <Icon name="person-circle-outline" type="ionicon" size={28} color="#6A0DAD" />
            </TouchableOpacity>
          ),
        })} 
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
            title: 'My Profile',
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    headerLocationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
        marginTop: -2,
    },
    headerLocationText: {
        fontSize: 12,
        color: '#555',
        marginLeft: 2,
    }
});

export default MainAppNavigator;