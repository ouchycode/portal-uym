import API from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
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
  danger: "#EF4444",
  dangerLight: "#FEF2F2",
  warningBg: "#FFFBEB",
  warningText: "#92400E",
  warningBorder: "#FCD34D",
};

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

// ─── Materi Item ──────────────────────────────────────────────────────────────
function MateriItem({ item }: { item: any }) {
  const ext = item.file?.extension || "";
  const url = item.file?.url;

  const extColor: Record<string, string> = {
    ".pdf": "#EF4444",
    ".pptx": "#F97316",
    ".ppt": "#F97316",
    ".docx": "#3B82F6",
    ".doc": "#3B82F6",
    ".xlsx": "#10B981",
    ".mp4": "#8B5CF6",
    ".zip": "#6B7280",
  };
  const color = extColor[ext] || C.primary;

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
    if (supported) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(
        `https://docs.google.com/viewer?url=${encodeURIComponent(url)}`,
      );
    }
  };

  return (
    <TouchableOpacity
      style={s.materiCard}
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
            {item.deskripsi.replace(/<[^>]+>/g, " ").trim()}
          </Text>
        ) : null}
        <Text style={s.materiMeta}>
          {item.jenis_materi} · {item.tipe_file}
        </Text>
      </View>
      <Ionicons
        name={url ? "download-outline" : "lock-closed-outline"}
        size={18}
        color={url ? C.primary : C.muted}
      />
    </TouchableOpacity>
  );
}

// ─── Generic Content Item ─────────────────────────────────────────────────────
function GenericItem({ item }: { item: any }) {
  return (
    <View style={s.genericCard}>
      <Text style={s.genericTitle}>
        {item.judul || item.nama || item.topik || "—"}
      </Text>
      {item.deskripsi ? (
        <Text style={s.genericDesc} numberOfLines={3}>
          {item.deskripsi.replace(/<[^>]+>/g, " ").trim()}
        </Text>
      ) : null}
      {item.deadline && item.deadline !== "0001-01-01T00:00:00Z" ? (
        <View style={s.deadlineRow}>
          <Ionicons name="alarm-outline" size={12} color={C.danger} />
          <Text style={s.deadlineText}>
            Deadline:{" "}
            {new Date(item.deadline).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </View>
      ) : null}
      {item.url ? (
        <TouchableOpacity
          style={s.linkBtn}
          onPress={() => Linking.openURL(item.url)}
        >
          <Ionicons name="open-outline" size={13} color={C.primary} />
          <Text style={s.linkText}>Buka Link</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ─── PertemuanDetail ──────────────────────────────────────────────────────────
export default function PertemuanDetail() {
  const params = useLocalSearchParams<{
    id: string;
    id_kelas: string;
    nama_mk: string;
    nama_kelas: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [kehadiran, setKehadiran] = useState<any>(null);
  const [contents, setContents] = useState<Record<string, any[]>>({});
  const [activeTab, setActiveTab] = useState("materi");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
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
        const t = TABS[i];
        newContents[t] =
          r.status === "fulfilled" ? r.value.data?.data || [] : [];
      });
      setContents(newContents);

      const first = TABS.find((t) => (newContents[t]?.length || 0) > 0);
      if (first) setActiveTab(first);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    const items = contents[activeTab] || [];
    if (loading) {
      return (
        <View style={s.centered}>
          <ActivityIndicator color={C.primary} />
        </View>
      );
    }
    if (items.length === 0) {
      return (
        <View style={s.emptyTab}>
          <Ionicons name={JENIS_ICON[activeTab]} size={28} color={C.border} />
          <Text style={s.emptyTabText}>Tidak ada {JENIS_LABEL[activeTab]}</Text>
        </View>
      );
    }
    return (
      <View style={{ gap: 8 }}>
        {items.map((item, i) =>
          activeTab === "materi" ? (
            <MateriItem key={i} item={item} />
          ) : (
            <GenericItem key={i} item={item} />
          ),
        )}
      </View>
    );
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
          <Text style={s.headerTitle}>
            {detail ? `Pertemuan ${detail.nomor}` : "Detail Pertemuan"}
          </Text>
          <Text style={s.headerSub} numberOfLines={1}>
            {params.nama_mk}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading && !detail ? (
          <View style={[s.centered, { paddingVertical: 80 }]}>
            <ActivityIndicator color={C.primary} size="large" />
            <Text style={s.loadingText}>Memuat data pertemuan...</Text>
          </View>
        ) : detail ? (
          <>
            {/* Info Card */}
            <View style={s.infoCard}>
              <InfoRow
                icon="layers-outline"
                label="Pertemuan"
                value={`ke-${detail.nomor}`}
              />
              <InfoRow
                icon={
                  detail.jenis === "online" ? "wifi-outline" : "school-outline"
                }
                label="Jenis"
                value={detail.jenis === "online" ? "Online" : "Offline"}
              />
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
              <View style={s.infoRow}>
                <Ionicons name="ellipse-outline" size={14} color={C.muted} />
                <Text style={s.infoLabel}>Status</Text>
                <StatusBadge status={detail.status} />
              </View>
              {kehadiran && (
                <View style={s.infoRow}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={14}
                    color={C.muted}
                  />
                  <Text style={s.infoLabel}>Kehadiran</Text>
                  <View
                    style={[
                      s.badge,
                      kehadiran.is_hadir ? s.badgeSuccess : s.badgeDanger,
                    ]}
                  >
                    <Text
                      style={[
                        s.badgeText,
                        {
                          color: kehadiran.is_hadir ? C.successText : C.danger,
                        },
                      ]}
                    >
                      {kehadiran.presensi ||
                        (kehadiran.is_hadir ? "Hadir" : "Tidak Hadir")}
                    </Text>
                  </View>
                </View>
              )}
              {detail.judul ? (
                <View style={s.judulBox}>
                  <Text style={s.judulText}>{detail.judul}</Text>
                </View>
              ) : null}
              {detail.deskripsi ? (
                <Text style={s.deskripsiText}>
                  {detail.deskripsi.replace(/<[^>]+>/g, " ").trim()}
                </Text>
              ) : null}
            </View>

            {/* Tabs */}
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
                    style={[s.tab, active && s.tabActive]}
                    onPress={() => setActiveTab(t)}
                  >
                    <Ionicons
                      name={JENIS_ICON[t]}
                      size={14}
                      color={active ? C.primary : C.muted}
                    />
                    <Text style={[s.tabText, active && s.tabTextActive]}>
                      {JENIS_LABEL[t]}
                    </Text>
                    {count > 0 && (
                      <View style={s.tabBadge}>
                        <Text style={s.tabBadgeText}>{count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Content */}
            <View style={s.contentArea}>{renderContent()}</View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
    <View style={s.infoRow}>
      <Ionicons name={icon} size={14} color={C.muted} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { bg: string; border: string; text: string }> = {
    selesai: { bg: C.successBg, border: C.successBorder, text: C.successText },
    berlangsung: {
      bg: C.primaryLight,
      border: C.primary + "40",
      text: C.primary,
    },
    belum: { bg: C.warningBg, border: C.warningBorder, text: C.warningText },
  };
  const c = map[status || ""] || map.belum;
  return (
    <View style={[s.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[s.badgeText, { color: c.text }]}>{status || "belum"}</Text>
    </View>
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
  centered: { alignItems: "center", gap: 10, paddingVertical: 40 },
  loadingText: { fontSize: 13, color: C.muted },

  infoCard: {
    margin: 14,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 10,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoLabel: { fontSize: 12, color: C.muted, width: 72 },
  infoValue: { fontSize: 13, color: C.text, fontWeight: "500", flex: 1 },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  badgeSuccess: { backgroundColor: C.successBg, borderColor: C.successBorder },
  badgeDanger: { backgroundColor: C.dangerLight, borderColor: C.danger + "40" },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  judulBox: {
    marginTop: 4,
    backgroundColor: C.primaryLight,
    borderRadius: 8,
    padding: 10,
  },
  judulText: { fontSize: 13, fontWeight: "600", color: C.primary },
  deskripsiText: { fontSize: 12, color: C.muted, lineHeight: 18 },

  tabScroll: { marginHorizontal: 14, marginBottom: 4 },
  tabRow: { flexDirection: "row", gap: 8, paddingRight: 14 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  tabActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  tabText: { fontSize: 12, color: C.muted, fontWeight: "500" },
  tabTextActive: { color: C.primary, fontWeight: "600" },
  tabBadge: {
    backgroundColor: C.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },

  contentArea: { margin: 14, marginTop: 10, paddingBottom: 40 },
  emptyTab: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyTabText: { fontSize: 13, color: C.muted },

  materiCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
  },
  extBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  extText: { fontSize: 9, fontWeight: "800" },
  materiInfo: { flex: 1, gap: 3 },
  materiTitle: { fontSize: 13, fontWeight: "600", color: C.text },
  materiDesc: { fontSize: 11, color: C.muted, lineHeight: 16 },
  materiMeta: { fontSize: 10, color: C.muted, textTransform: "capitalize" },

  genericCard: {
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    gap: 6,
  },
  genericTitle: { fontSize: 13, fontWeight: "600", color: C.text },
  genericDesc: { fontSize: 12, color: C.muted, lineHeight: 17 },
  deadlineRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  deadlineText: { fontSize: 11, color: C.danger, fontWeight: "500" },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: C.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  linkText: { fontSize: 12, color: C.primary, fontWeight: "600" },
});
