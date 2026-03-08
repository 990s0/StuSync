import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator, Alert, Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { generateQuizQuestions } from '../services/groq';
import { getCurrentUser, saveQuestions, saveResponse, supabase } from '../services/supabase';

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
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [responseCount, setResponseCount] = useState(0);
  const [hostAnswer, setHostAnswer] = useState(null);
  const [hostAnswered, setHostAnswered] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const timerRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fadeIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  };

  const saveQuestionsWithFallback = async (sessionId, questions) => {
    // First try: use the regular saveQuestions function
    const saved = await saveQuestions(sessionId, questions);
    if (saved.success) {
      return { success: true };
    }

    // Fallback: try to insert directly to Supabase
    console.warn('saveQuestions failed, attempting direct insert:', saved.error);
    try {
      const rows = questions.map((q, i) => ({
        session_id: sessionId,
        question: q.question,
        choices: q.choices,
        correct: q.correct,
        order_index: i,
      }));
      const { data, error } = await supabase.from('questions').insert(rows).select();
      if (error) {
        console.error('Direct insert fallback also failed:', error.message);
        return { success: false, error: error.message };
      }
      console.log('Direct insert fallback succeeded');
      return { success: true, data };
    } catch (error) {
      console.error('Direct insert exception:', error.message);
      return { success: false, error: error.message };
    }
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

    const saved = await saveQuestionsWithFallback(session.id, generated);
    if (!saved.success) {
      // Cannot proceed - attendees won't be able to see questions
      console.error('Failed to save questions to database:', saved.error);
      Alert.alert(
        'Database Error',
        `Could not save questions to the database. Attendees won't be able to join.\n\nError: ${saved.error}\n\nMake sure all required database columns exist (questions table should have: id, session_id, question, choices, correct, order_index).`,
        [{ text: 'Try Again', onPress: () => setPhase('setup') }]
      );
      setPhase('setup');
      return;
    }
    setQuestions(generated);
    setCurrentIndex(0);
    showQuestion(0, generated);
  };

  const showQuestion = (index, qs) => {
    setAnswerCounts([0, 0, 0, 0]);
    setResponseCount(0);
    setHostAnswer(null);
    setHostAnswered(false);
    setStartTime(Date.now());
    setTimer(15);
    setPhase('question');
    fadeIn();

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setPhase('results');
          // Broadcast show_results so attendees see correct answer
          supabase.channel(`quiz_${session.id}`).send({
            type: 'broadcast',
            event: 'show_results',
            payload: { sessionId: session.id }
          });
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
      // Broadcast game end to attendees
      supabase.channel(`quiz_${session.id}`).send({
        type: 'broadcast',
        event: 'quiz_finished',
        payload: { sessionId: session.id }
      });
    } else {
      setCurrentIndex(next);
      showQuestion(next, questions);
      // Broadcast new question to attendees
      supabase.channel(`quiz_${session.id}`).send({
        type: 'broadcast',
        event: 'advance_question',
        payload: { questionIndex: next, sessionId: session.id }
      });
    }
  };

  const handleHostAnswer = async (answerIndex) => {
    if (hostAnswered) return; // Already answered

    setHostAnswer(answerIndex);
    setHostAnswered(true);
    
    const q = questions[currentIndex];
    const timeTaken = (Date.now() - startTime) / 1000;
    
    // Save host's response to database
    const user = await getCurrentUser();
    if (q.id && user?.id) {
      await saveResponse(session.id, q.id, user.id, answerIndex, timeTaken);
    }
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // Track attendee responses and stop timer when all have answered
  useEffect(() => {
    if (!session?.id || questions.length === 0 || phase !== 'question') return;

    let isMounted = true;

    const setupResponseTracking = async () => {
      // Get attendee count
      const { count } = await supabase
        .from('lobby_members')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.id);
      
      if (isMounted) {
        setAttendeeCount(count || 0);
      }

      // Subscribe to response changes for this session
      const currentQuestion = questions[currentIndex];
      const subscription = supabase
        .channel(`responses_${session.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'responses',
            filter: `session_id=eq.${session.id}`,
          },
          async () => {
            // Count responses for current question
            const { count: respCount, data: responses } = await supabase
              .from('responses')
              .select('answer_index')
              .eq('session_id', session.id)
              .eq('question_id', currentQuestion.id);

            if (isMounted) {
              setResponseCount(respCount || 0);

              // Update answer counts
              const counts = [0, 0, 0, 0];
              (responses || []).forEach((resp) => {
                if (resp.answer_index !== null && resp.answer_index >= 0) {
                  counts[resp.answer_index]++;
                }
              });
              setAnswerCounts(counts);

              // If all attendees answered, stop timer and show results
              if (respCount >= count && count > 0) {
                clearInterval(timerRef.current);
                setPhase('results');
              }
            }
          }
        )
        .subscribe();

      return subscription;
    };

    setupResponseTracking();

    return () => {
      isMounted = false;
    };
  }, [session?.id, questions, currentIndex, phase]);

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
            Groq AI will generate 5 questions from your study itinerary.
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
        <Text style={styles.generatingText}>Generating quiz questions with Groq AI...</Text>
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
        <Text style={styles.responseCounter}>👥 {responseCount}/{attendeeCount}</Text>
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
        {(currentQ?.choices || []).map((choice, i) => {
          let tileStyle = { backgroundColor: COLORS[i] };
          
          // Show host's answer with highlight
          if (phase === 'question' && hostAnswered && i === hostAnswer) {
            tileStyle = { ...tileStyle, borderWidth: 3, borderColor: '#FFD700' };
          }
          
          // Show correct answer and host's result when phase is results
          if (phase === 'results') {
            if (i === currentQ.correct) {
              tileStyle = { ...tileStyle, borderWidth: 4, borderColor: '#4CAF50' };
            } else if (i === hostAnswer && i !== currentQ.correct) {
              tileStyle = { ...tileStyle, opacity: 0.4 };
            }
          }
          
          return (
            <TouchableOpacity
              key={i}
              style={[styles.answerTile, tileStyle]}
              onPress={() => phase === 'question' && !hostAnswered && handleHostAnswer(i)}
              disabled={phase !== 'question' || hostAnswered}
              activeOpacity={hostAnswered ? 0.5 : 0.7}
            >
              <Text style={styles.answerIcon}>{ICONS[i]}</Text>
              <Text style={styles.answerText}>{choice}</Text>
              {phase === 'results' && (
                <Text style={styles.answerCount}>{answerCounts[i]} answers</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Results overlay */}
      {phase === 'results' && (
        <View style={styles.resultsOverlay}>
          <Text style={styles.correctLabel}>
            ✅ Correct: {currentQ?.choices?.[currentQ?.correct]}
          </Text>
          {hostAnswered && (
            <Text style={[styles.hostFeedback, hostAnswer === currentQ?.correct ? styles.hostCorrect : styles.hostWrong]}>
              {hostAnswer === currentQ?.correct ? '✅ You got it right!' : '❌ You got it wrong'}
            </Text>
          )}
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
  responseCounter: { color: '#9575CD', fontSize: 15, fontWeight: '600' },
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
  hostFeedback: { fontSize: 15, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  hostCorrect: { color: '#4CAF50' },
  hostWrong: { color: '#FF6B6B' },
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
