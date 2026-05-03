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
  ScrollView,
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
          headers: { Authorization: `Bearer ${token}`, "college-id": "041105" },
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
      style={g.safeArea}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* BRAND */}
        <View style={styles.brand}>
          <View style={styles.logoBox}>
            <Image
              source={{ uri: "https://uym.ac.id/assets/internal/logo-uym.png" }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.uniName}>Universitas Yatsi Madani</Text>
          <Text style={[g.pageSubtitle, { color: Colors.muted }]}>
            Sistem Informasi Akademik
          </Text>
        </View>

        {/* FORM */}
        <View style={g.card}>
          <Text style={[g.pageTitle, { color: Colors.primary }]}>
            Masuk ke Akun
          </Text>
          {/* NIM */}
          <View>
            <Text style={g.inputLabel}>NIM</Text>
            <View style={g.inputWrap}>
              <Feather name="user" size={15} color={Colors.hint} />
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
          <View>
            <Text style={g.inputLabel}>Password</Text>
            <View style={g.inputWrap}>
              <Feather name="lock" size={15} color={Colors.hint} />
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
                  size={15}
                  color={Colors.hint}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* ERROR */}
          {error ? (
            <View style={g.errorBox}>
              <Feather name="alert-circle" size={13} color={Colors.error} />
              <Text style={g.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* SUBMIT */}
          <TouchableOpacity
            style={[g.btnPrimary, loading && { opacity: 0.65 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={g.btnPrimaryText}>Masuk</Text>
            )}
          </TouchableOpacity>

          {/* INFO */}
          <View style={g.infoBox}>
            <Feather
              name="info"
              size={13}
              color={Colors.primary}
              style={{ marginTop: 1 }}
            />
            <Text style={g.infoBoxText}>
              Hubungi BAA jika mengalami kendala login.
            </Text>
          </View>
        </View>

        {/* HELP */}
        <View style={g.quickLinkRow}>
          <TouchableOpacity style={g.quickLinkCard} activeOpacity={0.7}>
            <View style={g.iconWrap}>
              <Feather name="message-circle" size={15} color={Colors.primary} />
            </View>
            <View>
              <Text style={g.quickLinkTitle}>Helpdesk</Text>
              <Text style={g.quickLinkSub}>Butuh bantuan?</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={g.quickLinkCard} activeOpacity={0.7}>
            <View style={g.iconWrap}>
              <Feather name="mail" size={15} color={Colors.primary} />
            </View>
            <View>
              <Text style={g.quickLinkTitle}>Email BAA</Text>
              <Text style={g.quickLinkSub}>baa@uym.ac.id</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={g.footer}>
          © {new Date().getFullYear()} Universitas Yatsi Madani
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 40,
    backgroundColor: Colors.bg,
  },
  brand: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 0.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logo: {
    width: 60,
    height: 60,
  },
  uniName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
});
