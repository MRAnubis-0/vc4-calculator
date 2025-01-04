import { StyleSheet, View, Text, ScrollView, SafeAreaView, Image, TouchableOpacity, Platform, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const APP_VERSION = '1.0.0';
const UPDATE_CHECK_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/vc4-calculator/main/version.json';

export default function App() {
  const [selectedCabinet, setSelectedCabinet] = useState('Huawei');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [fullData, setFullData] = useState<any[]>([]);
  const [msanCode, setMsanCode] = useState<string>('');
  const [checking, setChecking] = useState(false);

  const calculateVC4 = (frame: number, shelf: number, cabinetType: string) => {
    const frameGroup = Math.floor((frame - 1) % 1024 / 16) + 1;
    const frameMod = cabinetType === 'Huawei' 
      ? (frame % 16 === 0 ? 15 : (frame % 16) - 1)
      : (frame % 16 === 0 ? 16 : frame % 16);
    return `${frameGroup}--${frameMod}--${shelf}`;
  };

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        copyToCacheDirectory: true
      });

      if (!result.canceled) {
        const { uri } = result.assets[0];
        setUploadedFile(result.assets[0].name);
        
        const fileUri = uri;
        let fileContent;
        
        try {
          fileContent = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (error) {
          const cacheUri = FileSystem.cacheDirectory + 'temp.xlsx';
          await FileSystem.copyAsync({
            from: fileUri,
            to: cacheUri
          });
          fileContent = await FileSystem.readAsStringAsync(cacheUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
        
        const workbook = XLSX.read(fileContent, { type: 'base64' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const processed = jsonData.map((row: any) => ({
          ...row,
          VC4: calculateVC4(Number(row.Frame), Number(row.Shelf), selectedCabinet)
        }));

        setMsanCode(processed[0]?.['MSAN Code'] || '');
        setFullData(processed); 
        setProcessedData(processed.slice(0, 5)); 
      }
    } catch (error) {
      console.error('Error processing file:', error);
    }
  };

  const createAppFolder = async () => {
    try {
      if (Platform.OS === 'android') {
        const folderPath = `${FileSystem.documentDirectory}Marg1 VC4`;
        const folderInfo = await FileSystem.getInfoAsync(folderPath);
        
        if (!folderInfo.exists) {
          await FileSystem.makeDirectoryAsync(folderPath, { intermediates: true });
        }
        return folderPath;
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }
    return null;
  };

  const handleDownload = async () => {
    if (fullData.length === 0) return;

    try {
      // Filter and structure the data with only required columns
      const downloadData = fullData.map(row => ({
        'Phone Number': row['Phone Number'],
        'MSAN Code': row['MSAN Code'],
        'Frame': row['Frame'],
        'R--C--S': row['VC4'],
        'MSAN Out': row['MSAN Out'] || '',
        'MSAN Block': row['MSAN Block'] || '',
        'Copper Out': row['Copper Out'] || '',
        'Copper Block': row['Copper Block'] || ''
      }));

      const ws = XLSX.utils.json_to_sheet(downloadData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const fileName = `${msanCode}.xlsx`;

      const folderPath = await createAppFolder();
      const filePath = folderPath ? `${folderPath}/${fileName}` : `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Save Excel File'
        });
        alert(`File ready to save with ${fullData.length} rows. Please choose a location to save it.`);
      } else {
        alert(`File saved as ${fileName} in app storage`);
      }
    } catch (error) {
      console.error('Error saving file:', error);
      alert('Error saving file. Please try again.');
    }
  };

  const checkForUpdates = async () => {
    try {
      setChecking(true);
      const response = await fetch(UPDATE_CHECK_URL);
      const data = await response.json();
      
      if (data.version > APP_VERSION) {
        const shouldUpdate = window.confirm(
          `New version ${data.version} is available. Would you like to download it?`
        );
        
        if (shouldUpdate && data.downloadUrl) {
          Linking.openURL(data.downloadUrl);
        }
      } else {
        alert('You have the latest version!');
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkForUpdates();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Image
            source={require('./assets/te.png')}
            style={styles.logo}
          />
          <Text style={styles.title}>VC4 Calculator By Seif Ehab</Text>
          <TouchableOpacity 
            style={[styles.updateButton, checking && styles.updateButtonDisabled]} 
            onPress={checkForUpdates}
            disabled={checking}
          >
            <Text style={styles.updateButtonText}>
              {checking ? 'Checking for updates...' : 'Check for Updates'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.label}>Cabinet Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCabinet}
                onValueChange={setSelectedCabinet}
                style={styles.picker}
              >
                <Picker.Item label="Huawei" value="Huawei" />
                <Picker.Item label="ZTE/Nokia" value="ZTE/Nokia" />
              </Picker>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleFileSelect}>
              <Text style={styles.buttonText}>
                {uploadedFile ? `Selected: ${uploadedFile}` : 'Select provisioning File'}
              </Text>
            </TouchableOpacity>

            {processedData.length > 0 && (
              <>
                <View style={styles.previewContainer}>
                  <Text style={styles.previewTitle}>Preview </Text>
                  <ScrollView horizontal>
                    <View>
                      <View style={styles.row}>
                        <Text style={[styles.cell, styles.headerCell]}>Phone Number</Text>
                        <Text style={[styles.cell, styles.headerCell]}>MSAN Code</Text>
                        <Text style={[styles.cell, styles.headerCell]}>Frame</Text>
                        <Text style={[styles.cell, styles.headerCell]}>R--C--S</Text>
                      </View>
                      {processedData.map((row, index) => (
                        <View key={index} style={styles.row}>
                          <Text style={styles.cell}>{row['Phone Number']}</Text>
                          <Text style={styles.cell}>{row['MSAN Code']}</Text>
                          <Text style={styles.cell}>{row['Frame']}</Text>
                          <Text style={styles.cell}>{row['VC4']}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleDownload}>
                  <Text style={styles.buttonText}>Download {msanCode}.xlsx</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Text style={styles.footerText}> {new Date().getFullYear()} Marg1 Team. All rights reserved.</Text>
        <Text style={styles.footerText}> تمت برمجه التطبيق من خلال سيف ايهاب ,سنترال المرج1  </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#1a2234',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#374151',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    marginBottom: 16,
  },
  picker: {
    height: 50,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  previewContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 5,
  },
  cell: {
    width: 120,
    padding: 8,
    textAlign: 'center',
  },
  headerCell: {
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
  },
  footer: {
    backgroundColor: '#1a2234',
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    color: 'white',
    fontSize: 14,
  },
  updateButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  updateButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
});
