import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_ICONS: Record<string, { active: any; inactive: any }> = {
  home: { active: "home", inactive: "home-outline" },
  jadwal: { active: "calendar", inactive: "calendar-outline" },
  tugas: { active: "document-text", inactive: "document-text-outline" },
  profile: { active: "person", inactive: "person-outline" },
};

const TAB_LABELS: Record<string, string> = {
  home: "Beranda",
  jadwal: "Jadwal",
  tugas: "Tugas",
  profile: "Profil",
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.hint,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopWidth: 0,
          height: Platform.OS === "android" ? 60 : 52 + insets.bottom,
          paddingBottom: Platform.OS === "android" ? 8 : insets.bottom || 8,
          paddingTop: 8,
          elevation: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name as keyof typeof TAB_ICONS];
          if (!icons) return null;
          return (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={22}
              color={color}
            />
          );
        },
        tabBarLabel:
          TAB_LABELS[route.name as keyof typeof TAB_LABELS] || route.name,
      })}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="jadwal" />
      <Tabs.Screen name="tugas" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
