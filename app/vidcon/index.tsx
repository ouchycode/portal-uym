import { SkeletonBlock } from "@/components/SkeletonBlock";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
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

const formatWaktu = (dateStr: string) =>
  new Date(dateStr).toLocaleString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getVidconStatus = (v: any): "live" | "selesai" | "pending" => {
  if (v.status === "selesai") return "selesai";
  if (v.status === "live") return "live";
  if (!v.waktu_mulai) return "pending";
  const now = new Date();
  const mulai = new Date(v.waktu_mulai);
  const selesai = v.waktu_selesai ? new Date(v.waktu_selesai) : null;
  if (selesai && now > selesai) return "selesai";
  if (now >= mulai) return "live";
  return "pending";
};

const APLIKASI_ICON: Record<string, any> = {
  gmeet: "logo-google",
  zoom: "videocam-outline",
  teams: "people-outline",
};

const goToDetail = (id: any, v: any) => {
  if (!id || id === "index") return;
  router.push({
    pathname: "/vidcon/[id]",
    params: {
      id: String(id),
      mkNama: v.kelas_kuliah?.mata_kuliah?.nama || "",
      mkKode: v.kelas_kuliah?.mata_kuliah?.kode || "",
      judul: v.judul || "",
    },
  } as any);
};

// ─── Skeleton card: mirip struktur card asli (stripe + icon + rows) ───────────
const VidconSkeleton = () => (
  <View style={styles.skeletonCard}>
    {/* stripe kiri — sama persis seperti card asli */}
    <View style={styles.skeletonStripe} />
    <View style={{ flex: 1, padding: 12, gap: 8 }}>
      {/* top row: icon placeholder + status badge placeholder */}
      <View style={styles.skeletonTopRow}>
        <View style={styles.skeletonIcon} />
        <SkeletonBlock height={22} width={72} />
      </View>
      {/* judul mata kuliah */}
      <SkeletonBlock height={14} width="70%" />
      <SkeletonBlock height={11} width="45%" />
      {/* divider */}
      <View style={{ height: 1, backgroundColor: Colors.border }} />
      {/* info rows */}
      <SkeletonBlock height={11} width="80%" />
      <SkeletonBlock height={11} width="55%" />
      {/* tombol row */}
      <View style={styles.skeletonBtnRow}>
        <SkeletonBlock height={34} width={80} />
        <SkeletonBlock height={34} width="60%" />
      </View>
    </View>
  </View>
);

export default function Vidcon() {
  const [data, setData] = useState<any[]>([]);
  const [periode, setPeriode] = useState(20252);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getVidcon();
  }, [periode]);

  const getVidcon = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await API.get("/v2/lms/vidcon", {
        params: { page: 1, per_page: 50, periode },
      });
      setData(res.data.data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const openMeeting = async (url: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Gagal", "Tidak bisa membuka link meeting.");
    }
  };

  const periodeLabel =
    PERIODE_OPTIONS.find((p) => p.value === periode)?.label ?? "";

  const liveCount = data.filter((v) => getVidconStatus(v) === "live").length;

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

            {!loading && liveCount > 0 && (
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.livePillText}>
                  {liveCount} sedang berlangsung
                </Text>
              </View>
            )}
          </View>
          <Text style={g.headerTitle}>Video Conference</Text>
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

        {/* BODY */}
        <View style={g.body}>
          <Text style={g.sectionLabel}>
            {loading
              ? "Memuat vidcon..."
              : error
                ? "Gagal memuat data"
                : data.length === 0
                  ? "Tidak ada vidcon ditemukan"
                  : `${data.length} sesi · ${periodeLabel}`}
          </Text>

          {/* ── SKELETON ── */}
          {loading ? (
            [1, 2, 3].map((i) => <VidconSkeleton key={i} />)
          ) : error ? (
            /* ── ERROR STATE ── */
            <View style={g.empty}>
              <Ionicons name="wifi-outline" size={40} color={Colors.border} />
              <Text style={g.emptyTitle}>Gagal memuat data</Text>
              <Text style={g.emptyHint}>Periksa koneksi internet kamu</Text>
              <TouchableOpacity style={g.retryBtn} onPress={getVidcon}>
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={g.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : data.length === 0 ? (
            /* ── EMPTY STATE ── */
            <View style={g.empty}>
              <Ionicons
                name="videocam-off-outline"
                size={40}
                color={Colors.border}
              />
              <Text style={g.emptyTitle}>Tidak ada vidcon</Text>
              <Text style={g.emptyHint}>untuk periode {periodeLabel}</Text>
            </View>
          ) : (
            /* ── DATA ── */
            data.map((v) => {
              const status = getVidconStatus(v);
              const isLive = status === "live";
              const isSelesai = status === "selesai";
              const hasLink = !!(v.link || v.url);
              const mk = v.kelas_kuliah?.mata_kuliah;
              const kelas = v.kelas_kuliah?.kelas;

              return (
                <TouchableOpacity
                  key={v.id}
                  style={[
                    styles.card,
                    isLive && { borderColor: Colors.successBorder },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => goToDetail(v.id_pertemuan, v)}
                >
                  {/* STRIPE */}
                  <View
                    style={[
                      styles.cardStripe,
                      {
                        backgroundColor: isLive
                          ? Colors.successText
                          : isSelesai
                            ? Colors.muted
                            : Colors.primary,
                      },
                    ]}
                  />

                  <View style={styles.cardBody}>
                    <View style={styles.cardTopRow}>
                      <View style={g.iconWrap}>
                        <Ionicons
                          name={APLIKASI_ICON[v.aplikasi] ?? "videocam-outline"}
                          size={16}
                          color={Colors.primary}
                        />
                      </View>
                      <View
                        style={
                          isLive
                            ? g.badgeSuccess
                            : isSelesai
                              ? g.badgeSlate
                              : g.badgeWarning
                        }
                      >
                        {isLive && <View style={styles.statusDot} />}
                        <Text
                          style={
                            isLive
                              ? g.badgeSuccessText
                              : isSelesai
                                ? g.badgeSlateText
                                : g.badgeWarningText
                          }
                        >
                          {isLive
                            ? "Live"
                            : isSelesai
                              ? "Selesai"
                              : "Belum mulai"}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {mk?.kode ? `${mk.kode} — ${mk.nama}` : mk?.nama || "-"}
                    </Text>

                    <View style={[g.divider, { marginVertical: 2 }]} />

                    <View style={g.infoRow}>
                      <Ionicons
                        name="bookmark-outline"
                        size={13}
                        color={Colors.hint}
                      />
                      <Text style={styles.infoText}>
                        {v.judul || "-"}
                        {kelas?.nama ? `  ·  ${kelas.nama}` : ""}
                      </Text>
                    </View>
                    {v.waktu_mulai && (
                      <View style={g.infoRow}>
                        <Ionicons
                          name="time-outline"
                          size={13}
                          color={Colors.hint}
                        />
                        <Text style={styles.infoText}>
                          {formatWaktu(v.waktu_mulai)}
                        </Text>
                      </View>
                    )}
                    {v.jumlah_peserta != null && (
                      <View style={g.infoRow}>
                        <Ionicons
                          name="people-outline"
                          size={13}
                          color={Colors.hint}
                        />
                        <Text style={styles.infoText}>
                          {v.jumlah_peserta} peserta bergabung
                        </Text>
                      </View>
                    )}

                    <View style={styles.btnRow}>
                      <TouchableOpacity
                        style={g.retryBtn}
                        onPress={() => goToDetail(v.id_pertemuan, v)}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name="information-circle-outline"
                          size={14}
                          color={Colors.primary}
                        />
                        <Text style={g.retryText}>Detail</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.joinBtn,
                          (!hasLink || isSelesai) && styles.joinBtnMuted,
                        ]}
                        onPress={() => openMeeting(v.link || v.url)}
                        disabled={!hasLink || isSelesai}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="videocam-outline"
                          size={14}
                          color={isSelesai ? Colors.muted : "#fff"}
                        />
                        <Text
                          style={[
                            styles.joinBtnText,
                            isSelesai && { color: Colors.muted },
                          ]}
                        >
                          {isSelesai ? "Sesi Selesai" : "Join Meeting"}
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
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ADE80" },
  livePillText: { fontSize: 11, color: "#fff", fontWeight: "600" },

  filterScroll: { marginTop: 16 },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingRight: 32,
  },

  card: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 0.5,
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
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    lineHeight: 20,
  },
  infoText: { fontSize: 12, color: Colors.muted, flex: 1 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 0.5,
  },
  statusLive: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.successBorder,
  },
  statusPending: {
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

  joinBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
  },
  joinBtnMuted: {
    backgroundColor: "#F3F4F6",
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  joinBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  skeletonCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 0.5,
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
});
