import { Colors, globalStyles as g } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FAQS = [
  {
    q: "Bagaimana cara login ke aplikasi?",
    a: "Gunakan NIM dan password SIAKAD yang sama. Jika belum memiliki akun, hubungi BAA untuk aktivasi.",
  },
  {
    q: "Lupa password SIAKAD?",
    a: "Reset password dapat dilakukan melalui portal SIAKAD di browser, atau hubungi BAA secara langsung.",
  },
  {
    q: "Mengapa jadwal kuliah tidak muncul?",
    a: "Pastikan periode yang dipilih sudah benar. Jika masih kosong, hubungi Bagian Akademik untuk pengecekan data KRS.",
  },
  {
    q: "Bagaimana cara mengumpulkan tugas?",
    a: "Buka menu Tugas, pilih tugas yang ingin dikumpulkan, lalu tekan tombol Unggah Tugas dan pilih file dari perangkat Anda.",
  },
  {
    q: "Nilai saya belum muncul, kenapa?",
    a: "Nilai diinput oleh dosen pengampu. Jika sudah melewati batas waktu input nilai, silakan hubungi dosen atau Bagian Akademik.",
  },
  {
    q: "Bagaimana cara bergabung dengan kelompok tugas?",
    a: "Ketua kelompok yang membuat kelompok dan menambahkan anggota. Hubungi ketua kelompok Anda untuk ditambahkan.",
  },
  {
    q: "Apakah data akademik saya aman?",
    a: "Data akademik Anda dikelola langsung oleh sistem SIAKAD Universitas Yatsi Madani dan hanya dapat diakses dengan akun Anda.",
  },
];

const CONTACTS = [
  {
    icon: "mail-outline" as const,
    label: "Email BAA",
    value: "baa@uym.ac.id",
    action: () => Linking.openURL("mailto:baa@uym.ac.id"),
  },
  {
    icon: "logo-whatsapp" as const,
    label: "WhatsApp Helpdesk",
    value: "+62 812-1933-4093",
    action: () => Linking.openURL("https://wa.me/6281219334093"),
  },
  {
    icon: "globe-outline" as const,
    label: "Portal SIAKAD",
    value: "siakad.uym.ac.id",
    action: () => Linking.openURL("https://siakad.uym.ac.id"),
  },
  {
    icon: "location-outline" as const,
    label: "Kantor BAA",
    value: "Kampus Karawaci",
    action: undefined,
  },
];

export default function Bantuan() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIdx((prev) => (prev === idx ? null : idx));
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
          <Text style={g.headerTitle}>Pusat Bantuan</Text>
          <Text style={g.headerSub}>Universitas Yatsi Madani · SIAKAD</Text>
        </View>

        <View style={g.body}>
          {/* INFO BOX */}
          <View style={g.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={Colors.primary}
              style={{ marginTop: 1 }}
            />
            <Text style={g.infoBoxText}>
              Jika mengalami kendala teknis, pastikan koneksi internet Anda
              stabil dan coba muat ulang aplikasi sebelum menghubungi helpdesk.
            </Text>
          </View>

          {/* HUBUNGI KAMI */}
          <View style={styles.sectionWrap}>
            <View style={[g.sectionHeader, { marginBottom: 12 }]}>
              <Ionicons name="call-outline" size={14} color={Colors.primary} />
              <Text style={g.sectionTitle}>Hubungi Kami</Text>
            </View>

            {CONTACTS.map((c, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  g.card,
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    marginBottom: 8,
                  },
                  !c.action && { opacity: 0.8 },
                ]}
                onPress={c.action}
                disabled={!c.action}
                activeOpacity={0.75}
              >
                <View style={g.iconWrap}>
                  <Ionicons name={c.icon} size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={g.infoLabel}>{c.label}</Text>
                  <Text style={g.infoValue}>{c.value}</Text>
                </View>
                {c.action && (
                  <Ionicons name="open-outline" size={14} color={Colors.hint} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* JAM OPERASIONAL */}
          <View style={styles.jamCard}>
            <View style={styles.jamHeader}>
              <Ionicons name="time-outline" size={14} color={Colors.primary} />
              <Text style={styles.jamTitle}>JAM OPERASIONAL BAA</Text>
            </View>
            <View style={styles.jamRow}>
              <Text style={styles.jamDay}>Senin – Jumat</Text>
              <Text style={styles.jamTime}>08.00 – 16.00 WIB</Text>
            </View>
            <View style={[styles.jamRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.jamDay}>Sabtu – Minggu</Text>
              <Text style={[styles.jamTime, { color: Colors.dangerText }]}>
                Tutup
              </Text>
            </View>
          </View>

          {/* FAQ */}
          <View style={styles.sectionWrap}>
            <View style={[g.sectionHeader, { marginBottom: 12 }]}>
              <Ionicons
                name="help-circle-outline"
                size={14}
                color={Colors.primary}
              />
              <Text style={g.sectionTitle}>Pertanyaan Umum</Text>
            </View>

            {FAQS.map((faq, i) => {
              const isOpen = openIdx === i;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.faqCard, isOpen && styles.faqCardOpen]}
                  onPress={() => toggle(i)}
                  activeOpacity={0.75}
                >
                  <View style={styles.faqHeader}>
                    <Text
                      style={[styles.faqQ, isOpen && { color: Colors.primary }]}
                    >
                      {faq.q}
                    </Text>
                    <Ionicons
                      name={isOpen ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={isOpen ? Colors.primary : Colors.hint}
                    />
                  </View>
                  {isOpen && <Text style={styles.faqA}>{faq.a}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* VERSI APLIKASI */}
          <Text style={[g.footer, { marginTop: 24 }]}>
            © {new Date().getFullYear()} Universitas Yatsi Madani
            {"\n"}SIAKAD Mobile · v1.0.0 · KEVIN ARDIANSYAH
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionWrap: { marginTop: 20 },

  // ── jam operasional ──
  jamCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12, // was 8
    borderWidth: 0.5,
    borderColor: Colors.primaryMid,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    padding: 14,
    marginTop: 20,
    gap: 10,
  },
  jamHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  jamTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: 1,
  },
  jamRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryMid,
  },
  jamDay: { fontSize: 13, color: Colors.text, fontWeight: "500" },
  jamTime: { fontSize: 13, fontWeight: "700", color: Colors.primary },

  // ── faq ──
  faqCard: {
    backgroundColor: Colors.card,
    borderRadius: 12, // was 8
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
    gap: 10,
  },
  faqCardOpen: {
    borderColor: Colors.primary,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  faqQ: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    lineHeight: 20,
  },
  faqA: {
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 19,
  },
});
