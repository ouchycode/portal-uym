import { FilterTab } from "@/components/FilterTab";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { SummaryCard } from "@/components/SummaryCard";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

const PERIODE_OPTIONS = [
  { value: "20252", label: "2025/2026 Genap" },
  { value: "20251", label: "2025/2026 Ganjil" },
  { value: "20242", label: "2024/2025 Genap" },
  { value: "20241", label: "2024/2025 Ganjil" },
  { value: "20232", label: "2023/2024 Genap" },
  { value: "20231", label: "2023/2024 Ganjil" },
];

const PER_PAGE = 10;

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
      priority: 0,
    };
  if (diffHours < 24)
    return {
      label: `${Math.floor(diffHours)} jam lagi`,
      color: Colors.warningText,
      bg: Colors.warningBg,
      border: Colors.warningBorder,
      icon: "warning-outline",
      priority: 1,
    };
  return {
    label: `${diffDays} hari lagi`,
    color: Colors.successText,
    bg: Colors.successBg,
    border: Colors.successBorder,
    icon: "time-outline",
    priority: 2,
  };
};

const getSortPriority = (t: any): number => {
  const sudah = t.jumlah_pengumpulan > 0;
  if (sudah) return 10;
  const info = getDeadlineInfo(t.waktu_selesai);
  return info?.priority ?? 3;
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

const TugasSkeleton = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonStripe} />
    <View style={{ flex: 1, padding: 12, gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
        <View style={styles.skeletonIcon} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonBlock height={14} width="75%" />
          <SkeletonBlock height={11} width="45%" />
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: Colors.border }} />
      <View style={{ flexDirection: "row", gap: 6 }}>
        <SkeletonBlock height={22} width={90} />
        <SkeletonBlock height={22} width={70} />
        <SkeletonBlock height={22} width={80} />
      </View>
      <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
        <SkeletonBlock height={11} width="55%" />
        <SkeletonBlock height={20} width={80} />
      </View>
      <SkeletonBlock height={26} width={140} />
    </View>
  </View>
);

export default function Tugas() {
  const [tugas, setTugas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>("semua");
  const [periode, setPeriode] = useState("20252");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setTugas([]);
    setPage(1);
    setHasMore(false);
    getTugas(1, true);
  }, [periode]);

  const getTugas = async (p = 1, reset = false) => {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    if (p === 1) setError(false);

    try {
      const res = await API.get("/v2/lms/tugas", {
        params: { page: p, per_page: PER_PAGE, periode, search: "" },
      });
      const newData: any[] = res.data.data || [];
      const total: number = res.data.meta?.total ?? newData.length;

      setTugas((prev) => (reset || p === 1 ? newData : [...prev, ...newData]));
      setPage(p);
      setHasMore(
        (reset || p === 1 ? newData.length : tugas.length + newData.length) <
          total,
      );
    } catch {
      if (p === 1) setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) getTugas(page + 1);
  };

  const sudahCount = tugas.filter((t) => t.jumlah_pengumpulan > 0).length;
  const belumCount = tugas.filter((t) => t.jumlah_pengumpulan === 0).length;
  const terlambatCount = tugas.filter((t) => {
    if (t.jumlah_pengumpulan > 0) return false;
    return getDeadlineInfo(t.waktu_selesai)?.priority === 0;
  }).length;
  const urgentCount = tugas.filter((t) => {
    if (t.jumlah_pengumpulan > 0) return false;
    return getDeadlineInfo(t.waktu_selesai)?.priority === 1;
  }).length;

  const filtered = tugas
    .filter((t) => {
      if (filter === "belum") return t.jumlah_pengumpulan === 0;
      if (filter === "sudah") return t.jumlah_pengumpulan > 0;
      return true;
    })
    .sort((a, b) => {
      const pa = getSortPriority(a);
      const pb = getSortPriority(b);
      if (pa !== pb) return pa - pb;
      const da = a.waktu_selesai
        ? new Date(a.waktu_selesai).getTime()
        : Infinity;
      const db = b.waktu_selesai
        ? new Date(b.waktu_selesai).getTime()
        : Infinity;
      return da - db;
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
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.decor1} />
          <View style={styles.decor2} />
          <View style={styles.decor3} />
          <View style={styles.decor4} />
          <View style={styles.topBar}>
            <View>
              <Text style={styles.heroLabel}>PORTAL MAHASISWA</Text>
              <Text style={styles.heroTitle}>Daftar Tugas</Text>
            </View>
            <View style={styles.uymBadge}>
              <Text style={styles.uymBadgeText}>UYM</Text>
            </View>
          </View>
        </View>

        {/* SUMMARY STRIP */}
        {!loading && !error && (
          <View style={styles.summaryStrip}>
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
            <SummaryCard
              icon="close-circle-outline"
              value={terlambatCount}
              label="Terlambat"
              valueColor={terlambatCount > 0 ? Colors.dangerText : undefined}
            />
          </View>
        )}

        {/* FILTER PERIODE */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodeRow}
          style={styles.periodeScroll}
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

        {/* FILTER STATUS TABS */}
        <View style={styles.filterWrap}>
          <FilterTab
            options={filterOptions}
            active={filter}
            onSelect={setFilter}
          />
        </View>

        {/* BODY */}
        <View style={styles.body}>
          {/* ALERT BANNERS */}
          {!loading && !error && terlambatCount > 0 && (
            <View
              style={[
                styles.alertBox,
                {
                  borderColor: Colors.dangerBorder,
                  backgroundColor: Colors.dangerBg,
                },
              ]}
            >
              <Ionicons
                name="close-circle-outline"
                size={14}
                color={Colors.dangerText}
              />
              <Text style={[styles.alertText, { color: Colors.dangerText }]}>
                {terlambatCount} tugas melewati deadline
              </Text>
            </View>
          )}
          {!loading && !error && urgentCount > 0 && (
            <View
              style={[
                styles.alertBox,
                {
                  borderColor: Colors.warningBorder,
                  backgroundColor: Colors.warningBg,
                },
              ]}
            >
              <Ionicons
                name="warning-outline"
                size={14}
                color={Colors.warningText}
              />
              <Text style={[styles.alertText, { color: Colors.warningText }]}>
                {urgentCount} tugas deadline kurang dari 24 jam
              </Text>
            </View>
          )}

          <Text style={styles.sectionLabel}>
            {loading
              ? "Memuat tugas..."
              : error
                ? "Gagal memuat data"
                : filtered.length === 0
                  ? "Tidak ada tugas ditemukan"
                  : `${filtered.length} tugas · diurutkan berdasarkan urgensi`}
          </Text>

          {/* SKELETON */}
          {loading ? (
            [1, 2, 3, 4].map((i) => <TugasSkeleton key={i} />)
          ) : error ? (
            <View style={styles.empty}>
              <Ionicons name="wifi-outline" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>Gagal memuat data</Text>
              <Text style={{ fontSize: 12, color: Colors.hint }}>
                Periksa koneksi internet kamu
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => getTugas(1, true)}
              >
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={styles.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
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
            <>
              {filtered.map((t, i) => {
                const sudah = t.jumlah_pengumpulan > 0;
                const deadline = getDeadlineInfo(t.waktu_selesai);
                const isLate = !sudah && deadline?.priority === 0;
                const isUrgent = !sudah && deadline?.priority === 1;

                return (
                  <TouchableOpacity
                    key={t.id ?? i}
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

                      {t.waktu_selesai && (
                        <View style={styles.deadlineRow}>
                          <Ionicons
                            name="alarm-outline"
                            size={12}
                            color={Colors.hint}
                          />
                          <Text style={styles.deadlineText}>
                            {`Deadline: ${formatDeadline(t.waktu_selesai)}`}
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

                      <View
                        style={[
                          styles.statusBadge,
                          sudah ? g.badgeSuccess : styles.badgeWarning,
                        ]}
                      >
                        <Ionicons
                          name={sudah ? "checkmark-circle" : "time-outline"}
                          size={13}
                          color={
                            sudah ? Colors.successText : Colors.warningText
                          }
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
              })}

              {/* LOAD MORE */}
              {hasMore && (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={loadMore}
                  activeOpacity={0.75}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <>
                      <Ionicons
                        name="chevron-down-outline"
                        size={14}
                        color={Colors.primary}
                      />
                      <Text style={styles.loadMoreText}>Muat lebih banyak</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </>
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
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 52,
    overflow: "hidden",
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
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginTop: 2,
    letterSpacing: -0.3,
  },
  uymBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  uymBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },

  summaryStrip: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: -22,
    gap: 8,
  },

  periodeScroll: { marginTop: 16 },
  periodeRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingRight: 32,
  },

  filterWrap: { marginTop: 12, paddingHorizontal: 16 },

  body: { paddingHorizontal: 16, paddingTop: 12 },
  sectionLabel: { fontSize: 12, color: Colors.muted, marginBottom: 10 },

  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  alertText: { fontSize: 12, fontWeight: "600" },

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

  loadMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    marginTop: 4,
  },
  loadMoreText: { fontSize: 13, fontWeight: "600", color: Colors.primary },

  skeletonCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    overflow: "hidden",
  },
  skeletonStripe: { width: 4, backgroundColor: Colors.skeletonBase },
  skeletonIcon: {
    width: 36,
    height: 36,
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
