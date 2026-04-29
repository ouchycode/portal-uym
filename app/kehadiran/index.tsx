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
        <View style={styles.header}>
          <View style={styles.decor1} />
          <View style={styles.decor2} />
          <View style={styles.decor3} />
          <View style={styles.decor4} />

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color="#fff" />
            <Text style={styles.backLabel}>Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kehadiran</Text>
          <Text style={styles.headerSub}>{periodeLabel}</Text>
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
        <View style={styles.body}>
          <Text style={styles.sectionLabel}>
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
              <View key={i} style={styles.skeletonCard}>
                <View style={styles.skeletonLeft} />
                <View style={{ flex: 1, gap: 8 }}>
                  <SkeletonBlock width="70%" height={13} />
                  <SkeletonBlock width="45%" height={11} />
                </View>
              </View>
            ))
          ) : error ? (
            <View style={styles.empty}>
              <Ionicons name="wifi-outline" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>Gagal memuat data</Text>
              <Text style={styles.emptySubText}>
                Periksa koneksi internet kamu
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={getKelas}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={styles.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : kelas.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="school-outline" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>Tidak ada kelas ditemukan</Text>
              <Text style={styles.emptySubText}>
                untuk periode {periodeLabel}
              </Text>
            </View>
          ) : (
            kelas.map((k, i) => (
              <TouchableOpacity
                key={i}
                style={styles.card}
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
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {k.mata_kuliah?.kode
                      ? `${k.mata_kuliah.kode} — ${k.mata_kuliah?.nama}`
                      : k.mata_kuliah?.nama || "-"}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={1}>
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
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    overflow: "hidden",
    gap: 4,
  },
  decor1: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  decor2: {
    position: "absolute",
    bottom: -40,
    left: -24,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  decor3: {
    position: "absolute",
    top: 28,
    right: 28,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  decor4: {
    position: "absolute",
    bottom: 16,
    right: 90,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 14,
  },
  backLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
  },

  filterScroll: { marginTop: 16 },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingRight: 32,
  },

  body: { paddingHorizontal: 16, paddingTop: 12 },
  sectionLabel: { fontSize: 12, color: Colors.muted, marginBottom: 10 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: Colors.text },
  cardSub: { fontSize: 12, color: Colors.muted, marginTop: 2 },

  skeletonCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  skeletonLeft: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.skeletonBase,
  },

  empty: { alignItems: "center", paddingVertical: 56, gap: 8 },
  emptyText: {
    fontSize: 14,
    color: Colors.muted,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubText: { fontSize: 12, color: Colors.hint },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryMid,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  retryText: { fontSize: 13, fontWeight: "600", color: Colors.primary },
});
