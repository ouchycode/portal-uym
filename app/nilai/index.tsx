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

const JENIS_LABEL: Record<string, string> = {
  "ujian-uts": "UTS",
  "ujian-uas": "UAS",
  "ujian-kuis": "Kuis",
  tugas: "Tugas",
  forum: "Forum",
};

// Warna spesifik halaman ini — tidak perlu masuk theme global
const JENIS_COLOR: Record<
  string,
  { bg: string; border: string; color: string }
> = {
  "ujian-uts": {
    bg: Colors.primaryLight,
    border: "#BFDBFE",
    color: Colors.primary,
  },
  "ujian-uas": {
    bg: Colors.successBg,
    border: Colors.successBorder,
    color: Colors.successText,
  },
  "ujian-kuis": {
    bg: Colors.warningBg,
    border: Colors.warningBorder,
    color: Colors.warningText,
  },
  tugas: { bg: "#F3F4F6", border: Colors.border, color: Colors.muted },
  forum: { bg: "#F3F4F6", border: Colors.border, color: Colors.muted },
};

const getRataRata = (nilaiPertemuan: any[] | null): number | null => {
  if (!nilaiPertemuan || nilaiPertemuan.length === 0) return null;
  const total = nilaiPertemuan.reduce((sum, n) => sum + (n.nilai ?? 0), 0);
  return Math.round((total / nilaiPertemuan.length) * 10) / 10;
};

const getRataRataStyle = (rata: number | null) => {
  if (rata === null)
    return { bg: "#F3F4F6", border: Colors.border, color: Colors.muted };
  if (rata >= 85)
    return {
      bg: Colors.successBg,
      border: Colors.successBorder,
      color: Colors.successText,
    };
  if (rata >= 70)
    return {
      bg: Colors.primaryLight,
      border: "#BFDBFE",
      color: Colors.primary,
    };
  if (rata >= 60)
    return {
      bg: Colors.warningBg,
      border: Colors.warningBorder,
      color: Colors.warningText,
    };
  return {
    bg: Colors.dangerBg,
    border: Colors.dangerBorder,
    color: Colors.dangerText,
  };
};

const getRataRataSemester = (data: any[]): number | null => {
  const allRata = data
    .map((k) => getRataRata(k.nilai_pertemuan))
    .filter((r): r is number => r !== null);
  if (allRata.length === 0) return null;
  return (
    Math.round((allRata.reduce((a, b) => a + b, 0) / allRata.length) * 100) /
    100
  );
};

export default function Nilai() {
  const [data, setData] = useState<any[]>([]);
  const [periode, setPeriode] = useState(20252);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getNilai();
  }, [periode]);

  const getNilai = async () => {
    setLoading(true);
    setExpanded({});
    try {
      const res = await API.get("/v2/lms/nilai/me", {
        params: { page: 1, per_page: 50, periode },
      });
      setData(res.data.data || []);
    } catch (err: any) {
      console.log("❌ ERROR NILAI:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const periodeLabel =
    PERIODE_OPTIONS.find((p) => p.value === periode)?.label ?? "";
  const rataRataSemester = getRataRataSemester(data);

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
          <Text style={styles.headerTitle}>Nilai</Text>
          <Text style={styles.headerSub}>{periodeLabel}</Text>
        </View>

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
          {/* ── Rata-rata semester card ── */}
          {!loading && rataRataSemester !== null && (
            <View style={styles.ipkCard}>
              <View style={styles.ipkLeft}>
                <View style={g.iconWrap}>
                  <Ionicons
                    name="ribbon-outline"
                    size={18}
                    color={Colors.primary}
                  />
                </View>
                <View>
                  <Text style={styles.ipkLabel}>Rata-rata Semester</Text>
                  <Text style={styles.ipkSub}>{periodeLabel}</Text>
                </View>
              </View>
              <View style={styles.ipkRight}>
                <Text style={styles.ipkValue}>
                  {rataRataSemester.toFixed(1)}
                </Text>
                <Text style={styles.ipkSks}>{data.length} mata kuliah</Text>
              </View>
            </View>
          )}

          {/* ── Section label ── */}
          <Text style={styles.sectionLabel}>
            {loading ? "Memuat nilai..." : `${data.length} kelas ditemukan`}
          </Text>

          {/* ── Skeleton ── */}
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
          ) : data.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons
                name="document-outline"
                size={40}
                color={Colors.border}
              />
              <Text style={styles.emptyText}>Belum ada nilai tersedia</Text>
              <Text style={styles.emptySubText}>
                untuk periode {periodeLabel}
              </Text>
            </View>
          ) : (
            data.map((k) => {
              const mk = k.kelas?.mata_kuliah;
              const kelasNama = k.kelas?.kelas?.nama;
              const nilaiPertemuan: any[] = k.nilai_pertemuan || [];
              const rata = getRataRata(k.nilai_pertemuan);
              const rataStyle = getRataRataStyle(rata);
              const isExpanded = expanded[k.id_kelas_kuliah] ?? false;

              return (
                <View key={k.id_kelas_kuliah} style={styles.card}>
                  {/* Card header — tap to expand */}
                  <TouchableOpacity
                    style={styles.cardHeader}
                    activeOpacity={0.75}
                    onPress={() => toggleExpand(k.id_kelas_kuliah)}
                  >
                    <View style={g.iconWrap}>
                      <Ionicons
                        name="book-outline"
                        size={18}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {mk?.kode ? `${mk.kode} — ${mk.nama}` : mk?.nama || "-"}
                      </Text>
                      <Text style={styles.cardSub} numberOfLines={1}>
                        {kelasNama ? `${kelasNama} Reguler` : ""}
                        {nilaiPertemuan.length > 0
                          ? `  ·  ${nilaiPertemuan.length} penilaian`
                          : "  ·  Belum ada nilai"}
                      </Text>
                    </View>
                    {/* Rata-rata badge */}
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: rataStyle.bg,
                          borderColor: rataStyle.border,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.badgeText, { color: rataStyle.color }]}
                      >
                        {rata !== null ? rata.toFixed(0) : "-"}
                      </Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={15}
                      color={Colors.hint}
                      style={{ marginLeft: 4 }}
                    />
                  </TouchableOpacity>

                  {/* Expanded: detail nilai per pertemuan */}
                  {isExpanded && nilaiPertemuan.length > 0 && (
                    <View style={styles.detailContainer}>
                      {nilaiPertemuan.map((np, idx) => {
                        const jenis = np.aktivitas?.jenis ?? "";
                        const label =
                          np.aktivitas?.label || JENIS_LABEL[jenis] || jenis;
                        const jenisColor = JENIS_COLOR[jenis] ?? {
                          bg: "#F3F4F6",
                          border: Colors.border,
                          color: Colors.muted,
                        };
                        return (
                          <View
                            key={np.id_pertemuan}
                            style={[
                              styles.detailRow,
                              idx < nilaiPertemuan.length - 1 &&
                                styles.detailRowBorder,
                            ]}
                          >
                            <View
                              style={[
                                styles.jenisBadge,
                                {
                                  backgroundColor: jenisColor.bg,
                                  borderColor: jenisColor.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.jenisBadgeText,
                                  { color: jenisColor.color },
                                ]}
                              >
                                {JENIS_LABEL[jenis] ?? jenis}
                              </Text>
                            </View>
                            <Text style={styles.detailLabel} numberOfLines={1}>
                              {label}
                            </Text>
                            <Text style={styles.detailNilai}>
                              {np.nilai ?? "-"}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {isExpanded && nilaiPertemuan.length === 0 && (
                    <View style={styles.detailEmpty}>
                      <Text style={styles.detailEmptyText}>
                        Belum ada nilai masuk
                      </Text>
                    </View>
                  )}
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

  // ── Filter ──
  filterScroll: { marginTop: 16 },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingRight: 32,
  },

  // ── Body ──
  body: { paddingHorizontal: 16, paddingTop: 12 },
  sectionLabel: { fontSize: 12, color: Colors.muted, marginBottom: 10 },

  // ── IPK / rata-rata card ──
  ipkCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 16,
  },
  ipkLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  ipkLabel: { fontSize: 13, fontWeight: "600", color: Colors.text },
  ipkSub: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  ipkRight: { alignItems: "flex-end" },
  ipkValue: { fontSize: 24, fontWeight: "700", color: Colors.primary },
  ipkSks: { fontSize: 11, color: Colors.muted, marginTop: 1 },

  // ── Card ──
  card: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: Colors.text },
  cardSub: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  badge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 44,
    alignItems: "center",
  },
  badgeText: { fontSize: 14, fontWeight: "700" },

  // ── Detail expand ──
  detailContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    gap: 10,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  jenisBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    minWidth: 44,
    alignItems: "center",
  },
  jenisBadgeText: { fontSize: 10, fontWeight: "700" },
  detailLabel: { flex: 1, fontSize: 12, color: Colors.text },
  detailNilai: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    minWidth: 30,
    textAlign: "right",
  },
  detailEmpty: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 12,
    alignItems: "center",
  },
  detailEmptyText: { fontSize: 12, color: Colors.muted },

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

  // ── Empty ──
  empty: { alignItems: "center", paddingVertical: 56, gap: 6 },
  emptyText: { fontSize: 14, color: Colors.muted, fontWeight: "600" },
  emptySubText: { fontSize: 12, color: Colors.hint },
});
