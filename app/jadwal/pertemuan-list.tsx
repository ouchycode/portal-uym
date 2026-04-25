import API from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  bg: "#F4F6F9",
  card: "#FFFFFF",
  primary: "#1A4C8B",
  primaryLight: "#EEF3FA",
  text: "#1A1A2E",
  muted: "#6B7280",
  border: "#D1D5DB",
  successBg: "#F0FDF4",
  successText: "#15803D",
  successBorder: "#86EFAC",
};

function fmtDate(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={s.legendItem}>
      <View style={[s.legendDot, { backgroundColor: color }]} />
      <Text style={s.legendText}>{label}</Text>
    </View>
  );
}

export default function PertemuanList() {
  const params = useLocalSearchParams<{
    id_kelas: string;
    nama_mk: string;
    nama_kelas: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPertemuan();
  }, []);

  const fetchPertemuan = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get(
        `/v2/lms/kelas_kuliah/${params.id_kelas}/pertemuan`,
        { params: { ignore_default_pagination: true } },
      );
      setList(res.data?.data || []);
    } catch (e: any) {
      setError(`Gagal memuat pertemuan (${e?.response?.status || e?.message})`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    if (status === "selesai") return C.successText;
    if (status === "berlangsung") return C.primary;
    return C.border;
  };

  const getNumBg = (status?: string) => {
    if (status === "selesai")
      return { backgroundColor: C.successBg, borderColor: C.successBorder };
    if (status === "berlangsung")
      return { backgroundColor: C.primaryLight, borderColor: C.primary + "60" };
    return { backgroundColor: C.bg, borderColor: C.border };
  };

  const getNumTextColor = (status?: string) => {
    if (status === "selesai") return C.successText;
    if (status === "berlangsung") return C.primary;
    return C.muted;
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={C.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle} numberOfLines={1}>
            {params.nama_mk || "Pertemuan"}
          </Text>
          <Text style={s.headerSub}>
            {params.nama_kelas
              ? `${params.nama_kelas} · Daftar Pertemuan`
              : "Daftar Pertemuan"}
          </Text>
        </View>
        {!loading && list.length > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countText}>{list.length}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator color={C.primary} size="large" />
          <Text style={s.loadingText}>Memuat pertemuan...</Text>
        </View>
      ) : error ? (
        <View style={s.centered}>
          <Ionicons name="warning-outline" size={32} color={C.muted} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={fetchPertemuan}>
            <Text style={s.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : list.length === 0 ? (
        <View style={s.centered}>
          <Ionicons name="calendar-outline" size={36} color={C.muted} />
          <Text style={s.emptyText}>Belum ada pertemuan</Text>
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        >
          {/* Legend */}
          <View style={s.legend}>
            <LegendDot color={C.successText} label="Selesai" />
            <LegendDot color={C.primary} label="Berlangsung" />
            <LegendDot color={C.border} label="Belum" />
          </View>

          {list.map((p, i) => {
            const idP = p.id || p.id_pertemuan;
            const status = p.status || "";
            const hasTugas = p.count_activity?.tugas > 0;
            const hasMateri = p.count_activity?.materi > 0;

            return (
              <TouchableOpacity
                key={idP ?? i}
                style={s.item}
                activeOpacity={0.75}
                onPress={() =>
                  router.push({
                    pathname: "/jadwal/[id]",
                    params: {
                      id: idP,
                      id_kelas: params.id_kelas,
                      nama_mk: params.nama_mk,
                      nama_kelas: params.nama_kelas,
                    },
                  })
                }
              >
                {/* Nomor */}
                <View style={[s.numCircle, getNumBg(status)]}>
                  <Text style={[s.numText, { color: getNumTextColor(status) }]}>
                    {p.nomor || i + 1}
                  </Text>
                </View>

                {/* Body */}
                <View style={s.itemBody}>
                  <Text style={s.itemTitle}>
                    {p.judul || `Pertemuan ${p.nomor || i + 1}`}
                  </Text>
                  <View style={s.itemMeta}>
                    <Ionicons
                      name="calendar-outline"
                      size={11}
                      color={C.muted}
                    />
                    <Text style={s.itemMetaText}>{fmtDate(p.waktu_mulai)}</Text>
                    {p.nama_ruangan ? (
                      <>
                        <Text style={s.dot}>·</Text>
                        <Ionicons
                          name="location-outline"
                          size={11}
                          color={C.muted}
                        />
                        <Text style={s.itemMetaText}>{p.nama_ruangan}</Text>
                      </>
                    ) : null}
                  </View>
                  {(hasTugas || hasMateri) && (
                    <View style={s.activityRow}>
                      {hasMateri && (
                        <View style={s.activityBadge}>
                          <Ionicons
                            name="document-text-outline"
                            size={10}
                            color={C.primary}
                          />
                          <Text style={s.activityText}>
                            {p.count_activity.materi} Materi
                          </Text>
                        </View>
                      )}
                      {hasTugas && (
                        <View style={[s.activityBadge, s.activityBadgeTugas]}>
                          <Ionicons
                            name="clipboard-outline"
                            size={10}
                            color="#F97316"
                          />
                          <Text style={[s.activityText, { color: "#F97316" }]}>
                            {p.count_activity.tugas} Tugas
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Status dot + chevron */}
                <View style={s.rightCol}>
                  <View
                    style={[
                      s.statusDot,
                      { backgroundColor: getStatusColor(status) },
                    ]}
                  />
                  <Ionicons name="chevron-forward" size={16} color={C.muted} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: C.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 15, fontWeight: "700", color: C.text },
  headerSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  countBadge: {
    backgroundColor: C.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.primary + "30",
  },
  countText: { fontSize: 12, fontWeight: "700", color: C.primary },

  scroll: { flex: 1 },
  list: { padding: 20, paddingBottom: 40, gap: 8 },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: { fontSize: 13, color: C.muted },
  errorText: { fontSize: 13, color: C.muted, textAlign: "center" },
  emptyText: { fontSize: 14, fontWeight: "600", color: C.muted },
  retryBtn: {
    backgroundColor: C.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.primary + "40",
  },
  retryText: { fontSize: 13, fontWeight: "600", color: C.primary },

  legend: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 11, color: C.muted },

  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
  },
  numCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  numText: { fontSize: 14, fontWeight: "700" },
  itemBody: { flex: 1, gap: 3 },
  itemTitle: { fontSize: 13, fontWeight: "600", color: C.text },
  itemMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  itemMetaText: { fontSize: 11, color: C.muted },
  dot: { fontSize: 11, color: C.muted },
  activityRow: { flexDirection: "row", gap: 6, marginTop: 2 },
  activityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: C.primaryLight,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activityBadgeTugas: { backgroundColor: "#FFF7ED" },
  activityText: { fontSize: 10, fontWeight: "600", color: C.primary },
  rightCol: { alignItems: "center", gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
});
