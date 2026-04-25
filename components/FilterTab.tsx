import { Colors, globalStyles as g } from "@/constants/theme";
import { Text, TouchableOpacity, View } from "react-native";

type FilterTabProps<T extends string> = {
  options: { key: T; label: string; count?: number }[];
  active: T;
  onSelect: (key: T) => void;
};

export function FilterTab<T extends string>({
  options,
  active,
  onSelect,
}: FilterTabProps<T>) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {options.map((opt) => {
        const isActive = active === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onSelect(opt.key)}
            style={[g.filterChip, isActive && g.filterChipActive]}
            activeOpacity={0.75}
          >
            <Text
              style={[g.filterChipText, isActive && g.filterChipTextActive]}
            >
              {opt.label}
            </Text>
            {opt.count !== undefined && (
              <View
                style={{
                  backgroundColor: isActive
                    ? "rgba(26,76,139,0.15)"
                    : Colors.bg,
                  borderRadius: 10,
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  minWidth: 20,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: isActive ? Colors.primary : Colors.muted,
                  }}
                >
                  {opt.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
