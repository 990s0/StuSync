import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function TitleScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>StuSync</Text>
      <Text style={styles.subtitle}>Connect, Collaborate, Conquer.</Text>
      
      <View style={styles.wireframeBox}>
        <Text style={styles.wireframeText}>App Logo / Mascot</Text>
      </View>

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
  wireframeBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#94A3B8',
    borderStyle: 'dashed',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
    backgroundColor: '#F1F5F9'
  },
  wireframeText: {
    color: '#94A3B8',
    fontWeight: '600'
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
