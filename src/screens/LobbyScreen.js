import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase, getCurrentUser, joinLobby, leaveLobby, deleteSession, getQuestions } from '../services/supabase';

export default function LobbyScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { session, isHost } = route.params;

  const [attendeeCount, setAttendeeCount] = useState(0);
  const userRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    let subscription = null;

    async function setup() {
      // Get current user
      const user = await getCurrentUser();
      if (!isMounted) return;
      userRef.current = user;

      // Join the lobby (delete first to prevent duplicate rows on rejoin)
      if (user && session?.id) {
        await leaveLobby(session.id, user.id);
        await joinLobby(session.id, user.id);
      }

      // Fetch initial attendee count
      const { count } = await supabase
        .from('lobby_members')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.id);
      if (isMounted) setAttendeeCount(count || 0);

      // Subscribe to realtime changes on lobby_members for this session
      subscription = supabase
        .channel(`lobby_${session.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'lobby_members',
            filter: `session_id=eq.${session.id}`,
          },
          async () => {
            // Re-fetch count on any change
            const { count: newCount } = await supabase
              .from('lobby_members')
              .select('*', { count: 'exact', head: true })
              .eq('session_id', session.id);
            if (isMounted) setAttendeeCount(newCount || 0);
          }
        )
        .subscribe();
    }

    setup();

    return () => {
      isMounted = false;
      // Leave the lobby — use ref so we always have the actual user
      if (userRef.current && session?.id) {
        leaveLobby(session.id, userRef.current.id);
      }
      // Unsubscribe from realtime
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [session.id]);

  // Non-hosts: watch for quiz start (questions created) and auto-join game
  useEffect(() => {
    if (isHost || !session?.id) return;

    let isMounted = true;
    const sessionId = session.id;
    let intervalId = setInterval(async () => {
      try {
        const qs = await getQuestions(sessionId);
        if (!isMounted) return;
        if (qs && qs.length > 0) {
          clearInterval(intervalId);
          intervalId = null;
          navigation.navigate('Game', { session });
        }
      } catch (e) {
        console.error('Error checking for quiz start:', e);
      }
    }, 2000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isHost, session, navigation]);

  const handleCancelSession = () => {
    if (!session?.id) {
      navigation.navigate('Home');
      return;
    }

    Alert.alert(
      'Cancel Session',
      'End this session for everyone and return to Home?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              if (userRef.current) {
                await leaveLobby(session.id, userRef.current.id);
              }
              const result = await deleteSession(session.id);
              if (!result.success) {
                console.error('Cancel session error:', result.error);
              }
            } finally {
              navigation.navigate('Home');
            }
          },
        },
      ],
    );
  };

  const handleLeaveSession = async () => {
    try {
      if (userRef.current && session?.id) {
        await leaveLobby(session.id, userRef.current.id);
      }
    } catch (e) {
      console.error('Leave session error:', e);
    } finally {
      navigation.navigate('Home');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Session Title */}
      <Text style={styles.sessionTitle}>{session?.title || 'Study Session'}</Text>

      {/* Session Details Card */}
      <View style={styles.card}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Subject / Class</Text>
          <Text style={styles.detailValue}>{session?.subject || 'N/A'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Room / Location</Text>
          <Text style={styles.detailValue}>{session?.room || 'N/A'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Study Itinerary</Text>
          <Text style={styles.detailValue}>{session?.itinerary || 'No itinerary provided'}</Text>
        </View>
      </View>

      {/* Attendee Count */}
      <View style={styles.attendeeCard}>
        <Text style={styles.attendeeIcon}>👥</Text>
        <Text style={styles.attendeeCount}>{attendeeCount}</Text>
        <Text style={styles.attendeeLabel}>in lobby</Text>
      </View>

      {/* Host: Start Quiz / Non-host: Waiting */}
      {isHost ? (
        <>
          <TouchableOpacity
            style={styles.startQuizButton}
            onPress={() => navigation.navigate('HostGame', { session })}
          >
            <Text style={styles.startQuizText}>Start Quiz 🎮</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelSession}
          >
            <Text style={styles.cancelButtonText}>Cancel Session</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={styles.waitingText}>Waiting for host to start...</Text>
          </View>
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveSession}
          >
            <Text style={styles.leaveButtonText}>Leave Session</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  sessionTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  detailRow: {
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1E293B',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  attendeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  attendeeIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  attendeeCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginRight: 6,
  },
  attendeeLabel: {
    fontSize: 16,
    color: '#64748B',
  },
  startQuizButton: {
    backgroundColor: '#10B981',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  startQuizText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    marginTop: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  waitingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  leaveButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#CBD5F5',
  },
  leaveButtonText: {
    color: '#1D4ED8',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
