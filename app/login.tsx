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
      {/* Header biru */}
      <View style={styles.header}>
        <View style={styles.decor1} />
        <View style={styles.decor2} />
        <View style={styles.decor3} />
        <View style={styles.brand}>
          <Image
            source={{ uri: "https://uym.ac.id/assets/internal/logo-uym.png" }}
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.uniName}>Universitas Yatsi Madani</Text>
            <Text style={styles.lmsLabel}>Learning Management System</Text>
          </View>
        </View>
        <Text style={styles.greeting}>Selamat datang{"\n"}kembali 👋</Text>
        <Text style={styles.greetingSub}>Silakan masuk untuk melanjutkan.</Text>
      </View>

      {/* Card form */}
      <View style={styles.card}>
        <Text style={g.inputLabel}>NIM</Text>
        <View style={g.inputWrap}>
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

        <Text style={[g.inputLabel, { marginTop: 14 }]}>Password</Text>
        <View style={g.inputWrap}>
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

        {error ? (
          <View style={g.errorBox}>
            <Feather name="alert-circle" size={14} color={Colors.error} />
            <Text style={g.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[g.btnPrimary, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={g.btnPrimaryText}>Masuk</Text>
          )}
        </TouchableOpacity>

        <View style={g.infoBox}>
          <Feather
            name="info"
            size={13}
            color={Colors.primary}
            style={{ marginTop: 1 }}
          />
          <Text style={g.infoBoxText}>
            Gunakan NIM dan password SIAKAD yang sama untuk login.
          </Text>
        </View>

        <Text style={g.footer}>
          © {new Date().getFullYear()} UYM · KEVIN ARDIANSYAH
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 52,
    overflow: "hidden",
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
    top: 28,
    right: 28,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  uniName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  lmsLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 30,
  },
  greetingSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 24,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
});
