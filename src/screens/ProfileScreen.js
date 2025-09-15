import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { launchImageLibrary } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import { useFocusEffect } from '@react-navigation/native';

const ProfileScreen = ({ navigation }) => {
  const user = auth().currentUser;

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState(null);

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');

  const fetchUserData = async () => {
    if (user) {
      if (user.photoURL) {
        setProfilePic({ uri: user.photoURL });
      }

      try {
        const userDocument = await firestore().collection('users').doc(user.uid).get();

        if (userDocument.exists) {
          const userData = userDocument.data();
          console.log("Firestore data loaded:", userData);
          setDisplayName(userData.fullName || user.displayName || '');
          setPhone(userData.phoneNumber || '');
        } else {
          setDisplayName(user.displayName || '');
          setPhone(user.phoneNumber || '');
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [user])
  );

  const handleUpdateProfilePic = async () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) { return; }
      if (response.errorCode) { console.log('ImagePicker Error: ', response.errorMessage); return; }
      
      const imageUri = response.assets[0].uri;
      if (!imageUri) { Alert.alert('Error', 'Could not get image path.'); return; }

      setLoading(true);
      const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
      const storageRef = storage().ref(`profile_pictures/${user.uid}/${filename}`);

      try {
        await storageRef.putFile(imageUri);
        const url = await storageRef.getDownloadURL();
        await user.updateProfile({ photoURL: url });
        setProfilePic({ uri: url });
        Alert.alert('Success', 'Profile picture updated successfully!');
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to upload profile picture.');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty.');
      return;
    }

    setLoading(true);

    try {
      await user.updateProfile({ displayName });
      await firestore().collection('users').doc(user.uid).update({
        fullName: displayName,
        phoneNumber: phone,
      });
      
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false); 

    } catch (error) {
      console.error("Profile Update Error:", error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: () => auth().signOut() },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={handleUpdateProfilePic} disabled={loading}>
          <View style={styles.avatarWrapper}>
            {profilePic ? (
              <Image source={profilePic} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{displayName ? displayName.charAt(0).toUpperCase() : 'U'}</Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Text style={styles.cameraIconText}>✏️</Text>
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{displayName || 'User Name'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>

        <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
          <Text style={styles.editButtonText}>{isEditing ? 'Cancel' : 'Edit Profile'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name</Text>
          {isEditing ? (
            <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
          ) : (
            <Text style={styles.infoText}>{displayName || 'Not set'}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.infoText}>{user?.email}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          {isEditing ? (
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          ) : (
            <Text style={styles.infoText}>{phone || 'Not provided'}</Text>
          )}
        </View>

        {isEditing && (
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4a6ea9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4a6ea9',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconText: {
    fontSize: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  editButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#4a6ea9',
    fontWeight: '600',
  },
  detailsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  button: {
    backgroundColor: '#4a6ea9',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signOutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#dc3545',
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;