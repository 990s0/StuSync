import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { User, Star, Award, BookOpen, Presentation, LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { getCurrentUser, supabase } from '../services/supabase';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setLoading(true);
    try {
      // Try to get the current session from Supabase directly
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        const cached = await getCurrentUser();
        setUser(cached);
      }
    } catch (e) {
      console.error('Profile load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.auth.signOut();
            if (error) console.error("Sign out error:", error.message);
          } catch (e) {
            console.error("Sign out exception:", e);
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const displayName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Student';
  const email = user?.email || 'Not signed in';
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.subText}>{email}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Star color="#F59E0B" size={30} />
          <Text style={styles.statValue}>New</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statBox}>
          <Award color="#3B82F6" size={30} />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <BookOpen color="#64748B" size={24} />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailTitle}>Sessions Joined</Text>
            <Text style={styles.detailValue}>0</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Presentation color="#64748B" size={24} />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailTitle}>Sessions Hosted</Text>
            <Text style={styles.detailValue}>0</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <User color="#64748B" size={24} />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailTitle}>Account ID</Text>
            <Text style={[styles.detailValue, { fontSize: 12, color: '#94A3B8' }]}>
              {user?.id ? user.id.substring(0, 16) + '...' : 'Not signed in'}
            </Text>
          </View>
        </View>
      </View>

      {user ? (
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <LogOut color="white" size={18} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.signInBtn} onPress={() => navigation.navigate('Auth')}>
          <Text style={styles.signInText}>Sign In / Create Account</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#1A0A3C',
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#7C4DFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: 'white'
  },
  avatarInitials: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
  },
  subText: {
    fontSize: 14,
    color: '#B39DDB',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: -30,
    paddingHorizontal: 20,
  },
  statBox: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: '45%',
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 5,
  },
  detailsContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  detailTextContainer: {
    marginLeft: 15,
  },
  detailTitle: {
    fontSize: 14,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 5,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signInBtn: {
    backgroundColor: '#7C4DFF',
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  signInText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
