import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager, StyleSheet, ScrollView, TextInput } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ = [
  { q: 'Como redefinir minha senha?', a: 'Acesse Admin > Configurações > Configurações de sistema e selecione a opção para redefinir sua senha.' },
  { q: 'Como adicionar um colaborador?', a: 'Acesse Admin > Gerenciar Colaboradores > Convidar.' },
  { q: 'Como trocar de obra ativa?', a: 'Vá em Perfil > Trocar de Obra.' },
  { q: 'Como registrar o progresso de uma tarefa?', a: 'Acesse a tarefa desejada, clique em “Atualizar Progresso” e preencha as informações solicitadas.' },
  { q: 'Como receber notificações de novas tarefas?', a: 'Certifique-se de que as notificações estão ativadas em Perfil > Privacidade > Notificações.' },
  { q: 'Como alterar meus dados cadastrais?', a: 'Vá em Perfil, clique no campo que deseja alterar (nome, foto, e-mail) e salve as alterações.' },
  { q: 'Como excluir minha conta?', a: 'Vá em Perfil > Privacidade > Excluir conta. Confirme a exclusão no modal de confirmação.' },
  { q: 'Como relatar um problema ou sugerir uma melhoria?', a: 'Entre em contato pelo e-mail suporte@obralimpa.com ou pelo WhatsApp disponível na tela de suporte.' },
  { q: 'Como visualizar o histórico de tarefas concluídas?', a: 'Acesse a aba Progresso e filtre por tarefas concluídas.' },
  { q: 'Como sair do aplicativo?', a: 'Vá em Perfil e clique em “Sair”.' },
  // Perguntas ocultas (só aparecem na busca):
  { q: 'Como exportar relatórios em PDF?', a: 'Acesse Admin > Relatórios e clique em Exportar PDF.', hidden: true },
  { q: 'Como alterar permissões de um colaborador?', a: 'Acesse Admin > Gerenciar Colaboradores, selecione o colaborador e ajuste as permissões.', hidden: true },
  { q: 'Como restaurar uma tarefa excluída?', a: 'Entre em contato com o suporte para restaurar tarefas excluídas.', hidden: true },
];

export default function FAQAccordionComBusca() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const filteredFAQ = FAQ.filter(item => {
    if (!search.trim()) return !item.hidden;
    return (
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase())
    );
  });

  const toggle = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <View>
      <TextInput
        style={styles.search}
        placeholder="Buscar no FAQ..."
        value={search}
        onChangeText={setSearch}
      />
      <ScrollView>
        {filteredFAQ.length === 0 && (
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>Nenhuma pergunta encontrada.</Text>
        )}
        {filteredFAQ.map((item, idx) => (
          <View key={idx} style={styles.card}>
            <TouchableOpacity onPress={() => toggle(idx)} style={styles.questionRow}>
              <Text style={styles.question}>{item.q}</Text>
              {openIndex === idx ? (
                <ChevronUp size={22} color="#2563EB" />
              ) : (
                <ChevronDown size={22} color="#2563EB" />
              )}
            </TouchableOpacity>
            {openIndex === idx && (
              <Text style={styles.answer}>{item.a}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, padding: 12, elevation: 1 },
  questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  question: { fontWeight: 'bold', fontSize: 15, color: '#111827' },
  answer: { marginTop: 8, fontSize: 14, color: '#374151' },
}); 