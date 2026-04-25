import { SkeletonBlock } from "@/components/SkeletonBlock";
import { SummaryCard } from "@/components/SummaryCard";
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

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const STRIPE_COLORS = [
  "#1A4C8B",
  "#0EA5E9",
  "#8B5CF6",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#EC4899",
  "#6366F1",
];

const PERIODE_OPTIONS = [
  { value: 20252, label: "2025/2026 Genap" },
  { value: 20251, label: "2025/2026 Ganjil" },
  { value: 20242, label: "2024/2025 Genap" },
  { value: 20241, label: "2024/2025 Ganjil" },
  { value: 20232, label: "2023/2024 Genap" },
  { value: 20231, label: "2023/2024 Ganjil" },
];

export default function Jadwal() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState(20252);
  const today = new Date().getDay();

  useEffect(() => {
    getJadwal();
  }, [periode]);

  const getJadwal = async () => {
    setLoading(true);
    try {
      const res = await API.get("/v2/lms/kelas_kuliah", {
        params: { periode },
      });
      setData(res.data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const isCurrentPeriode = periode === 20252;

  const perHari: Record<number, any[]> = {};
  data.forEach((k) => {
    k.jadwal?.forEach((j: any) => {
      if (j.hari == null) return;
      if (!perHari[j.hari]) perHari[j.hari] = [];
      perHari[j.hari].push({ ...k, _jadwal: j });
    });
  });

  const hariTerurut = Object.keys(perHari)
    .map(Number)
    .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));

  const totalSks = data.reduce((sum, k) => sum + (k.mata_kuliah?.sks || 0), 0);
  const kelasHariIni = isCurrentPeriode ? perHari[today]?.length || 0 : 0;
  const hasJadwal = hariTerurut.length > 0;

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
          <Text style={styles.headerTitle}>Jadwal Kuliah</Text>
          <Text style={styles.headerSub}>
            {PERIODE_OPTIONS.find((p) => p.value === periode)?.label}
          </Text>
        </View>

        {/* ── Summary strip overlap ── */}
        {!loading && (
          <View style={styles.summaryStrip}>
            <SummaryCard
              icon="book-outline"
              value={data.length}
              label="Mata Kuliah"
            />
            <SummaryCard
              icon="layers-outline"
              value={totalSks}
              label="Total SKS"
            />
            <SummaryCard
              icon="today-outline"
              value={kelasHariIni}
              label={isCurrentPeriode ? "Kelas Hari Ini" : "Kelas/Hari"}
              valueColor={
                isCurrentPeriode && kelasHariIni > 0
                  ? Colors.successText
                  : undefined
              }
            />
          </View>
        )}

        {/* ── Filter Periode ── */}
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
                color={periode === opt.value ? Colors.primary : Colors.muted}
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

        <View style={styles.body}>
          <Text style={styles.sectionLabel}>
            {loading
              ? "Memuat jadwal..."
              : hasJadwal
                ? `${data.length} kelas · ${hariTerurut.length} hari aktif`
                : "Tidak ada jadwal ditemukan"}
          </Text>

          {/* ── Loading skeleton ── */}
          {loading ? (
            [1, 2, 3].map((i) => (
              <View key={i} style={{ marginBottom: 20 }}>
                <SkeletonBlock height={14} width="30%" />
                <View style={{ height: 10 }} />
                {[1, 2].map((j) => (
                  <View key={j} style={styles.skeletonCard}>
                    <SkeletonBlock height={14} width="60%" />
                    <SkeletonBlock height={11} width="40%" />
                    <SkeletonBlock height={11} width="50%" />
                  </View>
                ))}
              </View>
            ))
          ) : !hasJadwal ? (
            <View style={styles.empty}>
              <Ionicons
                name="calendar-outline"
                size={40}
                color={Colors.border}
              />
              <Text style={styles.emptyText}>Tidak ada jadwal</Text>
              <Text style={styles.emptySubText}>
                untuk periode{" "}
                {PERIODE_OPTIONS.find((p) => p.value === periode)?.label}
              </Text>
            </View>
          ) : (
            hariTerurut.map((hari) => {
              const isToday = isCurrentPeriode && hari === today;
              return (
                <View key={hari} style={styles.group}>
                  {/* Day header */}
                  <View style={styles.dayHeader}>
                    <View
                      style={[
                        styles.dayDot,
                        isToday && { backgroundColor: Colors.successText },
                      ]}
                    />
                    <Text
                      style={[
                        styles.dayLabel,
                        isToday && { color: Colors.successText },
                      ]}
                    >
                      {HARI[hari]}
                    </Text>
                    {isToday && (
                      <View style={g.badgeSuccess}>
                        <Text style={g.badgeSuccessText}>Hari ini</Text>
                      </View>
                    )}
                    <Text style={styles.dayCount}>
                      {perHari[hari].length} kelas
                    </Text>
                  </View>

                  {/* Class cards */}
                  {perHari[hari].map((k, i) => {
                    const j = k._jadwal;
                    const dosen =
                      k.pengajar?.find((p: any) => p.utama) ?? k.pengajar?.[0];
                    const gelar = dosen?.gelar_akademik
                      ? `, ${dosen.gelar_akademik}`
                      : "";
                    const stripeColor = STRIPE_COLORS[i % STRIPE_COLORS.length];

                    return (
                      <TouchableOpacity
                        key={i}
                        style={[styles.card, isToday && styles.cardToday]}
                        activeOpacity={0.75}
                        onPress={() =>
                          router.push({
                            pathname: "/jadwal/pertemuan-list",
                            params: {
                              id_kelas: k.id || k.id_kelas_kuliah,
                              nama_mk: k.mata_kuliah?.nama,
                              nama_kelas: k.kelas?.nama,
                            },
                          })
                        }
                      >
                        <View
                          style={[
                            styles.cardStripe,
                            { backgroundColor: stripeColor },
                          ]}
                        />
                        <View style={styles.cardBody}>
                          {/* Title + SKS */}
                          <View style={styles.cardTopRow}>
                            <Text style={styles.cardTitle} numberOfLines={2}>
                              {k.mata_kuliah?.nama}
                            </Text>
                            {k.mata_kuliah?.sks && (
                              <View style={g.badgePrimary}>
                                <Text style={g.badgePrimaryText}>
                                  {k.mata_kuliah.sks} SKS
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.kodeMatkul}>
                            {k.mata_kuliah?.kode || ""}
                          </Text>

                          <View style={styles.divider} />

                          {/* Info rows */}
                          <View style={g.infoRow}>
                            <Ionicons
                              name="person-outline"
                              size={13}
                              color={Colors.hint}
                            />
                            <Text style={styles.infoText} numberOfLines={1}>
                              {dosen?.nama_pengajar
                                ? `${dosen.nama_pengajar}${gelar}`
                                : "-"}
                            </Text>
                          </View>
                          <View style={g.infoRow}>
                            <Ionicons
                              name="time-outline"
                              size={13}
                              color={Colors.hint}
                            />
                            <Text style={styles.infoText}>
                              {j?.jam_mulai?.slice(0, 5) ?? "-"} –{" "}
                              {j?.jam_selesai?.slice(0, 5) ?? "-"}
                            </Text>
                          </View>
                          <View style={g.infoRow}>
                            <Ionicons
                              name="location-outline"
                              size={13}
                              color={Colors.hint}
                            />
                            <Text style={styles.infoText}>
                              {j?.ruangan?.nama || "Ruangan belum ditentukan"}
                            </Text>
                          </View>

                          {/* Bottom row */}
                          <View style={styles.bottomRow}>
                            <View style={styles.modeBadge}>
                              <Ionicons
                                name={
                                  k.mode_kuliah === "online"
                                    ? "wifi-outline"
                                    : "school-outline"
                                }
                                size={11}
                                color={Colors.primary}
                              />
                              <Text style={styles.modeText}>
                                {k.mode_kuliah === "online"
                                  ? "Online"
                                  : "Offline"}
                              </Text>
                            </View>
                            <Text style={styles.pertemuanText}>
                              {k.jumlah_pertemuan} pertemuan
                            </Text>
                            <View style={styles.tapHint}>
                              <Ionicons
                                name="list-outline"
                                size={11}
                                color={Colors.primary}
                              />
                              <Text style={styles.tapHintText}>
                                Lihat pertemuan
                              </Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 52,
    overflow: "hidden",
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },

  // Summary strip overlap
  summaryStrip: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: -22,
    gap: 8,
    marginBottom: 0,
  },

  // Filter
  filterScroll: { marginTop: 16 },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingRight: 32,
  },

  // Body
  body: { paddingHorizontal: 16, paddingTop: 12 },
  sectionLabel: { fontSize: 12, color: Colors.muted, marginBottom: 10 },

  // Day group
  group: { marginBottom: 20 },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  dayCount: { fontSize: 11, color: Colors.muted, marginLeft: "auto" },

  // Card
  card: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    overflow: "hidden",
  },
  cardToday: {
    borderColor: Colors.successBorder,
    backgroundColor: Colors.successBg,
  },
  cardStripe: { width: 4 },
  cardBody: { flex: 1, padding: 12, gap: 5 },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    lineHeight: 20,
  },
  kodeMatkul: {
    fontSize: 11,
    color: Colors.hint,
    fontWeight: "500",
    marginTop: -2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 6,
  },
  infoText: { fontSize: 12, color: Colors.muted, flex: 1 },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    flexWrap: "wrap",
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  modeText: { fontSize: 10, fontWeight: "600", color: Colors.primary },
  pertemuanText: { fontSize: 11, color: Colors.muted },
  tapHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: "auto",
  },
  tapHintText: { fontSize: 10, color: Colors.primary, fontWeight: "600" },

  // Skeleton
  skeletonCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
    gap: 8,
  },

  // Empty
  empty: { alignItems: "center", paddingVertical: 56, gap: 8 },
  emptyText: { fontSize: 14, color: Colors.muted, fontWeight: "600" },
  emptySubText: { fontSize: 12, color: Colors.hint },
});
