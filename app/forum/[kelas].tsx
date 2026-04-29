import { SkeletonBlock } from "@/components/SkeletonBlock";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Skeleton: row identik dengan card asli (icon + konten + chevron) ─────────
const ForumKelasSkeleton = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonIcon} />
    <View style={{ flex: 1, gap: 6 }}>
      <SkeletonBlock height={11} width="30%" />
      <SkeletonBlock height={14} width="70%" />
    </View>
    <SkeletonBlock height={16} width={16} />
  </View>
);

export default function ForumKelas() {
  const params = useLocalSearchParams();
  const kelas = Array.isArray(params.kelas) ? params.kelas[0] : params.kelas;
  const mkNama = Array.isArray(params.mkNama)
    ? params.mkNama[0]
    : (params.mkNama as string) || "";

  const [forum, setForum] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (kelas) getForum();
  }, [kelas]);

  const getForum = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await API.get("/v2/lms/forum", {
        params: {
          id_kelas_kuliah: kelas,
          ignore_default_pagination: true,
          search: "",
          sort: "nomor_pertemuan",
        },
      });
      setForum(res.data.data || []);
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
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.decor1} />
          <View style={styles.decor2} />
          <View style={styles.decor3} />
          <View style={styles.decor4} />

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color="#fff" />
            <Text style={styles.backLabel}>Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{mkNama || "Forum Diskusi"}</Text>
          <Text style={styles.headerSub}>
            {loading
              ? "Memuat forum..."
              : error
                ? "Gagal memuat data"
                : `${forum.length} topik ditemukan`}
          </Text>
        </View>

        {/* BODY */}
        <View style={styles.body}>
          <Text style={styles.sectionLabel}>
            {loading
              ? "Memuat topik..."
              : error
                ? "Gagal memuat data"
                : forum.length === 0
                  ? "Belum ada forum di kelas ini"
                  : `${forum.length} topik · urut per pertemuan`}
          </Text>

          {/* ── SKELETON ── */}
          {loading ? (
            [1, 2, 3].map((i) => <ForumKelasSkeleton key={i} />)
          ) : error ? (
            /* ── ERROR STATE ── */
            <View style={styles.empty}>
              <Ionicons name="wifi-outline" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>Gagal memuat data</Text>
              <Text style={{ fontSize: 12, color: Colors.hint }}>
                Periksa koneksi internet kamu
              </Text>
              <TouchableOpacity style={styles.retryBtn} onPress={getForum}>
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={styles.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : forum.length === 0 ? (
            /* ── EMPTY STATE ── */
            <View style={styles.empty}>
              <Ionicons
                name="chatbubbles-outline"
                size={40}
                color={Colors.border}
              />
              <Text style={styles.emptyText}>Belum ada forum di kelas ini</Text>
            </View>
          ) : (
            /* ── DATA ── */
            forum.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={styles.card}
                activeOpacity={0.75}
                onPress={() => {
                  if (!f.id) return;
                  router.push(`/forum/detail/${f.id}` as any);
                }}
              >
                <View style={g.iconWrap}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={18}
                    color={Colors.primary}
                  />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.meetingLabel}>
                    Pertemuan {f.nomor_pertemuan}
                  </Text>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {f.judul}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={Colors.hint}
                />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  backBtn: {
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
  backLabel: { fontSize: 12, fontWeight: "600", color: "#fff" },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.55)" },

  body: { paddingHorizontal: 16, paddingTop: 16 },
  sectionLabel: { fontSize: 12, color: Colors.muted, marginBottom: 10 },

  // ─── Card ────────────────────────────────────────────────────────────────────
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
  meetingLabel: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: "600",
    marginBottom: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: "600", color: Colors.text },

  // ─── Skeleton ────────────────────────────────────────────────────────────────
  skeletonCard: {
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
  skeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.skeletonBase,
  },

  // ─── Empty / Error ───────────────────────────────────────────────────────────
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
