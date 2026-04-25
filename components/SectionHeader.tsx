import { Colors, globalStyles as g } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

type Props = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
};

export function SectionHeader({ icon, title }: Props) {
  return (
    <View style={g.sectionHeader}>
      <Ionicons name={icon} size={15} color={Colors.primary} />
      <Text style={g.sectionTitle}>{title}</Text>
    </View>
  );
}
