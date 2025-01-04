import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { ExcelRow } from '../types';

interface DataTableProps {
  data: ExcelRow[];
}

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const totalPages = Math.ceil(data.length / rowsPerPage);
  
  if (!data.length) return null;

  const startIndex = (currentPage - 1) * rowsPerPage;
  const visibleData = data.slice(startIndex, startIndex + rowsPerPage);
  const columns = ['Phone Number', 'Frame', 'R--C--S', 'MSAN Code'];

  return (
    <View style={styles.container}>
      <ScrollView horizontal>
        <View>
          <View style={styles.headerRow}>
            {columns.map((header) => (
              <View key={header} style={styles.headerCell}>
                <Text style={styles.headerText}>{header}</Text>
              </View>
            ))}
          </View>
          <View style={styles.body}>
            {visibleData.map((row, index) => (
              <View key={index} style={styles.row}>
                {columns.map((column) => (
                  <View key={column} style={styles.cell}>
                    <Text style={styles.cellText}>
                      {row[column as keyof ExcelRow]}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.pagination}>
        <TouchableOpacity
          onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
        >
          <Text style={styles.pageButtonText}>Previous</Text>
        </TouchableOpacity>
        
        <Text style={styles.pageText}>
          Page {currentPage} of {totalPages}
        </Text>
        
        <TouchableOpacity
          onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
        >
          <Text style={styles.pageButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
  },
  headerCell: {
    padding: 12,
    width: 120,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  body: {
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  cell: {
    padding: 12,
    width: 120,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cellText: {
    fontSize: 14,
    color: '#6b7280',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  pageButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  pageButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  pageText: {
    fontSize: 14,
    color: '#4b5563',
  },
});
