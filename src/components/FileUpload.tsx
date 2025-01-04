import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

interface FileUploadProps {
  onFileSelect: (file: DocumentPicker.DocumentResult) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [fileName, setFileName] = useState<string>('No file chosen');

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
      });
      
      if (result.type === 'success') {
        setFileName(result.name);
        onFileSelect(result);
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Upload file</Text>
      <View style={styles.uploadContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleFilePick}
        >
          <Text style={styles.buttonText}>Choose File</Text>
        </TouchableOpacity>
        <View style={styles.fileNameContainer}>
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  uploadContainer: {
    flexDirection: 'row',
  },
  button: {
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  fileNameContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: '#d1d5db',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  fileName: {
    color: '#6b7280',
    fontSize: 14,
  },
});
