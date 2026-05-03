import { SkeletonBlock } from "@/components/SkeletonBlock";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const JENIS_ICON: Record<string, any> = {
  materi: "document-text-outline",
  teks: "reader-outline",
  forum: "chatbubbles-outline",
  tugas: "clipboard-outline",
  vidcon: "videocam-outline",
};

const JENIS_LABEL: Record<string, string> = {
  materi: "Materi",
  teks: "Teks",
  forum: "Forum",
  tugas: "Tugas",
  vidcon: "Video",
};

const TABS = ["materi", "teks", "forum", "tugas", "vidcon"];

const STATUS_MAP: Record<
  string,
  { bg: string; border: string; text: string; label: string }
> = {
  selesai: {
    bg: Colors.successBg,
    border: Colors.successBorder,
    text: Colors.successText,
    label: "Selesai",
  },
  berlangsung: {
    bg: Colors.primaryLight,
    border: Colors.primary + "60",
    text: Colors.primary,
    label: "Berlangsung",
  },
  belum: {
    bg: Colors.warningBg,
    border: Colors.warningBorder,
    text: Colors.warningText,
    label: "Belum Mulai",
  },
};

const EXT_COLOR: Record<string, string> = {
  ".pdf": "#EF4444",
  ".pptx": "#F97316",
  ".ppt": "#F97316",
  ".docx": "#3B82F6",
  ".doc": "#3B82F6",
  ".xlsx": "#10B981",
  ".mp4": "#8B5CF6",
  ".zip": "#6B7280",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmtTime(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(iso?: string) {
  if (!iso || iso.startsWith("0001")) return null;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stripHtml(s?: string) {
  return s?.replace(/<[^>]+>/g, " ").trim() || "";
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton components
// ─────────────────────────────────────────────────────────────────────────────
function SummarySkeleton() {
  return (
    <View style={s.summaryStrip}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[g.summaryCard, { flex: 1, gap: 6 }]}>
          <SkeletonBlock height={22} width="50%" />
          <SkeletonBlock height={11} width="70%" />
        </View>
      ))}
    </View>
  );
}

function DetailSkeleton() {
  return (
    <View style={{ paddingHorizontal: 14, paddingTop: 20, gap: 14 }}>
      {/* info card skeleton */}
      <View
        style={[g.card, { margin: 14, marginTop: 20, padding: 14, gap: 10 }]}
      >
        {[70, 55, 45, 60].map((w, i) => (
          <View
            key={i}
            style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <SkeletonBlock height={14} width={14} />
            <SkeletonBlock height={12} width={60} />
            <SkeletonBlock height={12} width={`${w}%` as any} />
          </View>
        ))}
        <View style={{ marginTop: 4 }}>
          <SkeletonBlock height={40} width="100%" />
        </View>
      </View>
      {/* tabs skeleton */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        {[60, 50, 55, 50, 60].map((w, i) => (
          <SkeletonBlock key={i} height={32} width={w} />
        ))}
      </View>
      {/* content skeletons */}
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            g.card,
            {
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: 12,
            },
          ]}
        >
          <View style={s.skeletonExt} />
          <View style={{ flex: 1, gap: 7 }}>
            <SkeletonBlock height={13} width="65%" />
            <SkeletonBlock height={11} width="40%" />
            <SkeletonBlock height={10} width="30%" />
          </View>
        </View>
      ))}
    </View>
  );
}

function TabContentSkeleton({ tab }: { tab: string }) {
  if (tab === "materi") {
    return (
      <View style={{ gap: 8 }}>
        {[1, 2].map((i) => (
          <View
            key={i}
            style={[
              g.card,
              {
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                padding: 12,
              },
            ]}
          >
            <View style={s.skeletonExt} />
            <View style={{ flex: 1, gap: 7 }}>
              <SkeletonBlock height={13} width="65%" />
              <SkeletonBlock height={11} width="40%" />
              <SkeletonBlock height={10} width="30%" />
            </View>
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      {[1, 2].map((i) => (
        <View
          key={i}
          style={[
            g.card,
            {
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: 12,
            },
          ]}
        >
          <SkeletonBlock height={13} width="70%" />
          <SkeletonBlock height={11} width="50%" />
          <SkeletonBlock height={11} width="40%" />
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Content item components
// ─────────────────────────────────────────────────────────────────────────────
function MateriItem({ item }: { item: any }) {
  const ext = item.file?.extension || "";
  const url = item.file?.url;
  const color = EXT_COLOR[ext] || Colors.primary;

  const handleOpen = async () => {
    if (!url) return;
    const webViewable = [".pdf", ".mp4"];
    if (!webViewable.includes(ext)) {
      await Linking.openURL(
        `https://docs.google.com/viewer?url=${encodeURIComponent(url)}`,
      );
      return;
    }
    const supported = await Linking.canOpenURL(url);
    await Linking.openURL(
      supported
        ? url
        : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}`,
    );
  };

  return (
    <TouchableOpacity
      style={[
        g.card,
        { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
      ]}
      activeOpacity={0.75}
      onPress={handleOpen}
      disabled={!url}
    >
      <View
        style={[
          s.extBadge,
          { backgroundColor: color + "20", borderColor: color + "40" },
        ]}
      >
        <Text style={[s.extText, { color }]}>
          {ext.replace(".", "").toUpperCase() || "FILE"}
        </Text>
      </View>
      <View style={s.materiInfo}>
        <Text style={s.materiTitle} numberOfLines={2}>
          {item.judul}
        </Text>
        {item.deskripsi ? (
          <Text style={s.materiDesc} numberOfLines={2}>
            {stripHtml(item.deskripsi)}
          </Text>
        ) : null}
        <Text style={s.materiMeta}>
          {item.jenis_materi} · {item.tipe_file}
        </Text>
      </View>
      <Ionicons
        name={url ? "download-outline" : "lock-closed-outline"}
        size={18}
        color={url ? Colors.primary : Colors.hint}
      />
    </TouchableOpacity>
  );
}

function TugasItem({ item }: { item: any }) {
  const deadline = fmtDate(item.deadline);
  const sudah = item.jumlah_pengumpulan > 0;
  const isLate = deadline && new Date(item.deadline) < new Date() && !sudah;

  return (
    <TouchableOpacity
      style={[s.tugasCard, isLate && { borderColor: Colors.dangerBorder }]}
      activeOpacity={0.75}
      onPress={() =>
        router.push({
          pathname: "/tugas/[id]",
          params: {
            id: String(item.id),
            pertemuan: item.id_pertemuan,
            judul: item.judul,
          },
        })
      }
    >
      <View
        style={[
          s.cardStripe,
          {
            backgroundColor: isLate
              ? Colors.dangerText
              : sudah
                ? Colors.successText
                : Colors.primary,
          },
        ]}
      />
      <View style={{ flex: 1, padding: 12, gap: 6 }}>
        <View
          style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}
        >
          <View style={s.tugasIconWrap}>
            <Ionicons name="clipboard-outline" size={16} color="#F97316" />
          </View>
          <Text style={s.tugasTitle} numberOfLines={2}>
            {item.judul || item.nama || "—"}
          </Text>
        </View>
        {item.deskripsi ? (
          <Text style={s.genericDesc} numberOfLines={2}>
            {stripHtml(item.deskripsi)}
          </Text>
        ) : null}
        {deadline ? (
          <View style={g.infoRow}>
            <Ionicons
              name="alarm-outline"
              size={12}
              color={isLate ? Colors.dangerText : Colors.hint}
            />
            <Text
              style={[s.deadlineText, isLate && { color: Colors.dangerText }]}
            >
              Deadline: {deadline}
            </Text>
            {isLate && (
              <View style={g.badgeDanger}>
                <Text style={g.badgeDangerText}>Terlambat</Text>
              </View>
            )}
          </View>
        ) : null}
        <View
          style={[
            sudah ? g.badgeSuccess : g.badgeWarning,
            { alignSelf: "flex-start" },
          ]}
        >
          <Ionicons
            name={sudah ? "checkmark-circle" : "time-outline"}
            size={11}
            color={sudah ? Colors.successText : Colors.warningText}
          />
          <Text style={sudah ? g.badgeSuccessText : g.badgeWarningText}>
            {sudah ? "Sudah dikumpulkan" : "Belum dikumpulkan"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ForumItem({ item }: { item: any }) {
  return (
    <View style={[g.card, { padding: 12, gap: 8 }]}>
      <View style={s.forumHeader}>
        <View style={s.forumIconWrap}>
          <Ionicons name="chatbubbles-outline" size={15} color="#0EA5E9" />
        </View>
        <Text style={s.forumTitle} numberOfLines={2}>
          {item.topik || item.judul || "—"}
        </Text>
      </View>
      {item.deskripsi ? (
        <Text style={s.genericDesc} numberOfLines={3}>
          {stripHtml(item.deskripsi)}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {item.jumlah_balasan != null && (
          <View style={s.forumMeta}>
            <Ionicons name="chatbubble-outline" size={11} color={Colors.hint} />
            <Text style={s.forumMetaText}>{item.jumlah_balasan} balasan</Text>
          </View>
        )}
        {item.url ? (
          <TouchableOpacity
            style={g.retryBtn}
            onPress={() => Linking.openURL(item.url)}
          >
            <Ionicons name="open-outline" size={13} color={Colors.primary} />
            <Text style={g.retryText}>Buka Forum</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function TeksItem({ item }: { item: any }) {
  return (
    <View style={[g.card, { padding: 12, gap: 6 }]}>
      <Text style={s.teksTitle}>{item.judul || "—"}</Text>
      {item.deskripsi ? (
        <Text style={s.teksBody} numberOfLines={6}>
          {stripHtml(item.deskripsi)}
        </Text>
      ) : null}
    </View>
  );
}

function VidconItem({ item }: { item: any }) {
  const start = fmtDate(item.waktu_mulai);
  return (
    <View style={s.vidconCard}>
      <View style={s.vidconHeader}>
        <View style={s.vidconIconWrap}>
          <Ionicons name="videocam-outline" size={16} color="#8B5CF6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.vidconTitle} numberOfLines={2}>
            {item.judul || item.nama || "—"}
          </Text>
          {start ? <Text style={s.vidconMeta}>{start}</Text> : null}
        </View>
      </View>
      {item.deskripsi ? (
        <Text style={s.genericDesc} numberOfLines={2}>
          {stripHtml(item.deskripsi)}
        </Text>
      ) : null}
      {item.url ? (
        <TouchableOpacity
          style={[g.retryBtn, { backgroundColor: "#F5F3FF" }]}
          onPress={() => Linking.openURL(item.url)}
        >
          <Ionicons name="videocam-outline" size={13} color="#8B5CF6" />
          <Text style={[g.retryText, { color: "#8B5CF6" }]}>Bergabung</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function GenericItem({ item }: { item: any }) {
  const deadline = fmtDate(item.deadline);
  return (
    <View style={[g.card, { padding: 12, gap: 6 }]}>
      <Text style={s.genericTitle}>
        {item.judul || item.nama || item.topik || "—"}
      </Text>
      {item.deskripsi ? (
        <Text style={s.genericDesc} numberOfLines={3}>
          {stripHtml(item.deskripsi)}
        </Text>
      ) : null}
      {deadline ? (
        <View style={g.infoRow}>
          <Ionicons name="alarm-outline" size={12} color={Colors.dangerText} />
          <Text style={[s.deadlineText, { color: Colors.dangerText }]}>
            Deadline: {deadline}
          </Text>
        </View>
      ) : null}
      {item.url ? (
        <TouchableOpacity
          style={g.retryBtn}
          onPress={() => Linking.openURL(item.url)}
        >
          <Ionicons name="open-outline" size={13} color={Colors.primary} />
          <Text style={g.retryText}>Buka Link</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function PertemuanDetail() {
  const params = useLocalSearchParams<{
    id: string;
    id_kelas: string;
    nama_mk: string;
    nama_kelas: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [kehadiran, setKehadiran] = useState<any>(null);
  const [contents, setContents] = useState<Record<string, any[]>>({});
  const [activeTab, setActiveTab] = useState("materi");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(false);
    try {
      const detailRes = await API.get(`/v2/lms/pertemuan/${params.id}`);
      setDetail(detailRes.data?.data);

      try {
        const hadirRes = await API.get(
          `/v2/lms/kehadiran_mahasiswa/kelas_kuliah/${params.id_kelas}/pertemuan/${params.id}/me`,
        );
        setKehadiran(hadirRes.data?.data);
      } catch (_) {}

      const results = await Promise.allSettled(
        TABS.map((t) =>
          API.get(`/v2/lms/pertemuan/${params.id}/${t}`, {
            params: { ignore_default_pagination: true },
          }),
        ),
      );

      const newContents: Record<string, any[]> = {};
      results.forEach((r, i) => {
        newContents[TABS[i]] =
          r.status === "fulfilled" ? r.value.data?.data || [] : [];
      });
      setContents(newContents);

      const first = TABS.find((t) => (newContents[t]?.length || 0) > 0);
      if (first) setActiveTab(first);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleTabPress = (tab: string) => {
    if (tab === activeTab) return;
    setTabLoading(true);
    setActiveTab(tab);
    setTimeout(() => setTabLoading(false), 300);
  };

  const totalActivity = TABS.reduce(
    (sum, t) => sum + (contents[t]?.length || 0),
    0,
  );

  const renderItem = (item: any, i: number) => {
    switch (activeTab) {
      case "materi":
        return <MateriItem key={i} item={item} />;
      case "tugas":
        return <TugasItem key={i} item={item} />;
      case "forum":
        return <ForumItem key={i} item={item} />;
      case "teks":
        return <TeksItem key={i} item={item} />;
      case "vidcon":
        return <VidconItem key={i} item={item} />;
      default:
        return <GenericItem key={i} item={item} />;
    }
  };

  const renderContent = () => {
    if (tabLoading) return <TabContentSkeleton tab={activeTab} />;
    const items = contents[activeTab] || [];
    if (items.length === 0) {
      return (
        <View style={g.emptyWrap}>
          <Ionicons
            name={JENIS_ICON[activeTab]}
            size={40}
            color={Colors.border}
          />
          <Text style={g.emptyTitle}>Tidak ada {JENIS_LABEL[activeTab]}</Text>
          <Text style={g.emptyHint}>
            Konten belum tersedia untuk pertemuan ini
          </Text>
        </View>
      );
    }
    return <View style={{ gap: 8 }}>{items.map(renderItem)}</View>;
  };

  const statusCfg = STATUS_MAP[detail?.status || ""] || STATUS_MAP.belum;
  const isLive = detail?.status === "berlangsung";

  return (
    <SafeAreaView style={g.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── HEADER ── */}
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

            {!loading && !error && detail && (
              <View
                style={[
                  s.headerBadge,
                  {
                    backgroundColor: statusCfg.bg,
                    borderColor: statusCfg.border,
                  },
                ]}
              >
                {isLive && <View style={s.liveDot} />}
                <Text style={[s.headerBadgeText, { color: statusCfg.text }]}>
                  {statusCfg.label}
                </Text>
              </View>
            )}
          </View>

          <Text style={g.headerTitle}>
            {detail ? `Pertemuan ${detail.nomor}` : "Detail Pertemuan"}
          </Text>
          <Text style={g.headerSub} numberOfLines={1}>
            {params.nama_mk}
            {params.nama_kelas ? ` · ${params.nama_kelas}` : ""}
          </Text>
        </View>

        {/* ── SUMMARY STRIP ── */}
        {loading ? (
          <SummarySkeleton />
        ) : !error && detail ? (
          <View style={s.summaryStrip}>
            <View style={g.summaryCard}>
              <Text style={g.summaryValue}>{detail.nomor}</Text>
              <Text style={g.summaryLabel}>Pertemuan ke</Text>
            </View>
            <View style={g.summaryCard}>
              <Text style={[g.summaryValue, { color: Colors.primary }]}>
                {totalActivity}
              </Text>
              <Text style={g.summaryLabel}>Aktivitas</Text>
            </View>
            {kehadiran ? (
              <View
                style={[
                  g.summaryCard,
                  {
                    borderColor: kehadiran.is_hadir
                      ? Colors.successBorder
                      : Colors.dangerBorder,
                    backgroundColor: kehadiran.is_hadir
                      ? Colors.successBg
                      : Colors.dangerBg,
                  },
                ]}
              >
                <Ionicons
                  name={
                    kehadiran.is_hadir ? "checkmark-circle" : "close-circle"
                  }
                  size={18}
                  color={
                    kehadiran.is_hadir ? Colors.successText : Colors.dangerText
                  }
                />
                <Text
                  style={[
                    g.summaryLabel,
                    {
                      color: kehadiran.is_hadir
                        ? Colors.successText
                        : Colors.dangerText,
                      fontWeight: "600",
                    },
                  ]}
                >
                  {kehadiran.presensi === "H"
                    ? "Hadir"
                    : kehadiran.presensi === "I"
                      ? "Izin"
                      : "Tidak Hadir"}
                </Text>
              </View>
            ) : (
              <View style={g.summaryCard}>
                <Ionicons
                  name={
                    detail.jenis === "online"
                      ? "wifi-outline"
                      : "school-outline"
                  }
                  size={18}
                  color={Colors.primary}
                />
                <Text style={g.summaryLabel}>
                  {detail.jenis === "online" ? "Online" : "Offline"}
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {/* ── LOADING / ERROR / CONTENT ── */}
        {loading ? (
          <DetailSkeleton />
        ) : error ? (
          <View style={g.empty}>
            <Ionicons name="wifi-outline" size={40} color={Colors.border} />
            <Text style={g.emptyHint}>Gagal memuat data</Text>
            <Text style={{ fontSize: 12, color: Colors.hint }}>
              Periksa koneksi internet kamu
            </Text>
            <TouchableOpacity
              style={g.retryBtn}
              onPress={fetchAll}
              activeOpacity={0.75}
            >
              <Ionicons
                name="refresh-outline"
                size={15}
                color={Colors.primary}
              />
              <Text style={g.retryText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : detail ? (
          <>
            {/* INFO CARD */}
            <View
              style={[
                g.card,
                { margin: 14, marginTop: 20, padding: 14, gap: 10 },
              ]}
            >
              <InfoRow
                icon="time-outline"
                label="Waktu"
                value={`${fmtTime(detail.waktu_mulai)} – ${fmtTime(detail.waktu_selesai)}`}
              />
              {detail.nama_ruangan ? (
                <InfoRow
                  icon="location-outline"
                  label="Ruangan"
                  value={detail.nama_ruangan}
                />
              ) : null}
              <View style={g.infoRow}>
                <Ionicons
                  name="ellipse-outline"
                  size={14}
                  color={Colors.hint}
                />
                <Text style={g.infoLabel}>Status</Text>
                <StatusBadge status={detail.status} />
              </View>
              {detail.jenis ? (
                <View style={g.infoRow}>
                  <Ionicons
                    name={
                      detail.jenis === "online"
                        ? "wifi-outline"
                        : "school-outline"
                    }
                    size={14}
                    color={Colors.hint}
                  />
                  <Text style={g.infoLabel}>Mode</Text>
                  <Text style={g.infoValue}>
                    {detail.jenis === "online" ? "Online" : "Offline"}
                  </Text>
                </View>
              ) : null}
              {detail.judul ? (
                <View style={s.judulBox}>
                  <Text style={s.judulLabel}>Topik</Text>
                  <Text style={s.judulText}>{detail.judul}</Text>
                </View>
              ) : null}
              {detail.deskripsi ? (
                <Text style={s.deskripsiText}>
                  {stripHtml(detail.deskripsi)}
                </Text>
              ) : null}
            </View>

            {/* TABS */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.tabRow}
              style={s.tabScroll}
            >
              {TABS.map((t) => {
                const count = contents[t]?.length || 0;
                const active = activeTab === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[g.filterChip, active && g.filterChipActive]}
                    onPress={() => handleTabPress(t)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={JENIS_ICON[t]}
                      size={14}
                      color={active ? "#fff" : Colors.muted}
                    />
                    <Text
                      style={[
                        g.filterChipText,
                        active && g.filterChipTextActive,
                      ]}
                    >
                      {JENIS_LABEL[t]}
                    </Text>
                    {count > 0 && (
                      <View
                        style={[
                          s.tabBadge,
                          { backgroundColor: active ? "#fff" : Colors.primary },
                        ]}
                      >
                        <Text
                          style={[
                            s.tabBadgeText,
                            { color: active ? Colors.primary : "#fff" },
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* CONTENT AREA */}
            <View style={s.contentArea}>{renderContent()}</View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small shared components
// ─────────────────────────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <View style={g.infoRow}>
      <Ionicons name={icon} size={14} color={Colors.hint} />
      <Text style={g.infoLabel}>{label}</Text>
      <Text style={g.infoValue}>{value}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const c = STATUS_MAP[status || ""] || STATUS_MAP.belum;
  return (
    <View
      style={[g.badgePrimary, { backgroundColor: c.bg, borderColor: c.border }]}
    >
      <Text style={[g.badgePrimaryText, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 0.5,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },

  summaryStrip: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: -22,
    gap: 8,
  },

  judulBox: {
    marginTop: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    padding: 10,
    gap: 3,
  },
  judulLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  judulText: { fontSize: 13, fontWeight: "600", color: Colors.primary },
  deskripsiText: { fontSize: 12, color: Colors.muted, lineHeight: 18 },

  tabScroll: { marginHorizontal: 14, marginBottom: 4 },
  tabRow: { flexDirection: "row", gap: 8, paddingRight: 14 },
  tabBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },

  contentArea: { margin: 14, marginTop: 10, paddingBottom: 40 },

  // Mate
  extBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  extText: { fontSize: 9, fontWeight: "800" },
  materiInfo: { flex: 1, gap: 3 },
  materiTitle: { fontSize: 13, fontWeight: "600", color: Colors.text },
  materiDesc: { fontSize: 11, color: Colors.muted, lineHeight: 16 },
  materiMeta: { fontSize: 10, color: Colors.hint, textTransform: "capitalize" },

  // Tugas
  tugasCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  cardStripe: { width: 4 },
  tugasIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tugasTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
    lineHeight: 18,
  },

  forumHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  forumIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F0F9FF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  forumTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 18,
  },
  forumMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  forumMetaText: { fontSize: 11, color: Colors.hint },

  teksTitle: { fontSize: 13, fontWeight: "600", color: Colors.text },
  teksBody: { fontSize: 12, color: Colors.muted, lineHeight: 19 },

  // Vidcon
  vidconCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: "#E9D5FF",
    padding: 12,
    gap: 8,
  },
  vidconHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  vidconIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  vidconTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 18,
  },
  vidconMeta: { fontSize: 11, color: Colors.hint, marginTop: 2 },

  // Generic
  genericCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: 12,
    gap: 6,
  },
  genericTitle: { fontSize: 13, fontWeight: "600", color: Colors.text },
  genericDesc: { fontSize: 12, color: Colors.muted, lineHeight: 17 },
  deadlineText: { fontSize: 11, color: Colors.muted, fontWeight: "500" },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: Colors.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  linkText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },

  skeletonExt: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.skeletonBase,
    flexShrink: 0,
  },
});
