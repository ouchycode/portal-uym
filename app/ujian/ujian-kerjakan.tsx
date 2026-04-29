import { SkeletonBlock } from "@/components/SkeletonBlock";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Pilihan {
  pilihan: string[];
  gambar: string[];
  kunci: string | null;
}

interface Soal {
  id: string;
  jenis: "pilihan" | "esay";
  pertanyaan: string;
  soal_files: any[];
  pilihan: Pilihan;
  poin: number;
}

interface KelompokSoal {
  id: string;
  aturan: string;
  jumlah_wajib_dijawab: number;
  poin_per_soal: number;
  soal: Soal[];
}

type JawabanMap = Record<string, string>;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const formatTimer = (detik: number) => {
  const m = Math.floor(detik / 60);
  const s = detik % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const ALFABET = ["A", "B", "C", "D", "E", "F"];

// ─── SKELETON ────────────────────────────────────────────────────────────────

const UjianSkeleton = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonStripe} />
    <View style={{ flex: 1, padding: 14, gap: 10 }}>
      {/* header row */}
      <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
        <View style={styles.skeletonIcon} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonBlock height={15} width="70%" />
          <SkeletonBlock height={11} width="40%" />
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: Colors.border }} />
      {/* meta chips */}
      <View style={{ flexDirection: "row", gap: 6 }}>
        <SkeletonBlock height={22} width={90} />
        <SkeletonBlock height={22} width={70} />
        <SkeletonBlock height={22} width={80} />
      </View>
      {/* deadline row */}
      <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
        <SkeletonBlock height={11} width="55%" />
        <SkeletonBlock height={20} width={80} />
      </View>
      {/* status badge */}
      <SkeletonBlock height={26} width={140} />
    </View>
  </View>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function UjianKerjakan() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [ujian, setUjian] = useState<any>(null);
  const [pembatasan, setPembatasan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [started, setStarted] = useState(false);
  const [selesai, setSelesai] = useState(false);

  // soal state
  const [allSoal, setAllSoal] = useState<Soal[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [jawaban, setJawaban] = useState<JawabanMap>({});

  // timer
  const [timerDetik, setTimerDetik] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // modals
  const [showNav, setShowNav] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  useEffect(() => {
    if (!id || id === "index") {
      setLoading(false);
      return;
    }
    getDetail();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  const getDetail = async () => {
    setLoading(true);
    setError(false);
    try {
      const [ujianRes, pembatasanRes] = await Promise.all([
        API.get(`/v2/lms/ujian/${id}`),
        API.get("/v2/lms/check_pembatasan"),
      ]);
      const data = ujianRes.data.data || ujianRes.data;
      setUjian(data);
      setPembatasan(pembatasanRes.data?.data || null);

      const soalList: Soal[] = [];
      (data.kelompok_soal || []).forEach((kg: KelompokSoal) => {
        (kg.soal || []).forEach((s) => soalList.push(s));
      });
      setAllSoal(soalList);

      if (data.gunakan_batas_waktu && data.durasi) {
        setTimerDetik(data.durasi * 60);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const mulaiUjian = () => {
    setStarted(true);
    if (ujian?.gunakan_batas_waktu && ujian?.durasi) {
      timerRef.current = setInterval(() => {
        setTimerDetik((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleJawab = (idSoal: string, jawab: string) => {
    setJawaban((prev) => ({ ...prev, [idSoal]: jawab }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSelesai(true);
    setShowConfirmSubmit(false);
    console.log("📤 SUBMIT JAWABAN:", jawaban);
    if (autoSubmit) {
      Alert.alert(
        "Waktu Habis",
        "Waktu ujian telah habis. Jawaban otomatis dikumpulkan.",
      );
    }
  };

  const jumlahDijawab = allSoal.filter((s) => jawaban[s.id]).length;
  const jumlahBelum = allSoal.length - jumlahDijawab;
  const timerWarning = timerDetik <= 60 && timerDetik > 0;
  const timerDanger = timerDetik <= 30 && timerDetik > 0;

  // ── LOADING STATE (skeleton) ─────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={g.safeArea}>
        <ScrollView
          style={{ flex: 1, backgroundColor: Colors.bg }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* header skeleton */}
          <View style={[styles.header, { paddingBottom: 36 }]}>
            <View style={styles.decor1} />
            <View style={styles.decor2} />
            <View style={styles.decor3} />
            <View style={styles.decor4} />
            <View style={{ gap: 8, marginTop: 8 }}>
              <SkeletonBlock height={12} width="30%" />
              <SkeletonBlock height={22} width="60%" />
            </View>
          </View>

          <View style={styles.body}>
            <Text style={styles.sectionLabel}>Memuat detail ujian...</Text>
            {[1, 2, 3].map((i) => (
              <UjianSkeleton key={i} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── ERROR STATE ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={g.safeArea}>
        <ScrollView
          style={{ flex: 1, backgroundColor: Colors.bg }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.decor1} />
            <View style={styles.decor2} />
            <View style={styles.decor3} />
            <View style={styles.decor4} />
            <TouchableOpacity
              style={styles.backBtnHeader}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color="#fff" />
              <Text style={styles.backBtnLabel}>Kembali</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detail Ujian</Text>
          </View>

          <View style={styles.body}>
            <View style={styles.empty}>
              <Ionicons name="wifi-outline" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>Gagal memuat data</Text>
              <Text style={{ fontSize: 12, color: Colors.hint }}>
                Periksa koneksi internet kamu
              </Text>
              <TouchableOpacity style={styles.retryBtn} onPress={getDetail}>
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={styles.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── NOT FOUND STATE ──────────────────────────────────────────────────────
  if (!ujian) {
    return (
      <SafeAreaView style={g.safeArea}>
        <ScrollView
          style={{ flex: 1, backgroundColor: Colors.bg }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.decor1} />
            <View style={styles.decor2} />
            <View style={styles.decor3} />
            <View style={styles.decor4} />
            <TouchableOpacity
              style={styles.backBtnHeader}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color="#fff" />
              <Text style={styles.backBtnLabel}>Kembali</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detail Ujian</Text>
          </View>

          <View style={styles.body}>
            <View style={styles.empty}>
              <Ionicons
                name="document-outline"
                size={40}
                color={Colors.border}
              />
              <Text style={styles.emptyText}>Ujian tidak ditemukan</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── HASIL UJIAN ──────────────────────────────────────────────────────────
  if (selesai) {
    return (
      <SafeAreaView style={g.safeArea}>
        <ScrollView
          style={{ flex: 1, backgroundColor: Colors.bg }}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={styles.hasilHeader}>
            <View style={styles.decor1} />
            <View style={styles.decor2} />
            <View style={styles.hasilIcon}>
              <Ionicons name="checkmark-circle" size={40} color="#fff" />
            </View>
            <Text style={styles.hasilTitle}>Ujian Selesai!</Text>
            <Text style={styles.hasilSub}>{ujian.judul}</Text>
          </View>

          <View style={styles.body}>
            <View style={styles.hasilCard}>
              <View style={styles.hasilRow}>
                <Text style={styles.hasilLabel}>Total Soal</Text>
                <Text style={styles.hasilValue}>{allSoal.length}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.hasilRow}>
                <Text style={styles.hasilLabel}>Dijawab</Text>
                <Text
                  style={[styles.hasilValue, { color: Colors.successText }]}
                >
                  {jumlahDijawab}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.hasilRow}>
                <Text style={styles.hasilLabel}>Tidak Dijawab</Text>
                <Text
                  style={[
                    styles.hasilValue,
                    {
                      color: jumlahBelum > 0 ? Colors.dangerText : Colors.muted,
                    },
                  ]}
                >
                  {jumlahBelum}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.hasilRow}>
                <Text style={styles.hasilLabel}>Status</Text>
                <Text
                  style={[styles.hasilValue, { color: Colors.warningText }]}
                >
                  Menunggu penilaian
                </Text>
              </View>
            </View>

            <Text style={styles.hasilNote}>
              Jawaban telah dikumpulkan. Nilai akan diumumkan oleh dosen.
            </Text>

            <TouchableOpacity
              style={styles.backBtn2}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back-outline" size={16} color="#fff" />
              <Text style={styles.backBtn2Text}>Kembali ke Daftar Ujian</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── HALAMAN MULAI ────────────────────────────────────────────────────────
  if (!started) {
    return (
      <SafeAreaView style={g.safeArea}>
        <ScrollView
          style={{ flex: 1, backgroundColor: Colors.bg }}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={styles.header}>
            <View style={styles.decor1} />
            <View style={styles.decor2} />
            <View style={styles.decor3} />
            <View style={styles.decor4} />
            <TouchableOpacity
              style={styles.backBtnHeader}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color="#fff" />
              <Text style={styles.backBtnLabel}>Kembali</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{ujian.judul}</Text>
            <Text style={styles.headerSub}>
              {ujian.kelas_kuliah?.mata_kuliah?.nama || "-"}
            </Text>
          </View>

          <View style={styles.body}>
            {/* INFO CARD */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>
                Perhatian sebelum memulai
              </Text>
              <View style={styles.divider} />
              <View style={g.infoRow}>
                <Ionicons
                  name="help-circle-outline"
                  size={14}
                  color={Colors.hint}
                />
                <Text style={styles.infoText}>{allSoal.length} soal</Text>
              </View>
              {ujian.gunakan_batas_waktu && (
                <View style={g.infoRow}>
                  <Ionicons
                    name="hourglass-outline"
                    size={14}
                    color={Colors.hint}
                  />
                  <Text style={styles.infoText}>
                    Durasi {ujian.durasi} menit
                  </Text>
                </View>
              )}
              <View style={g.infoRow}>
                <Ionicons
                  name="shuffle-outline"
                  size={14}
                  color={Colors.hint}
                />
                <Text style={styles.infoText}>
                  {ujian.acakSoal ? "Soal diacak" : "Soal berurutan"}
                </Text>
              </View>
              <View style={g.infoRow}>
                <Ionicons name="shield-outline" size={14} color={Colors.hint} />
                <Text style={styles.infoText}>
                  Sifat:{" "}
                  {ujian.sifat === "close" ? "Buku tertutup" : ujian.sifat}
                </Text>
              </View>
              {ujian.deskripsi && ujian.deskripsi !== "-" && (
                <View style={g.infoRow}>
                  <Ionicons
                    name="information-circle-outline"
                    size={14}
                    color={Colors.hint}
                  />
                  <Text style={styles.infoText}>
                    {ujian.deskripsi.replace(/<br\s*\/?>/gi, " ")}
                  </Text>
                </View>
              )}
            </View>

            {/* CEK PEMBATASAN */}
            {(() => {
              const jenis = ujian?.jenis?.toLowerCase() || "";
              const isBlokir =
                (jenis.includes("uts") &&
                  pembatasan?.uts?.memenuhi_syarat === false) ||
                (jenis.includes("uas") &&
                  pembatasan?.uas?.memenuhi_syarat === false);

              return isBlokir ? (
                <View
                  style={[
                    styles.warningCard,
                    {
                      backgroundColor: Colors.dangerBg,
                      borderColor: Colors.dangerBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name="card-outline"
                    size={16}
                    color={Colors.dangerText}
                  />
                  <Text
                    style={[styles.warningText, { color: Colors.dangerText }]}
                  >
                    Akses ujian diblokir karena tunggakan keuangan. Hubungi
                    bagian keuangan kampus.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.warningCard}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={16}
                      color={Colors.warningText}
                    />
                    <Text style={styles.warningText}>
                      Pastikan koneksi internet stabil. Timer berjalan setelah
                      klik Mulai dan tidak bisa dihentikan.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.mulaiBtn}
                    onPress={mulaiUjian}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="pencil-outline" size={18} color="#fff" />
                    <Text style={styles.mulaiBtnText}>Mulai Ujian</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── HALAMAN KERJAKAN ─────────────────────────────────────────────────────
  const soalSekarang = allSoal[currentIdx];
  const isPilihan = soalSekarang?.jenis === "pilihan";
  const jawabanSekarang = jawaban[soalSekarang?.id] ?? null;

  return (
    <SafeAreaView style={[g.safeArea, { backgroundColor: Colors.bg }]}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setShowNav(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="grid-outline" size={18} color={Colors.primary} />
          <Text style={styles.navBtnText}>
            {currentIdx + 1}/{allSoal.length}
          </Text>
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {ujian.judul}
          </Text>
          <Text style={styles.topBarSub}>
            {jumlahDijawab}/{allSoal.length} dijawab
          </Text>
        </View>

        {ujian.gunakan_batas_waktu ? (
          <View
            style={[
              styles.timerWrap,
              timerDanger
                ? styles.timerDanger
                : timerWarning
                  ? styles.timerWarning
                  : styles.timerNormal,
            ]}
          >
            <Ionicons
              name="hourglass-outline"
              size={13}
              color={
                timerDanger
                  ? Colors.dangerText
                  : timerWarning
                    ? Colors.warningText
                    : Colors.primary
              }
            />
            <Text
              style={[
                styles.timerText,
                {
                  color: timerDanger
                    ? Colors.dangerText
                    : timerWarning
                      ? Colors.warningText
                      : Colors.primary,
                },
              ]}
            >
              {formatTimer(timerDetik)}
            </Text>
          </View>
        ) : (
          <View style={styles.timerWrap}>
            <Ionicons name="infinite-outline" size={16} color={Colors.muted} />
          </View>
        )}
      </View>

      {/* PROGRESS BAR */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(jumlahDijawab / allSoal.length) * 100}%` },
          ]}
        />
      </View>

      {/* SOAL */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.soalHeader}>
          <View style={styles.soalNomorBadge}>
            <Text style={styles.soalNomor}>{currentIdx + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.soalPoin}>{soalSekarang?.poin} poin</Text>
          </View>
          {jawabanSekarang && (
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={Colors.successText}
            />
          )}
        </View>

        <Text style={styles.pertanyaan}>{soalSekarang?.pertanyaan}</Text>

        {isPilihan ? (
          <View style={styles.pilihanWrap}>
            {soalSekarang.pilihan.pilihan.map((p, idx) => {
              const isSelected = jawabanSekarang === p;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.pilihanItem,
                    isSelected && styles.pilihanSelected,
                  ]}
                  onPress={() => handleJawab(soalSekarang.id, p)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.pilihanHuruf,
                      isSelected && styles.pilihanHurufSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pilihanHurufText,
                        isSelected && { color: "#fff" },
                      ]}
                    >
                      {ALFABET[idx]}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.pilihanText,
                      isSelected && {
                        color: Colors.primary,
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <TextInput
            style={styles.essayInput}
            placeholder="Tulis jawaban kamu di sini..."
            placeholderTextColor={Colors.hint}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={jawabanSekarang ?? ""}
            onChangeText={(t) => handleJawab(soalSekarang.id, t)}
          />
        )}
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navArrow, currentIdx === 0 && { opacity: 0.3 }]}
          onPress={() => setCurrentIdx((p) => Math.max(0, p - 1))}
          disabled={currentIdx === 0}
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.primary} />
          <Text style={styles.navArrowText}>Sebelumnya</Text>
        </TouchableOpacity>

        {currentIdx === allSoal.length - 1 ? (
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => setShowConfirmSubmit(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
            <Text style={styles.submitBtnText}>Kumpulkan</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.navArrowNext}
            onPress={() =>
              setCurrentIdx((p) => Math.min(allSoal.length - 1, p + 1))
            }
            activeOpacity={0.75}
          >
            <Text style={styles.navArrowNextText}>Selanjutnya</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* MODAL NAVIGASI SOAL */}
      <Modal
        visible={showNav}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNav(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Navigasi Soal</Text>
              <TouchableOpacity onPress={() => setShowNav(false)}>
                <Ionicons name="close" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalStats}>
              <View style={styles.modalStatItem}>
                <View
                  style={[
                    styles.modalDot,
                    { backgroundColor: Colors.successText },
                  ]}
                />
                <Text style={styles.modalStatText}>
                  Dijawab ({jumlahDijawab})
                </Text>
              </View>
              <View style={styles.modalStatItem}>
                <View
                  style={[styles.modalDot, { backgroundColor: Colors.border }]}
                />
                <Text style={styles.modalStatText}>Belum ({jumlahBelum})</Text>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.soalGrid}>
              {allSoal.map((s, idx) => {
                const isDijawab = !!jawaban[s.id];
                const isCurrent = idx === currentIdx;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.soalGridItem,
                      isDijawab && styles.soalGridDijawab,
                      isCurrent && styles.soalGridCurrent,
                    ]}
                    onPress={() => {
                      setCurrentIdx(idx);
                      setShowNav(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.soalGridText,
                        (isDijawab || isCurrent) && { color: "#fff" },
                      ]}
                    >
                      {idx + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => {
                setShowNav(false);
                setShowConfirmSubmit(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color="#fff"
              />
              <Text style={styles.submitBtnText}>Kumpulkan Jawaban</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL KONFIRMASI SUBMIT */}
      <Modal
        visible={showConfirmSubmit}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmSubmit(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: 20 }]}>
            <View style={styles.confirmIcon}>
              <Ionicons
                name="help-circle-outline"
                size={36}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.confirmTitle}>Kumpulkan Jawaban?</Text>
            <Text style={styles.confirmSub}>
              {jumlahBelum > 0
                ? `Masih ada ${jumlahBelum} soal yang belum dijawab.`
                : "Semua soal sudah dijawab."}
              {"\n"}Jawaban tidak bisa diubah setelah dikumpulkan.
            </Text>

            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowConfirmSubmit(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelBtnText}>Periksa Lagi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={() => handleSubmit(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.submitBtnText}>Ya, Kumpulkan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── skeleton ──
  skeletonCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    overflow: "hidden",
  },
  skeletonStripe: { width: 4, backgroundColor: Colors.skeletonBase },
  skeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.skeletonBase,
  },

  // ── empty / error ──
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

  // ── section label ──
  sectionLabel: { fontSize: 12, color: Colors.muted, marginBottom: 10 },

  // ── header ──
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
  backBtnHeader: {
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
  backBtnLabel: { fontSize: 12, fontWeight: "600", color: "#fff" },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.55)" },

  body: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },

  // ── info card ──
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 8,
  },
  infoCardTitle: { fontSize: 14, fontWeight: "700", color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border },
  infoText: { fontSize: 13, color: Colors.muted, flex: 1 },

  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.warningBg,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    borderRadius: 10,
    padding: 12,
  },
  warningText: {
    fontSize: 12,
    color: Colors.warningText,
    flex: 1,
    lineHeight: 18,
  },

  mulaiBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 4,
  },
  mulaiBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  // ── top bar (kerjakan) ──
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primaryMid,
  },
  navBtnText: { fontSize: 12, fontWeight: "700", color: Colors.primary },
  topBarCenter: { flex: 1, alignItems: "center" },
  topBarTitle: { fontSize: 13, fontWeight: "700", color: Colors.text },
  topBarSub: { fontSize: 10, color: Colors.muted },
  timerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  timerNormal: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryMid,
  },
  timerWarning: {
    backgroundColor: Colors.warningBg,
    borderColor: Colors.warningBorder,
  },
  timerDanger: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.dangerBorder,
  },
  timerText: { fontSize: 13, fontWeight: "700" },

  progressBar: { height: 3, backgroundColor: Colors.border },
  progressFill: { height: 3, backgroundColor: Colors.primary },

  // ── soal ──
  soalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  soalNomorBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  soalNomor: { fontSize: 14, fontWeight: "700", color: "#fff" },
  soalPoin: { fontSize: 11, color: Colors.muted },
  pertanyaan: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 20,
  },

  pilihanWrap: { gap: 10 },
  pilihanItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  pilihanSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  pilihanHuruf: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  pilihanHurufSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pilihanHurufText: { fontSize: 12, fontWeight: "700", color: Colors.muted },
  pilihanText: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
    paddingTop: 4,
  },

  essayInput: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    fontSize: 14,
    color: Colors.text,
    minHeight: 160,
  },

  // ── bottom nav ──
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  navArrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.primaryMid,
  },
  navArrowText: { fontSize: 13, fontWeight: "600", color: Colors.primary },
  navArrowNext: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
  },
  navArrowNextText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  submitBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
  },
  submitBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  // ── modals ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 14,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  modalStats: { flexDirection: "row", gap: 16 },
  modalStatItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  modalDot: { width: 10, height: 10, borderRadius: 5 },
  modalStatText: { fontSize: 12, color: Colors.muted },
  soalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 4,
  },
  soalGridItem: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  soalGridDijawab: {
    backgroundColor: Colors.successText,
    borderColor: Colors.successText,
  },
  soalGridCurrent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  soalGridText: { fontSize: 13, fontWeight: "700", color: Colors.muted },

  confirmIcon: { alignItems: "center", marginTop: 8 },
  confirmTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  confirmSub: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  confirmBtnRow: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bg,
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: { fontSize: 13, fontWeight: "600", color: Colors.muted },

  // ── hasil ──
  hasilHeader: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 40,
    overflow: "hidden",
    alignItems: "center",
    gap: 8,
  },
  hasilIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  hasilTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  hasilSub: { fontSize: 13, color: "rgba(255,255,255,0.65)" },
  hasilCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 10,
  },
  hasilRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hasilLabel: { fontSize: 13, color: Colors.muted },
  hasilValue: { fontSize: 14, fontWeight: "700", color: Colors.text },
  hasilNote: {
    fontSize: 12,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 18,
  },
  backBtn2: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 4,
  },
  backBtn2Text: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
