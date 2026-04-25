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

export default function Forum() {
  const [kelas, setKelas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getKelas();
  }, []);

  const getKelas = async () => {
    try {
      const res = await API.get("/v2/lms/kelas_kuliah", {
        params: { periode: 20252 },
      });
      setKelas(res.data.data || []);
    } catch (err: any) {
      console.log(err.response?.data);
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
        {/* ── Header biru ── */}
        <View style={styles.header}>
          <View style={styles.decor1} />
          <View style={styles.decor2} />
          <View style={styles.decor3} />
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Forum Diskusi</Text>
          <Text style={styles.headerSub}>
            {!loading ? `${kelas.length} kelas tersedia` : "Memuat kelas..."}
          </Text>
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>
          <Text style={styles.sectionLabel}>
            {loading
              ? "Memuat forum..."
              : kelas.length === 0
                ? "Tidak ada kelas ditemukan"
                : `${kelas.length} kelas aktif`}
          </Text>

          {/* Skeleton */}
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <SkeletonBlock height={14} width="60%" />
                <SkeletonBlock height={11} width="40%" />
              </View>
            ))
          ) : kelas.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons
                name="chatbubbles-outline"
                size={40}
                color={Colors.border}
              />
              <Text style={styles.emptyText}>Tidak ada kelas ditemukan</Text>
            </View>
          ) : (
            kelas.map((k, i) => (
              <TouchableOpacity
                key={i}
                style={styles.card}
                activeOpacity={0.75}
                onPress={() => {
                  if (!k.id) return;
                  router.push({
                    pathname: "/forum/[kelas]",
                    params: { kelas: k.id },
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
  // ── Header ──
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
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
  },

  // ── Body ──
  body: { paddingHorizontal: 16, paddingTop: 16 },
  sectionLabel: { fontSize: 12, color: Colors.muted, marginBottom: 10 },

  // ── Card ──
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
  empty: { alignItems: "center", paddingVertical: 56, gap: 8 },
  emptyText: { fontSize: 14, color: Colors.muted, fontWeight: "600" },
});
