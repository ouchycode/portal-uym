import { Colors, globalStyles as g } from "@/constants/theme";
import { useAuth } from "@/store/auth";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setAuth = useAuth((s) => s.setAuth);

  const handleLogin = async () => {
    setError("");
    if (!username || !password) {
      setError("NIM dan password wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      const loginRes = await fetch(
        "https://mahasiswa.lms.uym.ac.id/v2/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "college-id": "041105",
          },
          body: JSON.stringify({
            username,
            password,
            client_id: "web",
            grant_type: "password",
          }),
        },
      );
      const loginData = await loginRes.json();
      if (!loginData?.access_token) {
        setError("NIM atau password salah.");
        return;
      }
      const token = loginData.access_token;
      const profileRes = await fetch(
        `https://mahasiswa.lms.uym.ac.id/v1/mahasiswa/${username}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "college-id": "041105",
          },
        },
      );
      const profileData = await profileRes.json();
      setAuth(token, profileData);
      router.replace("/(tabs)/home");
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.decor1} />
        <View style={styles.decor2} />
        <View style={styles.decor3} />
        <View style={styles.decor4} />

        <View style={styles.brand}>
          <View style={styles.logoBox}>
            <Image
              source={{ uri: "https://uym.ac.id/assets/internal/logo-uym.png" }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={styles.uniName}>Universitas Yatsi Madani</Text>
            <Text style={styles.lmsLabel}>Sistem Informasi Akademik</Text>
          </View>
        </View>

        <View style={styles.portalBadge}>
          <Text style={styles.portalBadgeText}>PORTAL MAHASISWA</Text>
        </View>
        <Text style={styles.greeting}>Selamat datang{"\n"}kembali 👋</Text>
        <Text style={styles.greetingSub}>Masuk dengan akun SIAKAD Anda</Text>
      </View>
      {/* CARD FORM */}
      <View style={styles.card}>
        {/* NIM */}
        <View>
          <Text style={g.inputLabel}>NIM</Text>
          <View style={[g.inputWrap, { height: 48 }]}>
            <Feather name="file-text" size={16} color={Colors.hint} />
            <TextInput
              style={g.inputField}
              placeholder="Nomor Induk Mahasiswa"
              placeholderTextColor={Colors.hint}
              keyboardType="numeric"
              autoCapitalize="none"
              onChangeText={(v) => {
                setUsername(v);
                setError("");
              }}
              value={username}
            />
          </View>
        </View>

        {/* PASSWORD */}
        <View style={{ marginTop: 14 }}>
          <View style={styles.labelRow}>
            <Text style={g.inputLabel}>Password</Text>
          </View>
          <View style={[g.inputWrap, { height: 48 }]}>
            <Feather name="lock" size={16} color={Colors.hint} />
            <TextInput
              style={g.inputField}
              placeholder="Kata sandi"
              placeholderTextColor={Colors.hint}
              secureTextEntry={!showPass}
              onChangeText={(v) => {
                setPassword(v);
                setError("");
              }}
              value={password}
            />
            <TouchableOpacity onPress={() => setShowPass((p) => !p)}>
              <Feather
                name={showPass ? "eye-off" : "eye"}
                size={16}
                color={Colors.hint}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ERROR */}
        {error ? (
          <View style={g.errorBox}>
            <Feather name="alert-circle" size={14} color={Colors.error} />
            <Text style={g.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginBtn, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={g.btnPrimaryText}>Masuk ke SIAKAD</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        {/* INFO BOX */}
        <View style={g.infoBox}>
          <Feather
            name="info"
            size={13}
            color={Colors.primary}
            style={{ marginTop: 1 }}
          />
          <Text style={g.infoBoxText}>
            Gunakan NIM dan password{" "}
            <Text style={{ fontWeight: "700" }}>SIAKAD</Text> yang sama. Hubungi
            BAA jika mengalami kendala login.
          </Text>
        </View>

        {/* QUICK LINK */}
        <View style={g.quickLinkRow}>
          <TouchableOpacity style={g.quickLinkCard} activeOpacity={0.7}>
            <View style={g.iconWrap}>
              <Feather name="message-circle" size={16} color={Colors.primary} />
            </View>
            <View>
              <Text style={g.quickLinkTitle}>Helpdesk</Text>
              <Text style={g.quickLinkSub}>Butuh bantuan?</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={g.quickLinkCard} activeOpacity={0.7}>
            <View style={g.iconWrap}>
              <Feather name="mail" size={16} color={Colors.primary} />
            </View>
            <View>
              <Text style={g.quickLinkTitle}>Email BAA</Text>
              <Text style={g.quickLinkSub}>baa@uym.ac.id</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={g.footer}>
          © {new Date().getFullYear()} UYM · KEVIN ARDIANSYAH
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 56,
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
    bottom: -50,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  decor3: {
    position: "absolute",
    top: 30,
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  decor4: {
    position: "absolute",
    bottom: 24,
    right: 80,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  uniName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  lmsLabel: { fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 },
  portalBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 14,
  },
  portalBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  greetingSub: { fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 6 },
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 24,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 32,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  forgotText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
});
