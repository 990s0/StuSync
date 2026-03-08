import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function TitleScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>StuSync</Text>
      <Text style={styles.subtitle}>Connect, Collaborate, Conquer.</Text>
      
      <Image
        source={require('../../assets/images/StuSync_logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('Auth')}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748B',
    marginBottom: 40,
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 50,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
