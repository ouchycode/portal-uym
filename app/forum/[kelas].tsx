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

export default function ForumKelas() {
  const params = useLocalSearchParams();
  const kelas = Array.isArray(params.kelas) ? params.kelas[0] : params.kelas;

  const [forum, setForum] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (kelas) getForum();
  }, [kelas]);

  const getForum = async () => {
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
            {!loading ? `${forum.length} topik ditemukan` : "Memuat forum..."}
          </Text>
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>
          <Text style={styles.sectionLabel}>
            {loading
              ? "Memuat topik..."
              : forum.length === 0
                ? "Belum ada forum di kelas ini"
                : `${forum.length} topik · urut per pertemuan`}
          </Text>

          {/* Skeleton */}
          {loading ? (
            [1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <SkeletonBlock height={11} width="30%" />
                <SkeletonBlock height={14} width="70%" />
              </View>
            ))
          ) : forum.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons
                name="chatbubbles-outline"
                size={40}
                color={Colors.border}
              />
              <Text style={styles.emptyText}>Belum ada forum di kelas ini</Text>
            </View>
          ) : (
            forum.map((f, i) => (
              <TouchableOpacity
                key={i}
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
  meetingLabel: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: "600",
    marginBottom: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: "600", color: Colors.text },

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
