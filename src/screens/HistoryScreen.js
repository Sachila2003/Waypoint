import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Icon } from '@rneui/themed';

const HistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth().currentUser;

  useEffect(() => {
    if (user) {
      const subscriber = firestore()
        .collection('userHistory')
        .doc(user.uid)
        .collection('searches')
        .orderBy('timestamp', 'desc')
        .limit(20)
        .onSnapshot(querySnapshot => {
          const searches = [];
          querySnapshot.forEach(documentSnapshot => {
            searches.push({
              ...documentSnapshot.data(),
              key: documentSnapshot.id,
            });
          });
          setHistory(searches);
          setLoading(false);
        });

      return () => subscriber();
    }
  }, [user]);

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }
  
  if (history.length === 0) {
      return (
          <View style={styles.emptyContainer}>
              <Icon name="history" size={50} color="#ccc" />
              <Text style={styles.emptyText}>Your search history is empty.</Text>
              <Text style={styles.emptySubText}>Searches you make on the home screen will appear here.</Text>
          </View>
      )
  }
  const handleHistoryItemPress = (item) => {
    navigation.navigate('Home', { searchQuery: item.query});
  };

  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer}
    onPress={() => handleHistoryItemPress(item)}
    >
        <Icon name="search" size={20} color="#555" style={styles.icon}/>
        <View style={styles.textContainer}>
            <Text style={styles.queryText}>{item.query}</Text>
            <Text style={styles.dateText}>
                {item.timestamp ? new Date(item.timestamp.toDate()).toLocaleDateString() : ''}
            </Text>
        </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={history}
      renderItem={renderHistoryItem}
      keyExtractor={item => item.key}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  itemContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
      marginRight: 15,
  },
  textContainer: {
      flex: 1,
  },
  queryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
  },
  emptyText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#555',
      marginTop: 15,
  },
  emptySubText: {
      fontSize: 14,
      color: '#aaa',
      textAlign: 'center',
      marginTop: 10,
  }
});

export default HistoryScreen;