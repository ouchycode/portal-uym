import { SkeletonBlock } from "@/components/SkeletonBlock";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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

const PERIODE_OPTIONS = [
  { value: 20252, label: "2025/2026 Genap" },
  { value: 20251, label: "2025/2026 Ganjil" },
  { value: 20242, label: "2024/2025 Genap" },
  { value: 20241, label: "2024/2025 Ganjil" },
  { value: 20232, label: "2023/2024 Genap" },
  { value: 20231, label: "2023/2024 Ganjil" },
];

const EXT_CONFIG: Record<string, { color: string; bg: string }> = {
  ".pdf": { color: "#DC2626", bg: "#FEF2F2" },
  ".pptx": { color: "#EA580C", bg: "#FFF7ED" },
  ".ppt": { color: "#EA580C", bg: "#FFF7ED" },
  ".docx": { color: "#2563EB", bg: "#EFF6FF" },
  ".doc": { color: "#2563EB", bg: "#EFF6FF" },
  ".xlsx": { color: "#16A34A", bg: "#F0FDF4" },
  ".xls": { color: "#16A34A", bg: "#F0FDF4" },
  ".mp4": { color: "#7C3AED", bg: "#F5F3FF" },
  ".zip": { color: "#6B7280", bg: "#F3F4F6" },
};

const getExtConfig = (ext: string) =>
  EXT_CONFIG[ext] ?? { color: Colors.primary, bg: Colors.primaryLight };

const handleOpen = async (url: string, ext: string) => {
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

export default function Materi() {
  const [kelas, setKelas] = useState<any[]>([]);
  const [materi, setMateri] = useState<Record<string, any[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loadingMateri, setLoadingMateri] = useState<Record<string, boolean>>(
    {},
  );
  const [periode, setPeriode] = useState(20252);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getKelas();
  }, [periode]);

  const getKelas = async () => {
    setLoading(true);
    setError(false);
    setExpanded({});
    setMateri({});
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

  const toggleKelas = async (id: string) => {
    const isOpen = expanded[id];
    setExpanded((prev) => ({ ...prev, [id]: !isOpen }));

    if (!isOpen && !materi[id]) {
      setLoadingMateri((prev) => ({ ...prev, [id]: true }));
      try {
        const pertemuanRes = await API.get(
          `/v2/lms/kelas_kuliah/${id}/pertemuan`,
          { params: { ignore_default_pagination: true } },
        );
        const pertemuanList = pertemuanRes.data?.data || [];

        const allMateri: any[] = [];
        await Promise.allSettled(
          pertemuanList.map(async (p: any) => {
            try {
              const mRes = await API.get(`/v2/lms/pertemuan/${p.id}/materi`, {
                params: { ignore_default_pagination: true },
              });
              const items = mRes.data?.data || [];
              items.forEach((m: any) =>
                allMateri.push({ ...m, _pertemuan: p }),
              );
            } catch (_) {}
          }),
        );

        setMateri((prev) => ({ ...prev, [id]: allMateri }));
      } catch {
        setMateri((prev) => ({ ...prev, [id]: [] }));
      } finally {
        setLoadingMateri((prev) => ({ ...prev, [id]: false }));
      }
    }
  };

  const periodeLabel =
    PERIODE_OPTIONS.find((p) => p.value === periode)?.label ?? "";
  const totalMateri = Object.values(materi).reduce(
    (sum, m) => sum + m.length,
    0,
  );

  return (
    <SafeAreaView style={g.safeArea}>
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.bg }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.decor1} />
          <View style={styles.decor2} />
          <View style={styles.decor3} />
          <View style={styles.decor4} />

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color="#fff" />
            <Text style={styles.backLabel}>Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Materi Kuliah</Text>
          <Text style={styles.headerSub}>{periodeLabel}</Text>
        </View>

        {/* FILTER PERIODE */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
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
        <View style={styles.body}>
          <Text style={styles.sectionLabel}>
            {loading
              ? "Memuat kelas..."
              : error
                ? "Gagal memuat data"
                : kelas.length === 0
                  ? "Tidak ada kelas ditemukan"
                  : `${kelas.length} kelas · ${totalMateri > 0 ? `${totalMateri} materi dimuat` : "tap kelas untuk lihat materi"}`}
          </Text>

          {/* SKELETON */}
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <View style={styles.skeletonLeft} />
                <View style={{ flex: 1, gap: 8 }}>
                  <SkeletonBlock width="65%" height={13} />
                  <SkeletonBlock width="40%" height={11} />
                </View>
              </View>
            ))
          ) : error ? (
            <View style={styles.empty}>
              <Ionicons name="wifi-outline" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>Gagal memuat data</Text>
              <Text style={{ fontSize: 12, color: Colors.hint }}>
                Periksa koneksi internet kamu
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={getKelas}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={styles.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : kelas.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>Tidak ada kelas ditemukan</Text>
              <Text style={{ fontSize: 12, color: Colors.hint }}>
                untuk periode {periodeLabel}
              </Text>
            </View>
          ) : (
            kelas.map((k) => {
              const id = k.id;
              const isOpen = expanded[id] ?? false;
              const isLoadingM = loadingMateri[id] ?? false;
              const materiList = materi[id] ?? [];
              const mk = k.mata_kuliah;

              return (
                <View key={id} style={styles.kelasCard}>
                  {/* KELAS HEADER */}
                  <TouchableOpacity
                    style={styles.kelasHeader}
                    onPress={() => toggleKelas(id)}
                    activeOpacity={0.75}
                  >
                    <View style={g.iconWrap}>
                      <Ionicons
                        name="book-outline"
                        size={18}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={styles.kelasInfo}>
                      <Text style={styles.kelasTitle} numberOfLines={2}>
                        {mk?.kode ? `${mk.kode} — ${mk.nama}` : mk?.nama || "-"}
                      </Text>
                      <Text style={styles.kelasSub}>
                        {k.kelas?.nama ? `${k.kelas.nama} Reguler` : ""}
                        {materi[id] ? `  ·  ${materiList.length} materi` : ""}
                      </Text>
                    </View>
                    <View style={styles.kelasRight}>
                      {materi[id] && materiList.length > 0 && (
                        <View style={g.badgePrimary}>
                          <Text style={g.badgePrimaryText}>
                            {materiList.length}
                          </Text>
                        </View>
                      )}
                      <Ionicons
                        name={isOpen ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={Colors.hint}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* MATERI LIST */}
                  {isOpen && (
                    <View style={styles.materiContainer}>
                      {isLoadingM ? (
                        <View style={styles.materiLoading}>
                          {[1, 2].map((i) => (
                            <View key={i} style={styles.materiSkeletonRow}>
                              <View style={styles.skeletonExt} />
                              <View style={{ flex: 1, gap: 6 }}>
                                <SkeletonBlock width="60%" height={12} />
                                <SkeletonBlock width="35%" height={10} />
                              </View>
                            </View>
                          ))}
                        </View>
                      ) : materiList.length === 0 ? (
                        <View style={styles.materiEmpty}>
                          <Ionicons
                            name="document-outline"
                            size={24}
                            color={Colors.border}
                          />
                          <Text style={styles.materiEmptyText}>
                            Belum ada materi
                          </Text>
                        </View>
                      ) : (
                        materiList.map((m, i) => {
                          const ext = m.file?.extension || "";
                          const url = m.file?.url;
                          const cfg = getExtConfig(ext);
                          const pertemuan = m._pertemuan;

                          return (
                            <TouchableOpacity
                              key={m.id || i}
                              style={[
                                styles.materiItem,
                                i < materiList.length - 1 &&
                                  styles.materiItemBorder,
                              ]}
                              onPress={() => url && handleOpen(url, ext)}
                              disabled={!url}
                              activeOpacity={0.75}
                            >
                              {/* EXT BADGE */}
                              <View
                                style={[
                                  styles.extBadge,
                                  {
                                    backgroundColor: cfg.bg,
                                    borderColor: cfg.color + "30",
                                  },
                                ]}
                              >
                                <Text
                                  style={[styles.extText, { color: cfg.color }]}
                                >
                                  {ext.replace(".", "").toUpperCase() || "FILE"}
                                </Text>
                              </View>

                              {/* INFO */}
                              <View style={styles.materiInfo}>
                                <Text
                                  style={styles.materiTitle}
                                  numberOfLines={2}
                                >
                                  {m.judul || "Materi"}
                                </Text>
                                <View style={styles.materiMeta}>
                                  <Ionicons
                                    name="layers-outline"
                                    size={10}
                                    color={Colors.hint}
                                  />
                                  <Text style={styles.materiMetaText}>
                                    {`Pertemuan ${pertemuan?.nomor ?? "-"}`}
                                  </Text>
                                  {m.jenis_materi && (
                                    <>
                                      <Text style={g.dot}>·</Text>
                                      <Text style={styles.materiMetaText}>
                                        {m.jenis_materi}
                                      </Text>
                                    </>
                                  )}
                                </View>
                              </View>

                              {/* ACTION */}
                              <Ionicons
                                name={
                                  url
                                    ? "download-outline"
                                    : "lock-closed-outline"
                                }
                                size={16}
                                color={url ? Colors.primary : Colors.hint}
                              />
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 14,
  },
  backLabel: { fontSize: 12, fontWeight: "600", color: "#fff" },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.55)" },

  filterScroll: { marginTop: 16 },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingRight: 32,
  },

  body: { paddingHorizontal: 16, paddingTop: 12 },
  sectionLabel: { fontSize: 12, color: Colors.muted, marginBottom: 10 },

  // ── kelas card ──
  kelasCard: {
    backgroundColor: Colors.card,
    borderRadius: 12, // was 8
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  kelasHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14, // was 12
  },
  kelasInfo: { flex: 1 },
  kelasTitle: { fontSize: 13, fontWeight: "700", color: Colors.text },
  kelasSub: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  kelasRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // ── materi ──
  materiContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  materiLoading: { padding: 14, gap: 12 },
  materiSkeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  skeletonExt: {
    width: 40,
    height: 40,
    borderRadius: 8, // was 4
    backgroundColor: Colors.skeletonBase,
  },
  materiEmpty: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 6,
  },
  materiEmptyText: { fontSize: 12, color: Colors.muted },

  materiItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  materiItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  extBadge: {
    width: 44,
    height: 44,
    borderRadius: 8, // was 4
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  extText: { fontSize: 9, fontWeight: "800" },
  materiInfo: { flex: 1, gap: 4 },
  materiTitle: { fontSize: 13, fontWeight: "600", color: Colors.text },
  materiMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  materiMetaText: { fontSize: 10, color: Colors.muted },

  // ── skeleton ──
  skeletonCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12, // was 8
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  skeletonLeft: {
    width: 36,
    height: 36,
    borderRadius: 8, // was 4
    backgroundColor: Colors.skeletonBase,
  },

  // ── empty / error ──
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
});
