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
  const now = new Date();
  const deadline = new Date(waktuSelesai);
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffMs < 0) return { label: "Sudah lewat deadline", type: "danger" };
  if (diffHours < 24)
    return {
      label: `Tersisa ${Math.floor(diffHours)} jam lagi`,
      type: "warning",
    };
  return {
    label: `Tersisa ${Math.floor(diffDays)} hari lagi`,
    type: "success",
  };
};

export default function DetailTugas() {
  const { id, pertemuan, judul, periode } = useLocalSearchParams();
  const token = useAuth((s) => s.token);

  const uuidFromToken = token
    ? JSON.parse(atob(token.split(".")[1]))?.uuid
    : "";

  const [uploading, setUploading] = useState(false);
  const [tugas, setTugas] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    try {
      const periodeValue = periode ?? 20252;
      const res = await API.get("/v2/lms/tugas", {
        params: { per_page: 200, periode: periodeValue },
      });
      const found = res.data.data.find((t: any) => String(t.id) === id);
      setTugas(found);
      if (found?.jenis_tugas === "kelompok") fetchKelompok();
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const fetchKelompok = async () => {
    setLoadingKelompok(true);
    try {
      const res = await API.get(`/v2/lms/tugas/${id}/kelompok/me`);
      setKelompok(res.data?.data || null);
    } catch (err: any) {
      setKelompok(null);
    } finally {
      setLoadingKelompok(false);
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
      const msg =
        err?.response?.data?.message || "Gagal membuat kelompok. Coba lagi.";
      Alert.alert("Gagal", msg);
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
        const res = await API.get(`/lms/tugas/${id}/kelompok/no_kelompok`);
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
    const isAlready = kelompok?.anggota?.some(
      (a: any) => a.mahasiswa?.id_user === mhs.id_user,
    );
    if (isAlready) {
      Alert.alert("Error", "Mahasiswa sudah ada di kelompok.");
      return;
    }

    setAdding(true);
    try {
      const url = `/v2/lms/tugas/${id}/kelompok/${kelompok.id}`;
      const nim_ketua =
        kelompok?.anggota?.find((a: any) => a.jabatan === "ketua")?.mahasiswa
          ?.nim || "";
      const list_nim_existing = kelompok?.anggota
        ?.map((a: any) => a.mahasiswa?.nim)
        .filter(Boolean);
      const list_nim = [...list_nim_existing, mhs.nim];
      await API.put(url, { nama: kelompok.nama, list_nim, nim_ketua });
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
      const msg =
        err?.response?.data?.message || "Tidak bisa menambahkan anggota";
      Alert.alert("Gagal", `[${err?.response?.status}] ${msg}`);
    } finally {
      setAdding(false);
    }
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
            const url = `/v2/lms/tugas/${id}/kelompok/${kelompok.id}`;
            const nim_ketua =
              kelompok?.anggota?.find((a: any) => a.jabatan === "ketua")
                ?.mahasiswa?.nim || "";
            const list_nim = kelompok?.anggota
              ?.filter((a: any) => a.mahasiswa?.nim !== anggota.mahasiswa?.nim)
              ?.map((a: any) => a.mahasiswa?.nim)
              ?.filter(Boolean);
            await API.put(url, { nama: kelompok.nama, list_nim, nim_ketua });
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

  const sudah = tugas?.jumlah_pengumpulan > 0;
  const waktuUpload = tugas?.waktu_pengumpulan || tugas?.updated_at || null;
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

  return (
    <SafeAreaView style={g.safeArea}>
      {/* ── Header biru ── */}
      <View style={styles.header}>
        <View style={styles.decor1} />
        <View style={styles.decor2} />
        <View style={styles.decor3} />
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={2}>
          {judul || "Detail Tugas"}
        </Text>
        <Text style={styles.headerSub}>
          {loading
            ? "Memuat detail..."
            : tugas?.kelas_kuliah?.mata_kuliah?.nama || "Detail Tugas"}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Informasi Tugas ── */}
        <View style={g.card}>
          <SectionHeader
            icon="information-circle-outline"
            title="Informasi Tugas"
          />
          {loading ? (
            <SkeletonRows />
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

        {/* ── Kelompok ── */}
        {!loading && isKelompok && (
          <View style={g.card}>
            <SectionHeader icon="people-outline" title="Kelompok Saya" />
            {loadingKelompok ? (
              <View
                style={[styles.skeletonBlock, { height: 50, borderRadius: 8 }]}
              />
            ) : kelompok ? (
              <>
                <View style={styles.kelompokBox}>
                  <Ionicons name="people" size={18} color={Colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kelompokNama}>{kelompok.nama}</Text>
                    <Text style={styles.kelompokAnggota}>
                      {kelompok.anggota?.length ?? 0} anggota
                      {isKetua ? " · Kamu adalah Ketua" : ""}
                    </Text>
                    {canEditKelompok && (
                      <TouchableOpacity
                        onPress={() => setShowTambahModal(true)}
                        style={styles.tambahAnggotaBtn}
                      >
                        <Text style={styles.tambahAnggotaBtnText}>
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
                  <View style={styles.anggotaList}>
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
                              styles.anggotaAvatar,
                              a.jabatan === "ketua" &&
                                styles.anggotaAvatarKetua,
                            ]}
                          >
                            {a.mahasiswa?.avatar_url ? (
                              <Image
                                source={{ uri: a.mahasiswa.avatar_url }}
                                style={styles.anggotaAvatarImg}
                              />
                            ) : (
                              <Text
                                style={[
                                  styles.anggotaAvatarText,
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
                  style={styles.buatKelompokBtn}
                  onPress={() => setShowKelompokModal(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={styles.buatKelompokText}>Buat Kelompok</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* ── Waktu Tugas ── */}
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
              {deadlineStatus && (
                <View
                  style={[
                    styles.deadlineBanner,
                    deadlineStatus.type === "danger" && {
                      backgroundColor: Colors.dangerBg,
                      borderColor: Colors.dangerBorder,
                    },
                    deadlineStatus.type === "warning" && {
                      backgroundColor: Colors.warningBg,
                      borderColor: Colors.warningBorder,
                    },
                    deadlineStatus.type === "success" && {
                      backgroundColor: Colors.successBg,
                      borderColor: Colors.successBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      deadlineStatus.type === "danger"
                        ? "close-circle-outline"
                        : deadlineStatus.type === "warning"
                          ? "warning-outline"
                          : "checkmark-circle-outline"
                    }
                    size={15}
                    color={
                      deadlineStatus.type === "danger"
                        ? Colors.dangerText
                        : deadlineStatus.type === "warning"
                          ? Colors.warningText
                          : Colors.successText
                    }
                  />
                  <Text
                    style={[
                      styles.deadlineBannerText,
                      {
                        color:
                          deadlineStatus.type === "danger"
                            ? Colors.dangerText
                            : deadlineStatus.type === "warning"
                              ? Colors.warningText
                              : Colors.successText,
                      },
                    ]}
                  >
                    {deadlineStatus.label}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* ── Deskripsi ── */}
        <View style={g.card}>
          <SectionHeader icon="document-text-outline" title="Deskripsi" />
          {loading ? (
            <>
              <View
                style={[
                  styles.skeletonBlock,
                  { height: 12, width: "100%", marginBottom: 6 },
                ]}
              />
              <View
                style={[styles.skeletonBlock, { height: 12, width: "70%" }]}
              />
            </>
          ) : (
            <Text style={styles.desc}>
              {stripHtml(tugas?.deskripsi) || "Tidak ada deskripsi."}
            </Text>
          )}
        </View>

        {/* ── File Dosen ── */}
        <View style={g.card}>
          <SectionHeader icon="attach-outline" title="File Tugas dari Dosen" />
          {loading ? (
            <View
              style={[styles.skeletonBlock, { height: 42, borderRadius: 8 }]}
            />
          ) : tugas?.lampiran_file?.url ? (
            <TouchableOpacity
              style={styles.fileBtn}
              onPress={() => Linking.openURL(tugas.lampiran_file.url)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="download-outline"
                size={16}
                color={Colors.primary}
              />
              <Text style={styles.fileBtnText} numberOfLines={1}>
                {tugas.lampiran_file.name || "Download File"}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.desc}>Tidak ada file lampiran.</Text>
          )}
        </View>

        {/* ── Pengumpulan ── */}
        <View style={g.card}>
          <SectionHeader icon="cloud-upload-outline" title="Pengumpulan Saya" />
          {loading ? (
            <View
              style={[styles.skeletonBlock, { height: 50, borderRadius: 8 }]}
            />
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

        {/* ── Upload Button ── */}
        {!loading &&
          (canUpload ? (
            <TouchableOpacity
              style={[
                g.btnPrimary,
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
            <View style={[g.infoBox, { marginTop: 4 }]}>
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

      {/* ── Modal Buat Kelompok ── */}
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

      {/* ── Modal Tambah Anggota ── */}
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
                    style={styles.searchResultItem}
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

// ── Sub-components ──

function SectionHeader({ icon, title }: { icon: any; title: string }) {
  return (
    <View style={g.sectionHeader}>
      <Ionicons name={icon} size={15} color={Colors.primary} />
      <Text style={g.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value, badge }: any) {
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
              badge === "success" ? g.badgeSuccess : styles.badgeOther,
              badge === "warning" && {
                backgroundColor: Colors.warningBg,
                borderColor: Colors.warningBorder,
              },
              badge === "info" && {
                backgroundColor: Colors.primaryLight,
                borderColor: Colors.primaryMid,
              },
            ]}
          >
            <Text
              style={[
                g.badgeSuccessText,
                badge === "warning" && { color: Colors.warningText },
                badge === "info" && { color: Colors.primary },
              ]}
            >
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
    <>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[g.infoRow, { marginBottom: 4 }]}>
          <View
            style={[
              styles.skeletonBlock,
              { width: 32, height: 32, borderRadius: 8 },
            ]}
          />
          <View style={{ flex: 1, gap: 6 }}>
            <View
              style={[styles.skeletonBlock, { height: 10, width: "35%" }]}
            />
            <View
              style={[styles.skeletonBlock, { height: 13, width: "60%" }]}
            />
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  // ── Header biru ──
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
    top: -28,
    right: -28,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  decor2: {
    position: "absolute",
    bottom: -40,
    left: -24,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  decor3: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
  },

  // ── Page title ──
  pageTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
    lineHeight: 26,
  },

  // ── Kelompok ──
  kelompokBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryMid,
    borderRadius: 8,
    padding: 12,
  },
  kelompokNama: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  kelompokAnggota: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  tambahAnggotaBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  tambahAnggotaBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  // ── Anggota ──
  anggotaList: { gap: 8, marginTop: 4 },
  anggotaItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  anggotaItemMe: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  anggotaAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  anggotaAvatarKetua: {
    backgroundColor: Colors.primaryMid,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  anggotaAvatarImg: { width: 40, height: 40, borderRadius: 20 },
  anggotaAvatarText: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  anggotaName: { fontSize: 13, fontWeight: "600", color: Colors.text },
  anggotaNim: { fontSize: 10, color: Colors.muted, marginTop: 1 },

  // ── Buat kelompok ──
  buatKelompokBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  buatKelompokText: { fontSize: 13, fontWeight: "700", color: Colors.primary },

  // ── Deadline banner ──
  deadlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  deadlineBannerText: { fontSize: 12, fontWeight: "600" },

  // ── File & desc ──
  desc: { fontSize: 13, color: Colors.muted, lineHeight: 20 },
  fileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  fileBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
    flex: 1,
  },
  submittedTime: { fontSize: 11, color: Colors.muted, marginTop: 2 },

  // ── Badge fallback ──
  badgeOther: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  // ── Skeleton ──
  skeletonBlock: { backgroundColor: Colors.skeletonBase, borderRadius: 6 },

  // ── Modal ──
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

  // ── Search result ──
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
});
