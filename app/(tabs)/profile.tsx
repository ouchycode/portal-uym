import { InfoRow } from "@/components/InfoRow";
import { SectionHeader } from "@/components/SectionHeader";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { useAuth } from "@/store/auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const formatDate = (dateStr?: string) => {
  if (!dateStr || dateStr.startsWith("-0001")) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const hitungSemester = (angkatan?: number): string => {
  if (!angkatan) return "-";
  const now = new Date();
  const tahun = now.getFullYear();
  const bulan = now.getMonth() + 1;
  const isGanjil = bulan >= 8;
  const selisihTahun = tahun - angkatan;
  const semester = isGanjil ? selisihTahun * 2 + 1 : selisihTahun * 2;
  return semester > 0 ? String(semester) : "1";
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

const ProfileSkeleton = () => (
  <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 12 }}>
    {/* stat strip skeleton */}
    <View style={[styles.statStrip, { paddingVertical: 18, gap: 0 }]}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
          <SkeletonBlock width={24} height={24} />
          <SkeletonBlock width="50%" height={14} />
          <SkeletonBlock width="60%" height={10} />
          {i < 2 && (
            <View
              style={[
                styles.statDivider,
                { position: "absolute", right: 0, top: 12, bottom: 12 },
              ]}
            />
          )}
        </View>
      ))}
    </View>

    {/* prodi card skeleton */}
    <View style={[styles.prodiCard, { gap: 12 }]}>
      <SkeletonBlock width={36} height={36} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBlock width="70%" height={13} />
        <SkeletonBlock width="50%" height={11} />
      </View>
    </View>

    {/* info card skeletons */}
    {[5, 4, 5].map((rows, ci) => (
      <View key={ci} style={[g.card, { gap: 14 }]}>
        <SkeletonBlock width="45%" height={12} />
        {Array.from({ length: rows }).map((_, ri) => (
          <View
            key={ri}
            style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
          >
            <SkeletonBlock width={32} height={32} />
            <View style={{ flex: 1, gap: 5 }}>
              <SkeletonBlock width="30%" height={10} />
              <SkeletonBlock width="60%" height={13} />
            </View>
          </View>
        ))}
      </View>
    ))}
  </View>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Profile() {
  const { user: cachedUser, setAuth, logout } = useAuth();
  const router = useRouter();

  const [user, setUser] = useState<any>(cachedUser ?? null);
  const [loading, setLoading] = useState(!cachedUser);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!cachedUser) fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await API.get("/v2/profile");
      const data = res.data?.data ?? res.data;
      setUser(data);
      // sync ke auth store supaya halaman lain bisa pakai
      setAuth(useAuth.getState().token!, data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={g.safeArea}>
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.bg }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <View style={styles.hero}>
          <View style={styles.decor1} />
          <View style={styles.decor2} />
          <View style={styles.decor3} />
          <View style={styles.decor4} />

          <View style={styles.topBar}>
            <View>
              <Text style={styles.heroLabel}>PORTAL MAHASISWA</Text>
              <Text style={styles.heroTitle}>Profil Saya</Text>
            </View>
            <View style={styles.uymBadge}>
              <Text style={styles.uymBadgeText}>UYM</Text>
            </View>
          </View>

          {/* hero body: skeleton atau data */}
          {loading ? (
            <View style={styles.heroBody}>
              <SkeletonBlock width={72} height={72} />
              <View style={{ flex: 1, gap: 8 }}>
                <SkeletonBlock width="65%" height={16} />
                <SkeletonBlock width="40%" height={12} />
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <SkeletonBlock width={70} height={22} />
                  <SkeletonBlock width={40} height={22} />
                </View>
              </View>
            </View>
          ) : error ? (
            // error state ringkas di dalam header
            <View style={styles.heroBody}>
              <View style={styles.avatarWrap}>
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: "rgba(255,255,255,0.15)",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={32}
                    color="rgba(255,255,255,0.5)"
                  />
                </View>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.heroName}>Gagal memuat profil</Text>
                <Text
                  style={[styles.heroNim, { color: "rgba(255,255,255,0.5)" }]}
                >
                  Periksa koneksi internet kamu
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.heroBody}>
              <View style={styles.avatarWrap}>
                <Image
                  source={{
                    uri: user?.fotoContentUrl || "https://i.pravatar.cc/150",
                  }}
                  style={styles.avatar}
                />
                <View style={styles.statusDot} />
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.heroName} numberOfLines={2}>
                  {user?.nama || "-"}
                </Text>
                <Text style={styles.heroNim}>{user?.idMahasiswa || "-"}</Text>
                <View style={styles.heroBadgeRow}>
                  <View style={styles.heroBadge}>
                    <Ionicons name="ellipse" size={6} color="#4ADE80" />
                    <Text style={styles.heroBadgeText}>
                      {user?.namaStatus || "Aktif"}
                    </Text>
                  </View>
                  <View style={styles.heroBadgeMuted}>
                    <Text style={styles.heroBadgeMutedText}>
                      {user?.prodi?.tingkat || "S1"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ── BODY: skeleton / error / data ── */}
        {loading ? (
          <ProfileSkeleton />
        ) : error ? (
          <View style={styles.empty}>
            <Ionicons name="wifi-outline" size={40} color={Colors.border} />
            <Text style={styles.emptyText}>Gagal memuat data</Text>
            <Text style={{ fontSize: 12, color: Colors.hint }}>
              Periksa koneksi internet kamu
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile}>
              <Ionicons
                name="refresh-outline"
                size={15}
                color={Colors.primary}
              />
              <Text style={styles.retryText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* STAT STRIP */}
            <View style={styles.statStrip}>
              <StatCard
                icon="calendar-outline"
                label="Angkatan"
                value={String(user?.angkatan || "-")}
              />
              <View style={styles.statDivider} />
              <StatCard
                icon="layers-outline"
                label="Semester"
                value={hitungSemester(user?.angkatan)}
              />
              <View style={styles.statDivider} />
              <StatCard
                icon="ribbon-outline"
                label="Grade"
                value={user?.grade?.nama || "-"}
              />
            </View>

            {/* PRODI QUICK INFO */}
            <View style={styles.prodiCard}>
              <View style={styles.prodiIconWrap}>
                <Ionicons
                  name="school-outline"
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.prodiName}>
                  {user?.prodi?.nama || "Program Studi"}
                </Text>
                <Text style={styles.prodiFakultas}>
                  {user?.prodi?.fakultas?.nama || "-"} ·{" "}
                  {user?.kampus?.nama || "-"}
                </Text>
              </View>
            </View>

            {/* CARDS */}
            <View style={styles.section}>
              <View style={g.card}>
                <SectionHeader
                  icon="school-outline"
                  title="Informasi Akademik"
                />
                <InfoRow
                  icon="mail-outline"
                  label="Email"
                  value={user?.email}
                />
                <InfoRow
                  icon="call-outline"
                  label="No. HP"
                  value={user?.ponsel}
                />
                <InfoRow
                  icon="book-outline"
                  label="Program Studi"
                  value={user?.prodi?.nama}
                />
                <InfoRow
                  icon="layers-outline"
                  label="Jenjang"
                  value={user?.prodi?.tingkat}
                />
                <InfoRow
                  icon="business-outline"
                  label="Fakultas"
                  value={user?.prodi?.fakultas?.nama}
                />
                <InfoRow
                  icon="location-outline"
                  label="Kampus"
                  value={user?.kampus?.nama}
                />
                <InfoRow
                  icon="people-outline"
                  label="Kelas"
                  value={user?.kelas?.nama}
                />
                <InfoRow
                  icon="sunny-outline"
                  label="Sesi Kuliah"
                  value={user?.sesiKuliah?.nama}
                />
                <InfoRow
                  icon="ribbon-outline"
                  label="Jenis Kelas"
                  value={user?.jenisKelas?.nama}
                />
              </View>

              <View style={g.card}>
                <SectionHeader icon="calendar-outline" title="Status Studi" />
                <InfoRow
                  icon="enter-outline"
                  label="Angkatan"
                  value={String(user?.angkatan || "-")}
                />
                <InfoRow
                  icon="flag-outline"
                  label="Semester Awal"
                  value={user?.semesterAwal}
                />
                <InfoRow
                  icon="timer-outline"
                  label="Batas Studi"
                  value={user?.batasStudi}
                />
                <InfoRow
                  icon="calendar-outline"
                  label="Tanggal Masuk"
                  value={formatDate(user?.tanggalMasuk)}
                />
                <InfoRow
                  icon="gift-outline"
                  label="Pembiayaan"
                  value={user?.pembiayaanAwal}
                />
                <InfoRow
                  icon="trophy-outline"
                  label="Grade"
                  value={user?.grade?.nama}
                />
                <InfoRow
                  icon="person-outline"
                  label="Dosen Pembimbing"
                  value={user?.dosen?.nama}
                />
              </View>

              <View style={g.card}>
                <SectionHeader
                  icon="person-circle-outline"
                  title="Data Pribadi"
                />
                <InfoRow
                  icon="location-outline"
                  label="Tempat Lahir"
                  value={user?.tempatLahir}
                />
                <InfoRow
                  icon="calendar-outline"
                  label="Tanggal Lahir"
                  value={formatDate(user?.tanggalLahir)}
                />
                <InfoRow
                  icon="time-outline"
                  label="Umur"
                  value={user?.umur ? `${user.umur} tahun` : "-"}
                />
                <InfoRow
                  icon="body-outline"
                  label="Tinggi Badan"
                  value={user?.tinggiBadan ? `${user.tinggiBadan} cm` : "-"}
                />
                <InfoRow
                  icon="barbell-outline"
                  label="Berat Badan"
                  value={user?.beratBadan ? `${user.beratBadan} kg` : "-"}
                />
                <InfoRow
                  icon="water-outline"
                  label="Gol. Darah"
                  value={user?.golDarah !== "-" ? user?.golDarah : "-"}
                />
                <InfoRow
                  icon="home-outline"
                  label="Kelurahan"
                  value={user?.kelurahan}
                />
                <InfoRow
                  icon="globe-outline"
                  label="Negara"
                  value={user?.negara?.nama}
                />
              </View>

              <TouchableOpacity
                style={styles.bantuanBtn}
                onPress={() => router.push("/bantuan")}
                activeOpacity={0.75}
              >
                <View style={g.iconWrap}>
                  <Ionicons
                    name="help-circle-outline"
                    size={18}
                    color={Colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bantuanTitle}>Pusat Bantuan</Text>
                  <Text style={styles.bantuanSub}>
                    FAQ, kontak & jam operasional BAA
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={Colors.hint}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={g.btnDanger}
                onPress={logout}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color={Colors.dangerText}
                />
                <Text style={g.btnDangerText}>Keluar</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={16} color={Colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  hero: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
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
    marginBottom: 20,
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

  heroBody: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4ADE80",
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  heroInfo: { flex: 1, gap: 4 },
  heroName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  heroNim: { fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: "500" },
  heroBadgeRow: { flexDirection: "row", gap: 6, marginTop: 2 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(74,222,128,0.15)",
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.3)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  heroBadgeText: { fontSize: 10, fontWeight: "600", color: "#4ADE80" },
  heroBadgeMuted: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  heroBadgeMutedText: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
  },

  statStrip: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 16,
    marginTop: 16,
    overflow: "hidden",
  },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 4 },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 12 },
  statValue: { fontSize: 16, fontWeight: "700", color: Colors.primary },
  statLabel: { fontSize: 10, color: Colors.muted },

  prodiCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryMid,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
  },
  prodiIconWrap: {
    backgroundColor: Colors.primaryMid,
    borderRadius: 10,
    padding: 8,
  },
  prodiName: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  prodiFakultas: {
    fontSize: 11,
    color: Colors.primary,
    opacity: 0.7,
    marginTop: 2,
  },

  section: { paddingHorizontal: 16, paddingTop: 12 },

  bantuanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 8,
  },
  bantuanTitle: { fontSize: 13, fontWeight: "700", color: Colors.text },
  bantuanSub: { fontSize: 11, color: Colors.muted, marginTop: 1 },

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
