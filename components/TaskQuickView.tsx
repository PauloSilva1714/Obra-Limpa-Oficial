import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { X, MessageCircle, ChevronLeft, ChevronRight, Video as VideoIcon } from 'lucide-react-native';
import type { Task } from '../services/TaskService';
import { shadows } from '../utils/shadowUtils';

let Video: any, ResizeMode: any;
if (Platform.OS !== 'web') {
  ({ Video, ResizeMode } = require('expo-video'));
}

interface TaskQuickViewProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onOpenTheater: () => void;
  onAddComment?: (text: string) => void;
}

export function TaskQuickView({ visible, task, onClose, onOpenTheater, onAddComment }: TaskQuickViewProps) {
  const [comment, setComment] = useState('');
  const [mediaIndex, setMediaIndex] = useState(0);

  if (!task) return null;

  // Juntar fotos e vídeos em uma lista única para o carrossel
  const medias = [
    ...(task.photos || []).map(url => ({ type: 'photo', url })),
    ...(task.videos || []).map(url => ({ type: 'video', url })),
  ];
  const hasMedia = medias.length > 0;
  const currentMedia = medias[mediaIndex] || null;

  const handlePrev = () => setMediaIndex(i => (i > 0 ? i - 1 : medias.length - 1));
  const handleNext = () => setMediaIndex(i => (i < medias.length - 1 ? i + 1 : 0));

  function renderMedia(media: any, styles: any) {
    if (!media) return null;
    if (media.type === 'photo') {
      return <Image source={{ uri: media.url }} style={styles.mediaImage} resizeMode="cover" />;
    }
    if (Platform.OS === 'web') {
      return <video src={media.url} controls style={styles.mediaImage} />;
    }
    if (Video) {
      return (
        <Video
          source={{ uri: media.url }}
          style={styles.mediaImage}
          resizeMode={ResizeMode && ResizeMode.COVER}
          useNativeControls
        />
      );
    }
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <View style={styles.mediaContainer}>
            {hasMedia ? (
              <>
                {renderMedia(currentMedia, styles)}
                {medias.length > 1 && (
                  <View style={styles.mediaNav}>
                    <TouchableOpacity onPress={handlePrev} style={styles.mediaNavButton}>
                      <ChevronLeft size={22} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleNext} style={styles.mediaNavButton}>
                      <ChevronRight size={22} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noMedia}><Text style={{ color: '#888' }}>Sem mídia</Text></View>
            )}
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>{task.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={22} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Informações Básicas</Text>
            <Text style={styles.infoLabel}>Título da Tarefa</Text>
            <Text style={styles.infoValue}>{task.title}</Text>
            <Text style={styles.infoLabel}>Descrição Detalhada</Text>
            <Text style={styles.infoValue}>{task.description}</Text>
          </View>
          <Text style={styles.status}>{task.status === 'completed' ? 'Concluída' : task.status === 'in_progress' ? 'Em andamento' : 'Pendente'}</Text>
          <Text style={styles.description} numberOfLines={3}>{task.description}</Text>

          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>Comentários</Text>
            <FlatList
              data={task.comments?.slice(-3) || []}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <MessageCircle size={16} color="#888" style={{ marginRight: 4 }} />
                  <Text style={styles.commentText}><Text style={styles.commentUser}>{item.userName}:</Text> {item.text}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.noComments}>Nenhum comentário ainda.</Text>}
            />
          </View>
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Comente algo..."
              value={comment}
              onChangeText={setComment}
              onSubmitEditing={() => {
                if (comment.trim() && onAddComment) {
                  onAddComment(comment.trim());
                  setComment('');
                }
              }}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={styles.theaterButton}
              onPress={onOpenTheater}
            >
              <Text style={styles.theaterButtonText}>Ver em tela cheia</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: Math.min(600, width * 0.95),
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 0,
    boxShadow: '0px 20px 25px rgba(0,0,0,0.1)',
    elevation: 5,
    overflow: 'hidden',
    maxHeight: height * 0.95,
  },
  mediaContainer: {
    width: '100%',
    height: 320,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  noMedia: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  mediaNav: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    zIndex: 2,
  },
  mediaNavButton: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 28,
    paddingTop: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
  },
  status: {
    fontSize: 15,
    color: '#666',
    marginBottom: 6,
    paddingHorizontal: 28,
  },
  description: {
    fontSize: 16,
    color: '#444',
    marginBottom: 12,
    paddingHorizontal: 28,
  },
  commentsSection: {
    marginBottom: 10,
    paddingHorizontal: 28,
  },
  commentsTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#444',
  },
  commentUser: {
    fontWeight: 'bold',
    color: '#222',
  },
  noComments: {
    color: '#888',
    fontStyle: 'italic',
    fontSize: 14,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginRight: 10,
  },
  theaterButton: {
    backgroundColor: '#18344A',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  theaterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  infoCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    marginHorizontal: 28,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#222',
    marginBottom: 10,
  },
});