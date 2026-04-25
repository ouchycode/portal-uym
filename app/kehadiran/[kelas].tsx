import { SkeletonBlock } from "@/components/SkeletonBlock";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Status colors tidak ada di theme global karena spesifik ke halaman ini
const STATUS_COLORS = {
  hadir: { color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  izin: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  alpha: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  belum: { color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB" },
} as const;

type StatusKey = keyof typeof STATUS_COLORS;

const STATUS_CONFIG: Record<
  StatusKey,
  { icon: any } & (typeof STATUS_COLORS)[StatusKey]
> = {
  hadir: { icon: "checkmark-circle", ...STATUS_COLORS.hadir },
  izin: { icon: "alert-circle", ...STATUS_COLORS.izin },
  alpha: { icon: "close-circle", ...STATUS_COLORS.alpha },
  belum: { icon: "time-outline", ...STATUS_COLORS.belum },
};

type PresensiItem = {
  pertemuan?: { nomor?: number; tanggal?: string; materi?: string };
  ada_presensi?: boolean;
  is_hadir?: boolean;
  presensi?: string;
};

const getStatusKey = (d: PresensiItem): StatusKey => {
  if (!d.ada_presensi) return "belum";
  if (d.presensi === "H") return "hadir";
  if (d.presensi === "I") return "izin";
  return "alpha";
};

const getStatusLabel = (d: PresensiItem) => {
  if (!d.ada_presensi) return "Belum Presensi";
  if (d.presensi === "H") return "Hadir";
  if (d.presensi === "I") return "Izin";
  return "Tidak Hadir";
};

export default function DetailKehadiran() {
  const params = useLocalSearchParams();
  const kelas = Array.isArray(params.kelas) ? params.kelas[0] : params.kelas;

  const [data, setData] = useState<PresensiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (kelas) getData();
  }, [kelas]);

  const getData = async () => {
    try {
      const res = await API.get(
        `/v2/lms/kehadiran_mahasiswa/kelas_kuliah/${kelas}/me`,
      );
      setData(res.data.data || []);
    } catch (err: any) {
      console.log("ERROR:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const totalHadir = data.filter((d) => d.presensi === "H").length;
  const totalIzin = data.filter((d) => d.presensi === "I").length;
  const totalAlpha = data.filter(
    (d) => d.ada_presensi && !d.is_hadir && d.presensi !== "I",
  ).length;
  const totalBelum = data.filter((d) => !d.ada_presensi).length;
  const totalValid = totalHadir + totalIzin + totalAlpha;
  const pctHadir =
    totalValid > 0 ? Math.round((totalHadir / totalValid) * 100) : 0;

  const SUMMARY: { key: StatusKey; label: string; value: number }[] = [
    { key: "hadir", label: "Hadir", value: totalHadir },
    { key: "izin", label: "Izin", value: totalIzin },
    { key: "alpha", label: "Tidak Hadir", value: totalAlpha },
    { key: "belum", label: "Belum", value: totalBelum },
  ];

  return (
    <SafeAreaView style={g.safeArea}>
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.bg }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header biru ── */}
        <View style={styles.header}>
          <View style={styles.decor1} />
          <View style={styles.decor2} />
          <View style={styles.decor3} />
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Kehadiran</Text>
          <Text style={styles.headerSub}>
            {!loading ? `${data.length} pertemuan` : "Memuat data..."}
          </Text>
        </View>

        <View style={styles.body}>
          {/* ── Summary Card ── */}
          {loading ? (
            <View style={styles.summaryCardSkeleton}>
              <SkeletonBlock height={16} width="40%" />
              <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={styles.skeletonStatBox} />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.summaryCard}>
              {/* Persentase */}
              <View style={styles.summaryHeader}>
                <View>
                  <Text style={styles.summaryPctLabel}>Persentase Hadir</Text>
                  <Text style={styles.summaryPct}>{pctHadir}%</Text>
                </View>
                <View style={g.badgePrimary}>
                  <Text style={g.badgePrimaryText}>
                    {data.length} pertemuan
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressBg}>
                <View
                  style={[styles.progressFill, { width: `${pctHadir}%` }]}
                />
              </View>

              {/* Stat boxes */}
              <View style={styles.statRow}>
                {SUMMARY.map(({ key, label, value }) => {
                  const cfg = STATUS_CONFIG[key];
                  return (
                    <View
                      key={key}
                      style={[
                        styles.statBox,
                        { backgroundColor: cfg.bg, borderColor: cfg.border },
                      ]}
                    >
                      <Text style={[styles.statValue, { color: cfg.color }]}>
                        {value}
                      </Text>
                      <Text style={[styles.statLabel, { color: cfg.color }]}>
                        {label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Section label ── */}
          <Text style={styles.sectionLabel}>
            {loading ? "Memuat data..." : `${data.length} pertemuan`}
          </Text>

          {/* ── List ── */}
          {loading
            ? [1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={styles.skeletonCard}>
                  <View style={styles.skeletonLeft} />
                  <View style={{ flex: 1, gap: 8 }}>
                    <SkeletonBlock width="50%" height={12} />
                    <SkeletonBlock width="70%" height={11} />
                    <SkeletonBlock width="30%" height={11} />
                  </View>
                </View>
              ))
            : data.map((d, i) => {
                const key = getStatusKey(d);
                const cfg = STATUS_CONFIG[key];
                const status = getStatusLabel(d);

                return (
                  <View key={i} style={styles.card}>
                    {/* Icon */}
                    <View
                      style={[
                        styles.cardLeft,
                        { backgroundColor: cfg.bg, borderColor: cfg.border },
                      ]}
                    >
                      <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                    </View>

                    {/* Content */}
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>
                        Pertemuan {d.pertemuan?.nomor ?? i + 1}
                      </Text>
                      {d.pertemuan?.tanggal ? (
                        <Text style={styles.cardDate}>
                          {d.pertemuan.tanggal}
                        </Text>
                      ) : null}
                      {d.pertemuan?.materi ? (
                        <Text style={styles.cardMateri} numberOfLines={1}>
                          {d.pertemuan.materi}
                        </Text>
                      ) : null}
                    </View>

                    {/* Badge */}
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: cfg.bg, borderColor: cfg.border },
                      ]}
                    >
                      <Text style={[styles.badgeText, { color: cfg.color }]}>
                        {status}
                      </Text>
                    </View>
                  </View>
                );
              })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── Header ──
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
    top: -28,
    right: -28,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  decor2: {
    position: "absolute",
    bottom: -40,
    left: -24,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  decor3: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
  },

  // ── Body ──
  body: { paddingHorizontal: 16, paddingTop: 16 },
  sectionLabel: { fontSize: 12, color: Colors.muted, marginBottom: 10 },

  // ── Summary Card ──
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  summaryCardSkeleton: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  summaryPctLabel: { fontSize: 12, color: Colors.muted, marginBottom: 2 },
  summaryPct: { fontSize: 28, fontWeight: "700", color: Colors.primary },
  progressBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 99,
    marginBottom: 14,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: 99,
  },
  statRow: { flexDirection: "row", gap: 8 },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 10, fontWeight: "500" },

  // ── Card ──
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
  cardLeft: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 13, fontWeight: "600", color: Colors.text },
  cardDate: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  cardMateri: { fontSize: 11, color: Colors.muted, marginTop: 1 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },

  // ── Skeleton ──
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
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.skeletonBase,
  },
  skeletonStatBox: {
    flex: 1,
    height: 56,
    borderRadius: 8,
    backgroundColor: Colors.skeletonBase,
  },
});
