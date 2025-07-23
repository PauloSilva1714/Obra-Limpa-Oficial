import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { ChevronDown, ChevronUp, X, Search } from 'lucide-react-native';
import { shadows } from '../utils/shadowUtils';

interface MultiSelectItem {
  label: string;
  value: string;
}

interface CustomMultiSelectProps {
  data: MultiSelectItem[];
  value: string[];
  onChange: (selectedValues: string[]) => void;
  placeholder?: string;
  search?: boolean;
  style?: any;
  selectedStyle?: any;
}

export function CustomMultiSelect({
  data,
  value,
  onChange,
  placeholder = "Selecione os itens",
  search = false,
  style,
  selectedStyle,
}: CustomMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filteredData = search
    ? data.filter(item =>
        item.label.toLowerCase().includes(searchText.toLowerCase())
      )
    : data;

  const selectedItems = data.filter(item => value.includes(item.value));

  const toggleItem = (itemValue: string) => {
    const newValue = value.includes(itemValue)
      ? value.filter(v => v !== itemValue)
      : [...value, itemValue];
    onChange(newValue);
  };

  const removeItem = (itemValue: string) => {
    onChange(value.filter(v => v !== itemValue));
  };

  return (
    <View style={[styles.container, style]}>
      {/* Selected items display */}
      {selectedItems.length > 0 && (
        <View style={styles.selectedContainer}>
          {selectedItems.map((item) => (
            <View key={item.value} style={[styles.selectedItem, selectedStyle]}>
              <Text style={styles.selectedText}>{item.label}</Text>
              <TouchableOpacity onPress={() => removeItem(item.value)}>
                <X size={16} color="#666" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Dropdown trigger */}
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.triggerText}>
          {selectedItems.length > 0
            ? `${selectedItems.length} selecionado(s)`
            : placeholder}
        </Text>
        {isOpen ? (
          <ChevronUp size={20} color="#666" />
        ) : (
          <ChevronDown size={20} color="#666" />
        )}
      </TouchableOpacity>

      {/* Dropdown content */}
      {isOpen && (
        <View style={styles.dropdown}>
          {search && (
            <View style={styles.searchContainer}>
              <Search size={16} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar..."
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
          )}
          <ScrollView style={styles.optionsList} nestedScrollEnabled>
            {filteredData.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.option,
                  value.includes(item.value) && styles.selectedOption,
                ]}
                onPress={() => toggleItem(item.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    value.includes(item.value) && styles.selectedOptionText,
                  ]}
                >
                  {item.label}
                </Text>
                {value.includes(item.value) && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            {filteredData.length === 0 && (
              <Text style={styles.noResults}>Nenhum resultado encontrado</Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 6,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ef',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  selectedText: {
    fontSize: 14,
    color: '#374151',
  },
  trigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  triggerText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1000,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 6,
      },
    }),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  optionsList: {
    maxHeight: 150,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedOption: {
    backgroundColor: '#f0f9ff',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  selectedOptionText: {
    color: '#2563eb',
    fontWeight: '500',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noResults: {
    padding: 12,
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic',
  },
});