import { Colors, globalStyles as g } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

type Props = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value?: string | null;
};

export function InfoRow({ icon, label, value }: Props) {
  return (
    <View style={g.infoRow}>
      <View style={g.iconWrap}>
        <Ionicons name={icon} size={15} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={g.infoLabel}>{label}</Text>
        <Text style={g.infoValue}>{value || "-"}</Text>
      </View>
    </View>
  );
}
