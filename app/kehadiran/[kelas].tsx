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

const STATUS_COLORS = {
  hadir: { color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  alpha: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  belum: { color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB" },
} as const;

type StatusKey = keyof typeof STATUS_COLORS;

const STATUS_CONFIG: Record<
  StatusKey,
  { icon: any } & (typeof STATUS_COLORS)[StatusKey]
> = {
  hadir: { icon: "checkmark-circle", ...STATUS_COLORS.hadir },
  alpha: { icon: "close-circle", ...STATUS_COLORS.alpha },
  belum: { icon: "time-outline", ...STATUS_COLORS.belum },
};

type PresensiItem = {
  id_pertemuan?: string;
  pertemuan?: {
    nomor?: number;
    judul?: string;
    jenis?: string;
    waktu_mulai?: string;
    waktu_selesai?: string;
    kelas_kuliah?: {
      mata_kuliah?: { kode?: string; nama?: string };
      kelas?: { nama?: string };
      jumlah_pertemuan?: number;
    };
  };
  ada_presensi?: boolean;
  is_hadir?: boolean;
  presensi?: string;
};

const getStatusKey = (d: PresensiItem): StatusKey => {
  if (!d.ada_presensi) return "belum";
  if (d.presensi === "H") return "hadir";
  return "alpha";
};

const getStatusLabel = (d: PresensiItem) => {
  if (!d.ada_presensi) return "Belum";
  if (d.presensi === "H") return "Hadir";
  if (d.presensi === "I") return "Izin";
  return "Tidak Hadir";
};

const fmtTanggal = (iso?: string) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const fmtJam = (iso?: string) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const FILTER_OPTIONS: { key: StatusKey | "semua"; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "hadir", label: "Hadir" },
  { key: "alpha", label: "Tidak Hadir" },
  { key: "belum", label: "Belum" },
];

export default function DetailKehadiran() {
  const params = useLocalSearchParams();
  const kelas = Array.isArray(params.kelas) ? params.kelas[0] : params.kelas;

  const [data, setData] = useState<PresensiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<StatusKey | "semua">("semua");

  useEffect(() => {
    if (kelas) getData();
  }, [kelas]);

  const getData = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await API.get(
        `/v2/lms/kehadiran_mahasiswa/kelas_kuliah/${kelas}/me`,
      );
      setData(res.data.data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // INFO MK & KELAS
  const namaMK =
    data[0]?.pertemuan?.kelas_kuliah?.mata_kuliah?.nama?.trim() ||
    "Detail Kehadiran";
  const namaKelas = data[0]?.pertemuan?.kelas_kuliah?.kelas?.nama || "";

  // STATS
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
    { key: "alpha", label: "Tidak Hadir", value: totalAlpha },
    { key: "belum", label: "Belum", value: totalBelum },
  ];

  // SORT & FILTER
  const dataSorted = [...data].sort((a, b) => {
    const aTime = a.pertemuan?.waktu_mulai
      ? new Date(a.pertemuan.waktu_mulai).getTime()
      : 0;
    const bTime = b.pertemuan?.waktu_mulai
      ? new Date(b.pertemuan.waktu_mulai).getTime()
      : 0;
    return aTime - bTime;
  });

  const dataFiltered =
    filter === "semua"
      ? dataSorted
      : dataSorted.filter((d) => getStatusKey(d) === filter);

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
          <Text style={g.headerTitle} numberOfLines={2}>
            {loading ? "Detail Kehadiran" : namaMK}
          </Text>
          <Text style={g.headerSub}>
            {loading
              ? "Memuat data..."
              : error
                ? "Gagal memuat data"
                : `${namaKelas}${namaKelas ? " · " : ""}${data.length} pertemuan`}
          </Text>
        </View>

        <View style={g.body}>
          {/* SUMMARY CARD */}
          {loading ? (
            <View style={styles.summaryCardSkeleton}>
              <SkeletonBlock height={16} width="40%" />
              <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={styles.skeletonStatBox} />
                ))}
              </View>
            </View>
          ) : !error ? (
            <View style={styles.summaryCard}>
              {/* PERSENTASE */}
              <View style={styles.summaryHeader}>
                <View>
                  <Text style={styles.summaryPctLabel}>Persentase Hadir</Text>
                  <Text
                    style={[
                      styles.summaryPct,
                      pctHadir < 75 && { color: Colors.dangerText },
                    ]}
                  >
                    {pctHadir}%
                  </Text>
                </View>
                <View style={g.badgePrimary}>
                  <Text style={g.badgePrimaryText}>
                    {data.length} pertemuan
                  </Text>
                </View>
              </View>

              {/* PROGRESS BAR */}
              <View style={styles.progressBg}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${pctHadir}%` },
                    pctHadir < 75 && { backgroundColor: Colors.dangerText },
                  ]}
                />
              </View>

              {/* STAT BOXES */}
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
          ) : null}

          {/* WARNING KEHADIRAN */}
          {!loading && !error && totalAlpha >= 2 && (
            <View style={g.warningBox}>
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={Colors.warningText}
              />
              <View style={{ flex: 1 }}>
                <Text style={[g.warningBoxText, { fontWeight: "700" }]}>
                  Kehadiran perlu diperhatikan
                </Text>
                <Text style={g.warningBoxText}>
                  Kamu sudah tidak hadir {totalAlpha}x. Kehadiran yang kurang
                  dapat mempengaruhi akses UTS/UAS.
                </Text>
              </View>
            </View>
          )}

          {/* FILTER CHIPS */}
          {!loading && !error && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
              style={styles.filterScroll}
            >
              {FILTER_OPTIONS.map((f) => {
                const active = filter === f.key;
                const cfg = f.key !== "semua" ? STATUS_CONFIG[f.key] : null;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[
                      g.filterChip,
                      active && g.filterChipActive,
                      active && cfg
                        ? { backgroundColor: cfg.bg, borderColor: cfg.border }
                        : null,
                    ]}
                    onPress={() => setFilter(f.key)}
                    activeOpacity={0.75}
                  >
                    {cfg && (
                      <Ionicons
                        name={cfg.icon}
                        size={12}
                        color={active ? cfg.color : Colors.muted}
                      />
                    )}
                    <Text
                      style={[
                        g.filterChipText,
                        active && g.filterChipTextActive,
                        active && cfg ? { color: cfg.color } : null,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* SECTION LABEL */}
          <Text style={g.sectionLabel}>
            {loading
              ? "Memuat data..."
              : error
                ? "Gagal memuat data"
                : `${dataFiltered.length} pertemuan${filter !== "semua" ? ` · filter: ${FILTER_OPTIONS.find((f) => f.key === filter)?.label}` : ""}`}
          </Text>

          {/* LIST */}
          {loading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                style={[
                  g.card,
                  { flexDirection: "row", alignItems: "center", gap: 12 },
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
                  <SkeletonBlock width="50%" height={12} />
                  <SkeletonBlock width="70%" height={11} />
                  <SkeletonBlock width="30%" height={11} />
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
                onPress={getData}
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
          ) : dataFiltered.length === 0 ? (
            <View style={g.empty}>
              <Ionicons name="search-outline" size={40} color={Colors.border} />
              <Text style={g.emptyTitle}>Tidak ada data untuk filter ini</Text>
            </View>
          ) : (
            dataFiltered.map((d, i) => {
              const key = getStatusKey(d);
              const cfg = STATUS_CONFIG[key];
              const status = getStatusLabel(d);

              return (
                <View key={d.id_pertemuan ?? i} style={styles.card}>
                  <View
                    style={[
                      styles.cardLeft,
                      { backgroundColor: cfg.bg, borderColor: cfg.border },
                    ]}
                  >
                    <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      Pertemuan {d.pertemuan?.nomor ?? i + 1}
                      {d.pertemuan?.jenis ? ` · ${d.pertemuan.jenis}` : ""}
                    </Text>
                    {d.pertemuan?.waktu_mulai && (
                      <Text style={styles.cardDate}>
                        {fmtTanggal(d.pertemuan.waktu_mulai)}
                        {" · "}
                        {fmtJam(d.pertemuan.waktu_mulai)}
                        {" – "}
                        {fmtJam(d.pertemuan.waktu_selesai)}
                      </Text>
                    )}
                    {d.pertemuan?.judul ? (
                      <Text style={styles.cardMateri} numberOfLines={1}>
                        {d.pertemuan.judul}
                      </Text>
                    ) : null}
                  </View>
                  <View
                    style={[
                      g.badgePrimary,
                      {
                        backgroundColor: cfg.bg,
                        borderColor: cfg.border,
                        borderRadius: 20,
                      },
                    ]}
                  >
                    <Text style={[g.badgePrimaryText, { color: cfg.color }]}>
                      {status}
                    </Text>
                  </View>
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
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },
  summaryCardSkeleton: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
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

  filterScroll: { marginBottom: 4 },
  filterRow: { flexDirection: "row", gap: 8, paddingRight: 16 },

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
  cardLeft: { borderRadius: 8, borderWidth: 1, padding: 8 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 13, fontWeight: "600", color: Colors.text },
  cardDate: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  cardMateri: { fontSize: 11, color: Colors.muted, marginTop: 1 },

  skeletonStatBox: {
    flex: 1,
    height: 56,
    borderRadius: 8,
    backgroundColor: Colors.skeletonBase,
  },
});
