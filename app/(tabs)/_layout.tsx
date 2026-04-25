import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_ICONS: Record<string, { active: any; inactive: any }> = {
  home: { active: "home", inactive: "home-outline" },
  tugas: { active: "document-text", inactive: "document-text-outline" },
  jadwal: { active: "calendar", inactive: "calendar-outline" },
  profile: { active: "person", inactive: "person-outline" },
};

const TAB_LABELS: Record<string, string> = {
  home: "Beranda",
  tugas: "Tugas",
  jadwal: "Jadwal",
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
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 52 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
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
      <Tabs.Screen name="tugas" />
      <Tabs.Screen name="jadwal" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
