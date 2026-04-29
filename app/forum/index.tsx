import { SkeletonBlock } from "@/components/SkeletonBlock";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Skeleton: struktur identik dengan card asli (row: icon + konten + chevron)
const ForumSkeleton = () => (
  <View style={styles.skeletonCard}>
    {/* icon placeholder */}
    <View style={styles.skeletonIcon} />
    {/* konten */}
    <View style={{ flex: 1, gap: 6 }}>
      <SkeletonBlock height={14} width="60%" />
      <SkeletonBlock height={11} width="40%" />
    </View>
    {/* chevron placeholder */}
    <SkeletonBlock height={16} width={16} />
  </View>
);

export default function Forum() {
  const [kelas, setKelas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getKelas();
  }, []);

  const getKelas = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await API.get("/v2/lms/kelas_kuliah", {
        params: { periode: 20252 },
      });
      setKelas(res.data.data || []);
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
          <Text style={styles.headerTitle}>Forum Diskusi</Text>
          <Text style={styles.headerSub}>
            {loading
              ? "Memuat kelas..."
              : error
                ? "Gagal memuat data"
                : `${kelas.length} kelas tersedia`}
          </Text>
        </View>

        {/* BODY */}
        <View style={styles.body}>
          <Text style={styles.sectionLabel}>
            {loading
              ? "Memuat forum..."
              : error
                ? "Gagal memuat data"
                : kelas.length === 0
                  ? "Tidak ada kelas ditemukan"
                  : `${kelas.length} kelas aktif`}
          </Text>

          {/* ── SKELETON ── */}
          {loading ? (
            [1, 2, 3, 4].map((i) => <ForumSkeleton key={i} />)
          ) : error ? (
            /* ── ERROR STATE ── */
            <View style={styles.empty}>
              <Ionicons name="wifi-outline" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>Gagal memuat data</Text>
              <Text style={{ fontSize: 12, color: Colors.hint }}>
                Periksa koneksi internet kamu
              </Text>
              <TouchableOpacity style={styles.retryBtn} onPress={getKelas}>
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={styles.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : kelas.length === 0 ? (
            /* ── EMPTY STATE ── */
            <View style={styles.empty}>
              <Ionicons
                name="chatbubbles-outline"
                size={40}
                color={Colors.border}
              />
              <Text style={styles.emptyText}>Tidak ada kelas ditemukan</Text>
            </View>
          ) : (
            /* ── DATA ── */
            kelas.map((k) => (
              <TouchableOpacity
                key={k.id}
                style={styles.card}
                activeOpacity={0.75}
                onPress={() => {
                  if (!k.id) return;
                  router.push({
                    pathname: "/forum/[kelas]",
                    params: {
                      kelas: k.id,
                      mkNama: k.mata_kuliah?.nama || "",
                    },
                  } as any);
                }}
              >
                <View style={g.iconWrap}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={18}
                    color={Colors.primary}
                  />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {k.mata_kuliah?.nama || "-"}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {k.pengajar?.[0]?.nama_pengajar || ""}
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
  cardTitle: { fontSize: 14, fontWeight: "600", color: Colors.text },
  cardSub: { fontSize: 12, color: Colors.muted, marginTop: 2 },

  // ─── Skeleton ────────────────────────────────────────────────────────────────
  skeletonCard: {
    flexDirection: "row", // sama persis dengan card asli
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
