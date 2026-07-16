import { useColorScheme } from "@/hooks/use-color-scheme";
import { ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthCallback() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const bg = isDark ? "#000" : "#fff";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ActivityIndicator size="large" color="#208AEF" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
