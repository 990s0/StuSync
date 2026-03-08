import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { User, Search, PlusCircle } from 'lucide-react-native';

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome back, Student!</Text>
      
      <View style={styles.grid}>
        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('Profile')}
        >
          <User color="#1E3A8A" size={48} />
          <Text style={styles.cardTitle}>My Profile</Text>
          <Text style={styles.cardDesc}>View stats & info</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('FindSessions')}
        >
          <Search color="#10B981" size={48} />
          <Text style={styles.cardTitle}>Find Sessions</Text>
          <Text style={styles.cardDesc}>Join open study groups</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('HostSession')}
        >
          <PlusCircle color="#F59E0B" size={48} />
          <Text style={styles.cardTitle}>Host a Session</Text>
          <Text style={styles.cardDesc}>Create a room & itinerary</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 30,
    marginTop: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: 'white',
    width: '100%',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 15,
    marginBottom: 5,
  },
  cardDesc: {
    fontSize: 14,
    color: '#64748B',
  }
});
