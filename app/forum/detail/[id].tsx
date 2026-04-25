import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { useAuth } from "@/store/auth";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const stripHtml = (html: string) => {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const time = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (isToday) return time;
  if (isYesterday) return `Kemarin ${time}`;
  return `${date.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} ${time}`;
};

export default function ForumDetail() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);

  const [forum, setForum] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (id) getData();
    return () => {
      wsRef.current?.close();
    };
  }, [id]);

  const getData = async () => {
    try {
      const res = await API.get(`/v2/lms/forum/${id}`);
      const data = res.data.data;
      setForum(data);
      if (!data?.id_forum_chat || !data?.id_group_chat) return;
      connectWS(data);
    } catch (err: any) {
      console.log("❌ ERROR:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const connectWS = (data: any) => {
    const ws = new WebSocket("wss://chat.multisite.kampusmu.com/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          intent: "register",
          body: { id: user?.uuid, usage: "lms" },
          token,
        }),
      );
      setTimeout(() => {
        ws.send(
          JSON.stringify({
            intent: "select-forum",
            body: { id: data.id_forum_chat, groupId: data.id_group_chat },
            token,
          }),
        );
      }, 500);
    };

    ws.onmessage = (event) => {
      try {
        if (typeof event.data !== "string" || !event.data.startsWith("{"))
          return;
        const res = JSON.parse(event.data);
        if (res.topic === "selectForumResponse") {
          setMessages(res.chats || []);
          setTimeout(
            () => scrollRef.current?.scrollToEnd({ animated: false }),
            100,
          );
        }
        if (res.topic === "newMessage") {
          setMessages((prev) => [...prev, res.chat]);
          setTimeout(
            () => scrollRef.current?.scrollToEnd({ animated: true }),
            100,
          );
        }
      } catch (err) {
        console.log("❌ PARSE ERROR:", err);
      }
    };

    ws.onerror = (e) => console.log("❌ WS ERROR:", e);
    ws.onclose = () => console.log("🔴 WS CLOSED");
  };

  const handleSend = async () => {
    if (!input.trim() || !forum?.id_forum_chat) return;
    setSending(true);
    try {
      wsRef.current?.send(
        JSON.stringify({
          intent: "send-message",
          body: {
            forumId: forum.id_forum_chat,
            groupId: forum.id_group_chat,
            message: input.trim(),
          },
          token,
        }),
      );
      setInput("");
    } catch (err: any) {
      console.log(err);
    } finally {
      setSending(false);
    }
  };

  const groupedMessages = messages.reduce((groups: any[], m, i) => {
    const dateStr = m.created_at ?? m.timestamp;
    const date = dateStr ? new Date(dateStr).toDateString() : null;
    const prevDateStr =
      i > 0 ? (messages[i - 1].created_at ?? messages[i - 1].timestamp) : null;
    const prevDate = prevDateStr ? new Date(prevDateStr).toDateString() : null;

    if (date && date !== prevDate) {
      const now = new Date();
      const msgDate = new Date(m.created_at ?? m.timestamp);
      const isToday = msgDate.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = msgDate.toDateString() === yesterday.toDateString();
      const label = isToday
        ? "Hari ini"
        : isYesterday
          ? "Kemarin"
          : msgDate.toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            });
      groups.push({ type: "date", label });
    }

    groups.push({ type: "message", data: m });
    return groups;
  }, []);

  return (
    <SafeAreaView style={g.safeArea}>
      {/* ── Header biru ── */}
      <View style={styles.header}>
        <View style={styles.decor1} />
        <View style={styles.decor2} />
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {loading ? "Memuat..." : forum?.judul || "Forum"}
            </Text>
            <Text style={styles.headerSub}>
              {messages.length > 0
                ? `${messages.length} pesan`
                : "Forum Diskusi"}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Soal Diskusi ── */}
      {forum?.deskripsi ? (
        <View style={styles.soalBox}>
          <View style={styles.soalLabelRow}>
            <Ionicons
              name="document-text-outline"
              size={12}
              color={Colors.primary}
            />
            <Text style={styles.soalLabel}>Soal Diskusi</Text>
          </View>
          <Text style={styles.soalText}>{stripHtml(forum.deskripsi)}</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* ── Chat area ── */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, backgroundColor: Colors.bg }}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: false })
          }
        >
          {loading ? (
            [1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.skeletonBubble,
                  i % 2 === 0
                    ? { alignSelf: "flex-end" }
                    : { alignSelf: "flex-start" },
                ]}
              >
                <View
                  style={[
                    styles.skeletonBlock,
                    { height: 12, width: 120, marginBottom: 6 },
                  ]}
                />
                <View
                  style={[styles.skeletonBlock, { height: 12, width: 80 }]}
                />
              </View>
            ))
          ) : messages.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons
                name="chatbubbles-outline"
                size={40}
                color={Colors.border}
              />
              <Text style={styles.emptyText}>Belum ada diskusi</Text>
              <Text style={styles.emptySubText}>
                Jadilah yang pertama memulai
              </Text>
            </View>
          ) : (
            groupedMessages.map((item, i) => {
              if (item.type === "date") {
                return (
                  <View key={`date-${i}`} style={styles.dateSeparator}>
                    <View style={styles.dateLine} />
                    <Text style={styles.dateLabel}>{item.label}</Text>
                    <View style={styles.dateLine} />
                  </View>
                );
              }

              const m = item.data;
              const sender = m.from ?? m.user;
              const senderId = sender?.id ?? sender?.uuid ?? m.sender_id;
              const userId = user?.id ?? user?.uuid;
              const isMe = !!userId && senderId === userId;

              return (
                <View
                  key={i}
                  style={[
                    styles.bubbleWrap,
                    isMe
                      ? { alignItems: "flex-end" }
                      : { alignItems: "flex-start" },
                  ]}
                >
                  <Text
                    style={[
                      styles.senderName,
                      isMe && { color: Colors.muted, textAlign: "right" },
                    ]}
                  >
                    {isMe ? "Saya" : sender?.name || "User"}
                  </Text>
                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.myBubble : styles.otherBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isMe ? { color: "#fff" } : { color: Colors.text },
                      ]}
                    >
                      {stripHtml(m.message || "-")}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text
                        style={[
                          styles.timeText,
                          isMe
                            ? { color: "rgba(255,255,255,0.6)" }
                            : { color: Colors.hint },
                        ]}
                      >
                        {formatTime(m.created_at ?? m.timestamp)}
                      </Text>
                      {isMe && (
                        <Ionicons
                          name="checkmark-done"
                          size={12}
                          color="rgba(255,255,255,0.6)"
                          style={{ marginLeft: 3 }}
                        />
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* ── Input bar ── */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Tulis pesan..."
            placeholderTextColor={Colors.hint}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!input.trim() || sending) && { opacity: 0.4 },
            ]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── Header ──
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    overflow: "hidden",
  },
  decor1: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  decor2: {
    position: "absolute",
    bottom: -30,
    left: -16,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  headerSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    marginTop: 1,
  },

  // ── Soal Diskusi ──
  soalBox: {
    backgroundColor: Colors.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    margin: 12,
    borderRadius: 8,
  },
  soalLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  soalLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  soalText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },

  // ── Chat ──
  chatContent: { padding: 16, paddingBottom: 8, gap: 4 },

  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    gap: 8,
  },
  dateLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dateLabel: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: "600",
    paddingHorizontal: 4,
  },

  bubbleWrap: { marginBottom: 8 },
  senderName: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "600",
    marginBottom: 3,
    marginLeft: 4,
    marginRight: 4,
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  myBubble: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderBottomLeftRadius: 2,
  },
  messageText: { fontSize: 14, lineHeight: 20 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  timeText: { fontSize: 10 },

  // ── Empty ──
  empty: { alignItems: "center", paddingVertical: 56, gap: 8 },
  emptyText: { fontSize: 14, color: Colors.muted, fontWeight: "600" },
  emptySubText: { fontSize: 12, color: Colors.hint },

  // ── Input bar ──
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Skeleton ──
  skeletonBubble: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    maxWidth: "60%",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skeletonBlock: { backgroundColor: Colors.skeletonBase, borderRadius: 6 },
});
