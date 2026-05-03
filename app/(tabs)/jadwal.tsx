import { SkeletonBlock } from "@/components/SkeletonBlock";
import { SummaryCard } from "@/components/SummaryCard";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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
      <View key={j} style={styles.card}>
        <View
          style={[styles.cardStripe, { backgroundColor: Colors.skeletonBase }]}
        />
        <View style={{ flex: 1, padding: 12, gap: 8 }}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <SkeletonBlock height={14} width="55%" />
            <SkeletonBlock height={14} width="15%" />
          </View>
          <SkeletonBlock height={11} width="25%" />
          <View style={g.divider} />
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

  const today = new Date().getDay();
  const isCurrentPeriode = periode === 20252;

  useEffect(() => {
    getJadwal();
  }, [periode]);

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

  const perHari = useMemo(() => {
    const map: Record<number, any[]> = {};
    data.forEach((k) => {
      k.jadwal?.forEach((j: any) => {
        if (j.hari == null) return;
        if (!map[j.hari]) map[j.hari] = [];
        map[j.hari].push({ ...k, _jadwal: j });
      });
    });
    Object.keys(map).forEach((hari) => {
      map[Number(hari)].sort(
        (a, b) =>
          toMinutes(a._jadwal?.jam_mulai) - toMinutes(b._jadwal?.jam_mulai),
      );
    });
    return map;
  }, [data]);

  const hariTerurut = Object.keys(perHari)
    .map(Number)
    .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
  const totalSks = data.reduce((sum, k) => sum + (k.mata_kuliah?.sks || 0), 0);
  const kelasHariIni = isCurrentPeriode ? perHari[today]?.length || 0 : 0;
  const ongoingCount = isCurrentPeriode
    ? (perHari[today] || []).filter(
        (k) => getClassStatus(k._jadwal, true, true) === "ongoing",
      ).length
    : 0;
  const hasJadwal = hariTerurut.length > 0;

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
              <Text style={g.pageTitle}>Jadwal Kuliah</Text>
            </View>
            <View style={g.uymBadge}>
              <Text style={g.uymBadgeText}>UYM</Text>
            </View>
          </View>

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
        </View>

        {/* PERIODE FILTER */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
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

        {/* BODY */}
        <View style={g.body}>
          {!loading && !error && (
            <Text style={g.sectionLabel}>
              {hasJadwal
                ? `${data.length} kelas · ${hariTerurut.length} hari aktif`
                : "Tidak ada jadwal ditemukan"}
            </Text>
          )}

          {/* SKELETON */}
          {loading && [1, 2, 3].map((i) => <DaySkeleton key={i} />)}

          {/* ERROR */}
          {error && (
            <View style={g.empty}>
              <Ionicons name="wifi-outline" size={40} color={Colors.border} />
              <Text style={g.emptyTitle}>Gagal memuat data</Text>
              <Text style={g.emptyHint}>Periksa koneksi internet kamu</Text>
              <TouchableOpacity style={g.retryBtn} onPress={getJadwal}>
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
          {!loading && !error && !hasJadwal && (
            <View style={g.empty}>
              <Ionicons
                name="calendar-outline"
                size={40}
                color={Colors.border}
              />
              <Text style={g.emptyTitle}>Tidak ada jadwal</Text>
              <Text style={g.emptyHint}>
                {PERIODE_OPTIONS.find((p) => p.value === periode)?.label}
              </Text>
            </View>
          )}

          {/* LIST */}
          {!loading &&
            !error &&
            hariTerurut.map((hari) => {
              const isToday = isCurrentPeriode && hari === today;
              return (
                <View key={hari} style={styles.group}>
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
                          isToday && {
                            borderColor: Colors.successBorder,
                            backgroundColor: Colors.successBg,
                          },
                          status === "ongoing" && {
                            borderColor: Colors.dangerBorder,
                            backgroundColor: Colors.dangerBg,
                          },
                          status === "done" && { opacity: 0.55 },
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
                                <View style={g.badgeDanger}>
                                  <View style={styles.ongoingDot} />
                                  <Text style={g.badgeDangerText}>Live</Text>
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
                          <View style={g.divider} />

                          {/* INFO */}
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
                              <View style={g.badgePrimary}>
                                <Text style={g.badgePrimaryText}>
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

                          {/* BOTTOM */}
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
            })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  summaryStrip: {
    flexDirection: "row",
    gap: 8,
  },

  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingRight: 32,
  },

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
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
    marginBottom: 8,
    overflow: "hidden",
  },
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
  infoText: { fontSize: 12, color: Colors.muted, flex: 1 },

  ongoingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.dangerText,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
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
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
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
});
