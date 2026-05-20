import { SkeletonBlock } from "@/components/SkeletonBlock";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useRefresh } from "@/hooks/useRefresh";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PERIODE_OPTIONS = [
  { value: 20252, label: "2025/2026 Genap" },
  { value: 20251, label: "2025/2026 Ganjil" },
  { value: 20242, label: "2024/2025 Genap" },
  { value: 20241, label: "2024/2025 Ganjil" },
  { value: 20232, label: "2023/2024 Genap" },
  { value: 20231, label: "2023/2024 Ganjil" },
];

const ForumSkeleton = () => (
  <View style={g.listRow}>
    <View style={styles.skeletonIcon} />
    <View style={styles.skeletonBody}>
      <SkeletonBlock height={14} width="60%" />
      <SkeletonBlock height={11} width="40%" />
    </View>
    <SkeletonBlock height={16} width={16} />
  </View>
);

export default function Forum() {
  const [kelas, setKelas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [periode, setPeriode] = useState(20252);

  const getKelas = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await API.get("/v2/lms/kelas_kuliah", {
        params: { periode },
      });
      setKelas(res.data.data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getKelas();
  }, [periode]);

  const { refreshing, onRefresh } = useRefresh(getKelas);

  return (
    <SafeAreaView style={g.safeArea}>
      <ScrollView
        style={styles.scrollBg}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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

        {/* FILTER PERIODE */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodeRow}
          style={styles.periodeScroll}
        >
          {PERIODE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                g.filterChip,
                periode === opt.value && g.filterChipActive,
              ]}
              activeOpacity={0.75}
              onPress={() => setPeriode(opt.value)}
            >
              <Ionicons
                name="calendar-outline"
                size={13}
                color={periode === opt.value ? "#fff" : Colors.muted}
              />
              <Text
                style={[
                  g.filterChipText,
                  periode === opt.value && g.filterChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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

          {/* SKELETON */}
          {loading ? (
            [1, 2, 3, 4].map((i) => <ForumSkeleton key={i} />)
          ) : error ? (
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
            <View style={g.empty}>
              <Ionicons
                name="chatbubbles-outline"
                size={40}
                color={Colors.border}
              />
              <Text style={g.emptyTitle}>Tidak ada kelas ditemukan</Text>
            </View>
          ) : (
            kelas.map((k) => (
              <TouchableOpacity
                key={k.id}
                style={g.listRow}
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
                <View style={g.flex1}>
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
  skeletonBody: { flex: 1, gap: 6 },
  scrollBg: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingBottom: 40 },
  periodeRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingRight: 32,
  },
  periodeScroll: { marginTop: 14 },
});
