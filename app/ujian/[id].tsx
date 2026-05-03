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

const JENIS_ICON: Record<string, any> = {
  kuis: "help-circle-outline",
  ujian: "school-outline",
  uts: "newspaper-outline",
  uas: "ribbon-outline",
};

const stripHtml = (html: string): string => {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

const formatDurasi = (menit: number) => {
  if (menit < 60) return `${menit} menit`;
  const jam = Math.floor(menit / 60);
  const sisa = menit % 60;
  return sisa > 0 ? `${jam} jam ${sisa} menit` : `${jam} jam`;
};

const getStatus = (u: any): "aktif" | "selesai" | "belum" => {
  if (u.status === "selesai") return "selesai";
  if (!u.waktu_mulai) return "belum";
  const now = new Date();
  const mulai = new Date(u.waktu_mulai);
  const selesai = u.waktu_selesai ? new Date(u.waktu_selesai) : null;
  if (selesai && now > selesai) return "selesai";
  if (now >= mulai) return "aktif";
  return "belum";
};

export default function UjianDetail() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
      const res = await API.get(`/v2/lms/ujian/${id}`);
      setData(res.data.data || res.data || null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // ── SKELETON ──
  if (loading) {
    return (
      <SafeAreaView style={g.safeArea}>
        <View style={g.header}>
          <View style={g.headerTop}>
            <SkeletonBlock height={28} width={80} />
          </View>
          <SkeletonBlock height={20} width="70%" />
          <SkeletonBlock height={11} width="45%" />
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={g.body}
          showsVerticalScrollIndicator={false}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={[g.infoRow, { alignItems: "center" }]}>
              <SkeletonBlock height={28} width={28} />
              <SkeletonBlock
                height={12}
                width={`${[60, 75, 50, 80, 65, 55][i - 1]}%`}
              />
            </View>
          ))}
          <SkeletonBlock height={52} width="100%" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── ERROR STATE ──
  if (error) {
    return (
      <SafeAreaView style={g.safeArea}>
        <View style={[g.emptyWrap, { flex: 1, justifyContent: "center" }]}>
          <Ionicons name="wifi-outline" size={40} color={Colors.border} />
          <Text style={g.emptyTitle}>Gagal memuat data</Text>
          <Text style={g.emptyHint}>Periksa koneksi internet kamu</Text>
          <TouchableOpacity style={g.retryBtn} onPress={getDetail}>
            <Ionicons name="refresh-outline" size={15} color={Colors.primary} />
            <Text style={g.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── EMPTY STATE ──
  if (!data) {
    return (
      <SafeAreaView style={g.safeArea}>
        <View style={[g.emptyWrap, { flex: 1, justifyContent: "center" }]}>
          <Ionicons
            name="document-text-outline"
            size={40}
            color={Colors.border}
          />
          <Text style={g.emptyTitle}>Tidak ada data ujian</Text>
          <TouchableOpacity style={g.retryBtn} onPress={getDetail}>
            <Ionicons name="refresh-outline" size={15} color={Colors.primary} />
            <Text style={g.retryText}>Muat Ulang</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = getStatus(data);
  const isAktif = status === "aktif";
  const isSelesai = status === "selesai";
  const sudah = data.jumlah_pengerjaan > 0;
  const mk = data.kelas_kuliah?.mata_kuliah;
  const kelas = data.kelas_kuliah?.kelas;

  const durasiPengerjaan =
    sudah && data.waktu_mulai_pengerjaan && data.waktu_selesai_pengerjaan
      ? Math.round(
          (new Date(data.waktu_selesai_pengerjaan).getTime() -
            new Date(data.waktu_mulai_pengerjaan).getTime()) /
            60000,
        )
      : null;

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

            <View style={styles.jenisBadge}>
              <Ionicons
                name={JENIS_ICON[data.jenis] ?? "document-text-outline"}
                size={11}
                color="#fff"
              />
              <Text style={styles.jenisBadgeText}>
                {data.jenis?.toUpperCase() ?? "-"}
              </Text>
            </View>

            <View
              style={[
                styles.statusPill,
                isAktif
                  ? styles.statusPillAktif
                  : isSelesai
                    ? styles.statusPillSelesai
                    : styles.statusPillBelum,
              ]}
            >
              {isAktif && <View style={styles.statusDot} />}
              <Text style={styles.statusPillText}>
                {isAktif
                  ? "Sedang Berlangsung"
                  : isSelesai
                    ? "Sesi Selesai"
                    : "Belum Dibuka"}
              </Text>
            </View>
          </View>
          <Text style={g.headerTitle} numberOfLines={2}>
            {data.judul || "-"}
          </Text>
          <Text style={g.headerSub}>
            {mk?.kode ? `${mk.kode} — ${mk.nama}` : mk?.nama || "-"}
          </Text>
        </View>

        <View style={g.body}>
          {/* SUDAH DIKERJAKAN BANNER */}
          {sudah && (
            <View
              style={[
                g.card,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  padding: 12,
                  borderColor: Colors.successBorder,
                  backgroundColor: Colors.successBg,
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={Colors.successText}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.successBannerTitle}>Sudah Dikerjakan</Text>
                {durasiPengerjaan != null && (
                  <Text style={styles.successBannerSub}>
                    Diselesaikan dalam {formatDurasi(durasiPengerjaan)}
                  </Text>
                )}
              </View>
              {data.is_tampilkan_nilai && data.rata_rata_nilai > 0 && (
                <View style={styles.nilaiBadge}>
                  <Text style={styles.nilaiText}>
                    {Number(data.rata_rata_nilai).toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* INFO UTAMA */}
          <View style={styles.card}>
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
              <View style={styles.cardTopRow}>
                <View style={g.iconWrap}>
                  <Ionicons
                    name={JENIS_ICON[data.jenis] ?? "document-text-outline"}
                    size={16}
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.cardTitle}>Informasi Ujian</Text>
              </View>

              <View style={g.divider} />

              {data.pertemuan?.nomor && (
                <View style={g.infoRow}>
                  <Ionicons name="book-outline" size={13} color={Colors.hint} />
                  <Text style={styles.infoText}>
                    Pertemuan {data.pertemuan.nomor}
                  </Text>
                </View>
              )}
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
                    name="play-circle-outline"
                    size={13}
                    color={Colors.hint}
                  />
                  <Text style={styles.infoText}>
                    Mulai: {formatWaktu(data.waktu_mulai)}
                  </Text>
                </View>
              )}
              {data.waktu_selesai && (
                <View style={g.infoRow}>
                  <Ionicons
                    name="stop-circle-outline"
                    size={13}
                    color={Colors.hint}
                  />
                  <Text style={styles.infoText}>
                    Tutup: {formatWaktu(data.waktu_selesai)}
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
                  {data.gunakan_batas_waktu
                    ? `Durasi ${formatDurasi(data.durasi)}`
                    : "Tanpa batas waktu"}
                </Text>
              </View>
              <View style={g.infoRow}>
                <Ionicons
                  name={data.acakSoal ? "shuffle-outline" : "list-outline"}
                  size={13}
                  color={Colors.hint}
                />
                <Text style={styles.infoText}>
                  {data.acakSoal ? "Soal diacak" : "Soal berurutan"}
                </Text>
              </View>
              <View style={g.infoRow}>
                <Ionicons name="shield-outline" size={13} color={Colors.hint} />
                <Text style={styles.infoText}>
                  Sifat: {data.sifat === "close" ? "Buku tertutup" : data.sifat}
                </Text>
              </View>
              {data.deskripsi && data.deskripsi !== "-" && (
                <View style={g.infoRow}>
                  <Ionicons
                    name="information-circle-outline"
                    size={13}
                    color={Colors.hint}
                  />
                  <Text style={styles.infoText}>
                    {stripHtml(data.deskripsi)}
                  </Text>
                </View>
              )}
              {data.created_by?.name && (
                <View style={g.infoRow}>
                  <Ionicons
                    name="person-outline"
                    size={13}
                    color={Colors.hint}
                  />
                  <Text style={styles.infoText}>
                    Dibuat oleh {data.created_by.name}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* RIWAYAT PENGERJAAN */}
          {sudah && (
            <>
              <Text style={g.sectionLabel}>Riwayat Pengerjaan</Text>
              <View style={styles.card}>
                <View
                  style={[
                    styles.cardStripe,
                    { backgroundColor: Colors.successText },
                  ]}
                />
                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <View style={g.iconWrap}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={16}
                        color={Colors.successText}
                      />
                    </View>
                    <Text style={styles.cardTitle}>Detail Pengerjaan</Text>
                  </View>
                  <View style={styles.divider} />

                  {data.waktu_mulai_pengerjaan && (
                    <View style={g.infoRow}>
                      <Ionicons
                        name="play-circle-outline"
                        size={13}
                        color={Colors.hint}
                      />
                      <Text style={styles.infoText}>
                        Mulai: {formatWaktu(data.waktu_mulai_pengerjaan)}
                      </Text>
                    </View>
                  )}
                  {data.waktu_selesai_pengerjaan && (
                    <View style={g.infoRow}>
                      <Ionicons
                        name="stop-circle-outline"
                        size={13}
                        color={Colors.hint}
                      />
                      <Text style={styles.infoText}>
                        Selesai: {formatWaktu(data.waktu_selesai_pengerjaan)}
                      </Text>
                    </View>
                  )}
                  {durasiPengerjaan != null && (
                    <View style={g.infoRow}>
                      <Ionicons
                        name="timer-outline"
                        size={13}
                        color={Colors.hint}
                      />
                      <Text style={styles.infoText}>
                        Waktu pengerjaan: {formatDurasi(durasiPengerjaan)}
                      </Text>
                    </View>
                  )}
                  {data.is_out_of_time && (
                    <View style={g.infoRow}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={13}
                        color={Colors.dangerText}
                      />
                      <Text
                        style={[styles.infoText, { color: Colors.dangerText }]}
                      >
                        Waktu habis saat pengerjaan
                      </Text>
                    </View>
                  )}
                  {data.is_tampilkan_nilai && data.rata_rata_nilai > 0 && (
                    <View style={g.infoRow}>
                      <Ionicons
                        name="ribbon-outline"
                        size={13}
                        color={Colors.primary}
                      />
                      <Text style={styles.infoText}>
                        Nilai: {Number(data.rata_rata_nilai).toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}

          {/* TOMBOL KERJAKAN */}
          <TouchableOpacity
            style={[
              styles.kerjakanBtn,
              (isSelesai || sudah || !isAktif) && styles.kerjakanBtnMuted,
            ]}
            disabled={isSelesai || sudah || !isAktif}
            onPress={
              isAktif && !sudah
                ? () => {
                    // TODO: navigasi ke halaman pengerjaan ujian
                    // router.push({ pathname: "/ujian/kerjakan/[id]", params: { id } })
                  }
                : undefined
            }
            activeOpacity={0.8}
          >
            <Ionicons
              name={sudah ? "checkmark-circle-outline" : "pencil-outline"}
              size={18}
              color={isSelesai || sudah || !isAktif ? Colors.muted : "#fff"}
            />
            <Text
              style={[
                styles.kerjakanBtnText,
                (isSelesai || sudah || !isAktif) && { color: Colors.muted },
              ]}
            >
              {sudah
                ? "Sudah Dikerjakan"
                : isSelesai
                  ? "Waktu Sudah Habis"
                  : isAktif
                    ? "Mulai Kerjakan"
                    : "Belum Dibuka"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  jenisBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  jenisBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 2,
  },
  statusPillAktif: { backgroundColor: "rgba(74,222,128,0.2)" },
  statusPillBelum: { backgroundColor: "rgba(250,204,21,0.2)" },
  statusPillSelesai: { backgroundColor: "rgba(255,255,255,0.15)" },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
  },
  statusPillText: { fontSize: 11, color: "#fff", fontWeight: "600" },

  successBannerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.successText,
  },
  successBannerSub: { fontSize: 11, color: Colors.successText, opacity: 0.8 },
  nilaiBadge: {
    backgroundColor: Colors.successText,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  nilaiText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  // ─── Card ────────────────────────────────────────────────────────────────────
  card: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  cardStripe: { width: 4 },
  cardBody: { flex: 1, padding: 12, gap: 6 },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 2 },
  infoText: { fontSize: 12, color: Colors.muted, flex: 1 },

  // ─── Kerjakan Button ─────────────────────────────────────────────────────────
  kerjakanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 4,
  },
  kerjakanBtnMuted: {
    backgroundColor: "#F3F4F6",
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  kerjakanBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
