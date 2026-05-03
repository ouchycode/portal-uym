import { SkeletonBlock } from "@/components/SkeletonBlock";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { useAuth } from "@/store/auth";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const stripHtml = (html: string): string => {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDeadlineStatus = (waktuSelesai: string) => {
  if (!waktuSelesai) return null;
  const diffMs = new Date(waktuSelesai).getTime() - Date.now();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffMs < 0) return { label: "Sudah lewat deadline", type: "danger" };
  if (diffHours < 24)
    return {
      label: `Tersisa ${Math.floor(diffHours)} jam lagi`,
      type: "warning",
    };
  return {
    label: `Tersisa ${Math.floor(diffMs / (1000 * 60 * 60 * 24))} hari lagi`,
    type: "success",
  };
};

function SectionHeader({ icon, title }: { icon: any; title: string }) {
  return (
    <View style={g.sectionHeader}>
      <Ionicons name={icon} size={15} color={Colors.primary} />
      <Text style={g.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value, badge }: any) {
  const badgeStyle =
    badge === "success"
      ? {
          bg: Colors.successBg,
          border: Colors.successBorder,
          text: Colors.successText,
        }
      : badge === "warning"
        ? {
            bg: Colors.warningBg,
            border: Colors.warningBorder,
            text: Colors.warningText,
          }
        : {
            bg: Colors.primaryLight,
            border: Colors.primaryMid,
            text: Colors.primary,
          };

  return (
    <View style={g.infoRow}>
      <View style={g.iconWrap}>
        <Ionicons name={icon} size={15} color={Colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={g.infoLabel}>{label}</Text>
        {badge ? (
          <View
            style={[
              styles.inlineBadge,
              {
                backgroundColor: badgeStyle.bg,
                borderColor: badgeStyle.border,
              },
            ]}
          >
            <Text style={[styles.inlineBadgeText, { color: badgeStyle.text }]}>
              {value}
            </Text>
          </View>
        ) : (
          <Text style={g.infoValue}>{value || "-"}</Text>
        )}
      </View>
    </View>
  );
}

function SkeletonRows() {
  return (
    <View style={{ gap: 12 }}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[g.infoRow, { alignItems: "center" }]}>
          <SkeletonBlock height={32} width={32} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBlock height={10} width="35%" />
            <SkeletonBlock height={13} width="60%" />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function DetailTugas() {
  const { id, pertemuan, judul, periode } = useLocalSearchParams();
  const token = useAuth((s) => s.token);

  const uuidFromToken = (() => {
    try {
      return JSON.parse(atob(token!.split(".")[1]))?.uuid ?? "";
    } catch {
      return "";
    }
  })();

  const [uploading, setUploading] = useState(false);
  const [pengumpulan, setPengumpulan] = useState<any>(null);
  const [tugas, setTugas] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [kelompok, setKelompok] = useState<any>(null);
  const [loadingKelompok, setLoadingKelompok] = useState(false);
  const [showKelompokModal, setShowKelompokModal] = useState(false);
  const [namaKelompok, setNamaKelompok] = useState("");
  const [creatingKelompok, setCreatingKelompok] = useState(false);
  const [showTambahModal, setShowTambahModal] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [adding, setAdding] = useState(false);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getDetail();
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, []);

  const getDetail = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await API.get("/v2/lms/tugas", {
        params: { per_page: 200, periode: periode ?? 20252 },
      });
      const found = res.data.data.find((t: any) => String(t.id) === id);
      setTugas(found);
      if (found?.jenis_tugas === "kelompok") fetchKelompok();
      fetchPengumpulan();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchKelompok = async () => {
    setLoadingKelompok(true);
    try {
      const res = await API.get(`/v2/lms/tugas/${id}/kelompok/me`);
      setKelompok(res.data?.data || null);
    } catch {
      setKelompok(null);
    } finally {
      setLoadingKelompok(false);
    }
  };

  const fetchPengumpulan = async () => {
    try {
      const res = await API.get(`/v2/lms/tugas/${id}/pengumpulan/me`);
      setPengumpulan(res.data?.data || res.data || null);
    } catch {
      setPengumpulan(null);
    }
  };

  const handleBuatKelompok = async () => {
    if (!namaKelompok.trim()) {
      Alert.alert("Perhatian", "Nama kelompok tidak boleh kosong.");
      return;
    }
    setCreatingKelompok(true);
    try {
      const res = await API.post(`/v2/lms/tugas/${id}/kelompok`, {
        nama: namaKelompok.trim(),
      });
      if (res.data) {
        Alert.alert("Berhasil", "Kelompok berhasil dibuat!");
        setShowKelompokModal(false);
        setNamaKelompok("");
        fetchKelompok();
      }
    } catch (err: any) {
      Alert.alert(
        "Gagal",
        err?.response?.data?.message || "Gagal membuat kelompok. Coba lagi.",
      );
    } finally {
      setCreatingKelompok(false);
    }
  };

  const handleSearchMahasiswa = useCallback((name: string) => {
    setSearchName(name);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    if (!name.trim()) {
      setSearchResults([]);
      return;
    }
    debounceTimeout.current = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await API.get(`/lms/tugas/${id}/kelompok/no_kelompok`, {
          params: { search: name },
        });
        setSearchResults(res.data?.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 500);
  }, []);

  const handleTambahAnggota = async (mhs: any) => {
    if (mhs.id_user === uuidFromToken) {
      Alert.alert("Error", "Tidak bisa menambahkan diri sendiri.");
      return;
    }
    if (
      kelompok?.anggota?.some((a: any) => a.mahasiswa?.id_user === mhs.id_user)
    ) {
      Alert.alert("Error", "Mahasiswa sudah ada di kelompok.");
      return;
    }
    setAdding(true);
    try {
      const nim_ketua =
        kelompok?.anggota?.find((a: any) => a.jabatan === "ketua")?.mahasiswa
          ?.nim || "";
      const list_nim = [
        ...(kelompok?.anggota
          ?.map((a: any) => a.mahasiswa?.nim)
          .filter(Boolean) || []),
        mhs.nim,
      ];
      await API.put(`/v2/lms/tugas/${id}/kelompok/${kelompok.id}`, {
        nama: kelompok.nama,
        list_nim,
        nim_ketua,
      });
      setKelompok((prev: any) => ({
        ...prev,
        anggota: [
          ...(prev?.anggota || []),
          { jabatan: "anggota", mahasiswa: mhs },
        ],
      }));
      Alert.alert("Berhasil", "Anggota berhasil ditambahkan");
      setShowTambahModal(false);
      setSearchName("");
      setSearchResults([]);
      setTimeout(() => fetchKelompok(), 1000);
    } catch (err: any) {
      Alert.alert(
        "Gagal",
        `[${err?.response?.status}] ${err?.response?.data?.message || "Tidak bisa menambahkan anggota"}`,
      );
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAnggota = async (anggota: any) => {
    if (!isKetua) {
      Alert.alert("Akses ditolak", "Hanya ketua yang bisa menghapus anggota.");
      return;
    }
    if (anggota.mahasiswa?.id_user === uuidFromToken) {
      Alert.alert("Error", "Kamu tidak bisa menghapus diri sendiri.");
      return;
    }
    Alert.alert("Konfirmasi", `Hapus ${anggota.mahasiswa?.nama}?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            setLoadingKelompok(true);
            const nim_ketua =
              kelompok?.anggota?.find((a: any) => a.jabatan === "ketua")
                ?.mahasiswa?.nim || "";
            const list_nim = kelompok?.anggota
              ?.filter((a: any) => a.mahasiswa?.nim !== anggota.mahasiswa?.nim)
              ?.map((a: any) => a.mahasiswa?.nim)
              ?.filter(Boolean);
            await API.put(`/v2/lms/tugas/${id}/kelompok/${kelompok.id}`, {
              nama: kelompok.nama,
              list_nim,
              nim_ketua,
            });
            setKelompok((prev: any) => ({
              ...prev,
              anggota: prev.anggota.filter(
                (a: any) => a.mahasiswa?.nim !== anggota.mahasiswa?.nim,
              ),
            }));
            Alert.alert("Berhasil", "Anggota berhasil dihapus");
            setTimeout(() => fetchKelompok(), 1000);
          } catch (err: any) {
            Alert.alert(
              "Gagal",
              err?.response?.data?.message || "Tidak bisa menghapus anggota",
            );
          } finally {
            setLoadingKelompok(false);
          }
        },
      },
    ]);
  };

  const handleUpload = async () => {
    if (tugas?.waktu_selesai && new Date() > new Date(tugas.waktu_selesai)) {
      Alert.alert("Deadline Terlewat", "Waktu pengumpulan sudah berakhir.");
      return;
    }
    if (tugas?.jenis_tugas === "kelompok" && !kelompok) {
      Alert.alert("Kelompok Diperlukan", "Buat kelompok terlebih dahulu.");
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
      if (result.canceled) return;
      const file = result.assets[0];
      const formData = new FormData();
      formData.append("files", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/octet-stream",
      } as any);
      formData.append("link", "");
      setUploading(true);
      const res = await fetch(
        `https://mahasiswa.lms.uym.ac.id/v2/lms/tugas/${id}/pengumpulan?pertemuan=${pertemuan}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "college-id": "041105",
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        },
      );
      if (res.ok) {
        Alert.alert("Berhasil", "Tugas berhasil dikirim");
        getDetail();
      } else Alert.alert("Gagal", "Upload gagal");
    } catch {
      Alert.alert("Error", "Terjadi kesalahan");
    } finally {
      setUploading(false);
    }
  };

  const sudah =
    Boolean(pengumpulan?.submitted_at) || tugas?.jumlah_pengumpulan > 0;
  const waktuUpload = pengumpulan?.submitted_at
    ? formatDateTime(pengumpulan.submitted_at)
    : null;
  const deadlineStatus = getDeadlineStatus(tugas?.waktu_selesai);
  const isKelompok = tugas?.jenis_tugas === "kelompok";
  const isDeadlinePassed =
    tugas?.waktu_selesai && new Date() > new Date(tugas.waktu_selesai);
  const isKetua = Boolean(
    kelompok?.anggota?.some(
      (a: any) =>
        String(a.mahasiswa?.id_user) === String(uuidFromToken) &&
        String(a.jabatan).toLowerCase() === "ketua",
    ),
  );
  const canUpload = !isKelompok || (isKelompok && Boolean(kelompok) && isKetua);
  const canEditKelompok = isKelompok && isKetua && !isDeadlinePassed;

  const deadlineColors: Record<
    string,
    { bg: string; border: string; text: string; icon: any }
  > = {
    danger: {
      bg: Colors.dangerBg,
      border: Colors.dangerBorder,
      text: Colors.dangerText,
      icon: "close-circle-outline",
    },
    warning: {
      bg: Colors.warningBg,
      border: Colors.warningBorder,
      text: Colors.warningText,
      icon: "warning-outline",
    },
    success: {
      bg: Colors.successBg,
      border: Colors.successBorder,
      text: Colors.successText,
      icon: "checkmark-circle-outline",
    },
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
        </View>
        <Text style={g.headerTitle} numberOfLines={2}>
          {judul || "Detail Tugas"}
        </Text>
        <Text style={g.headerSub}>
          {loading
            ? "Memuat detail..."
            : tugas?.kelas_kuliah?.mata_kuliah?.nama || "Detail Tugas"}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* INFO TUGAS */}
        <View style={g.card}>
          <SectionHeader
            icon="information-circle-outline"
            title="Informasi Tugas"
          />
          {loading ? (
            <SkeletonRows />
          ) : error ? (
            <View style={g.emptyWrap}>
              <Ionicons name="wifi-outline" size={40} color={Colors.border} />
              <Text style={g.emptyTitle}>Gagal memuat data</Text>
              <Text style={g.emptyHint}>Periksa koneksi internet kamu</Text>
              <TouchableOpacity style={g.retryBtn} onPress={getDetail}>
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={g.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <InfoRow
                icon="book-outline"
                label="Mata Kuliah"
                value={tugas?.kelas_kuliah?.mata_kuliah?.nama}
              />
              <InfoRow
                icon="person-outline"
                label="Dosen"
                value={tugas?.created_by?.name}
              />
              <InfoRow
                icon={sudah ? "checkmark-circle-outline" : "time-outline"}
                label="Status Pengumpulan"
                value={sudah ? "Sudah dikumpulkan" : "Belum dikumpulkan"}
                badge={sudah ? "success" : "warning"}
              />
              {isKelompok && (
                <InfoRow
                  icon="people-outline"
                  label="Tipe Tugas"
                  value="Tugas Kelompok"
                  badge="info"
                />
              )}
            </>
          )}
        </View>

        {/* KELOMPOK */}
        {!loading && isKelompok && (
          <View style={g.card}>
            <SectionHeader icon="people-outline" title="Kelompok Saya" />
            {loadingKelompok ? (
              <View style={{ gap: 10 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <SkeletonBlock width={36} height={36} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <SkeletonBlock height={14} width="50%" />
                    <SkeletonBlock height={11} width="35%" />
                  </View>
                </View>
                <SkeletonBlock height={32} width="45%" />
              </View>
            ) : kelompok ? (
              <>
                <View
                  style={[
                    g.card,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      padding: 12,
                      backgroundColor: Colors.primaryLight,
                      borderColor: Colors.primaryMid,
                    },
                  ]}
                >
                  <Ionicons name="people" size={18} color={Colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kelompokNama}>{kelompok.nama}</Text>
                    <Text style={styles.kelompokSub}>
                      {kelompok.anggota?.length ?? 0} anggota
                      {isKetua ? " · Kamu adalah Ketua" : ""}
                    </Text>
                    {canEditKelompok && (
                      <TouchableOpacity
                        onPress={() => setShowTambahModal(true)}
                        style={styles.tambahBtn}
                      >
                        <Text style={styles.tambahBtnText}>
                          + Tambah Anggota
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {isKetua && (
                    <View style={g.badgePrimary}>
                      <Text style={g.badgePrimaryText}>Ketua</Text>
                    </View>
                  )}
                </View>

                {kelompok.anggota?.length > 0 && (
                  <View style={{ gap: 8, marginTop: 4 }}>
                    {kelompok.anggota.map((a: any, idx: number) => {
                      const isMe = a.mahasiswa?.id_user === uuidFromToken;
                      return (
                        <View
                          key={a.id || idx}
                          style={[
                            styles.anggotaItem,
                            isMe && styles.anggotaItemMe,
                          ]}
                        >
                          <View
                            style={[
                              styles.avatar,
                              a.jabatan === "ketua" && styles.avatarKetua,
                            ]}
                          >
                            {a.mahasiswa?.avatar_url ? (
                              <Image
                                source={{ uri: a.mahasiswa.avatar_url }}
                                style={styles.avatarImg}
                              />
                            ) : (
                              <Text
                                style={[
                                  styles.avatarText,
                                  a.jabatan === "ketua" && {
                                    color: Colors.primary,
                                  },
                                ]}
                              >
                                {(a.mahasiswa?.nama || "?")[0].toUpperCase()}
                              </Text>
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.anggotaName}>
                              {a.mahasiswa?.nama}
                              {isMe ? " (Kamu)" : ""}
                            </Text>
                            {a.mahasiswa?.nim && (
                              <Text style={styles.anggotaNim}>
                                {a.mahasiswa.nim}
                              </Text>
                            )}
                          </View>
                          {a.jabatan === "ketua" && (
                            <View style={g.badgePrimary}>
                              <Text style={g.badgePrimaryText}>Ketua</Text>
                            </View>
                          )}
                          {canEditKelompok &&
                            a.jabatan !== "ketua" &&
                            !isMe && (
                              <TouchableOpacity
                                onPress={() => handleRemoveAnggota(a)}
                                style={{ padding: 8 }}
                              >
                                <Ionicons
                                  name="trash-outline"
                                  size={18}
                                  color={Colors.error}
                                />
                              </TouchableOpacity>
                            )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={styles.desc}>
                  Kamu belum tergabung dalam kelompok untuk tugas ini.
                </Text>
                <TouchableOpacity
                  style={g.btnSecondary}
                  onPress={() => setShowKelompokModal(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={g.btnSecondaryText}>Buat Kelompok</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* WAKTU TUGAS */}
        <View style={g.card}>
          <SectionHeader icon="calendar-outline" title="Waktu Tugas" />
          {loading ? (
            <SkeletonRows />
          ) : (
            <>
              <InfoRow
                icon="play-circle-outline"
                label="Dibuka"
                value={formatDateTime(tugas?.waktu_mulai)}
              />
              <InfoRow
                icon="alarm-outline"
                label="Deadline"
                value={formatDateTime(tugas?.waktu_selesai)}
              />
              {deadlineStatus &&
                (() => {
                  const dc = deadlineColors[deadlineStatus.type];
                  return (
                    <View
                      style={
                        deadlineStatus.type === "danger"
                          ? g.errorBox
                          : deadlineStatus.type === "warning"
                            ? g.warningBox
                            : g.infoBox
                      }
                    >
                      <Ionicons name={dc.icon} size={15} color={dc.text} />
                      <Text
                        style={
                          deadlineStatus.type === "danger"
                            ? g.errorText
                            : deadlineStatus.type === "warning"
                              ? g.warningBoxText
                              : g.infoBoxText
                        }
                      >
                        {deadlineStatus.label}
                      </Text>
                    </View>
                  );
                })()}
            </>
          )}
        </View>

        {/* DESKRIPSI */}
        <View style={g.card}>
          <SectionHeader icon="document-text-outline" title="Deskripsi" />
          {loading ? (
            <View style={{ gap: 6 }}>
              <SkeletonBlock height={12} width="100%" />
              <SkeletonBlock height={12} width="80%" />
              <SkeletonBlock height={12} width="65%" />
            </View>
          ) : (
            <Text style={styles.desc}>
              {stripHtml(tugas?.deskripsi) || "Tidak ada deskripsi."}
            </Text>
          )}
        </View>

        {/* FILE DOSEN */}
        <View style={g.card}>
          <SectionHeader icon="attach-outline" title="File Tugas dari Dosen" />
          {loading ? (
            <SkeletonBlock height={42} width="100%" />
          ) : tugas?.lampiran_file?.url ? (
            <TouchableOpacity
              style={g.retryBtn}
              onPress={() => Linking.openURL(tugas.lampiran_file.url)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="download-outline"
                size={16}
                color={Colors.primary}
              />
              <Text style={g.retryText} numberOfLines={1}>
                {tugas.lampiran_file.name || "Download File"}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.desc}>Tidak ada file lampiran.</Text>
          )}
        </View>

        {/* PENGUMPULAN */}
        <View style={g.card}>
          <SectionHeader icon="cloud-upload-outline" title="Pengumpulan Saya" />
          {loading ? (
            <View style={{ gap: 6 }}>
              <SkeletonBlock height={14} width="60%" />
              <SkeletonBlock height={11} width="45%" />
            </View>
          ) : sudah ? (
            <View style={g.badgeSuccess}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={Colors.successText}
              />
              <View>
                <Text style={[g.badgeSuccessText, { fontSize: 13 }]}>
                  Tugas telah dikumpulkan
                </Text>
                {waktuUpload && (
                  <Text style={styles.submittedTime}>{waktuUpload}</Text>
                )}
              </View>
            </View>
          ) : (
            <Text style={styles.desc}>Belum ada file yang diunggah.</Text>
          )}
        </View>

        {/* UPLOAD BUTTON */}
        {!loading &&
          (canUpload ? (
            <TouchableOpacity
              style={[
                g.btnPrimary,
                { flexDirection: "row", gap: 8 },
                (uploading || isDeadlinePassed) && { opacity: 0.5 },
              ]}
              onPress={handleUpload}
              disabled={uploading || Boolean(isDeadlinePassed)}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={18}
                    color="#fff"
                  />
                  <Text style={g.btnPrimaryText}>
                    {isDeadlinePassed
                      ? "Deadline Berakhir"
                      : sudah
                        ? "Unggah Ulang"
                        : "Unggah Tugas"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={g.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={Colors.primary}
              />
              <Text style={g.infoBoxText}>
                {isKelompok && !kelompok
                  ? "Buat kelompok terlebih dahulu untuk bisa mengumpulkan tugas ini."
                  : "Hanya ketua kelompok yang dapat mengumpulkan tugas ini."}
              </Text>
            </View>
          ))}
      </ScrollView>

      {/* MODAL BUAT KELOMPOK */}
      <Modal
        visible={showKelompokModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowKelompokModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buat Kelompok</Text>
              <TouchableOpacity onPress={() => setShowKelompokModal(false)}>
                <Ionicons name="close" size={22} color={Colors.muted} />
              </TouchableOpacity>
            </View>
            <Text style={g.inputLabel}>Nama Kelompok</Text>
            <View style={g.inputWrap}>
              <Ionicons name="people-outline" size={16} color={Colors.hint} />
              <TextInput
                style={g.inputField}
                placeholder="Contoh: Kelompok 1"
                placeholderTextColor={Colors.hint}
                value={namaKelompok}
                onChangeText={setNamaKelompok}
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[g.btnPrimary, creatingKelompok && { opacity: 0.65 }]}
              onPress={handleBuatKelompok}
              disabled={creatingKelompok}
              activeOpacity={0.85}
            >
              {creatingKelompok ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={g.btnPrimaryText}>Buat Kelompok</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL TAMBAH ANGGOTA */}
      <Modal
        visible={showTambahModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowTambahModal(false);
          setSearchName("");
          setSearchResults([]);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tambah Anggota</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowTambahModal(false);
                    setSearchName("");
                    setSearchResults([]);
                  }}
                >
                  <Ionicons name="close" size={22} color={Colors.muted} />
                </TouchableOpacity>
              </View>
              <Text style={g.inputLabel}>Cari berdasarkan Nama</Text>
              <View style={g.inputWrap}>
                <Ionicons name="search-outline" size={16} color={Colors.hint} />
                <TextInput
                  style={g.inputField}
                  placeholder="Ketik nama mahasiswa..."
                  placeholderTextColor={Colors.hint}
                  value={searchName}
                  onChangeText={handleSearchMahasiswa}
                  autoFocus
                />
              </View>
              {loadingSearch && (
                <ActivityIndicator
                  size="small"
                  color={Colors.primary}
                  style={{ marginTop: 10 }}
                />
              )}
              {!loadingSearch && searchName && searchResults.length === 0 && (
                <Text
                  style={{ color: Colors.muted, marginTop: 10, fontSize: 13 }}
                >
                  Tidak ada mahasiswa ditemukan
                </Text>
              )}
              <ScrollView
                style={{ maxHeight: 240 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {searchResults.map((mhs: any, index: number) => (
                  <TouchableOpacity
                    key={mhs.id_user || index}
                    onPress={() => handleTambahAnggota(mhs)}
                    style={styles.searchItem}
                  >
                    <View style={g.iconWrap}>
                      <Ionicons
                        name="person-outline"
                        size={15}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontWeight: "600",
                          color: Colors.text,
                          fontSize: 13,
                        }}
                      >
                        {mhs.nama}
                      </Text>
                      <Text
                        style={{
                          color: Colors.muted,
                          fontSize: 11,
                          marginTop: 2,
                        }}
                      >
                        {mhs.nim}
                      </Text>
                    </View>
                    <Ionicons
                      name="add-circle-outline"
                      size={18}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  inlineBadge: {
    alignSelf: "flex-start",
    borderWidth: 0.5,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  inlineBadgeText: { fontSize: 11, fontWeight: "600" },

  kelompokNama: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  kelompokSub: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  tambahBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  tambahBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  anggotaItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  anggotaItemMe: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarKetua: {
    backgroundColor: Colors.primaryMid,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  avatarText: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  anggotaName: { fontSize: 13, fontWeight: "600", color: Colors.text },
  anggotaNim: { fontSize: 10, color: Colors.muted, marginTop: 1 },

  desc: { fontSize: 13, color: Colors.muted, lineHeight: 20 },

  fileBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
    flex: 1,
  },
  submittedTime: { fontSize: 11, color: Colors.muted, marginTop: 2 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },

  searchItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderBottomWidth: 0.5,
    borderColor: Colors.border,
  },
});
