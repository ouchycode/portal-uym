import { SkeletonBlock } from "@/components/SkeletonBlock";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function fmtDate(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function ItemSkeleton() {
  return (
    <View
      style={[
        g.card,
        { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
      ]}
    >
      <View style={s.skeletonCircle} />
      <View style={{ flex: 1, gap: 7 }}>
        <SkeletonBlock height={13} width="65%" />
        <SkeletonBlock height={11} width="45%" />
        <View style={{ flexDirection: "row", gap: 6 }}>
          <SkeletonBlock height={20} width={70} />
          <SkeletonBlock height={20} width={60} />
        </View>
      </View>
      <View style={{ alignItems: "center", gap: 6 }}>
        <View style={s.skeletonDot} />
        <SkeletonBlock height={16} width={16} />
      </View>
    </View>
  );
}

function ActivityBadge({
  icon,
  label,
  color,
  bg,
}: {
  icon: any;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[s.activityBadge, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={10} color={color} />
      <Text style={[s.activityText, { color }]}>{label}</Text>
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
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchPertemuan();
  }, []);

  const fetchPertemuan = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await API.get(
        `/v2/lms/kelas_kuliah/${params.id_kelas}/pertemuan`,
        {
          params: { ignore_default_pagination: true },
        },
      );
      setList(res.data?.data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const selesai = list.filter((p) => p.status === "selesai").length;
  const berlangsung = list.filter((p) => p.status === "berlangsung").length;
  const tersisa = list.length - selesai - berlangsung;
  const progressPct =
    list.length > 0 ? Math.round((selesai / list.length) * 100) : 0;

  const getStatusColor = (status?: string) => {
    if (status === "selesai") return Colors.successText;
    if (status === "berlangsung") return Colors.primary;
    return Colors.border;
  };

  const getNumStyle = (status?: string) => {
    if (status === "selesai")
      return {
        bg: Colors.successBg,
        border: Colors.successBorder,
        text: Colors.successText,
      };
    if (status === "berlangsung")
      return {
        bg: Colors.primaryLight,
        border: Colors.primary + "60",
        text: Colors.primary,
      };
    return { bg: Colors.bg, border: Colors.border, text: Colors.muted };
  };

  return (
    <SafeAreaView style={g.safeArea}>
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
          {!loading && !error && list.length > 0 && (
            <View style={s.countBadge}>
              <Text style={s.countText}>{list.length} pertemuan</Text>
            </View>
          )}
        </View>
        <Text style={g.headerTitle} numberOfLines={2}>
          {params.nama_mk || "Pertemuan"}
        </Text>
        <Text style={g.headerSub}>
          {params.nama_kelas
            ? `${params.nama_kelas} · Daftar Pertemuan`
            : "Daftar Pertemuan"}
        </Text>
      </View>

      {/* SUMMARY */}
      {loading ? (
        <View style={s.summaryOuter}>
          <View style={s.summaryStrip}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[g.summaryCard, { flex: 1, gap: 6 }]}>
                <SkeletonBlock height={22} width="50%" />
                <SkeletonBlock height={11} width="70%" />
              </View>
            ))}
          </View>
          <View style={[g.card, { padding: 12, gap: 6 }]}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <SkeletonBlock height={12} width={120} />
              <SkeletonBlock height={12} width={36} />
            </View>
            <SkeletonBlock height={6} width="100%" />
            <SkeletonBlock height={11} width={160} />
          </View>
        </View>
      ) : !error && list.length > 0 ? (
        <View style={s.summaryOuter}>
          <View style={s.summaryStrip}>
            <View style={[g.summaryCard, { flex: 1 }]}>
              <Text style={[g.summaryValue, { color: Colors.successText }]}>
                {selesai}
              </Text>
              <Text style={g.summaryLabel}>Selesai</Text>
            </View>
            <View style={[g.summaryCard, { flex: 1 }]}>
              <Text style={[g.summaryValue, { color: Colors.primary }]}>
                {berlangsung}
              </Text>
              <Text style={g.summaryLabel}>Berlangsung</Text>
            </View>
            <View style={[g.summaryCard, { flex: 1 }]}>
              <Text style={[g.summaryValue, { color: Colors.muted }]}>
                {tersisa}
              </Text>
              <Text style={g.summaryLabel}>Tersisa</Text>
            </View>
          </View>
          <View style={s.progressCard}>
            <View style={s.progressHeader}>
              <Text style={s.progressLabel}>Progress Pertemuan</Text>
              <Text style={s.progressPct}>{progressPct}%</Text>
            </View>
            <View style={g.progressWrap}>
              <View
                style={[
                  g.progressFill,
                  { width: `${progressPct}%` as any },
                  progressPct === 100 && {
                    backgroundColor: Colors.successText,
                  },
                ]}
              />
            </View>
            <Text style={s.progressSub}>
              {selesai} dari {list.length} pertemuan selesai
            </Text>
          </View>
        </View>
      ) : null}

      {/* CONTENT */}
      {loading ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 16,
              marginBottom: 12,
              paddingHorizontal: 4,
            }}
          >
            {[80, 90, 60].map((w, i) => (
              <SkeletonBlock key={i} height={11} width={w} />
            ))}
          </View>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ItemSkeleton key={i} />
          ))}
        </ScrollView>
      ) : error ? (
        <View style={g.empty}>
          <Ionicons name="wifi-outline" size={40} color={Colors.border} />
          <Text style={g.emptyTitle}>Gagal memuat data</Text>
          <Text style={g.emptyHint}>Periksa koneksi internet kamu</Text>
          <TouchableOpacity
            style={g.retryBtn}
            onPress={fetchPertemuan}
            activeOpacity={0.75}
          >
            <Ionicons name="refresh-outline" size={15} color={Colors.primary} />
            <Text style={g.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : list.length === 0 ? (
        <View style={g.empty}>
          <Ionicons name="document-outline" size={40} color={Colors.border} />
          <Text style={g.emptyTitle}>Belum Ada Pertemuan</Text>
          <Text style={g.emptyHint}>
            Pertemuan untuk kelas ini belum tersedia
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        >
          {/* LEGEND */}
          <View style={s.legend}>
            {[
              { color: Colors.successText, label: "Selesai" },
              { color: Colors.primary, label: "Berlangsung" },
              { color: Colors.border, label: "Belum" },
            ].map(({ color, label }) => (
              <View key={label} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: color }]} />
                <Text style={s.legendText}>{label}</Text>
              </View>
            ))}
          </View>

          {/* LIST */}
          {list.map((p, i) => {
            const idP = p.id || p.id_pertemuan;
            const status = p.status || "";
            const numStyle = getNumStyle(status);
            const isLive = status === "berlangsung";
            const isDone = status === "selesai";
            const act = p.count_activity || {};

            return (
              <TouchableOpacity
                key={idP ?? i}
                style={[
                  g.card,
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                  },
                  isLive && s.itemActive,
                  isDone && s.itemDone,
                ]}
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
                <View
                  style={[
                    s.numCircle,
                    {
                      backgroundColor: numStyle.bg,
                      borderColor: numStyle.border,
                    },
                  ]}
                >
                  {isDone ? (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={numStyle.text}
                    />
                  ) : (
                    <Text style={[s.numText, { color: numStyle.text }]}>
                      {p.nomor || i + 1}
                    </Text>
                  )}
                </View>

                <View style={s.itemBody}>
                  <View style={s.titleRow}>
                    <Text style={s.itemTitle} numberOfLines={2}>
                      {p.judul || `Pertemuan ${p.nomor || i + 1}`}
                    </Text>
                    {isLive && (
                      <View style={[g.badgeDanger, { borderRadius: 6 }]}>
                        <View style={s.liveDot} />
                        <Text style={s.liveText}>Live</Text>
                      </View>
                    )}
                  </View>

                  <View style={g.infoRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={11}
                      color={Colors.hint}
                    />
                    <Text style={s.itemMetaText}>{fmtDate(p.waktu_mulai)}</Text>
                  </View>

                  {(act.materi > 0 ||
                    act.tugas > 0 ||
                    act.kuis > 0 ||
                    act.forum > 0) && (
                    <View style={s.activityRow}>
                      {act.materi > 0 && (
                        <ActivityBadge
                          icon="document-text-outline"
                          label={`${act.materi} Materi`}
                          color={Colors.primary}
                          bg={Colors.primaryLight}
                        />
                      )}
                      {act.tugas > 0 && (
                        <ActivityBadge
                          icon="clipboard-outline"
                          label={`${act.tugas} Tugas`}
                          color="#F97316"
                          bg="#FFF7ED"
                        />
                      )}
                      {act.kuis > 0 && (
                        <ActivityBadge
                          icon="help-circle-outline"
                          label={`${act.kuis} Kuis`}
                          color="#8B5CF6"
                          bg="#F5F3FF"
                        />
                      )}
                      {act.forum > 0 && (
                        <ActivityBadge
                          icon="chatbubbles-outline"
                          label={`${act.forum} Forum`}
                          color="#0EA5E9"
                          bg="#F0F9FF"
                        />
                      )}
                    </View>
                  )}
                </View>

                <View style={s.rightCol}>
                  <View
                    style={[
                      s.statusDot,
                      { backgroundColor: getStatusColor(status) },
                    ]}
                  />
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={Colors.hint}
                  />
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
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },

  summaryOuter: { paddingHorizontal: 16, marginTop: -22, gap: 8 },
  summaryStrip: { flexDirection: "row", gap: 8 },
  progressCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 0.1,
    borderColor: Colors.border,
    padding: 12,
    gap: 6,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: { fontSize: 12, color: Colors.muted, fontWeight: "500" },
  progressPct: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  progressSub: { fontSize: 11, color: Colors.hint },

  listContent: { padding: 16, paddingBottom: 40, gap: 8 },
  legend: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.muted },

  itemActive: {
    borderColor: Colors.primary + "60",
    backgroundColor: Colors.primaryLight,
  },
  itemDone: {
    borderColor: Colors.successBorder,
    backgroundColor: Colors.successBg,
  },

  numCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 0.1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  numText: { fontSize: 14, fontWeight: "700" },

  itemBody: { flex: 1, gap: 3 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  itemTitle: { flex: 1, fontSize: 13, fontWeight: "600", color: Colors.text },

  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.dangerText,
  },
  liveText: { fontSize: 10, fontWeight: "700", color: Colors.dangerText },

  itemMetaText: { fontSize: 11, color: Colors.muted },
  activityRow: { flexDirection: "row", gap: 5, marginTop: 2, flexWrap: "wrap" },
  activityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activityText: { fontSize: 10, fontWeight: "600" },

  rightCol: { alignItems: "center", gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  skeletonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.skeletonBase,
    flexShrink: 0,
  },
  skeletonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.skeletonBase,
  },
});
