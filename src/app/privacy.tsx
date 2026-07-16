import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PrivacyPolicyScreen() {
  const isDark = useColorScheme() === 'dark';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#FFF' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>Privacy Policy</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.text, { color: isDark ? '#FFF' : '#000' }]}>
          Last updated: {new Date().toLocaleDateString()}
        </Text>
        <Text style={[styles.paragraph, { color: isDark ? '#CCC' : '#333' }]}>
          Welcome to our app. We value your privacy. We are providing this app "as-is".
          {"\n\n"}
          We do not have any liability for any data loss, damages, or issues arising from the use of this app.
          By using this app, you acknowledge and agree that we are not responsible for any information you provide or any interactions you have on the platform.
          {"\n\n"}
          This privacy policy is basic and intended to protect the creators from any liability. Use the app at your own risk.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: {
    padding: 6,
    marginLeft: -6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    padding: 24,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
  },
});
