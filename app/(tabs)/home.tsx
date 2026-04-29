import { SkeletonBlock } from "@/components/SkeletonBlock";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { useAuth } from "@/store/auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const QUICK_MENUS = [
  {
    icon: "checkmark-done-outline",
    label: "Kehadiran",
    sub: "Rekap absensi",
    route: "/kehadiran",
  },
  {
    icon: "ribbon-outline",
    label: "Nilai",
    sub: "Hasil studi",
    route: "/nilai",
  },
  {
    icon: "videocam-outline",
    label: "Vidcon",
    sub: "Video conference",
    route: "/vidcon",
  },
  {
    icon: "chatbubbles-outline",
    label: "Forum",
    sub: "Diskusi kelas",
    route: "/forum",
  },
  {
    icon: "help-circle-outline",
    label: "Ujian & Kuis",
    sub: "Quiz & ujian",
    route: "/ujian",
  },
  {
    icon: "book-outline",
    label: "Materi",
    sub: "Bahan ajar",
    route: "/materi",
  },
] as const;

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

const getVidconStatus = (waktuMulai?: string, waktuSelesai?: string) => {
  if (!waktuMulai) return "pending";
  const now = new Date();
  const mulai = new Date(waktuMulai);
  const selesai = waktuSelesai ? new Date(waktuSelesai) : null;
  if (selesai && now > selesai) return "selesai";
  if (now >= mulai) return "live";
  return "pending";
};

export default function Home() {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [tugas, setTugas] = useState<any[]>([]);
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [vidcon, setVidcon] = useState<any[]>([]);
  const [checkPembatasan, setCheckPembatasan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [tugasRes, jadwalRes, vidconRes, pembatasanRes] = await Promise.all(
        [
          API.get("/v2/lms/tugas?per_page=5"),
          API.get(
            "/v2/lms/kelas_kuliah?status=berlangsung&status=akan_dimulai&periode=20252&sort=status&sort=mata_kuliah&sort=kelas",
          ),
          API.get("/v2/lms/vidcon", {
            params: { page: 1, per_page: 10, periode: 20252 },
          }),
          API.get("/v2/lms/check_pembatasan"),
        ],
      );
      setTugas(tugasRes.data.data || []);
      setJadwal(jadwalRes.data.data || []);
      setVidcon(vidconRes.data.data || []);
      setCheckPembatasan(pembatasanRes.data?.data || null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const openMeeting = async (url: string) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch {
      Alert.alert("Gagal", "Tidak bisa membuka link meeting.");
    }
  };

  const tugasBelum = tugas.filter((t) => t.jumlah_pengumpulan === 0);
  const today = new Date().getDay();
  const jadwalHariIni = jadwal;
  const vidconAktif = vidcon
    .filter(
      (v) => getVidconStatus(v.waktu_mulai, v.waktu_selesai) !== "selesai",
    )
    .slice(0, 3);
  const hasLiveVidcon = vidconAktif.some(
    (v) => getVidconStatus(v.waktu_mulai, v.waktu_selesai) === "live",
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
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.decor1} />
          <View style={styles.decor2} />
          <View style={styles.decor3} />
          <View style={styles.decor4} />
          <View style={styles.topBar}>
            <View>
              <Text style={styles.heroLabel}>PORTAL MAHASISWA</Text>
              <Text style={styles.greetSub}>{getGreeting()},</Text>
              <Text style={styles.greetName}>{firstName} 👋</Text>
              <Text style={styles.greetDate}>{tanggalHariIni}</Text>
            </View>
            <View style={styles.uymBadge}>
              <Text style={styles.uymBadgeText}>UYM</Text>
            </View>
          </View>
        </View>

        {/* ── SUMMARY STRIP ── */}
        {!loading && !error && (
          <View style={styles.summaryStrip}>
            <View style={g.summaryCard}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color={
                  tugasBelum.length > 0 ? Colors.warningText : Colors.primary
                }
              />
              <Text
                style={[
                  g.summaryValue,
                  tugasBelum.length > 0 ? { color: Colors.warningText } : null,
                ]}
              >
                {tugasBelum.length}
              </Text>
              <Text style={g.summaryLabel}>Tugas Pending</Text>
            </View>
            <View style={g.summaryCard}>
              <Ionicons name="today-outline" size={18} color={Colors.primary} />
              <Text style={g.summaryValue}>{jadwalHariIni.length}</Text>
              <Text style={g.summaryLabel}>Kelas Aktif</Text>
            </View>
            <View style={g.summaryCard}>
              <Ionicons
                name="videocam-outline"
                size={18}
                color={hasLiveVidcon ? Colors.successText : Colors.primary}
              />
              <Text
                style={[
                  g.summaryValue,
                  hasLiveVidcon ? { color: Colors.successText } : null,
                ]}
              >
                {vidconAktif.length}
              </Text>
              <Text style={g.summaryLabel}>Vidcon Aktif</Text>
            </View>
          </View>
        )}

        <View style={styles.body}>
          {/* ── ERROR STATE ── */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons
                name="wifi-outline"
                size={16}
                color={Colors.dangerText}
              />
              <Text style={styles.errorText}>Gagal memuat data</Text>
              <TouchableOpacity onPress={loadData} style={styles.retryBtn}>
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={styles.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── ALERT TUGAS MENDESAK ── */}
          {!error && hasUrgentTugas && (
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

          {/* ── ALERT UTS / UAS ── */}
          {!error && checkPembatasan && (
            <>
              {checkPembatasan.uts?.memenuhi_syarat === false && (
                <View
                  style={[
                    styles.alert,
                    {
                      backgroundColor: Colors.dangerBg,
                      borderColor: Colors.dangerBorder,
                      marginBottom: 8,
                    },
                  ]}
                >
                  <Ionicons
                    name="warning-outline"
                    size={16}
                    color={Colors.dangerText}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.alertText, { color: Colors.dangerText }]}
                    >
                      Akses UTS dibatasi
                    </Text>
                    {checkPembatasan.uts?.kekurangan?.kehadiran?.length > 0 &&
                      checkPembatasan.uts.kekurangan.kehadiran.map(
                        (k: any, i: number) => (
                          <Text
                            key={i}
                            style={{
                              fontSize: 11,
                              color: Colors.dangerText,
                              marginTop: 2,
                            }}
                          >
                            • {k.nama_mk}: {k.kehadiran}/{k.minimal} kehadiran
                          </Text>
                        ),
                      )}
                    {!checkPembatasan.uts?.kekurangan?.kehadiran?.length && (
                      <Text
                        style={{
                          fontSize: 11,
                          color: Colors.dangerText,
                          marginTop: 2,
                        }}
                      >
                        • Tunggakan keuangan belum diselesaikan
                      </Text>
                    )}
                  </View>
                </View>
              )}
              {checkPembatasan.uas?.memenuhi_syarat === false && (
                <View
                  style={[
                    styles.alert,
                    {
                      backgroundColor: Colors.dangerBg,
                      borderColor: Colors.dangerBorder,
                      marginBottom: 8,
                    },
                  ]}
                >
                  <Ionicons
                    name="warning-outline"
                    size={16}
                    color={Colors.dangerText}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.alertText, { color: Colors.dangerText }]}
                    >
                      Akses UAS dibatasi
                    </Text>
                    {checkPembatasan.uas?.kekurangan?.kehadiran?.length > 0 &&
                      checkPembatasan.uas.kekurangan.kehadiran.map(
                        (k: any, i: number) => (
                          <Text
                            key={i}
                            style={{
                              fontSize: 11,
                              color: Colors.dangerText,
                              marginTop: 2,
                            }}
                          >
                            • {k.nama_mk}: {k.kehadiran}/{k.minimal} kehadiran
                          </Text>
                        ),
                      )}
                    {!checkPembatasan.uas?.kekurangan?.kehadiran?.length && (
                      <Text
                        style={{
                          fontSize: 11,
                          color: Colors.dangerText,
                          marginTop: 2,
                        }}
                      >
                        • Tunggakan keuangan belum diselesaikan
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </>
          )}

          {/* ── AKSES CEPAT ── */}
          <SectionHeader title="Akses Cepat" />
          <View style={styles.quickGrid}>
            {QUICK_MENUS.map((menu) => (
              <QuickCard
                key={menu.route}
                icon={menu.icon}
                label={menu.label}
                sub={menu.sub}
                onPress={() => router.push(menu.route as any)}
              />
            ))}
          </View>

          {/* ── VIDCON ── */}
          <SectionHeader
            title="Video Conference"
            badge={hasLiveVidcon ? "Live" : undefined}
            onSeeAll={() => router.push("/vidcon" as any)}
          />
          {loading ? (
            <SkeletonList />
          ) : error ? (
            <EmptyState
              icon="videocam-off-outline"
              label="Gagal memuat vidcon"
            />
          ) : vidconAktif.length === 0 ? (
            <EmptyState
              icon="videocam-off-outline"
              label="Tidak ada sesi vidcon aktif"
            />
          ) : (
            vidconAktif.map((v, i) => {
              const status = getVidconStatus(v.waktu_mulai, v.waktu_selesai);
              const isLive = status === "live";
              const hasLink = !!(v.link || v.url);
              const mkNama = v.kelas_kuliah?.mata_kuliah?.nama || "";
              const mkKode = v.kelas_kuliah?.mata_kuliah?.kode || "";
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.card,
                    isLive && { borderColor: Colors.successBorder },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => {
                    if (!v.id_pertemuan || v.id_pertemuan === "index") return;
                    router.push({
                      pathname: "/vidcon/[id]",
                      params: {
                        id: String(v.id_pertemuan),
                        mkNama,
                        mkKode,
                        judul: v.judul || "",
                      },
                    } as any);
                  }}
                >
                  <View style={g.iconWrap}>
                    <Ionicons
                      name="videocam-outline"
                      size={16}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {mkNama || "-"}
                    </Text>
                    <Text style={styles.cardSub}>{v.judul || "-"}</Text>
                    {v.waktu_mulai && (
                      <View style={styles.cardMeta}>
                        <Ionicons
                          name="time-outline"
                          size={11}
                          color={Colors.hint}
                        />
                        <Text style={styles.cardMetaText}>
                          {new Date(v.waktu_mulai).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                        {v.aplikasi && (
                          <>
                            <Text style={g.dot}>·</Text>
                            <Text style={styles.cardMetaText}>
                              {v.aplikasi}
                            </Text>
                          </>
                        )}
                      </View>
                    )}
                  </View>
                  <View style={styles.vidconRight}>
                    <View
                      style={[
                        styles.vidconBadge,
                        isLive ? styles.vidconLive : styles.vidconPending,
                      ]}
                    >
                      {isLive && <View style={styles.vidconDot} />}
                      <Text
                        style={[
                          styles.vidconBadgeText,
                          {
                            color: isLive
                              ? Colors.successText
                              : Colors.warningText,
                          },
                        ]}
                      >
                        {isLive ? "Live" : "Segera"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.joinBtn, !hasLink && { opacity: 0.4 }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        openMeeting(v.link || v.url);
                      }}
                      disabled={!hasLink}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="videocam" size={12} color="#fff" />
                      <Text style={styles.joinBtnText}>Join</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* ── TUGAS TERDEKAT ── */}
          <SectionHeader
            title="Tugas Terdekat"
            onSeeAll={() => router.push("/tugas")}
          />
          {loading ? (
            <SkeletonList />
          ) : error ? (
            <EmptyState icon="document-outline" label="Gagal memuat tugas" />
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

          {/* ── JADWAL HARI INI / YANG AKAN DATANG ── */}
          <SectionHeader
            title="Kelas Aktif & Segera"
            badge={
              jadwalHariIni.some((k) => k.status === "berlangsung")
                ? "Live"
                : undefined
            }
            onSeeAll={() => router.push("/jadwal")}
          />
          {loading ? (
            <SkeletonList />
          ) : error ? (
            <EmptyState icon="today-outline" label="Gagal memuat jadwal" />
          ) : jadwalHariIni.length === 0 ? (
            <EmptyState
              icon="cafe-outline"
              label="Tidak ada kelas aktif atau segera"
            />
          ) : (
            jadwalHariIni.map((k, i) => {
              const isBerlangsung = k.status === "berlangsung";
              const j =
                k.jadwal?.find((jd: any) => jd.hari === today) ?? k.jadwal?.[0];
              const dosenUtama =
                k.pengajar?.find((p: any) => p.utama) ?? k.pengajar?.[0];
              const gelar = dosenUtama?.gelar_akademik
                ? `, ${dosenUtama.gelar_akademik}`
                : "";
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.75}
                  onPress={() =>
                    router.push({
                      pathname: "/jadwal/pertemuan-list",
                      params: {
                        id_kelas: k.id,
                        nama_mk: k.mata_kuliah?.nama,
                        nama_kelas: k.kelas?.nama,
                      },
                    } as any)
                  }
                  style={[
                    styles.card,
                    isBerlangsung && {
                      borderColor: Colors.successBorder,
                      borderLeftWidth: 3,
                      borderLeftColor: Colors.successText,
                    },
                  ]}
                >
                  <View style={g.iconWrap}>
                    <Ionicons
                      name={isBerlangsung ? "radio-outline" : "time-outline"}
                      size={16}
                      color={
                        isBerlangsung ? Colors.successText : Colors.primary
                      }
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
                        {j?.hari !== today ? `${HARI[j?.hari ?? 0]}, ` : ""}
                        {`${j?.jam_mulai?.slice(0, 5)} – ${j?.jam_selesai?.slice(0, 5)}`}
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
                          {`${dosenUtama.nama_pengajar}${gelar}`}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View
                    style={[
                      styles.deadlineBadge,
                      {
                        backgroundColor: isBerlangsung
                          ? Colors.successBg
                          : Colors.warningBg,
                        borderColor: isBerlangsung
                          ? Colors.successBorder
                          : Colors.warningBorder,
                        gap: 4,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.deadlineBadgeText,
                        {
                          color: isBerlangsung
                            ? Colors.successText
                            : Colors.warningText,
                        },
                      ]}
                    >
                      {isBerlangsung ? "Berlangsung" : "Segera"}
                    </Text>
                  </View>
                  {k.mata_kuliah?.sks && (
                    <View style={g.badgePrimary}>
                      <Text style={g.badgePrimaryText}>
                        {k.mata_kuliah.sks} SKS
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickSub} numberOfLines={1}>
        {sub}
      </Text>
    </TouchableOpacity>
  );
}

function SectionHeader({
  title,
  badge,
  onSeeAll,
}: {
  title: string;
  badge?: string;
  onSeeAll?: () => void;
}) {
  return (
    <View style={[g.sectionHeader, { marginBottom: 10, marginTop: 20 }]}>
      <Text style={g.sectionTitle}>{title}</Text>
      {badge && (
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.livePillText}>{badge}</Text>
        </View>
      )}
      {onSeeAll && (
        <TouchableOpacity
          onPress={onSeeAll}
          style={styles.seeAll}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllText}>Lihat semua</Text>
          <Ionicons name="chevron-forward" size={12} color={Colors.primary} />
        </TouchableOpacity>
      )}
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

// Skeleton menyerupai shape card asli: iconWrap + dua baris teks
function SkeletonList() {
  return (
    <>
      {[1, 2].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <SkeletonBlock width={34} height={34} />
          <View style={{ flex: 1, gap: 7 }}>
            <SkeletonBlock height={13} width="60%" />
            <SkeletonBlock height={11} width="40%" />
          </View>
        </View>
      ))}
    </>
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
    marginBottom: 4,
  },
  greetSub: { fontSize: 13, color: "rgba(255,255,255,0.65)" },
  greetName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginTop: 2,
    letterSpacing: -0.3,
  },
  greetDate: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 },
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

  body: { paddingHorizontal: 16, paddingTop: 16 },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: Colors.dangerText,
    fontWeight: "600",
    flex: 1,
  },

  // Konsisten dengan Tugas/Jadwal/Profile
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryMid,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  retryText: { fontSize: 13, fontWeight: "600", color: Colors.primary },

  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.warningBg,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
  },
  alertText: { fontSize: 13, color: Colors.warningText, fontWeight: "600" },

  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.successBg,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.successText,
  },
  livePillText: { fontSize: 10, fontWeight: "700", color: Colors.successText },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: "auto",
  },
  seeAllText: { fontSize: 11, color: Colors.primary, fontWeight: "600" },

  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickCard: {
    width: "31%",
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 6,
    alignItems: "flex-start",
  },
  quickLabel: { fontSize: 12, fontWeight: "700", color: Colors.text },
  quickSub: { fontSize: 10, color: Colors.muted },

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

  deadlineBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  deadlineBadgeText: { fontSize: 10, fontWeight: "700" },

  vidconRight: { alignItems: "flex-end", gap: 6 },
  vidconBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  vidconLive: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.successBorder,
  },
  vidconPending: {
    backgroundColor: Colors.warningBg,
    borderColor: Colors.warningBorder,
  },
  vidconDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.successText,
  },
  vidconBadgeText: { fontSize: 10, fontWeight: "700" },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  joinBtnText: { fontSize: 11, fontWeight: "700", color: "#fff" },

  // Konsisten: row layout dengan iconWrap + teks, mirip card asli
  skeletonCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
  },

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
