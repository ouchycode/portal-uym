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
  const diffMs = new Date(waktuSelesai).getTime() - Date.now();
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

const getSortPriority = (t: any) => {
  if (t.jumlah_pengumpulan > 0) return 10;
  return getDeadlineInfo(t.waktu_selesai)?.priority ?? 3;
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
  <View style={styles.card}>
    <View
      style={[styles.cardStripe, { backgroundColor: Colors.skeletonBase }]}
    />
    <View style={{ flex: 1, padding: 12, gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
        <SkeletonBlock width={36} height={36} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonBlock height={14} width="75%" />
          <SkeletonBlock height={11} width="45%" />
        </View>
      </View>
      <View style={g.divider} />
      <View style={{ flexDirection: "row", gap: 6 }}>
        <SkeletonBlock height={22} width={90} />
        <SkeletonBlock height={22} width={70} />
      </View>
      <SkeletonBlock height={22} width={140} />
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
    p === 1 ? setLoading(true) : setLoadingMore(true);
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

  const sudahCount = tugas.filter((t) => t.jumlah_pengumpulan > 0).length;
  const belumCount = tugas.filter((t) => t.jumlah_pengumpulan === 0).length;
  const terlambatCount = tugas.filter(
    (t) =>
      !t.jumlah_pengumpulan && getDeadlineInfo(t.waktu_selesai)?.priority === 0,
  ).length;
  const urgentCount = tugas.filter(
    (t) =>
      !t.jumlah_pengumpulan && getDeadlineInfo(t.waktu_selesai)?.priority === 1,
  ).length;

  const filtered = tugas
    .filter((t) =>
      filter === "belum"
        ? t.jumlah_pengumpulan === 0
        : filter === "sudah"
          ? t.jumlah_pengumpulan > 0
          : true,
    )
    .sort((a, b) => {
      const pd = getSortPriority(a) - getSortPriority(b);
      if (pd !== 0) return pd;
      return (
        (a.waktu_selesai ? new Date(a.waktu_selesai).getTime() : Infinity) -
        (b.waktu_selesai ? new Date(b.waktu_selesai).getTime() : Infinity)
      );
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
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={g.headerSection}>
          <View style={g.topBar}>
            <View>
              <Text style={g.headerLabel}>PORTAL MAHASISWA</Text>
              <Text style={g.pageTitle}>Daftar Tugas</Text>
            </View>
            <View style={g.uymBadge}>
              <Text style={g.uymBadgeText}>UYM</Text>
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
        </View>

        {/* PERIODE FILTER */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodeRow}
          style={{ marginTop: 14 }}
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

        {/* STATUS TABS */}
        <View style={{ marginTop: 10, paddingHorizontal: 16 }}>
          <FilterTab
            options={filterOptions}
            active={filter}
            onSelect={setFilter}
          />
        </View>

        {/* BODY */}
        <View style={g.body}>
          {/* ALERT BANNERS */}
          {!loading && !error && terlambatCount > 0 && (
            <View style={[g.errorBox, { marginBottom: 4 }]}>
              <Ionicons
                name="close-circle-outline"
                size={14}
                color={Colors.dangerText}
              />
              <Text style={g.errorText}>
                {terlambatCount} tugas melewati deadline
              </Text>
            </View>
          )}
          {!loading && !error && urgentCount > 0 && (
            <View style={[g.warningBox, { marginBottom: 4 }]}>
              <Ionicons
                name="warning-outline"
                size={14}
                color={Colors.warningText}
              />
              <Text style={g.warningBoxText}>
                {urgentCount} tugas deadline kurang dari 24 jam
              </Text>
            </View>
          )}

          {/* META LABEL */}
          {!loading && !error && (
            <Text style={g.sectionLabel}>
              {filtered.length === 0
                ? "Tidak ada tugas ditemukan"
                : `${filtered.length} tugas · diurutkan berdasarkan urgensi`}
            </Text>
          )}

          {/* SKELETON */}
          {loading && [1, 2, 3, 4].map((i) => <TugasSkeleton key={i} />)}

          {/* ERROR */}
          {error && (
            <View style={g.empty}>
              <Ionicons name="wifi-outline" size={40} color={Colors.border} />
              <Text style={g.emptyTitle}>Gagal memuat data</Text>
              <Text style={g.emptyHint}>Periksa koneksi internet kamu</Text>
              <TouchableOpacity
                style={g.retryBtn}
                onPress={() => getTugas(1, true)}
              >
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={g.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* EMPTY */}
          {!loading && !error && filtered.length === 0 && (
            <View style={g.empty}>
              <Ionicons
                name="document-outline"
                size={40}
                color={Colors.border}
              />
              <Text style={g.emptyTitle}>
                {filter === "belum"
                  ? "Semua tugas sudah dikumpulkan"
                  : filter === "sudah"
                    ? "Belum ada tugas yang dikumpulkan"
                    : "Tidak ada tugas"}
              </Text>
            </View>
          )}

          {/* LIST */}
          {!loading &&
            !error &&
            filtered.map((t, i) => {
              const sudah = t.jumlah_pengumpulan > 0;
              const deadline = getDeadlineInfo(t.waktu_selesai);
              const isLate = !sudah && deadline?.priority === 0;
              const isUrgent = !sudah && deadline?.priority === 1;
              const stripeColor = sudah
                ? Colors.successText
                : isLate
                  ? Colors.dangerText
                  : isUrgent
                    ? Colors.warningText
                    : Colors.primary;
              const cardBorder = sudah
                ? Colors.successBorder
                : isLate
                  ? Colors.dangerBorder
                  : isUrgent
                    ? Colors.warningBorder
                    : Colors.border;

              return (
                <TouchableOpacity
                  key={t.id ?? i}
                  style={[styles.card, { borderColor: cardBorder }]}
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
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.cardStripe,
                      { backgroundColor: stripeColor },
                    ]}
                  />
                  <View style={styles.cardBody}>
                    {/* TOP */}
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

                    <View style={g.divider} />

                    {/* META */}
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

                    {/* DEADLINE */}
                    {t.waktu_selesai && (
                      <View style={styles.deadlineRow}>
                        <Ionicons
                          name="alarm-outline"
                          size={12}
                          color={Colors.hint}
                        />
                        <Text style={styles.deadlineText} numberOfLines={1}>
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

                    {/* STATUS */}
                    <View
                      style={[
                        sudah ? g.badgeSuccess : g.badgeWarning,
                        { alignSelf: "flex-start" },
                      ]}
                    >
                      <Ionicons
                        name={sudah ? "checkmark-circle" : "time-outline"}
                        size={13}
                        color={sudah ? Colors.successText : Colors.warningText}
                      />
                      <Text
                        style={sudah ? g.badgeSuccessText : g.badgeWarningText}
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
              style={g.retryBtn}
              onPress={() => !loadingMore && getTugas(page + 1)}
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
  summaryStrip: {
    flexDirection: "row",
    gap: 8,
  },

  // FILTERS
  periodeRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingRight: 32,
  },

  // CARD
  card: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
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

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 0.5,
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
    borderWidth: 0.5,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  deadlineBadgeText: { fontSize: 10, fontWeight: "700" },

  loadMoreText: { fontSize: 13, fontWeight: "600", color: Colors.primary },
});
