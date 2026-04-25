import { SkeletonBlock } from "@/components/SkeletonBlock";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { useAuth } from "@/store/auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

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
    };
  if (diffHours < 24)
    return {
      label: `${Math.floor(diffHours)} jam lagi`,
      color: Colors.warningText,
      bg: Colors.warningBg,
      border: Colors.warningBorder,
    };
  return {
    label: `${diffDays} hari lagi`,
    color: Colors.successText,
    bg: Colors.successBg,
    border: Colors.successBorder,
  };
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
};

export default function Home() {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [tugas, setTugas] = useState<any[]>([]);
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tugasRes, jadwalRes] = await Promise.all([
        API.get("/v2/lms/tugas?per_page=5"),
        API.get("/v2/lms/kelas_kuliah?periode=20252"),
      ]);
      setTugas(tugasRes.data.data || []);
      setJadwal(jadwalRes.data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const tugasBelum = tugas.filter((t) => t.jumlah_pengumpulan === 0);
  const tugasSudah = tugas.filter((t) => t.jumlah_pengumpulan > 0);
  const today = new Date().getDay();
  const jadwalHariIni = jadwal.filter((k) =>
    k.jadwal?.some((j: any) => j.hari === today),
  );
  const hasUrgentTugas = tugasBelum.some((t) => {
    const info = getDeadlineInfo(t.waktu_selesai);
    return (
      info?.color === Colors.dangerText || info?.color === Colors.warningText
    );
  });

  const firstName = user?.nama?.split(" ")[0] ?? "Mahasiswa";
  const tanggalHariIni = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
          <Text style={styles.greetSub}>{getGreeting()},</Text>
          <Text style={styles.greetName}>{firstName} 👋</Text>
          <Text style={styles.greetDate}>{tanggalHariIni}</Text>
        </View>

        {/* ── Summary strip overlap ── */}
        {!loading && (
          <View style={styles.summaryStrip}>
            <SummaryCard
              icon="document-text-outline"
              label="Belum Dikumpul"
              value={tugasBelum.length}
              valueColor={
                tugasBelum.length > 0 ? Colors.warningText : undefined
              }
            />
            <SummaryCard
              icon="checkmark-circle-outline"
              label="Sudah Dikumpul"
              value={tugasSudah.length}
              valueColor={
                tugasSudah.length > 0 ? Colors.successText : undefined
              }
            />
            <SummaryCard
              icon="calendar-outline"
              label="Kelas Hari Ini"
              value={jadwalHariIni.length}
            />
          </View>
        )}

        <View style={styles.body}>
          {/* ── Alert tugas mendesak ── */}
          {hasUrgentTugas && (
            <View style={styles.alert}>
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={Colors.warningText}
              />
              <Text style={styles.alertText}>
                Ada tugas yang mendekati deadline!
              </Text>
            </View>
          )}

          {/* ── Akses Cepat ── */}
          <SectionHeader title="Akses Cepat" />
          <View style={styles.quickGrid}>
            <QuickCard
              icon="chatbubbles-outline"
              label="Forum"
              sub="Diskusi kelas"
              onPress={() => router.push("/forum")}
            />
            <QuickCard
              icon="checkmark-done-outline"
              label="Kehadiran"
              sub="Rekap absensi"
              onPress={() => router.push("/kehadiran")}
            />
            <QuickCard
              icon="ribbon-outline"
              label="Nilai"
              sub="Hasil studi"
              onPress={() => router.push("/nilai")}
            />
          </View>

          {/* ── Tugas terdekat ── */}
          <SectionHeader title="Tugas Terdekat" />
          {loading ? (
            <SkeletonList />
          ) : tugasBelum.length === 0 ? (
            <EmptyState
              icon="checkmark-done-outline"
              label="Semua tugas sudah dikumpulkan"
            />
          ) : (
            tugasBelum.slice(0, 3).map((t, i) => {
              const deadline = getDeadlineInfo(t.waktu_selesai);
              return (
                <View key={i} style={styles.card}>
                  <View style={g.iconWrap}>
                    <Ionicons
                      name="document-outline"
                      size={16}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {t.judul}
                    </Text>
                    <Text style={styles.cardSub} numberOfLines={1}>
                      {t.kelas_kuliah?.mata_kuliah?.nama}
                    </Text>
                    <View style={styles.cardMeta}>
                      <Ionicons
                        name="person-outline"
                        size={11}
                        color={Colors.hint}
                      />
                      <Text style={styles.cardMetaText}>
                        {t.created_by?.name || "-"}
                      </Text>
                      <Text style={g.dot}>·</Text>
                      <Ionicons
                        name="layers-outline"
                        size={11}
                        color={Colors.hint}
                      />
                      <Text style={styles.cardMetaText}>{t.jenis_tugas}</Text>
                    </View>
                  </View>
                  {deadline && (
                    <View
                      style={[
                        styles.deadlineBadge,
                        {
                          backgroundColor: deadline.bg,
                          borderColor: deadline.border,
                        },
                      ]}
                    >
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
              );
            })
          )}

          {/* ── Jadwal hari ini ── */}
          <SectionHeader title={`Jadwal ${HARI[today]}`} />
          {loading ? (
            <SkeletonList />
          ) : jadwalHariIni.length === 0 ? (
            <EmptyState icon="cafe-outline" label="Tidak ada kelas hari ini" />
          ) : (
            jadwalHariIni.map((k, i) => {
              const j =
                k.jadwal?.find((jd: any) => jd.hari === today) ?? k.jadwal?.[0];
              const dosenUtama =
                k.pengajar?.find((p: any) => p.utama) ?? k.pengajar?.[0];
              const gelar = dosenUtama?.gelar_akademik
                ? `, ${dosenUtama.gelar_akademik}`
                : "";
              return (
                <View key={i} style={styles.card}>
                  <View style={g.iconWrap}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {k.mata_kuliah?.nama}
                    </Text>
                    <View style={styles.cardMeta}>
                      <Ionicons
                        name="time-outline"
                        size={11}
                        color={Colors.hint}
                      />
                      <Text style={styles.cardMetaText}>
                        {j?.jam_mulai?.slice(0, 5)} –{" "}
                        {j?.jam_selesai?.slice(0, 5)}
                      </Text>
                      {j?.ruangan?.nama && (
                        <>
                          <Text style={g.dot}>·</Text>
                          <Ionicons
                            name="location-outline"
                            size={11}
                            color={Colors.hint}
                          />
                          <Text style={styles.cardMetaText}>
                            {j.ruangan.nama}
                          </Text>
                        </>
                      )}
                    </View>
                    {dosenUtama?.nama_pengajar && (
                      <View style={styles.cardMeta}>
                        <Ionicons
                          name="person-outline"
                          size={11}
                          color={Colors.hint}
                        />
                        <Text style={styles.cardMetaText} numberOfLines={1}>
                          {dosenUtama.nama_pengajar}
                          {gelar}
                        </Text>
                      </View>
                    )}
                  </View>
                  {k.mata_kuliah?.sks && (
                    <View style={g.badgePrimary}>
                      <Text style={g.badgePrimaryText}>
                        {k.mata_kuliah.sks} SKS
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ──

function SummaryCard({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: any;
  label: string;
  value: number;
  valueColor?: string;
}) {
  return (
    <View style={g.summaryCard}>
      <Ionicons name={icon} size={18} color={valueColor ?? Colors.primary} />
      <Text style={[g.summaryValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
      <Text style={g.summaryLabel}>{label}</Text>
    </View>
  );
}

function QuickCard({
  icon,
  label,
  sub,
  onPress,
}: {
  icon: any;
  label: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.quickCard}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={g.iconWrap}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{label}</Text>
        <Text style={styles.cardSub}>{sub}</Text>
      </View>
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={[g.sectionHeader, { marginBottom: 10, marginTop: 20 }]}>
      <Text style={g.sectionTitle}>{title}</Text>
    </View>
  );
}

function EmptyState({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={20} color={Colors.border} />
      <Text style={styles.emptyText}>{label}</Text>
    </View>
  );
}

function SkeletonList() {
  return (
    <>
      {[1, 2].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <SkeletonBlock height={14} width="60%" />
          <SkeletonBlock height={11} width="40%" />
        </View>
      ))}
    </>
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
  greetSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
  },
  greetName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginTop: 2,
  },
  greetDate: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    marginTop: 3,
  },

  // ── Summary strip ──
  summaryStrip: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: -22,
    gap: 8,
  },

  // ── Body ──
  body: { paddingHorizontal: 16, paddingTop: 16 },

  // ── Alert ──
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.warningBg,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    borderRadius: 8,
    padding: 10,
  },
  alertText: {
    fontSize: 13,
    color: Colors.warningText,
    fontWeight: "600",
  },

  // ── Quick grid ──
  quickGrid: {
    gap: 8,
  },
  quickCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },

  // ── Cards ──
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
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: Colors.text },
  cardSub: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    flexWrap: "wrap",
  },
  cardMetaText: { fontSize: 11, color: Colors.muted },

  // ── Deadline badge ──
  deadlineBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  deadlineBadgeText: { fontSize: 10, fontWeight: "700" },

  // ── Skeleton ──
  skeletonCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
    gap: 8,
  },

  // ── Empty ──
  empty: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  emptyText: { fontSize: 13, color: Colors.muted },
});
