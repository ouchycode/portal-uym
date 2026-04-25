import { InfoRow } from "@/components/InfoRow";
import { SectionHeader } from "@/components/SectionHeader";
import { Colors, globalStyles as g } from "@/constants/theme";
import { useAuth } from "@/store/auth";
import { Ionicons } from "@expo/vector-icons";
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

export default function Profile() {
  const { user, logout } = useAuth();

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
          <Text style={styles.headerTitle}>Profil Saya</Text>
          <Text style={styles.headerSub}>Universitas Yatsi Madani</Text>
        </View>

        {/* ── Avatar overlap ── */}
        <View style={styles.avatarSection}>
          <Image
            source={{
              uri: user?.fotoContentUrl || "https://i.pravatar.cc/150",
            }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{user?.nama || "-"}</Text>
          <View style={g.badgePrimary}>
            <Text style={g.badgePrimaryText}>
              {user?.idMahasiswa || "Mahasiswa"}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <View style={g.badgeSuccess}>
              <Ionicons name="ellipse" size={7} color={Colors.successText} />
              <Text style={g.badgeSuccessText}>
                {user?.namaStatus || "Aktif"}
              </Text>
            </View>
            <Text style={g.dot}>·</Text>
            <Text style={styles.heroMeta}>{user?.namaGender || "-"}</Text>
            <Text style={g.dot}>·</Text>
            <Text style={styles.heroMeta}>{user?.namaAgama || "-"}</Text>
          </View>
        </View>

        {/* ── Stat strip ── */}
        <View style={styles.statStrip}>
          <StatCard label="Angkatan" value={String(user?.angkatan || "-")} />
          <View style={styles.statDivider} />
          <StatCard label="Semester" value={hitungSemester(user?.angkatan)} />
          <View style={styles.statDivider} />
          <StatCard label="Grade" value={user?.grade?.nama || "-"} />
        </View>

        {/* ── Cards ── */}
        <View style={styles.section}>
          <View style={g.card}>
            <SectionHeader icon="school-outline" title="Informasi Akademik" />
            <InfoRow icon="mail-outline" label="Email" value={user?.email} />
            <InfoRow icon="call-outline" label="No. HP" value={user?.ponsel} />
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
            <SectionHeader icon="person-circle-outline" title="Data Pribadi" />
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
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 56,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },

  // Avatar section
  avatarSection: {
    alignItems: "center",
    marginTop: -44,
    paddingHorizontal: 20,
    gap: 6,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: Colors.card,
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  heroMeta: {
    fontSize: 12,
    color: Colors.muted,
    fontWeight: "500",
  },

  // Stat strip
  statStrip: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    overflow: "hidden",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
  },
  statDivider: {
    width: 1,
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
    marginTop: 2,
  },

  // Section wrapper
  section: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
