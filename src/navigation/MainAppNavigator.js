import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HistoryScreen from '../screens/HistoryScreen';
import { useLocation } from '../contexts/LocationContext';
import DirectionsScreen from '../screens/DirectionsScreen';
import { TouchableOpacity, View, Text, StyleSheet, Modal, SafeAreaView } from 'react-native';
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
const BurgerMenu = ({ navigation, isVisible, onClose }) => {
    if (!isVisible) return null;

    return (
        <Modal
            transparent={true}
            animationType="fade"
            visible={isVisible}
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.menuOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <SafeAreaView style={styles.menuContainer}>
                    <View style={styles.menuContent}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                onClose();
                                navigation.navigate('Home');
                            }}
                        >
                            <Icon name="home" type="material" size={24} color="#333" />
                            <Text style={styles.menuText}>Home</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                onClose();
                                navigation.navigate('Profile');
                            }}
                        >
                            <Icon name="person" type="material" size={24} color="#333" />
                            <Text style={styles.menuText}>Profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                onClose();
                                navigation.navigate('History');
                            }}
                        >
                            <Icon name="history" type="material" size={24} color="#333" />
                            <Text style={styles.menuText}>History</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </TouchableOpacity>
        </Modal>
    );
};

// Main App Navigator
const MainAppNavigator = () => {
    const [menuVisible, setMenuVisible] = useState(false);
    const navigation = useNavigation();

    return (
        <>
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
                    options={{
                        headerTitle: () => <CustomHeaderTitle />,
                        headerLeft: () => (
                            <TouchableOpacity
                                onPress={() => setMenuVisible(true)}
                                style={{ marginLeft: 15 }}
                            >
                                <Icon name="menu" type="material" size={28} color="#6A0DAD" />
                            </TouchableOpacity>
                        ),
                        headerRight: () => (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Profile')}
                                style={{ marginRight: 15 }}
                            >
                                <Icon name="person-circle-outline" type="ionicon" size={28} color="#6A0DAD" />
                            </TouchableOpacity>
                        ),
                    }}
                />
                <Stack.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{
                        title: 'My Profile',
                        headerLeft: () => (
                            <TouchableOpacity
                                onPress={() => setMenuVisible(true)}
                                style={{ marginLeft: 15 }}
                            >
                                <Icon name="menu" type="material" size={28} color="#6A0DAD" />
                            </TouchableOpacity>
                        ),
                    }}
                />
                <Stack.Screen
                    name="History"
                    component={HistoryScreen}
                    options={{
                        title: 'History',
                        headerLeft: () => (
                            <TouchableOpacity
                                onPress={() => setMenuVisible(true)}
                                style={{ marginLeft: 15 }}
                            >
                                <Icon name="menu" type="material" size={28} color="#6A0DAD" />
                            </TouchableOpacity>
                        ),
                    }}
                />
                <Stack.Screen
                    name="Directions"
                    component={DirectionsScreen}
                    options={{
                        headerShown: false
                    }}
                />
            </Stack.Navigator>
            <BurgerMenu
                navigation={navigation}
                isVisible={menuVisible}
                onClose={() => setMenuVisible(false)}
            />
        </>
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
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    menuContainer: {
        width: 250,
        height: '100%',
        backgroundColor: 'white',
    },
    menuContent: {
        padding: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    menuText: {
        fontSize: 16,
        marginLeft: 15,
        color: '#333',
    },
});

export default MainAppNavigator;