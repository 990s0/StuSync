import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator, Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { getCurrentUser, getQuestions, saveResponse, supabase } from '../services/supabase';

const COLORS = ['#E74C3C', '#3498DB', '#F39C12', '#27AE60'];
const ICONS = ['▲', '◆', '●', '■'];

export default function GameScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { session } = route.params;

  const [phase, setPhase] = useState('loading'); // loading | question | answered | finished
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(15);
  const [startTime, setStartTime] = useState(null);
  const [loadingRetries, setLoadingRetries] = useState(0);
  const timerRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;


  const loadQuestions = async () => {
    let retries = 0;
    const maxRetries = 15; // Try for up to 30 seconds (15 * 2s)
    
    while (retries < maxRetries) {
      setLoadingRetries(retries);
      const qs = await getQuestions(session.id);
      if (qs && qs.length > 0) {
        setQuestions(qs);
        showQuestion(0, qs);
        return;
      }
      retries++;
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
      }
    }
    
    // If we've retried max times and still no questions, show error
    setPhase('no_questions');
  };

  useEffect(() => {
    let isMounted = true;
    
    async function init() {
      if (isMounted) {
        await loadQuestions();
      }
    }
    
    init();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for host-controlled question advancement
  useEffect(() => {
    if (!session?.id) return;
    
    let isMounted = true;
    const channel = supabase.channel(`quiz_${session.id}`);
    
    const subscription = channel.on('broadcast', { event: 'advance_question' }, (payload) => {
      if (isMounted && questions.length > 0) {
        const nextIndex = payload.payload.questionIndex;
        setCurrentIndex(nextIndex);
        setSelectedAnswer(null);
        showQuestion(nextIndex, questions);
      }
    }).on('broadcast', { event: 'show_results' }, () => {
      if (isMounted) {
        setPhase('results');
      }
    }).on('broadcast', { event: 'quiz_finished' }, () => {
      if (isMounted) {
        clearInterval(timerRef.current);
        setPhase('finished');
      }
    }).subscribe();

    return () => {
      isMounted = false;
      if (subscription) {
        supabase.removeChannel(channel);
      }
    };
  }, [session?.id, questions]);

  const fadeIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  };

  const showQuestion = (index, qs) => {
    const questionList = qs || questions;
    setSelectedAnswer(null);
    setStartTime(Date.now());
    setPhase('question');
    fadeIn();
    // Attendees don't have a local timer - host controls timing
  };

  const handleAnswer = async (answerIndex, questionOverride) => {
    clearInterval(timerRef.current);
    const q = questionOverride || questions[currentIndex];
    const timeTaken = (Date.now() - startTime) / 1000;

    setSelectedAnswer(answerIndex);

    const isCorrect = answerIndex === q.correct;
    const points = isCorrect ? Math.max(0, 1000 - Math.floor(timeTaken * 50)) : 0;
    setScore(prev => prev + points);
    setPhase('answered');

    const user = await getCurrentUser();
    if (q.id && user?.id) {
      await saveResponse(session.id, q.id, user.id, answerIndex, timeTaken);
    }
  };

  const nextQuestion = () => {
    const next = currentIndex + 1;
    if (next >= questions.length) {
      setPhase('finished');
    } else {
      setCurrentIndex(next);
      showQuestion(next);
    }
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const currentQ = questions[currentIndex];

  if (phase === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading quiz...</Text>
        {loadingRetries > 0 && (
          <Text style={styles.loadingSubtext}>Waiting for host to start... ({loadingRetries})</Text>
        )}
      </View>
    );
  }

  if (phase === 'no_questions') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorText}>The host hasn&apos;t started the quiz yet!</Text>
        <Text style={styles.errorSub}>Please wait for the host to begin.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'finished') {
    return (
      <View style={styles.container}>
        <Text style={styles.finishedEmoji}>🏆</Text>
        <Text style={styles.finishedTitle}>Quiz Complete!</Text>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Your Score</Text>
          <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
          <Text style={styles.scoreMax}>out of {questions.length * 1000}</Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.scorePill}>⭐ {score.toLocaleString()}</Text>
        <Text style={styles.questionCounter}>{currentIndex + 1} / {questions.length}</Text>
      </View>

      {/* Question */}
      <View style={styles.questionBox}>
        <Text style={styles.questionText}>{currentQ?.question}</Text>
      </View>

      {/* Answer tiles */}
      <View style={styles.answersGrid}>
        {(currentQ?.choices || []).map((choice, i) => {
          let tileStyle = { backgroundColor: COLORS[i] };
          if (phase === 'answered') {
            if (i === selectedAnswer) tileStyle = { ...tileStyle, borderWidth: 3, borderColor: '#FFD700' };
          }
          if (phase === 'results') {
            if (i === currentQ.correct) tileStyle = { ...tileStyle, borderWidth: 4, borderColor: '#4CAF50' };
            else if (i === selectedAnswer && i !== currentQ.correct) tileStyle = { ...tileStyle, opacity: 0.4 };
          }
          return (
            <TouchableOpacity
              key={i}
              style={[styles.answerTile, tileStyle]}
              onPress={() => phase === 'question' && handleAnswer(i)}
              disabled={phase !== 'question'}
            >
              <Text style={styles.answerIcon}>{ICONS[i]}</Text>
              <Text style={styles.answerText}>{choice}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Result feedback */}
      {phase === 'answered' && (
        <View style={styles.feedbackBar}>
          <Text style={styles.feedbackText}>
            ✓ Answer submitted
          </Text>
          <Text style={styles.waitingForHostText}>
            Waiting for host to reveal answer...
          </Text>
        </View>
      )}

      {/* Results revealed */}
      {phase === 'results' && (
        <View style={styles.feedbackBar}>
          <Text style={styles.feedbackText}>
            {selectedAnswer === currentQ?.correct ? '✅ Correct!' : '❌ Wrong!'}
          </Text>
          <Text style={styles.correctAnswerText}>
            Answer: {currentQ?.choices?.[currentQ?.correct]}
          </Text>
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
  loadingText: { color: '#fff', marginTop: 16, fontSize: 16 },
  loadingSubtext: { color: '#B39DDB', marginTop: 8, fontSize: 13 },
  errorEmoji: { fontSize: 60, marginBottom: 12 },
  errorText: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  errorSub: { color: '#B39DDB', fontSize: 15, textAlign: 'center', marginBottom: 24 },
  finishedEmoji: { fontSize: 72, marginBottom: 12 },
  finishedTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  scoreCard: {
    backgroundColor: '#2D1B69',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    marginBottom: 32,
  },
  scoreLabel: { color: '#B39DDB', fontSize: 16, marginBottom: 8 },
  scoreValue: { color: '#FFD700', fontSize: 56, fontWeight: 'bold' },
  scoreMax: { color: '#9575CD', fontSize: 14, marginTop: 4 },
  backBtn: {
    backgroundColor: '#7C4DFF',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 50,
    width: '100%',
    alignItems: 'center',
  },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  scorePill: {
    backgroundColor: '#2D1B69',
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  questionCounter: { color: '#B39DDB', fontSize: 15, fontWeight: 'bold' },
  timerBadge: {
    backgroundColor: '#7C4DFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 48,
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
  feedbackBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#2D1B69',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedbackText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  waitingForHostText: { color: '#B39DDB', fontSize: 14, marginTop: 12, textAlign: 'center', fontStyle: 'italic' },
  correctAnswerText: { color: '#4CAF50', fontSize: 13, marginTop: 8, textAlign: 'center' },
});
