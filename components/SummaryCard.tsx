import { Colors, globalStyles as g } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

type Props = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  value: number;
  label: string;
  valueColor?: string;
};

export function SummaryCard({ icon, value, label, valueColor }: Props) {
  return (
    <View style={g.summaryCard}>
      <Ionicons name={icon} size={16} color={Colors.primary} />
      <Text style={[g.summaryValue, valueColor ? { color: valueColor } : {}]}>
        {value}
      </Text>
      <Text style={g.summaryLabel}>{label}</Text>
    </View>
  );
}
