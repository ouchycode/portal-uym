import { SkeletonBlock } from "@/components/SkeletonBlock";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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

const APLIKASI_ICON: Record<string, any> = {
  gmeet: "logo-google",
  zoom: "videocam-outline",
  teams: "people-outline",
};

const formatWaktu = (dateStr: string) =>
  new Date(dateStr).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getStatus = (v: any): "live" | "selesai" | "pending" => {
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

const DetailSkeleton = () => (
  <View style={g.card}>
    {/* stripe kiri */}
    <View style={styles.skeletonStripe} />
    <View style={{ flex: 1, padding: 12, gap: 8 }}>
      {/* top row: icon + judul */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={styles.skeletonIcon} />
        <SkeletonBlock height={14} width="65%" />
      </View>
      {/* divider */}
      <View style={{ height: 1, backgroundColor: Colors.border }} />
      {/* info rows */}
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <SkeletonBlock height={13} width={13} />
        <SkeletonBlock height={11} width="55%" />
      </View>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <SkeletonBlock height={13} width={13} />
        <SkeletonBlock height={11} width="75%" />
      </View>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <SkeletonBlock height={13} width={13} />
        <SkeletonBlock height={11} width="40%" />
      </View>
      {/* tombol join */}
      <SkeletonBlock height={46} width="100%" />
    </View>
  </View>
);

export default function VidconDetail() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const mkNama = Array.isArray(params.mkNama)
    ? params.mkNama[0]
    : (params.mkNama as string) || "";
  const mkKode = Array.isArray(params.mkKode)
    ? params.mkKode[0]
    : (params.mkKode as string) || "";
  const judulParam = Array.isArray(params.judul)
    ? params.judul[0]
    : (params.judul as string) || "";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAllPeserta, setShowAllPeserta] = useState(false);

  useEffect(() => {
    if (!id || id === "index") {
      setLoading(false);
      return;
    }
    getDetail();
  }, [id]);

  const getDetail = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await API.get(`/v2/lms/pertemuan/${id}/vidcon`, {
        params: { ignore_default_pagination: true },
      });
      setData(res.data.data?.[0] || null);
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

  const status = data ? getStatus(data) : null;
  const isLive = status === "live";
  const isSelesai = status === "selesai";
  const hasLink = !!(data?.link || data?.url);
  const kelas = data?.kelas_kuliah?.kelas;
  const mkTitle = mkKode
    ? `${mkKode} — ${mkNama}`
    : mkNama || "Detail Video Conference";

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

            {!loading && data && (
              <View
                style={[
                  styles.statusPill,
                  isLive
                    ? styles.statusPillLive
                    : isSelesai
                      ? styles.statusPillSelesai
                      : styles.statusPillPending,
                ]}
              >
                {isLive && <View style={styles.statusDot} />}
                <Text style={styles.statusPillText}>
                  {isLive
                    ? "Sedang Berlangsung"
                    : isSelesai
                      ? "Sesi Selesai"
                      : "Belum Mulai"}
                </Text>
              </View>
            )}
          </View>
          <Text style={g.headerTitle}>{mkTitle}</Text>
          <Text style={g.headerSub}>{data?.judul || judulParam || "-"}</Text>
        </View>

        <View style={g.body}>
          {/* ── SKELETON ── */}
          {loading ? (
            <DetailSkeleton />
          ) : error ? (
            /* ── ERROR STATE ── */
            <View style={g.empty}>
              <Ionicons name="wifi-outline" size={40} color={Colors.border} />
              <Text style={g.emptyTitle}>Gagal memuat data</Text>
              <Text style={g.emptyHint}>Periksa koneksi internet kamu</Text>
              <TouchableOpacity style={g.retryBtn} onPress={getDetail}>
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={g.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : !data ? (
            /* ── EMPTY STATE ── */
            <View style={g.empty}>
              <Ionicons
                name="videocam-off-outline"
                size={40}
                color={Colors.border}
              />
              <Text style={g.emptyTitle}>Tidak ada data vidcon</Text>
            </View>
          ) : (
            <>
              {/* INFO CARD */}
              <View style={[g.card, g.cardAccent]}>
                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <View style={g.iconWrap}>
                      <Ionicons
                        name={
                          APLIKASI_ICON[data.aplikasi] ?? "videocam-outline"
                        }
                        size={16}
                        color={Colors.primary}
                      />
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {data.judul || "-"}
                    </Text>
                  </View>

                  <View style={g.divider} />
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
                  {data.waktu_mulai && (
                    <View style={g.infoRow}>
                      <Ionicons
                        name="time-outline"
                        size={13}
                        color={Colors.hint}
                      />
                      <Text style={styles.infoText}>
                        {formatWaktu(data.waktu_mulai)}
                      </Text>
                    </View>
                  )}
                  {data.waktu_selesai && (
                    <View style={g.infoRow}>
                      <Ionicons
                        name="time-outline"
                        size={13}
                        color={Colors.hint}
                      />
                      <Text style={styles.infoText}>
                        Selesai: {formatWaktu(data.waktu_selesai)}
                      </Text>
                    </View>
                  )}
                  {data.jumlah_peserta != null && (
                    <View style={g.infoRow}>
                      <Ionicons
                        name="people-outline"
                        size={13}
                        color={Colors.hint}
                      />
                      <Text style={styles.infoText}>
                        {data.jumlah_peserta} peserta bergabung
                      </Text>
                    </View>
                  )}
                  {!!data.catatan && (
                    <View style={g.infoRow}>
                      <Ionicons
                        name="document-text-outline"
                        size={13}
                        color={Colors.hint}
                      />
                      <Text style={styles.infoText}>{data.catatan}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* PESERTA BERGABUNG */}
              {data.join_data?.length > 0 && (
                <>
                  <View style={styles.pesertaHeader}>
                    <Text style={g.sectionLabel}>
                      Peserta Bergabung ({data.join_data.length})
                    </Text>
                    {data.join_data.length > 3 && (
                      <TouchableOpacity
                        onPress={() => setShowAllPeserta((v) => !v)}
                      >
                        <Text style={styles.toggleText}>
                          {showAllPeserta ? "Sembunyikan" : "Lihat semua"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {(showAllPeserta
                    ? data.join_data
                    : data.join_data.slice(0, 3)
                  ).map((j: any, i: number) => (
                    <View key={i} style={[g.listRow, { gap: 10 }]}>
                      <View style={g.iconWrap}>
                        <Ionicons
                          name="person-outline"
                          size={14}
                          color={Colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={g.listRowTitle}>{j.username}</Text>
                        <Text style={g.listRowSub}>
                          {new Date(j.waktu_join).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {/* BUTTON JOIN MEETING */}
              <TouchableOpacity
                style={[
                  g.btnPrimary,
                  { flexDirection: "row", gap: 8 },
                  (!hasLink || isSelesai) && g.btnGhost,
                ]}
                onPress={() => openMeeting(data.link || data.url)}
                disabled={!hasLink || isSelesai}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="videocam-outline"
                  size={16}
                  color={isSelesai ? Colors.muted : "#fff"}
                />
                <Text
                  style={[
                    g.btnPrimaryText,
                    isSelesai && { color: Colors.muted },
                  ]}
                >
                  {isSelesai ? "Sesi Sudah Selesai" : "Join Meeting"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  statusPillLive: { backgroundColor: "rgba(74,222,128,0.2)" },
  statusPillPending: { backgroundColor: "rgba(250,204,21,0.2)" },
  statusPillSelesai: { backgroundColor: "rgba(255,255,255,0.15)" },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
  },
  statusPillText: { fontSize: 11, color: "#fff", fontWeight: "600" },

  // ─── Skeleton ────────────────────────────────────────────────────────────────
  skeletonStripe: {
    width: 4,
    backgroundColor: Colors.skeletonBase,
  },
  skeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.skeletonBase,
  },

  cardBody: { flex: 1, padding: 12, gap: 6 },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    lineHeight: 20,
  },
  infoText: { fontSize: 12, color: Colors.muted, flex: 1 },

  pesertaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 4,
  },
  toggleText: { fontSize: 11, color: Colors.primary, fontWeight: "600" },
});
