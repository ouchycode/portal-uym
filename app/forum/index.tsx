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
  <View
    style={[g.card, { flexDirection: "row", alignItems: "center", gap: 12 }]}
  >
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
        <View style={g.header}>
          <View style={g.headerTop}>
            <TouchableOpacity
              style={g.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color="#fff" />
              <Text style={g.backLabel}>Kembali</Text>
            </TouchableOpacity>
          </View>
          <Text style={g.headerTitle}>Forum Diskusi</Text>
          <Text style={g.headerSub}>
            {loading
              ? "Memuat kelas..."
              : error
                ? "Gagal memuat data"
                : `${kelas.length} kelas tersedia`}
          </Text>
        </View>

        {/* BODY */}
        <View style={g.body}>
          <Text style={g.sectionLabel}>
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
            <View style={g.empty}>
              <Ionicons name="wifi-outline" size={40} color={Colors.border} />
              <Text style={g.emptyTitle}>Gagal memuat data</Text>
              <Text style={g.emptyHint}>Periksa koneksi internet kamu</Text>
              <TouchableOpacity style={g.retryBtn} onPress={getKelas}>
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={g.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : kelas.length === 0 ? (
            /* ── EMPTY STATE ── */
            <View style={g.empty}>
              <Ionicons
                name="chatbubbles-outline"
                size={40}
                color={Colors.border}
              />
              <Text style={g.emptyTitle}>Tidak ada kelas ditemukan</Text>
            </View>
          ) : (
            /* ── DATA ── */
            kelas.map((k) => (
              <TouchableOpacity
                key={k.id}
                style={[
                  g.card,
                  { flexDirection: "row", alignItems: "center", gap: 12 },
                ]}
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
                <View style={{ flex: 1 }}>
                  <Text style={g.listRowTitle} numberOfLines={2}>
                    {k.mata_kuliah?.nama || "-"}
                  </Text>
                  <Text style={g.listRowSub} numberOfLines={1}>
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
  skeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.skeletonBase,
  },
});
