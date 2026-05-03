import { InfoRow } from "@/components/InfoRow";
import { SectionHeader } from "@/components/SectionHeader";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { useAuth } from "@/store/auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  const selisih = now.getFullYear() - angkatan;
  const semester = now.getMonth() + 1 >= 8 ? selisih * 2 + 1 : selisih * 2;
  return semester > 0 ? String(semester) : "1";
};

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
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={g.headerSection}>
          <View style={g.topBar}>
            <View>
              <Text style={g.headerLabel}>PORTAL MAHASISWA</Text>
              <Text style={g.pageTitle}>Profil Saya</Text>
            </View>
            <View style={g.uymBadge}>
              <Text style={g.uymBadgeText}>UYM</Text>
            </View>
          </View>

          {!loading && !error && (
            <View style={styles.identityRow}>
              <Image
                source={{
                  uri: user?.fotoContentUrl || "https://i.pravatar.cc/150",
                }}
                style={styles.avatar}
              />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.userName} numberOfLines={2}>
                  {user?.nama || "-"}
                </Text>
                <Text style={styles.userNim}>{user?.idMahasiswa || "-"}</Text>
                <View style={styles.badgeRow}>
                  <View style={g.badgeSuccess}>
                    <Ionicons
                      name="ellipse"
                      size={6}
                      color={Colors.successText}
                    />
                    <Text style={styles.badgeActiveText}>
                      {user?.namaStatus || "Aktif"}
                    </Text>
                  </View>
                  <View style={g.badgePrimary}>
                    <Text style={g.badgePrimaryText}>
                      {user?.prodi?.tingkat || "S1"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* LOADING */}
        {loading && (
          <View
            style={[
              g.emptyWrap,
              { flex: 1, justifyContent: "center", paddingVertical: 60 },
            ]}
          >
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>Memuat profil...</Text>
          </View>
        )}

        {/* ERROR */}
        {error && (
          <View
            style={[
              g.emptyWrap,
              { flex: 1, justifyContent: "center", paddingVertical: 60 },
            ]}
          >
            <Ionicons name="wifi-outline" size={40} color={Colors.border} />
            <Text style={g.emptyTitle}>Gagal memuat data</Text>
            <Text style={g.emptyHint}>Periksa koneksi internet kamu</Text>
            <TouchableOpacity style={g.retryBtn} onPress={fetchProfile}>
              <Ionicons
                name="refresh-outline"
                size={15}
                color={Colors.primary}
              />
              <Text style={g.retryText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CONTENT */}
        {!loading && !error && (
          <View style={g.body}>
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

            {/* PRODI BANNER */}
            <View
              style={[
                g.card,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  padding: 12,
                  backgroundColor: Colors.primaryLight,
                  borderColor: Colors.primaryMid,
                },
              ]}
            >
              <View style={g.iconWrap}>
                <Ionicons
                  name="school-outline"
                  size={18}
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

            {/* INFO CARDS */}
            <View style={g.card}>
              <SectionHeader icon="school-outline" title="Informasi Akademik" />
              <InfoRow icon="mail-outline" label="Email" value={user?.email} />
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

            {/* BANTUAN */}
            <TouchableOpacity
              style={g.quickLinkCard}
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
                <Text style={g.quickLinkTitle}>Pusat Bantuan</Text>
                <Text style={g.quickLinkSub}>
                  FAQ, kontak & jam operasional BAA
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.hint} />
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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

const styles = StyleSheet.create({
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: Colors.primaryMid,
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.2,
  },
  userNim: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
  },

  badgeActiveText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.successText,
  },

  loadingText: {
    fontSize: 13,
    color: Colors.muted,
    marginTop: 4,
  },

  statStrip: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    gap: 4,
  },
  statDivider: {
    width: 0.5,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.muted,
    fontWeight: "500",
  },
  prodiBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.primaryLight,
    borderWidth: 0.5,
    borderColor: Colors.primaryMid,
    borderRadius: 10,
    padding: 12,
  },
  prodiName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },
  prodiFakultas: {
    fontSize: 11,
    color: Colors.primary,
    opacity: 0.7,
    marginTop: 1,
  },
});
