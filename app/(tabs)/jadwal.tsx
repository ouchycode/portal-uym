import { SkeletonBlock } from "@/components/SkeletonBlock";
import { SummaryCard } from "@/components/SummaryCard";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const PERIODE_OPTIONS = [
  { value: 20252, label: "2025/2026 Genap" },
  { value: 20251, label: "2025/2026 Ganjil" },
  { value: 20242, label: "2024/2025 Genap" },
  { value: 20241, label: "2024/2025 Ganjil" },
  { value: 20232, label: "2023/2024 Genap" },
  { value: 20231, label: "2023/2024 Ganjil" },
];

const CARD_ACCENTS = [
  "#1A4C8B",
  "#0EA5E9",
  "#8B5CF6",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#EC4899",
  "#6366F1",
];

const toMinutes = (t?: string) => {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const nowMinutes = () => {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
};

type ClassStatus = "ongoing" | "upcoming" | "done" | "none";

const getClassStatus = (
  jadwal: any,
  isToday: boolean,
  isCurrentPeriode: boolean,
): ClassStatus => {
  if (!isToday || !isCurrentPeriode) return "none";
  const now = nowMinutes();
  const start = toMinutes(jadwal?.jam_mulai);
  const end = toMinutes(jadwal?.jam_selesai);
  if (now >= start && now <= end) return "ongoing";
  if (now < start) return "upcoming";
  return "done";
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

const DaySkeleton = () => (
  <View style={{ marginBottom: 20 }}>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: Colors.skeletonBase,
        }}
      />
      <SkeletonBlock height={13} width="20%" />
    </View>
    {[1, 2].map((j) => (
      <View key={j} style={styles.skeletonCard}>
        <View style={styles.skeletonStripe} />
        <View style={{ flex: 1, padding: 12, gap: 8 }}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <SkeletonBlock height={14} width="55%" />
            <SkeletonBlock height={14} width="15%" />
          </View>
          <SkeletonBlock height={11} width="25%" />
          <View
            style={{
              height: 1,
              backgroundColor: Colors.border,
              marginVertical: 2,
            }}
          />
          <SkeletonBlock height={11} width="60%" />
          <SkeletonBlock height={11} width="40%" />
          <SkeletonBlock height={11} width="50%" />
        </View>
      </View>
    ))}
  </View>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Jadwal() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [periode, setPeriode] = useState(20252);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;

  const today = new Date().getDay();
  const isCurrentPeriode = periode === 20252;

  useEffect(() => {
    getJadwal();
  }, [periode]);

  const toggleSearch = () => {
    if (showSearch) {
      setSearch("");
      Animated.timing(searchAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }).start(() => setShowSearch(false));
    } else {
      setShowSearch(true);
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const getJadwal = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await API.get("/v2/lms/kelas_kuliah", {
        params: { periode },
      });
      setData(res.data.data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (k) =>
        k.mata_kuliah?.nama?.toLowerCase().includes(q) ||
        k.mata_kuliah?.kode?.toLowerCase().includes(q) ||
        k.pengajar?.some((p: any) =>
          p.nama_pengajar?.toLowerCase().includes(q),
        ),
    );
  }, [data, search]);

  const perHari: Record<number, any[]> = {};
  filteredData.forEach((k) => {
    k.jadwal?.forEach((j: any) => {
      if (j.hari == null) return;
      if (!perHari[j.hari]) perHari[j.hari] = [];
      perHari[j.hari].push({ ...k, _jadwal: j });
    });
  });

  Object.keys(perHari).forEach((hari) => {
    perHari[Number(hari)].sort(
      (a, b) =>
        toMinutes(a._jadwal?.jam_mulai) - toMinutes(b._jadwal?.jam_mulai),
    );
  });

  const hariTerurut = Object.keys(perHari)
    .map(Number)
    .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));

  const totalSks = data.reduce((sum, k) => sum + (k.mata_kuliah?.sks || 0), 0);
  const kelasHariIni = isCurrentPeriode ? perHari[today]?.length || 0 : 0;
  const hasJadwal = hariTerurut.length > 0;

  const ongoingCount = isCurrentPeriode
    ? (perHari[today] || []).filter(
        (k) => getClassStatus(k._jadwal, true, true) === "ongoing",
      ).length
    : 0;

  const searchHeight = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 44],
  });

  return (
    <SafeAreaView style={g.safeArea}>
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.bg }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.decor1} />
          <View style={styles.decor2} />
          <View style={styles.decor3} />
          <View style={styles.decor4} />
          <View style={styles.topBar}>
            <View>
              <Text style={styles.heroLabel}>PORTAL MAHASISWA</Text>
              <Text style={styles.heroTitle}>Jadwal Kuliah</Text>
            </View>
            <View
              style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
            >
              <TouchableOpacity
                style={[styles.iconBtn, showSearch && styles.iconBtnActive]}
                onPress={toggleSearch}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={showSearch ? "close" : "search-outline"}
                  size={16}
                  color="#fff"
                />
              </TouchableOpacity>
              <View style={styles.uymBadge}>
                <Text style={styles.uymBadgeText}>UYM</Text>
              </View>
            </View>
          </View>

          {/* ANIMATED SEARCH */}
          <Animated.View
            style={{ height: searchHeight, overflow: "hidden", marginTop: 10 }}
          >
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={14} color={Colors.hint} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari mata kuliah, kode, atau dosen..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={search}
                onChangeText={setSearch}
                autoFocus={showSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Ionicons
                    name="close-circle"
                    size={14}
                    color="rgba(255,255,255,0.5)"
                  />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>

        {/* ── SUMMARY STRIP ── */}
        {!loading && !error && (
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
              icon={ongoingCount > 0 ? "radio-outline" : "today-outline"}
              value={ongoingCount > 0 ? ongoingCount : kelasHariIni}
              label={
                ongoingCount > 0
                  ? "Sedang Berlangsung"
                  : isCurrentPeriode
                    ? "Kelas Hari Ini"
                    : "Kelas/Hari"
              }
              valueColor={
                ongoingCount > 0
                  ? Colors.dangerText
                  : isCurrentPeriode && kelasHariIni > 0
                    ? Colors.successText
                    : undefined
              }
            />
          </View>
        )}

        {/* ── FILTER PERIODE ── */}
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

        {/* ── BODY ── */}
        <View style={styles.body}>
          <Text style={styles.sectionLabel}>
            {loading
              ? "Memuat jadwal..."
              : error
                ? "Gagal memuat data"
                : search.trim()
                  ? `${filteredData.length} hasil untuk "${search}"`
                  : hasJadwal
                    ? `${data.length} kelas · ${hariTerurut.length} hari aktif`
                    : "Tidak ada jadwal ditemukan"}
          </Text>

          {/* SKELETON */}
          {loading ? (
            [1, 2, 3].map((i) => <DaySkeleton key={i} />)
          ) : error ? (
            <View style={styles.empty}>
              <Ionicons name="wifi-outline" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>Gagal memuat data</Text>
              <Text style={{ fontSize: 12, color: Colors.hint }}>
                Periksa koneksi internet kamu
              </Text>
              <TouchableOpacity style={styles.retryBtn} onPress={getJadwal}>
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={styles.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : !hasJadwal ? (
            <View style={styles.empty}>
              <Ionicons
                name="calendar-outline"
                size={40}
                color={Colors.border}
              />
              <Text style={styles.emptyText}>
                {search.trim() ? "Tidak ada hasil" : "Tidak ada jadwal"}
              </Text>
              <Text style={styles.emptySubText}>
                {search.trim()
                  ? "Coba kata kunci lain"
                  : `untuk periode ${PERIODE_OPTIONS.find((p) => p.value === periode)?.label}`}
              </Text>
            </View>
          ) : (
            hariTerurut.map((hari) => {
              const isToday = isCurrentPeriode && hari === today;
              return (
                <View key={hari} style={styles.group}>
                  {/* DAY HEADER */}
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

                  {/* CLASS CARDS */}
                  {perHari[hari].map((k, i) => {
                    const j = k._jadwal;
                    const dosen =
                      k.pengajar?.find((p: any) => p.utama) ?? k.pengajar?.[0];
                    const gelar = dosen?.gelar_akademik
                      ? `, ${dosen.gelar_akademik}`
                      : "";
                    const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
                    const status = getClassStatus(j, isToday, isCurrentPeriode);

                    return (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.card,
                          isToday && styles.cardToday,
                          status === "ongoing" && styles.cardOngoing,
                          status === "done" && styles.cardDone,
                        ]}
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
                            {
                              backgroundColor:
                                status === "done" ? Colors.border : accent,
                            },
                          ]}
                        />
                        <View style={styles.cardBody}>
                          {/* TITLE + SKS */}
                          <View style={styles.cardTopRow}>
                            <Text
                              style={[
                                styles.cardTitle,
                                status === "done" && { color: Colors.muted },
                              ]}
                              numberOfLines={2}
                            >
                              {k.mata_kuliah?.nama}
                            </Text>
                            <View
                              style={{
                                flexDirection: "row",
                                gap: 6,
                                alignItems: "center",
                              }}
                            >
                              {status === "ongoing" && (
                                <View style={styles.ongoingBadge}>
                                  <View style={styles.ongoingDot} />
                                  <Text style={styles.ongoingText}>Live</Text>
                                </View>
                              )}
                              {k.mata_kuliah?.sks && (
                                <View style={g.badgePrimary}>
                                  <Text style={g.badgePrimaryText}>
                                    {k.mata_kuliah.sks} SKS
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>

                          <Text style={styles.kodeMatkul}>
                            {k.mata_kuliah?.kode || ""}
                          </Text>
                          <View style={styles.divider} />

                          {/* INFO ROWS */}
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
                              {`${j?.jam_mulai?.slice(0, 5) ?? "-"} – ${j?.jam_selesai?.slice(0, 5) ?? "-"}`}
                            </Text>
                            {j?.jam_mulai && j?.jam_selesai && (
                              <View style={styles.durationPill}>
                                <Text style={styles.durationText}>
                                  {toMinutes(j.jam_selesai) -
                                    toMinutes(j.jam_mulai)}{" "}
                                  mnt
                                </Text>
                              </View>
                            )}
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

                          {/* BOTTOM ROW */}
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
                            {k.kelas?.nama && (
                              <View style={styles.kelasBadge}>
                                <Ionicons
                                  name="people-outline"
                                  size={11}
                                  color={Colors.muted}
                                />
                                <Text style={styles.kelasText}>
                                  {k.kelas.nama}
                                </Text>
                              </View>
                            )}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  iconBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    padding: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBtnActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderColor: "rgba(255,255,255,0.35)",
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

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  searchInput: { flex: 1, fontSize: 13, color: "#fff", padding: 0 },

  summaryStrip: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: -22,
    gap: 8,
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
  cardOngoing: { borderColor: "#FCA5A5", backgroundColor: "#FFF5F5" },
  cardDone: { opacity: 0.55 },
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
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 6 },
  infoText: { fontSize: 12, color: Colors.muted, flex: 1 },

  durationPill: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  durationText: { fontSize: 10, color: Colors.primary, fontWeight: "600" },

  ongoingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ongoingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.dangerText,
  },
  ongoingText: { fontSize: 10, fontWeight: "700", color: Colors.dangerText },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  kelasBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  kelasText: { fontSize: 10, color: Colors.muted, fontWeight: "500" },
  tapHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: "auto",
  },
  tapHintText: { fontSize: 10, color: Colors.primary, fontWeight: "600" },

  skeletonCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    overflow: "hidden",
  },
  skeletonStripe: { width: 4, backgroundColor: Colors.skeletonBase },

  empty: { alignItems: "center", paddingVertical: 56, gap: 8 },
  emptyText: { fontSize: 14, color: Colors.muted, fontWeight: "600" },
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
