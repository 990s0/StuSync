import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

export default function AuthScreen() {
  const navigation = useNavigation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async () => {
    if (!email.includes('@')) {
      Alert.alert("Invalid Email", "Please use a valid school email address.");
      return;
    }

    try {
      // Mocking school email authentication using Axios as requested
      // In a real app we would await axios.post('https://our-backend.com/api/auth', {email, password})
      console.log("Authenticating school email using Axios (mock)");
      
      // Navigate to Home upon success
      navigation.replace('Home');
    } catch (e) {
      Alert.alert("Error", "Authentication failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Welcome Back!' : 'Create Account'}</Text>
      
      {!isLogin && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Username / Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Type your username or name"
            value={username}
            onChangeText={setUsername}
          />
        </View>
      )}

      {isLogin && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Username or Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Type your username or school email"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>
      )}

      {!isLogin && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>School Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Type your .edu email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Type your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleAuth}>
        <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
        <Text style={styles.switchText}>
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
        </Text>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    width: '100%',
    backgroundColor: '#E2E8F0',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
  },
  switchText: {
    color: '#3B82F6',
    fontSize: 16,
  }
});
