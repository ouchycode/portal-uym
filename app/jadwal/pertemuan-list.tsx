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

// ── Skeleton for one pertemuan row ──────────────────────────────────────────
function ItemSkeleton() {
  return (
    <View style={s.skeletonItem}>
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

// ── Skeleton for summary strip ───────────────────────────────────────────────
function SummarySkeleton() {
  return (
    <View style={s.summaryOuter}>
      <View style={s.summaryStrip}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[g.summaryCard, { flex: 1, gap: 6 }]}>
            <SkeletonBlock height={22} width="50%" />
            <SkeletonBlock height={11} width="70%" />
          </View>
        ))}
      </View>
      <View style={[s.progressCard, { gap: 8 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <SkeletonBlock height={12} width={120} />
          <SkeletonBlock height={12} width={36} />
        </View>
        <SkeletonBlock height={6} width="100%" />
        <SkeletonBlock height={11} width={160} />
      </View>
    </View>
  );
}

// ── Activity badge ───────────────────────────────────────────────────────────
type ActivityBadgeProps = {
  icon: any;
  label: string;
  color: string;
  bg: string;
};
function ActivityBadge({ icon, label, color, bg }: ActivityBadgeProps) {
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
        { params: { ignore_default_pagination: true } },
      );
      setList(res.data?.data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived stats ───────────────────────────────────────────────────────
  const selesai = list.filter((p) => p.status === "selesai").length;
  const berlangsung = list.filter((p) => p.status === "berlangsung").length;
  const tersisa = list.length - selesai - berlangsung;
  const progressPct =
    list.length > 0 ? Math.round((selesai / list.length) * 100) : 0;

  // ── Status helpers ──────────────────────────────────────────────────────
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
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.decor1} />
        <View style={s.decor2} />
        <View style={s.decor3} />
        <View style={s.decor4} />

        <View style={s.headerTop}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color="#fff" />
            <Text style={s.backLabel}>Kembali</Text>
          </TouchableOpacity>
          {!loading && !error && list.length > 0 && (
            <View style={s.countBadge}>
              <Text style={s.countText}>{list.length} pertemuan</Text>
            </View>
          )}
        </View>

        <Text style={s.headerTitle} numberOfLines={2}>
          {params.nama_mk || "Pertemuan"}
        </Text>
        <Text style={s.headerSub}>
          {params.nama_kelas
            ? `${params.nama_kelas} · Daftar Pertemuan`
            : "Daftar Pertemuan"}
        </Text>
      </View>

      {/* ── SUMMARY STRIP ──────────────────────────────────────────────── */}
      {loading ? (
        <SummarySkeleton />
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

          {/* Progress bar */}
          <View style={s.progressCard}>
            <View style={s.progressHeader}>
              <Text style={s.progressLabel}>Progress Pertemuan</Text>
              <Text style={s.progressPct}>{progressPct}%</Text>
            </View>
            <View style={s.progressBg}>
              <View
                style={[
                  s.progressFill,
                  { width: `${progressPct}%` },
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

      {/* ── CONTENT ────────────────────────────────────────────────────── */}
      {loading ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        >
          {/* legend skeleton */}
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
        <View style={s.empty}>
          <Ionicons name="wifi-outline" size={40} color={Colors.border} />
          <Text style={s.emptyText}>Gagal memuat data</Text>
          <Text style={{ fontSize: 12, color: Colors.hint }}>
            Periksa koneksi internet kamu
          </Text>
          <TouchableOpacity
            style={s.retryBtn}
            onPress={fetchPertemuan}
            activeOpacity={0.75}
          >
            <Ionicons name="refresh-outline" size={15} color={Colors.primary} />
            <Text style={s.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : list.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="document-outline" size={40} color={Colors.border} />
          <Text style={s.emptyText}>Belum Ada Pertemuan</Text>
          <Text style={{ fontSize: 12, color: Colors.hint }}>
            Pertemuan untuk kelas ini belum tersedia
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── LEGEND ── */}
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

          {/* ── LIST ── */}
          {list.map((p, i) => {
            const idP = p.id || p.id_pertemuan;
            const status = p.status || "";
            const numStyle = getNumStyle(status);
            const isLive = status === "berlangsung";
            const isDone = status === "selesai";

            const hasTugas = p.count_activity?.tugas > 0;
            const hasMateri = p.count_activity?.materi > 0;
            const hasKuis = p.count_activity?.kuis > 0;
            const hasForum = p.count_activity?.forum > 0;

            return (
              <TouchableOpacity
                key={idP ?? i}
                style={[s.item, isLive && s.itemActive, isDone && s.itemDone]}
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
                {/* Number circle */}
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

                {/* Body */}
                <View style={s.itemBody}>
                  <View style={s.titleRow}>
                    <Text style={s.itemTitle} numberOfLines={2}>
                      {p.judul || `Pertemuan ${p.nomor || i + 1}`}
                    </Text>
                    {isLive && (
                      <View style={s.liveBadge}>
                        <View style={s.liveDot} />
                        <Text style={s.liveText}>Live</Text>
                      </View>
                    )}
                  </View>

                  {/* Date */}
                  <View style={g.infoRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={11}
                      color={Colors.hint}
                    />
                    <Text style={s.itemMetaText} numberOfLines={1}>
                      {fmtDate(p.waktu_mulai)}
                    </Text>
                  </View>

                  {/* Activity badges */}
                  {(hasMateri || hasTugas || hasKuis || hasForum) && (
                    <View style={s.activityRow}>
                      {hasMateri && (
                        <ActivityBadge
                          icon="document-text-outline"
                          label={`${p.count_activity.materi} Materi`}
                          color={Colors.primary}
                          bg={Colors.primaryLight}
                        />
                      )}
                      {hasTugas && (
                        <ActivityBadge
                          icon="clipboard-outline"
                          label={`${p.count_activity.tugas} Tugas`}
                          color="#F97316"
                          bg="#FFF7ED"
                        />
                      )}
                      {hasKuis && (
                        <ActivityBadge
                          icon="help-circle-outline"
                          label={`${p.count_activity.kuis} Kuis`}
                          color="#8B5CF6"
                          bg="#F5F3FF"
                        />
                      )}
                      {hasForum && (
                        <ActivityBadge
                          icon="chatbubbles-outline"
                          label={`${p.count_activity.forum} Forum`}
                          color="#0EA5E9"
                          bg="#F0F9FF"
                        />
                      )}
                    </View>
                  )}
                </View>

                {/* Right col */}
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
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 52,
    overflow: "hidden",
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
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backLabel: { fontSize: 12, fontWeight: "600", color: "#fff" },
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 },

  // ── Summary ──────────────────────────────────────────────────────────────
  summaryOuter: { paddingHorizontal: 16, marginTop: -22, gap: 8 },
  summaryStrip: { flexDirection: "row", gap: 8 },

  progressCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
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
  progressBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: 99,
  },
  progressSub: { fontSize: 11, color: Colors.hint },

  // ── Empty / Error ────────────────────────────────────────────────────────
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

  // ── List ─────────────────────────────────────────────────────────────────
  listContent: { padding: 16, paddingTop: 16, paddingBottom: 40, gap: 8 },
  legend: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.muted },

  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
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
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  numText: { fontSize: 14, fontWeight: "700" },

  itemBody: { flex: 1, gap: 3 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  itemTitle: { flex: 1, fontSize: 13, fontWeight: "600", color: Colors.text },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
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

  // ── Skeleton ─────────────────────────────────────────────────────────────
  skeletonItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
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
