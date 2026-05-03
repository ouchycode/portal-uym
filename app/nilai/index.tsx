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
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getNilai();
  }, [periode]);

  const getNilai = async () => {
    setLoading(true);
    setError(false);
    setExpanded({});
    try {
      const res = await API.get("/v2/lms/nilai/me", {
        params: { page: 1, per_page: 50, periode },
      });
      setData(res.data.data || []);
    } catch {
      setError(true);
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
          <Text style={g.headerTitle}>Nilai</Text>
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

        <View style={g.body}>
          {/* RATA-RATA SEMESTER CARD */}
          {!loading && !error && rataRataSemester !== null && (
            <View
              style={[
                g.card,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 14,
                  marginBottom: 16,
                },
              ]}
            >
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

          {/* SECTION LABEL */}
          <Text style={g.sectionLabel}>
            {loading
              ? "Memuat nilai..."
              : error
                ? "Gagal memuat data"
                : `${data.length} kelas ditemukan`}
          </Text>

          {/* SKELETON / ERROR / EMPTY / LIST */}
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  g.card,
                  {
                    padding: 14,
                    marginBottom: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  },
                ]}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: Colors.skeletonBase,
                  }}
                />
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
                onPress={getNilai}
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
          ) : data.length === 0 ? (
            <View style={g.empty}>
              <Ionicons
                name="document-outline"
                size={40}
                color={Colors.border}
              />
              <Text style={g.emptyTitle}>Belum ada nilai tersedia</Text>
              <Text style={g.emptyHint}>untuk periode {periodeLabel}</Text>
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
                <View
                  key={k.id_kelas_kuliah}
                  style={[g.card, { marginBottom: 8, overflow: "hidden" }]}
                >
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
                    <View style={{ flex: 1 }}>
                      <Text style={g.listRowTitle} numberOfLines={2}>
                        {mk?.kode ? `${mk.kode} — ${mk.nama}` : mk?.nama || "-"}
                      </Text>
                      <Text style={g.listRowSub} numberOfLines={1}>
                        {kelasNama ? `${kelasNama} Reguler` : ""}
                        {nilaiPertemuan.length > 0
                          ? `  ·  ${nilaiPertemuan.length} penilaian`
                          : "  ·  Belum ada nilai"}
                      </Text>
                    </View>
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
                                g.badgePrimary,
                                {
                                  backgroundColor: jenisColor.bg,
                                  borderColor: jenisColor.border,
                                  minWidth: 44,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  g.badgePrimaryText,
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
                      <Text style={g.emptyHint}>Belum ada nilai masuk</Text>
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
  filterScroll: { marginTop: 16 },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingRight: 32,
  },

  ipkLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  ipkLabel: { fontSize: 13, fontWeight: "600", color: Colors.text },
  ipkSub: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  ipkRight: { alignItems: "flex-end" },
  ipkValue: { fontSize: 24, fontWeight: "700", color: Colors.primary },
  ipkSks: { fontSize: 11, color: Colors.muted, marginTop: 1 },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },

  badge: {
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 44,
    alignItems: "center",
  },
  badgeText: { fontSize: 14, fontWeight: "700" },

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
});
