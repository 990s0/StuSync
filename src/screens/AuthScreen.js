import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signUp, signIn } from '../services/supabase';
import * as Haptics from 'expo-haptics';

export default function AuthScreen() {
  const navigation = useNavigation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState('');

  const handleAuth = async () => {
    console.log("!!! SIGN UP / LOGIN BUTTON PRESSED !!!");
    if (!isLogin && !email.includes('@')) {
      Alert.alert("Invalid Email", "Please use a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert("Invalid Password", "Password must be at least 6 characters.");
      return;
    }
    if (!isLogin && !username) {
      Alert.alert("Username Required", "Please enter a username.");
      return;
    }

    setIsLoading(true);
    setAuthStatus('');
    console.log("handleAuth started", { isLogin, email, username });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let result;
      if (isLogin) {
        // For login, we use email but the user might type username in the same field
        // Simple logic for this demo: if it doesn't have @, we assume it's username (but Supabase Auth usually needs email)
        // Let's assume the user provides email for now, or we'd need to fetch user by username first.
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password, username);
      }

      if (result.success) {
        console.log("Auth Successful Payload:", result.data);
        const userData = result.data.user || result.data;
        const sessionData = result.data.session || (result.data.access_token ? result.data : null);

        // If identities is empty or session is missing, email confirmation might be needed
        if (!isLogin && (!sessionData || (userData.identities && userData.identities.length === 0))) {
          setAuthStatus("Success! CHECK YOUR EMAIL to confirm your account.");
          Alert.alert("Check Your Email", "Signup successful! Please confirm your email before logging in.");
          setIsLogin(true);
        } else {
          setAuthStatus("Success!");
          navigation.replace('Home');
        }
      } else {
        const errorMsg = typeof result.error === 'string' ? result.error : "Please try again.";
        console.error("Auth Failure Error:", result.error);
        setAuthStatus("Error: " + errorMsg);
        Alert.alert("Auth Error", errorMsg);
      }
    } catch (e) {
      console.error("Auth Exception:", e);
      setAuthStatus("Unexpected Error occurred.");
      Alert.alert("Error", "An unexpected error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
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

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{isLogin ? 'Email' : 'School Email'}</Text>
            <TextInput
              style={styles.input}
              placeholder={isLogin ? "Type your school email" : "Type your .edu email"}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
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

          {authStatus ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>{authStatus}</Text>
            </View>
          ) : null}

          <TouchableOpacity 
            style={[styles.button, isLoading && { opacity: 0.7 }, { borderWidth: 2, borderColor: '#3B82F6' }]} 
            onPress={() => {
              console.log(">>> CLICK DETECTED ON SIGNUP/LOGIN BUTTON <<<");
              handleAuth();
            }}
            disabled={isLoading}
            activeOpacity={0.6}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </Text>
          </TouchableOpacity>


        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#FAF9F6',
    justifyContent: 'center', // Center content vertically
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
  },
  statusBox: {
    width: '100%',
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  statusText: {
    color: '#92400E',
    textAlign: 'center',
    fontWeight: 'bold',
  },

});
