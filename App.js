import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import TitleScreen from './src/screens/TitleScreen';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FindSessionsScreen from './src/screens/FindSessionsScreen';
import HostSessionScreen from './src/screens/HostSessionScreen';
import HostGameScreen from './src/screens/HostGameScreen';
import GameScreen from './src/screens/GameScreen';
import LobbyScreen from './src/screens/LobbyScreen';

const Stack = createNativeStackNavigator();

const headerStyle = { backgroundColor: '#1A0A3C' };
const screenOptions = {
  headerStyle,
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="Title" component={TitleScreen}
            options={{ headerShown: false }} />
          <Stack.Screen name="Auth" component={AuthScreen}
            options={{ headerShown: true, title: 'Login / Sign Up' }} />
          <Stack.Screen name="Home" component={HomeScreen}
            options={{ title: 'StuSync Dashboard', headerBackVisible: false }} />
          <Stack.Screen name="Profile" component={ProfileScreen}
            options={{ title: 'My Profile' }} />
          <Stack.Screen name="FindSessions" component={FindSessionsScreen}
            options={{ title: 'Find Sessions' }} />
          <Stack.Screen name="HostSession" component={HostSessionScreen}
            options={{ title: 'Host a Session' }} />
          <Stack.Screen name="Lobby" component={LobbyScreen}
            options={{ title: '📚 Session Lobby', headerBackVisible: false }} />
          <Stack.Screen name="HostGame" component={HostGameScreen}
            options={{ title: '🎮 Quiz Controller' }} />
          <Stack.Screen name="Game" component={GameScreen}
            options={{ title: '🎮 Quiz Time!' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
