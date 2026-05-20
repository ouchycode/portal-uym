import { useAuth } from "@/store/auth";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const isHydrated = useAuth((s) => s.isHydrated);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F6FB" }}>
        <ActivityIndicator size="large" color="#0D47A1" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
