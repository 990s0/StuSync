import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase, getCurrentUser, joinLobby, leaveLobby } from '../services/supabase';
import { generateStudyQuestions } from '../services/gemini';

export default function LobbyScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { session, isHost } = route.params;

  const [attendeeCount, setAttendeeCount] = useState(0);
  const [studyQuestions, setStudyQuestions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
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
  }, []);

  const handleGenerateQuestions = async () => {
    if (!session?.itinerary || !session?.subject) return;
    setIsGenerating(true);
    try {
      const questions = await generateStudyQuestions(session.itinerary, session.subject);
      setStudyQuestions(questions);
    } catch (e) {
      console.error('Generate questions error:', e);
    } finally {
      setIsGenerating(false);
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

      {/* Generate Study Questions */}
      <TouchableOpacity
        style={styles.generateButton}
        onPress={handleGenerateQuestions}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.generateButtonText}>✨ Generate Study Questions</Text>
        )}
      </TouchableOpacity>

      {studyQuestions ? (
        <View style={styles.questionsCard}>
          <Text style={styles.questionsHeader}>Study Questions</Text>
          <Text style={styles.questionsText}>{studyQuestions}</Text>
        </View>
      ) : null}

      {/* Host: Start Quiz / Non-host: Waiting */}
      {isHost ? (
        <TouchableOpacity
          style={styles.startQuizButton}
          onPress={() => navigation.navigate('HostGame', { session })}
        >
          <Text style={styles.startQuizText}>Start Quiz 🎮</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.waitingContainer}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.waitingText}>Waiting for host to start...</Text>
        </View>
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
  generateButton: {
    backgroundColor: '#8B5CF6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  generateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  questionsCard: {
    backgroundColor: '#F3E8FF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D8B4FE',
  },
  questionsHeader: {
    fontWeight: 'bold',
    color: '#6B21A8',
    marginBottom: 8,
    fontSize: 16,
  },
  questionsText: {
    color: '#4C1D95',
    lineHeight: 22,
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
});
