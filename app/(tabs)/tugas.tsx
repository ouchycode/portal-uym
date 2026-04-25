import { FilterTab } from "@/components/FilterTab";
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

type Filter = "semua" | "belum" | "sudah";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "belum", label: "Belum" },
  { key: "sudah", label: "Sudah" },
];

const getDeadlineInfo = (waktuSelesai: string) => {
  if (!waktuSelesai) return null;
  const now = new Date();
  const deadline = new Date(waktuSelesai);
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0)
    return {
      label: "Terlambat",
      color: Colors.dangerText,
      bg: Colors.dangerBg,
      border: Colors.dangerBorder,
      icon: "close-circle-outline",
    };
  if (diffHours < 24)
    return {
      label: `${Math.floor(diffHours)} jam lagi`,
      color: Colors.warningText,
      bg: Colors.warningBg,
      border: Colors.warningBorder,
      icon: "warning-outline",
    };
  return {
    label: `${diffDays} hari lagi`,
    color: Colors.successText,
    bg: Colors.successBg,
    border: Colors.successBorder,
    icon: "time-outline",
  };
};

const formatDeadline = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Tugas() {
  const [tugas, setTugas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("semua");

  useEffect(() => {
    getTugas();
  }, []);

  const getTugas = async () => {
    setLoading(true);
    try {
      const res = await API.get("/v2/lms/tugas", {
        params: { page: 1, per_page: 10, periode: "20252", search: "" },
      });
      setTugas(res.data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const sudahCount = tugas.filter((t) => t.jumlah_pengumpulan > 0).length;
  const belumCount = tugas.filter((t) => t.jumlah_pengumpulan === 0).length;
  const terlambatCount = tugas.filter((t) => {
    if (t.jumlah_pengumpulan > 0) return false;
    const info = getDeadlineInfo(t.waktu_selesai);
    return info?.color === Colors.dangerText;
  }).length;

  const filtered = tugas.filter((t) => {
    if (filter === "belum") return t.jumlah_pengumpulan === 0;
    if (filter === "sudah") return t.jumlah_pengumpulan > 0;
    return true;
  });

  const filterOptions = FILTERS.map((f) => ({
    ...f,
    count: loading
      ? undefined
      : f.key === "semua"
        ? tugas.length
        : f.key === "belum"
          ? belumCount
          : sudahCount,
  }));

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
          <Text style={styles.headerTitle}>Daftar Tugas</Text>
          <Text style={styles.headerSub}>Periode 2025/2026 Genap</Text>
        </View>

        {/* ── Summary strip ── */}
        {!loading && (
          <View style={styles.summaryStrip}>
            <SummaryCard
              icon="document-text-outline"
              value={tugas.length}
              label="Total Tugas"
            />
            <SummaryCard
              icon="checkmark-circle-outline"
              value={sudahCount}
              label="Sudah Kumpul"
              valueColor={Colors.successText}
            />
            <SummaryCard
              icon="time-outline"
              value={belumCount}
              label="Belum Kumpul"
              valueColor={belumCount > 0 ? Colors.warningText : undefined}
            />
          </View>
        )}

        {/* ── Filter tabs ── */}
        <View style={styles.filterWrap}>
          <FilterTab
            options={filterOptions}
            active={filter}
            onSelect={setFilter}
          />
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>
          <Text style={styles.sectionLabel}>
            {loading
              ? "Memuat tugas..."
              : filtered.length === 0
                ? "Tidak ada tugas ditemukan"
                : `${filtered.length} tugas · ${sudahCount} sudah dikumpulkan`}
          </Text>

          {/* Skeleton */}
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <SkeletonBlock height={14} width="70%" />
                <SkeletonBlock height={11} width="45%" />
                <SkeletonBlock height={11} width="55%" />
                <SkeletonBlock height={24} width={130} />
              </View>
            ))
          ) : filtered.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons
                name="document-outline"
                size={40}
                color={Colors.border}
              />
              <Text style={styles.emptyText}>
                {filter === "belum"
                  ? "Semua tugas sudah dikumpulkan"
                  : filter === "sudah"
                    ? "Belum ada tugas yang dikumpulkan"
                    : "Tidak ada tugas"}
              </Text>
            </View>
          ) : (
            filtered.map((t, i) => {
              const sudah = t.jumlah_pengumpulan > 0;
              const deadline = getDeadlineInfo(t.waktu_selesai);
              const isLate = !sudah && deadline?.color === Colors.dangerText;
              const isUrgent = !sudah && deadline?.color === Colors.warningText;

              return (
                <TouchableOpacity
                  key={i}
                  onPress={() =>
                    router.push({
                      pathname: "/tugas/[id]",
                      params: {
                        id: String(t.id),
                        pertemuan: t.id_pertemuan,
                        judul: t.judul,
                      },
                    })
                  }
                  style={[
                    styles.card,
                    isLate && { borderColor: Colors.dangerBorder },
                    isUrgent && { borderColor: Colors.warningBorder },
                    sudah && { borderColor: Colors.successBorder },
                  ]}
                  activeOpacity={0.75}
                >
                  {/* Color stripe */}
                  <View
                    style={[
                      styles.cardStripe,
                      {
                        backgroundColor: sudah
                          ? Colors.successText
                          : isLate
                            ? Colors.dangerText
                            : isUrgent
                              ? Colors.warningText
                              : Colors.primary,
                      },
                    ]}
                  />

                  <View style={styles.cardBody}>
                    {/* Top: icon + judul */}
                    <View style={styles.cardTop}>
                      <View style={g.iconWrap}>
                        <Ionicons
                          name="document-text-outline"
                          size={18}
                          color={Colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {t.judul}
                        </Text>
                        <Text style={styles.cardMatkul} numberOfLines={1}>
                          {t.kelas_kuliah?.mata_kuliah?.nama || "-"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Meta chips */}
                    <View style={styles.metaRow}>
                      <MetaChip
                        icon="person-outline"
                        label={t.created_by?.name || "-"}
                      />
                      <MetaChip
                        icon="layers-outline"
                        label={t.jenis_tugas || "-"}
                      />
                      <MetaChip
                        icon="git-branch-outline"
                        label={`Pertemuan ${t.pertemuan?.nomor}`}
                      />
                    </View>

                    {/* Deadline */}
                    {t.waktu_selesai && (
                      <View style={styles.deadlineRow}>
                        <Ionicons
                          name="alarm-outline"
                          size={12}
                          color={Colors.hint}
                        />
                        <Text style={styles.deadlineText}>
                          Deadline: {formatDeadline(t.waktu_selesai)}
                        </Text>
                        {!sudah && deadline && (
                          <View
                            style={[
                              styles.deadlineBadge,
                              {
                                backgroundColor: deadline.bg,
                                borderColor: deadline.border,
                              },
                            ]}
                          >
                            <Ionicons
                              name={deadline.icon as any}
                              size={10}
                              color={deadline.color}
                            />
                            <Text
                              style={[
                                styles.deadlineBadgeText,
                                { color: deadline.color },
                              ]}
                            >
                              {deadline.label}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Status badge */}
                    <View
                      style={[
                        styles.statusBadge,
                        sudah ? g.badgeSuccess : styles.badgeWarning,
                      ]}
                    >
                      <Ionicons
                        name={sudah ? "checkmark-circle" : "time-outline"}
                        size={13}
                        color={sudah ? Colors.successText : Colors.warningText}
                      />
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color: sudah
                              ? Colors.successText
                              : Colors.warningText,
                          },
                        ]}
                      >
                        {sudah ? "Sudah dikumpulkan" : "Belum dikumpulkan"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaChip({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={11} color={Colors.hint} />
      <Text style={styles.metaChipText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Header ──
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

  // ── Summary strip ──
  summaryStrip: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: -22,
    gap: 8,
  },

  // ── Filter ──
  filterWrap: {
    marginTop: 16,
    paddingHorizontal: 16,
  },

  // ── Body ──
  body: { paddingHorizontal: 16, paddingTop: 12 },
  sectionLabel: { fontSize: 12, color: Colors.muted, marginBottom: 10 },

  // ── Card ──
  card: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    overflow: "hidden",
  },
  cardStripe: { width: 4 },
  cardBody: { flex: 1, padding: 12, gap: 8 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 20,
  },
  cardMatkul: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border },

  // ── Meta chips ──
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.bg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaChipText: { fontSize: 11, color: Colors.muted },

  // ── Deadline ──
  deadlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },
  deadlineText: { fontSize: 11, color: Colors.muted, flex: 1 },
  deadlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  deadlineBadgeText: { fontSize: 10, fontWeight: "700" },

  // ── Status badge ──
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeWarning: {
    backgroundColor: Colors.warningBg,
    borderColor: Colors.warningBorder,
  },
  statusBadgeText: { fontSize: 11, fontWeight: "600" },

  // ── Skeleton ──
  skeletonCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },

  // ── Empty ──
  empty: { alignItems: "center", paddingVertical: 56, gap: 8 },
  emptyText: {
    fontSize: 14,
    color: Colors.muted,
    fontWeight: "600",
    textAlign: "center",
  },
});
