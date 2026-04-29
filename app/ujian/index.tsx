import { SkeletonBlock } from "@/components/SkeletonBlock";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

const JENIS_OPTIONS = [
  { value: "", label: "Semua" },
  { value: "kuis", label: "Kuis" },
  { value: "ujian", label: "Ujian" },
  { value: "uts", label: "UTS" },
  { value: "uas", label: "UAS" },
];

const stripHtml = (html: string): string => {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
};

const formatWaktu = (dateStr: string) =>
  new Date(dateStr).toLocaleString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getUjianStatus = (u: any): "aktif" | "selesai" | "belum" => {
  if (u.status === "selesai") return "selesai";
  if (!u.waktu_mulai) return "belum";
  const now = new Date();
  const mulai = new Date(u.waktu_mulai);
  const selesai = u.waktu_selesai ? new Date(u.waktu_selesai) : null;
  if (selesai && now > selesai) return "selesai";
  if (now >= mulai) return "aktif";
  return "belum";
};

const getSudahDikerjakan = (u: any) => u.jumlah_pengerjaan > 0;

const JENIS_ICON: Record<string, any> = {
  kuis: "help-circle-outline",
  ujian: "school-outline",
  uts: "newspaper-outline",
  uas: "ribbon-outline",
};

// ─── Skeleton: identik dengan struktur card asli (stripe + icon + badges + rows + tombol) ──
const UjianSkeleton = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonStripe} />
    <View style={{ flex: 1, padding: 12, gap: 8 }}>
      {/* top row: icon + badge jenis + badge status */}
      <View style={styles.skeletonTopRow}>
        <View style={styles.skeletonIcon} />
        <View style={{ flexDirection: "row", gap: 6 }}>
          <SkeletonBlock height={20} width={40} />
          <SkeletonBlock height={20} width={80} />
        </View>
      </View>
      {/* judul + subtitle */}
      <SkeletonBlock height={14} width="70%" />
      <SkeletonBlock height={11} width="50%" />
      {/* divider */}
      <View style={{ height: 1, backgroundColor: Colors.border }} />
      {/* info rows */}
      <SkeletonBlock height={11} width="55%" />
      <SkeletonBlock height={11} width="75%" />
      <SkeletonBlock height={11} width="45%" />
      {/* tombol row */}
      <View style={styles.skeletonBtnRow}>
        <SkeletonBlock height={34} width={80} />
        <SkeletonBlock height={34} width="60%" />
      </View>
    </View>
  </View>
);

export default function Ujian() {
  const [data, setData] = useState<any[]>([]);
  const [periode, setPeriode] = useState(20252);
  const [jenis, setJenis] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getUjian();
  }, [periode, jenis]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      getUjian();
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const getUjian = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await API.get("/v2/lms/ujian", {
        params: {
          page: 1,
          per_page: 50,
          periode,
          jenis: jenis || undefined,
          search: search || undefined,
        },
      });
      setData(res.data.data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const periodeLabel =
    PERIODE_OPTIONS.find((p) => p.value === periode)?.label ?? "";

  const aktifCount = data.filter((u) => getUjianStatus(u) === "aktif").length;
  const sudahCount = data.filter((u) => getSudahDikerjakan(u)).length;

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
          <Text style={styles.headerTitle}>Ujian & Kuis</Text>
          <Text style={styles.headerSub}>
            {loading
              ? "Memuat ujian..."
              : error
                ? "Gagal memuat data"
                : periodeLabel}
          </Text>

          {!loading && !error && (
            <View style={styles.pillRow}>
              {aktifCount > 0 && (
                <View style={styles.activePill}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activePillText}>
                    {aktifCount} sedang berlangsung
                  </Text>
                </View>
              )}
              <View style={styles.statPill}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={12}
                  color="#fff"
                />
                <Text style={styles.statPillText}>
                  {sudahCount}/{data.length} dikerjakan
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={15} color={Colors.hint} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari ujian atau mata kuliah..."
            placeholderTextColor={Colors.hint}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={15} color={Colors.hint} />
            </TouchableOpacity>
          )}
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

        {/* FILTER JENIS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {JENIS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[g.filterChip, jenis === opt.value && g.filterChipActive]}
              activeOpacity={0.75}
              onPress={() => setJenis(opt.value)}
            >
              <Text
                style={[
                  g.filterChipText,
                  jenis === opt.value && g.filterChipTextActive,
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
              ? "Memuat ujian..."
              : error
                ? "Gagal memuat data"
                : data.length === 0
                  ? "Tidak ada ujian ditemukan"
                  : `${data.length} ujian · ${periodeLabel}`}
          </Text>

          {/* ── SKELETON ── */}
          {loading ? (
            [1, 2, 3].map((i) => <UjianSkeleton key={i} />)
          ) : error ? (
            /* ── ERROR STATE ── */
            <View style={styles.empty}>
              <Ionicons name="wifi-outline" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>Gagal memuat data</Text>
              <Text style={{ fontSize: 12, color: Colors.hint }}>
                Periksa koneksi internet kamu
              </Text>
              <TouchableOpacity style={styles.retryBtn} onPress={getUjian}>
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={styles.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : data.length === 0 ? (
            /* ── EMPTY STATE ── */
            <View style={styles.empty}>
              <Ionicons
                name="document-text-outline"
                size={40}
                color={Colors.border}
              />
              <Text style={styles.emptyText}>Tidak ada ujian</Text>
              <Text style={{ fontSize: 12, color: Colors.hint }}>
                untuk periode {periodeLabel}
              </Text>
            </View>
          ) : (
            /* ── DATA ── */
            data.map((u) => {
              const status = getUjianStatus(u);
              const isAktif = status === "aktif";
              const isSelesai = status === "selesai";
              const sudah = getSudahDikerjakan(u);
              const mk = u.kelas_kuliah?.mata_kuliah;
              const kelas = u.kelas_kuliah?.kelas;

              const handleNavigate = () => {
                if (!u.id || u.id === "index") return;
                router.push({
                  pathname: "/ujian/[id]",
                  params: { id: u.id },
                } as any);
              };

              return (
                <TouchableOpacity
                  key={u.id}
                  style={[
                    styles.card,
                    isAktif && { borderColor: Colors.successBorder },
                  ]}
                  activeOpacity={0.75}
                  onPress={handleNavigate}
                >
                  {/* STRIPE */}
                  <View
                    style={[
                      styles.cardStripe,
                      {
                        backgroundColor: isAktif
                          ? Colors.successText
                          : isSelesai
                            ? Colors.muted
                            : Colors.primary,
                      },
                    ]}
                  />

                  <View style={styles.cardBody}>
                    {/* TOP ROW */}
                    <View style={styles.cardTopRow}>
                      <View style={g.iconWrap}>
                        <Ionicons
                          name={JENIS_ICON[u.jenis] ?? "document-text-outline"}
                          size={16}
                          color={Colors.primary}
                        />
                      </View>
                      <View style={styles.badgeRow}>
                        <View style={styles.jenisBadge}>
                          <Text style={styles.jenisBadgeText}>
                            {u.jenis?.toUpperCase() ?? "-"}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            isAktif
                              ? styles.statusAktif
                              : isSelesai
                                ? styles.statusSelesai
                                : styles.statusBelum,
                          ]}
                        >
                          {isAktif && <View style={styles.statusDot} />}
                          <Text
                            style={[
                              styles.statusText,
                              {
                                color: isAktif
                                  ? Colors.successText
                                  : isSelesai
                                    ? Colors.muted
                                    : Colors.warningText,
                              },
                            ]}
                          >
                            {isAktif
                              ? "Berlangsung"
                              : isSelesai
                                ? "Selesai"
                                : "Belum mulai"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* JUDUL */}
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {u.judul || "-"}
                    </Text>
                    <Text style={styles.cardSubtitle} numberOfLines={1}>
                      {mk?.kode ? `${mk.kode} — ${mk.nama}` : mk?.nama || "-"}
                    </Text>

                    <View style={styles.divider} />

                    {/* INFO ROWS */}
                    {kelas?.nama && (
                      <View style={g.infoRow}>
                        <Ionicons
                          name="bookmark-outline"
                          size={13}
                          color={Colors.hint}
                        />
                        <Text style={styles.infoText}>Kelas {kelas.nama}</Text>
                      </View>
                    )}
                    {u.waktu_mulai && (
                      <View style={g.infoRow}>
                        <Ionicons
                          name="time-outline"
                          size={13}
                          color={Colors.hint}
                        />
                        <Text style={styles.infoText}>
                          {formatWaktu(u.waktu_mulai)}
                        </Text>
                      </View>
                    )}
                    <View style={g.infoRow}>
                      <Ionicons
                        name="hourglass-outline"
                        size={13}
                        color={Colors.hint}
                      />
                      <Text style={styles.infoText}>
                        {u.gunakan_batas_waktu
                          ? `${u.durasi} menit`
                          : "Tanpa batas waktu"}
                      </Text>
                      {u.acakSoal && (
                        <>
                          <Text
                            style={{
                              color: Colors.border,
                              marginHorizontal: 4,
                            }}
                          >
                            ·
                          </Text>
                          <Ionicons
                            name="shuffle-outline"
                            size={13}
                            color={Colors.hint}
                          />
                          <Text style={styles.infoText}>Soal diacak</Text>
                        </>
                      )}
                    </View>
                    {sudah && u.waktu_mulai_pengerjaan && (
                      <View style={g.infoRow}>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={13}
                          color={Colors.successText}
                        />
                        <Text
                          style={[
                            styles.infoText,
                            { color: Colors.successText },
                          ]}
                        >
                          Dikerjakan {formatWaktu(u.waktu_mulai_pengerjaan)}
                        </Text>
                      </View>
                    )}
                    {u.deskripsi && u.deskripsi !== "-" && (
                      <View style={g.infoRow}>
                        <Ionicons
                          name="information-circle-outline"
                          size={13}
                          color={Colors.hint}
                        />
                        <Text style={styles.infoText} numberOfLines={1}>
                          {stripHtml(u.deskripsi)}
                        </Text>
                      </View>
                    )}

                    {/* TOMBOL */}
                    <View style={styles.btnRow}>
                      <TouchableOpacity
                        style={styles.detailBtn}
                        onPress={handleNavigate}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name="information-circle-outline"
                          size={14}
                          color={Colors.primary}
                        />
                        <Text style={styles.detailBtnText}>Detail</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.kerjakanBtn,
                          (isSelesai || sudah || !isAktif) &&
                            styles.kerjakanBtnMuted,
                        ]}
                        disabled={isSelesai || sudah || !isAktif}
                        onPress={isAktif && !sudah ? handleNavigate : undefined}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={
                            sudah
                              ? "checkmark-circle-outline"
                              : "pencil-outline"
                          }
                          size={14}
                          color={
                            isSelesai || sudah || !isAktif
                              ? Colors.muted
                              : "#fff"
                          }
                        />
                        <Text
                          style={[
                            styles.kerjakanBtnText,
                            (isSelesai || sudah || !isAktif) && {
                              color: Colors.muted,
                            },
                          ]}
                        >
                          {sudah
                            ? "Sudah Dikerjakan"
                            : isSelesai
                              ? "Waktu Habis"
                              : isAktif
                                ? "Kerjakan"
                                : "Belum Dibuka"}
                        </Text>
                      </TouchableOpacity>
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
  backLabel: { fontSize: 12, fontWeight: "600", color: "#fff" },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.55)" },
  pillRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
  },
  activePillText: { fontSize: 11, color: "#fff", fontWeight: "600" },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statPillText: { fontSize: 11, color: "#fff", fontWeight: "600" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    padding: 0,
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

  // ─── Card ────────────────────────────────────────────────────────────────────
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
  cardBody: { flex: 1, padding: 12, gap: 6 },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    lineHeight: 20,
  },
  cardSubtitle: { fontSize: 12, color: Colors.muted },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 2 },
  infoText: { fontSize: 12, color: Colors.muted, flex: 1 },

  jenisBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.primaryMid,
  },
  jenisBadgeText: { fontSize: 9, fontWeight: "700", color: Colors.primary },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusAktif: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.successBorder,
  },
  statusBelum: {
    backgroundColor: Colors.warningBg,
    borderColor: Colors.warningBorder,
  },
  statusSelesai: { backgroundColor: "#F3F4F6", borderColor: Colors.border },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.successText,
  },
  statusText: { fontSize: 10, fontWeight: "700" },

  btnRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.primaryMid,
  },
  detailBtnText: { fontSize: 12, fontWeight: "600", color: Colors.primary },
  kerjakanBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
  },
  kerjakanBtnMuted: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kerjakanBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  // ─── Skeleton ────────────────────────────────────────────────────────────────
  skeletonCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    overflow: "hidden",
  },
  skeletonStripe: {
    width: 4,
    backgroundColor: Colors.skeletonBase,
  },
  skeletonTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.skeletonBase,
  },
  skeletonBtnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },

  // ─── Empty / Error ───────────────────────────────────────────────────────────
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
