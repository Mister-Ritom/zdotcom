import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TermsOfServiceScreen() {
  const isDark = useColorScheme() === 'dark';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#FFF' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>Terms & Conditions</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.text, { color: isDark ? '#FFF' : '#000' }]}>
          Last updated: {new Date().toLocaleDateString()}
        </Text>
        <Text style={[styles.paragraph, { color: isDark ? '#CCC' : '#333' }]}>
          By accessing or using our app, you agree to be bound by these terms.
          {"\n\n"}
          1. No Liability: The app is provided on an "as-is" and "as available" basis. We do not have any liability for any damages, data loss, or other issues resulting from your use of this app.
          {"\n\n"}
          2. User Content: You are solely responsible for any content you upload or share on the app. We are not liable for any user-generated content.
          {"\n\n"}
          3. Termination: We reserve the right to terminate or suspend your access to the app at any time, without prior notice or liability, for any reason whatsoever.
          {"\n\n"}
          By using this app, you accept that you are doing so entirely at your own risk.
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
