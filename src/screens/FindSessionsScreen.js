import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator, RefreshControl } from 'react-native';
import { MapPin, BookOpen, User, Filter } from 'lucide-react-native';
import { getSessions } from '../services/supabase';

// Mock data reflecting what would be in Firestore
const mockSessions = [
  { id: '1', class: 'CS 314', building: 'GDC', hostMajor: 'Computer Science', hostName: 'Alice', title: 'Data Structures Midterm Prep' },
  { id: '2', class: 'BIO 311C', building: 'WEL', hostMajor: 'Biology', hostName: 'Bob', title: 'Intro Bio Chapter 4' },
  { id: '3', class: 'M 408D', building: 'PMA', hostMajor: 'Mathematics', hostName: 'Charlie', title: 'Calculus II Integration Practice' },
  { id: '4', class: 'CS 429', building: 'GDC', hostMajor: 'Computer Engineering', hostName: 'Diana', title: 'Architecture Assembly Review' },
];

export default function FindSessionsScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOption, setSortOption] = useState('None');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const loadSessions = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    
    try {
      const data = await getSessions();
      setSessions(data);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadSessions();
  }, []);

  const applySort = (option) => {
    let sorted = [...sessions];
    if (option === 'Class') {
      sorted.sort((a, b) => a.class.localeCompare(b.class));
    } else if (option === 'Building') {
      sorted.sort((a, b) => a.building.localeCompare(b.building));
    } else if (option === 'Host Major') {
      sorted.sort((a, b) => a.hostMajor.localeCompare(b.hostMajor));
    }
    setSessions(sorted);
    setSortOption(option);
    setFilterModalVisible(false);
  };

  const renderSessionItem = ({ item }) => (
    <TouchableOpacity style={styles.sessionCard}>
      <Text style={styles.sessionTitle}>{item.title}</Text>
      
      <View style={styles.detailRow}>
        <BookOpen color="#10B981" size={18} />
        <Text style={styles.detailText}>{item.class}</Text>
      </View>
      
      <View style={styles.detailRow}>
        <MapPin color="#EF4444" size={18} />
        <Text style={styles.detailText}>{item.building}</Text>
      </View>

      <View style={styles.detailRow}>
        <User color="#3B82F6" size={18} />
        <Text style={styles.detailText}>Host: {item.hostName} ({item.hostMajor})</Text>
      </View>

      <TouchableOpacity style={styles.joinButton}>
        <Text style={styles.joinButtonText}>Join Session</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Open Sessions</Text>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
          <Filter color="white" size={20} />
          <Text style={styles.filterText}>Sort: {sortOption}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Finding study sessions...</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No active sessions found.</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => loadSessions()}>
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={item => item.id.toString()}
          renderItem={renderSessionItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadSessions(true)} />
          }
        />
      )}

      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort Sessions By</Text>
            
            {['None', 'Class', 'Building', 'Host Major'].map(option => (
              <TouchableOpacity
                key={option}
                style={styles.modalOption}
                onPress={() => applySort(option)}
              >
                <Text style={styles.modalOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 15,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  filterButton: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  filterText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  sessionCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#475569',
  },
  joinButton: {
    backgroundColor: '#10B981',
    marginTop: 15,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  joinButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 18,
    color: '#334155',
  },
  modalCloseBtn: {
    marginTop: 20,
    backgroundColor: '#EF4444',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 20,
  },
  refreshBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  refreshBtnText: {
    color: 'white',
    fontWeight: 'bold',
  }
});
