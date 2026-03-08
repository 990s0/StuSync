import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, Animated
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { generateQuizQuestions } from '../services/gemini';
import { saveQuestions, getQuestions } from '../services/supabase';

const COLORS = ['#E74C3C', '#3498DB', '#F39C12', '#27AE60'];
const ICONS = ['▲', '◆', '●', '■'];

export default function HostGameScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { session } = route.params;

  const [phase, setPhase] = useState('setup'); // setup | generating | question | results | leaderboard
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerCounts, setAnswerCounts] = useState([0, 0, 0, 0]);
  const [timer, setTimer] = useState(15);
  const timerRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fadeIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  };

  const startGame = async () => {
    setPhase('generating');
    const itinerary = session.itinerary || session.subject || 'general study topics';
    const subject = session.subject || 'General';
    const generated = await generateQuizQuestions(itinerary, subject);

    if (!generated || generated.length === 0) {
      Alert.alert('Error', 'Could not generate questions. Please try again.');
      setPhase('setup');
      return;
    }

    const saved = await saveQuestions(session.id, generated);
    if (!saved.success) {
      // Use in-memory questions if save fails (graceful degradation)
      console.warn('Could not save questions, running locally');
    }
    setQuestions(generated);
    setCurrentIndex(0);
    showQuestion(0, generated);
  };

  const showQuestion = (index, qs) => {
    const questionList = qs || questions;
    setAnswerCounts([0, 0, 0, 0]);
    setTimer(15);
    setPhase('question');
    fadeIn();

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setPhase('results');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const nextQuestion = () => {
    const next = currentIndex + 1;
    if (next >= questions.length) {
      setPhase('leaderboard');
    } else {
      setCurrentIndex(next);
      showQuestion(next);
    }
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const currentQ = questions[currentIndex];

  if (phase === 'setup') {
    return (
      <View style={styles.container}>
        <View style={styles.setupCard}>
          <Text style={styles.emoji}>🎮</Text>
          <Text style={styles.setupTitle}>Ready to Start?</Text>
          <Text style={styles.setupSubtitle}>
            Quiz: {session.subject}{'\n'}Location: {session.room}
          </Text>
          <Text style={styles.setupNote}>
            Gemini AI will generate 5 questions from your study itinerary.
          </Text>
          <TouchableOpacity style={styles.startBtn} onPress={startGame}>
            <Text style={styles.startBtnText}>🚀  Start Quiz</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (phase === 'generating') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.generatingText}>Generating quiz questions with Gemini AI...</Text>
      </View>
    );
  }

  if (phase === 'leaderboard') {
    return (
      <View style={styles.container}>
        <Text style={styles.leaderboardTitle}>🏆 Game Over!</Text>
        <Text style={styles.leaderboardSub}>{questions.length} questions completed</Text>
        <TouchableOpacity style={[styles.startBtn, { marginTop: 40 }]} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.startBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.questionCounter}>Q {currentIndex + 1} / {questions.length}</Text>
        <View style={[styles.timerBadge, timer <= 5 && styles.timerUrgent]}>
          <Text style={styles.timerText}>{timer}s</Text>
        </View>
      </View>

      {/* Question */}
      <View style={styles.questionBox}>
        <Text style={styles.questionText}>{currentQ?.question}</Text>
      </View>

      {/* Answer tiles */}
      <View style={styles.answersGrid}>
        {(currentQ?.choices || []).map((choice, i) => (
          <View key={i} style={[styles.answerTile, { backgroundColor: COLORS[i] }]}>
            <Text style={styles.answerIcon}>{ICONS[i]}</Text>
            <Text style={styles.answerText}>{choice}</Text>
            {phase === 'results' && (
              <Text style={styles.answerCount}>{answerCounts[i]} answers</Text>
            )}
          </View>
        ))}
      </View>

      {/* Results overlay */}
      {phase === 'results' && (
        <View style={styles.resultsOverlay}>
          <Text style={styles.correctLabel}>
            ✅ Correct: {currentQ?.choices?.[currentQ?.correct]}
          </Text>
          <TouchableOpacity style={styles.nextBtn} onPress={nextQuestion}>
            <Text style={styles.nextBtnText}>
              {currentIndex + 1 >= questions.length ? 'Finish Game 🏆' : 'Next Question →'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0A3C',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  setupCard: {
    backgroundColor: '#2D1B69',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
  },
  emoji: { fontSize: 60, marginBottom: 12 },
  setupTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  setupSubtitle: { fontSize: 16, color: '#B39DDB', textAlign: 'center', marginBottom: 16 },
  setupNote: { fontSize: 14, color: '#9575CD', textAlign: 'center', marginBottom: 24 },
  startBtn: {
    backgroundColor: '#7C4DFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 50,
    width: '100%',
    alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  generatingText: { color: '#fff', marginTop: 20, fontSize: 16, textAlign: 'center' },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  questionCounter: { color: '#B39DDB', fontSize: 16, fontWeight: 'bold' },
  timerBadge: {
    backgroundColor: '#7C4DFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    minWidth: 56,
    alignItems: 'center',
  },
  timerUrgent: { backgroundColor: '#E74C3C' },
  timerText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  questionBox: {
    backgroundColor: '#2D1B69',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    marginBottom: 20,
    minHeight: 100,
    justifyContent: 'center',
  },
  questionText: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  answersGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  answerTile: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    minHeight: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerIcon: { fontSize: 24, marginBottom: 6 },
  answerText: { color: '#fff', fontWeight: 'bold', fontSize: 15, textAlign: 'center' },
  answerCount: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
  resultsOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    backgroundColor: '#2D1B69',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  correctLabel: { color: '#4CAF50', fontSize: 17, fontWeight: 'bold', marginBottom: 16 },
  nextBtn: {
    backgroundColor: '#7C4DFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 50,
    width: '100%',
    alignItems: 'center',
  },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  leaderboardTitle: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 8 },
  leaderboardSub: { color: '#B39DDB', fontSize: 18 },
});
