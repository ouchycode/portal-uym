import { SkeletonBlock } from "@/components/SkeletonBlock";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PERIODE_OPTIONS = [
  { value: 20252, label: "2025/2026 Genap" },
  { value: 20251, label: "2025/2026 Ganjil" },
  { value: 20242, label: "2024/2025 Genap" },
  { value: 20241, label: "2024/2025 Ganjil" },
  { value: 20232, label: "2023/2024 Genap" },
  { value: 20231, label: "2023/2024 Ganjil" },
];

export default function Kehadiran() {
  const [kelas, setKelas] = useState<any[]>([]);
  const [periode, setPeriode] = useState(20252);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getKelas();
  }, [periode]);

  const getKelas = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await API.get("/v2/lms/kelas_kuliah", {
        params: { periode },
      });
      setKelas(res.data.data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const periodeLabel =
    PERIODE_OPTIONS.find((p) => p.value === periode)?.label ?? "-";

  return (
    <SafeAreaView style={g.safeArea}>
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.bg }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={g.header}>
          <View style={g.headerTop}>
            <TouchableOpacity
              style={g.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color="#fff" />
              <Text style={g.backLabel}>Kembali</Text>
            </TouchableOpacity>
          </View>
          <Text style={g.headerTitle}>Kehadiran</Text>
          <Text style={g.headerSub}>{periodeLabel}</Text>
        </View>

        {/* FILTER PERIODE */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {PERIODE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                g.filterChip,
                periode === opt.value && g.filterChipActive,
              ]}
              activeOpacity={0.75}
              onPress={() => setPeriode(opt.value)}
            >
              <Ionicons
                name="calendar-outline"
                size={13}
                color={periode === opt.value ? "#fff" : Colors.muted}
              />
              <Text
                style={[
                  g.filterChipText,
                  periode === opt.value && g.filterChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* BODY */}
        <View style={g.body}>
          <Text style={g.sectionLabel}>
            {loading
              ? "Memuat kelas..."
              : error
                ? "Gagal memuat data"
                : kelas.length === 0
                  ? "Tidak ada kelas ditemukan"
                  : `${kelas.length} kelas ditemukan`}
          </Text>

          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <View key={i} style={g.card}>
                <View style={g.gradeBadge} />
                <View style={{ flex: 1, gap: 8 }}>
                  <SkeletonBlock width="70%" height={13} />
                  <SkeletonBlock width="45%" height={11} />
                </View>
              </View>
            ))
          ) : error ? (
            <View style={g.empty}>
              <Ionicons name="wifi-outline" size={40} color={Colors.border} />
              <Text style={g.emptyTitle}>Gagal memuat data</Text>
              <Text style={g.emptyHint}>Periksa koneksi internet kamu</Text>
              <TouchableOpacity
                style={g.retryBtn}
                onPress={getKelas}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={g.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : kelas.length === 0 ? (
            <View style={g.empty}>
              <Ionicons name="school-outline" size={40} color={Colors.border} />
              <Text style={g.emptyTitle}>Tidak ada kelas ditemukan</Text>
              <Text style={g.emptyHint}>untuk periode {periodeLabel}</Text>
            </View>
          ) : (
            kelas.map((k, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  g.card,
                  { flexDirection: "row", alignItems: "center", gap: 12 },
                ]}
                activeOpacity={0.75}
                onPress={() => {
                  if (!k.id) return;
                  router.push({
                    pathname: "/kehadiran/[kelas]",
                    params: { kelas: k.id },
                  } as any);
                }}
              >
                <View style={g.iconWrap}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={Colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={g.listRowTitle} numberOfLines={2}>
                    {k.mata_kuliah?.kode
                      ? `${k.mata_kuliah.kode} — ${k.mata_kuliah?.nama}`
                      : k.mata_kuliah?.nama || "-"}
                  </Text>
                  <Text style={g.listRowSub} numberOfLines={1}>
                    {k.kelas?.nama ? `${k.kelas.nama} Reguler` : ""}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={Colors.hint}
                />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  filterScroll: { marginTop: 16 },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingRight: 32,
  },
});
