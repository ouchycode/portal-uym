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
  const color = valueColor ?? Colors.primary;

  return (
    <View
      style={[g.summaryCard, valueColor ? { borderTopColor: valueColor } : {}]}
    >
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[g.summaryValue, { color }]}>{value}</Text>
      <Text style={g.summaryLabel}>{label}</Text>
    </View>
  );
}
