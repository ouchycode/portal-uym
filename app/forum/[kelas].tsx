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

const ForumKelasSkeleton = () => (
  <View
    style={[g.card, { flexDirection: "row", alignItems: "center", gap: 12 }]}
  >
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
          <Text style={g.headerTitle}>{mkNama || "Forum Diskusi"}</Text>
          <Text style={g.headerSub}>
            {loading
              ? "Memuat forum..."
              : error
                ? "Gagal memuat data"
                : `${forum.length} topik ditemukan`}
          </Text>
        </View>

        {/* BODY */}
        <View style={g.body}>
          <Text style={g.sectionLabel}>
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
            <View style={g.empty}>
              <Ionicons name="wifi-outline" size={40} color={Colors.border} />
              <Text style={g.emptyTitle}>Gagal memuat data</Text>
              <Text style={g.emptyHint}>Periksa koneksi internet kamu</Text>
              <TouchableOpacity style={g.retryBtn} onPress={getForum}>
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={g.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : forum.length === 0 ? (
            /* ── EMPTY STATE ── */
            <View style={g.empty}>
              <Ionicons
                name="chatbubbles-outline"
                size={40}
                color={Colors.border}
              />
              <Text style={g.emptyTitle}>Belum ada forum di kelas ini</Text>
            </View>
          ) : (
            /* ── DATA ── */
            forum.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[
                  g.card,
                  { flexDirection: "row", alignItems: "center", gap: 12 },
                ]}
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
                <View style={{ flex: 1 }}>
                  <Text style={g.listRowSub}>
                    Pertemuan {f.nomor_pertemuan}
                  </Text>
                  <Text style={g.listRowTitle} numberOfLines={2}>
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
  skeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.skeletonBase,
  },
});
