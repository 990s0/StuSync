import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { User, Star, Award, BookOpen, Presentation } from 'lucide-react-native';

export default function ProfileScreen() {
  // Mock User Data
  const userProfile = {
    name: "Alex Johnson",
    gradeLevel: "Junior",
    major: "Computer Science",
    starRating: 4.8,
    sessionsJoined: 12,
    sessionsHosted: 5,
    totalPoints: 850
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <User color="white" size={60} />
        </View>
        <Text style={styles.name}>{userProfile.name}</Text>
        <Text style={styles.subText}>{userProfile.gradeLevel} • {userProfile.major}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Star color="#F59E0B" size={30} />
          <Text style={styles.statValue}>{userProfile.starRating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statBox}>
          <Award color="#3B82F6" size={30} />
          <Text style={styles.statValue}>{userProfile.totalPoints}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <BookOpen color="#64748B" size={24} />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailTitle}>Sessions Joined</Text>
            <Text style={styles.detailValue}>{userProfile.sessionsJoined}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Presentation color="#64748B" size={24} />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailTitle}>Sessions Hosted</Text>
            <Text style={styles.detailValue}>{userProfile.sessionsHosted}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: 'white'
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
  },
  subText: {
    fontSize: 16,
    color: '#BFDBFE',
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
  }
});
