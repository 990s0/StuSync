import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TitleScreen from './src/screens/TitleScreen';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FindSessionsScreen from './src/screens/FindSessionsScreen';
import HostSessionScreen from './src/screens/HostSessionScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Title"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1E3A8A',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Title" 
          component={TitleScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen} 
          options={{ title: 'Login / Sign Up' }} 
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'StuSync Dashboard', headerBackVisible: false }} 
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ title: 'My Profile' }} 
        />
        <Stack.Screen 
          name="FindSessions" 
          component={FindSessionsScreen} 
          options={{ title: 'Find Sessions' }} 
        />
        <Stack.Screen 
          name="HostSession" 
          component={HostSessionScreen} 
          options={{ title: 'Host a Session' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
