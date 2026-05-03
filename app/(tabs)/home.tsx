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
  const diffMs = new Date(waktuSelesai).getTime() - Date.now();
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
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
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
      await Linking.openURL(url);
    } catch {
      Alert.alert("Gagal", "Tidak bisa membuka link meeting.");
    }
  };

  const tugasBelum = tugas.filter((t) => t.jumlah_pengumpulan === 0);
  const today = new Date().getDay();
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
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={g.headerSection}>
          <View style={g.topBar}>
            <View style={{ flex: 1 }}>
              <Text style={g.headerLabel}>PORTAL MAHASISWA</Text>
              <Text style={styles.greetName}>
                {getGreeting()}, {firstName} 👋
              </Text>
              <Text style={g.pageSubtitle}>{tanggalHariIni}</Text>
            </View>
            <View style={g.uymBadge}>
              <Text style={g.uymBadgeText}>UYM</Text>
            </View>
          </View>

          {/* SUMMARY STRIP */}
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
                    tugasBelum.length > 0 && { color: Colors.warningText },
                  ]}
                >
                  {tugasBelum.length}
                </Text>
                <Text style={g.summaryLabel}>Tugas Pending</Text>
              </View>
              <View style={g.summaryCard}>
                <Ionicons
                  name="today-outline"
                  size={18}
                  color={Colors.primary}
                />
                <Text style={g.summaryValue}>{jadwal.length}</Text>
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
                    hasLiveVidcon && { color: Colors.successText },
                  ]}
                >
                  {vidconAktif.length}
                </Text>
                <Text style={g.summaryLabel}>Vidcon Aktif</Text>
              </View>
            </View>
          )}
        </View>

        <View style={g.body}>
          {/* ERROR */}
          {error && (
            <View style={g.errorBox}>
              <Ionicons
                name="wifi-outline"
                size={14}
                color={Colors.dangerText}
              />
              <Text style={g.errorText}>Gagal memuat data</Text>
              <TouchableOpacity onPress={loadData} style={styles.retryInline}>
                <Ionicons
                  name="refresh-outline"
                  size={14}
                  color={Colors.primary}
                />
                <Text style={styles.retryInlineText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ALERT TUGAS MENDESAK */}
          {!error && hasUrgentTugas && (
            <View style={g.warningBox}>
              <Ionicons
                name="alert-circle-outline"
                size={14}
                color={Colors.warningText}
              />
              <Text style={g.warningBoxText}>
                Ada tugas yang mendekati deadline!
              </Text>
            </View>
          )}

          {/* ALERT UTS/UAS */}
          {!error && checkPembatasan && (
            <>
              {checkPembatasan.uts?.memenuhi_syarat === false && (
                <PembatasanAlert
                  label="Akses UTS dibatasi"
                  data={checkPembatasan.uts}
                />
              )}
              {checkPembatasan.uas?.memenuhi_syarat === false && (
                <PembatasanAlert
                  label="Akses UAS dibatasi"
                  data={checkPembatasan.uas}
                />
              )}
            </>
          )}

          {/* AKSES CEPAT */}
          <SectionHeader title="Akses Cepat" />
          <View style={styles.quickGrid}>
            {QUICK_MENUS.map((menu) => (
              <TouchableOpacity
                key={menu.route}
                style={styles.quickCard}
                onPress={() => router.push(menu.route as any)}
                activeOpacity={0.75}
              >
                <View style={g.iconWrap}>
                  <Ionicons
                    name={menu.icon as any}
                    size={20}
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.quickLabel}>{menu.label}</Text>
                <Text style={styles.quickSub} numberOfLines={1}>
                  {menu.sub}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* VIDCON */}
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
              const isLive =
                getVidconStatus(v.waktu_mulai, v.waktu_selesai) === "live";
              const hasLink = !!(v.link || v.url);
              const mkNama = v.kelas_kuliah?.mata_kuliah?.nama || "";
              const mkKode = v.kelas_kuliah?.mata_kuliah?.kode || "";
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    g.card,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                    },
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
                  <View style={{ flex: 1 }}>
                    <Text style={g.listRowTitle} numberOfLines={1}>
                      {mkNama || "-"}
                    </Text>
                    <Text style={g.listRowSub}>{v.judul || "-"}</Text>
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

          {/* TUGAS TERDEKAT */}
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
                <View
                  key={i}
                  style={[
                    g.card,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                    },
                  ]}
                >
                  <View style={g.iconWrap}>
                    <Ionicons
                      name="document-outline"
                      size={16}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={g.listRowTitle} numberOfLines={1}>
                      {t.judul}
                    </Text>
                    <Text style={g.listRowSub} numberOfLines={1}>
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
                      <Text style={styles.cardMetaText}>{t.jenis_tugas}</Text>
                    </View>
                  </View>
                  {deadline && (
                    <View
                      style={
                        deadline.color === Colors.successText
                          ? g.badgeSuccess
                          : deadline.color === Colors.warningText
                            ? g.badgeWarning
                            : g.badgeDanger
                      }
                    >
                      <Text
                        style={
                          deadline.color === Colors.successText
                            ? g.badgeSuccessText
                            : deadline.color === Colors.warningText
                              ? g.badgeWarningText
                              : g.badgeDangerText
                        }
                      >
                        {deadline.label}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}

          {/* JADWAL */}
          <SectionHeader
            title="Kelas Aktif & Segera"
            badge={
              jadwal.some((k) => k.status === "berlangsung")
                ? "Live"
                : undefined
            }
            onSeeAll={() => router.push("/jadwal")}
          />
          {loading ? (
            <SkeletonList />
          ) : error ? (
            <EmptyState icon="today-outline" label="Gagal memuat jadwal" />
          ) : jadwal.length === 0 ? (
            <EmptyState
              icon="cafe-outline"
              label="Tidak ada kelas aktif atau segera"
            />
          ) : (
            jadwal.map((k, i) => {
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
                  style={[
                    g.card,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                    },
                    isBerlangsung && { borderColor: Colors.successBorder },
                  ]}
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
                  <View style={{ flex: 1 }}>
                    <Text style={g.listRowTitle} numberOfLines={1}>
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
                        <Text
                          style={styles.cardMetaText}
                          numberOfLines={1}
                        >{`${dosenUtama.nama_pengajar}${gelar}`}</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <View
                      style={isBerlangsung ? g.badgeSuccess : g.badgeWarning}
                    >
                      <Text
                        style={
                          isBerlangsung
                            ? g.badgeSuccessText
                            : g.badgeWarningText
                        }
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function PembatasanAlert({ label, data }: { label: string; data: any }) {
  return (
    <View style={[g.errorBox, { marginBottom: 8 }]}>
      <Ionicons name="warning-outline" size={14} color={Colors.dangerText} />
      <View style={{ flex: 1 }}>
        <Text style={g.errorText}>{label}</Text>
        {data?.kekurangan?.kehadiran?.length > 0 ? (
          data.kekurangan.kehadiran.map((k: any, i: number) => (
            <Text key={i} style={styles.alertDangerSub}>
              • {k.nama_mk}: {k.kehadiran}/{k.minimal} kehadiran
            </Text>
          ))
        ) : (
          <Text style={styles.alertDangerSub}>
            • Tunggakan keuangan belum diselesaikan
          </Text>
        )}
      </View>
    </View>
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
    <View style={g.empty}>
      <Ionicons name={icon} size={20} color={Colors.border} />
      <Text style={g.emptyHint}>{label}</Text>
    </View>
  );
}

function SkeletonList() {
  return (
    <>
      {[1, 2].map((i) => (
        <View
          key={i}
          style={[
            g.card,
            {
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 14,
              marginBottom: 8,
            },
          ]}
        >
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

const styles = StyleSheet.create({
  greetName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.3,
  },

  summaryStrip: {
    flexDirection: "row",
    gap: 8,
  },

  retryInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  retryInlineText: { fontSize: 12, fontWeight: "600", color: Colors.primary },

  alertDangerSub: { fontSize: 11, color: Colors.dangerText, marginTop: 2 },

  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.successBg,
    borderWidth: 0.5,
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
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: 12,
    gap: 6,
    alignItems: "flex-start",
  },
  quickLabel: { fontSize: 12, fontWeight: "700", color: Colors.text },
  quickSub: { fontSize: 10, color: Colors.muted },

  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    flexWrap: "wrap",
  },
  cardMetaText: { fontSize: 11, color: Colors.muted },

  vidconRight: { alignItems: "flex-end", gap: 6 },
  vidconBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 0.5,
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
});
