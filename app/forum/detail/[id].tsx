import { SkeletonBlock } from "@/components/SkeletonBlock";
import { Colors, globalStyles as g } from "@/constants/theme";
import API from "@/lib/api";
import { useAuth } from "@/store/auth";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ActionSheetIOS,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

const isImageUrl = (url: string) =>
  /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  _id?: string;
  id?: string;
  message?: string;
  created_at?: string;
  timestamp?: string;
  from?: { id?: string; uuid?: string; name?: string };
  user?: { id?: string; uuid?: string; name?: string };
  sender_id?: string;
  reply_to?: {
    id?: string;
    message?: string;
    sender_name?: string;
    attachment_url?: string;
  };
  attachment_url?: string;
  attachment_type?: "image" | "file";
  attachment_name?: string;
  attachment?: string;
  imgPlaceholder?: string;
  attachmentFileName?: string;
  deleted?: boolean;
  isUnsent?: boolean;
  threadId?: string;
}

interface ThreadData {
  id: string;
  totalChat: number;
  unreadChat: number;
  firstChat?: {
    id?: string;
    from?: { name?: string };
    message?: string;
  };
}

interface ActiveThread {
  id: string;
  chats: ChatMessage[];
  loading: boolean;
  parentMessage?: ChatMessage;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getAttachmentUrl = (m: ChatMessage): string | undefined =>
  m.attachment ?? m.attachment_url;

const getAttachmentName = (m: ChatMessage): string | undefined =>
  m.attachmentFileName ?? m.attachment_name;

const isDeleted = (m: ChatMessage): boolean => !!(m.deleted || m.isUnsent);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const BubbleSkeleton = ({ align }: { align: "left" | "right" }) => (
  <View
    style={[
      styles.skeletonBubble,
      align === "right"
        ? { alignSelf: "flex-end" }
        : { alignSelf: "flex-start" },
    ]}
  >
    <SkeletonBlock height={10} width={align === "right" ? 40 : 80} />
    <SkeletonBlock height={12} width={120} />
    <SkeletonBlock height={12} width={align === "right" ? 80 : 100} />
    <View style={{ alignSelf: "flex-end" }}>
      <SkeletonBlock height={9} width={40} />
    </View>
  </View>
);

// ─── Reply Preview ─────────────────────────────────────────────────────────────
const ReplyPreview = ({
  replyTo,
  onCancel,
}: {
  replyTo: ChatMessage;
  onCancel: () => void;
}) => {
  const sender = replyTo.from ?? replyTo.user;
  const senderName = sender?.name ?? "User";
  const attUrl = getAttachmentUrl(replyTo);
  const attName = getAttachmentName(replyTo);
  const preview = isDeleted(replyTo)
    ? "Pesan telah dihapus"
    : attUrl
      ? isImageUrl(attUrl)
        ? "📷 Gambar"
        : `📎 ${attName ?? "File"}`
      : stripHtml(replyTo.message ?? "");

  return (
    <View style={styles.replyPreview}>
      <View style={styles.replyPreviewBar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.replyPreviewName}>{senderName}</Text>
        <Text style={styles.replyPreviewText} numberOfLines={1}>
          {preview}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onCancel}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      >
        <Ionicons name="close" size={18} color={Colors.muted} />
      </TouchableOpacity>
    </View>
  );
};

// ─── Quote Bubble ──────────────────────────────────────────────────────────────
const QuoteBubble = ({
  replyTo,
  isMe,
}: {
  replyTo: NonNullable<ChatMessage["reply_to"]>;
  isMe: boolean;
}) => (
  <View
    style={[
      styles.quoteBubble,
      isMe ? styles.quoteBubbleMe : styles.quoteBubbleOther,
    ]}
  >
    <Text
      style={[styles.quoteNameText, isMe && { color: "rgba(255,255,255,0.9)" }]}
    >
      {replyTo.sender_name ?? "User"}
    </Text>
    <Text
      style={[styles.quoteText, isMe && { color: "rgba(255,255,255,0.7)" }]}
      numberOfLines={2}
    >
      {replyTo.attachment_url
        ? isImageUrl(replyTo.attachment_url)
          ? "📷 Gambar"
          : "📎 File"
        : stripHtml(replyTo.message ?? "")}
    </Text>
  </View>
);

// ─── Message Bubble ────────────────────────────────────────────────────────────
const MessageBubble = ({
  m,
  isMe,
  onReply,
  onDelete,
  showActions = true,
}: {
  m: ChatMessage;
  isMe: boolean;
  onReply?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}) => {
  const sender = m.from ?? m.user;
  const attUrl = getAttachmentUrl(m);
  const attName = getAttachmentName(m);
  const deleted = isDeleted(m);
  const isLecturer = (sender as any)?.type === "lecturer";

  return (
    <View
      style={[
        styles.bubbleWrap,
        isMe ? { alignItems: "flex-end" } : { alignItems: "flex-start" },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          marginBottom: 3,
          marginLeft: 4,
          marginRight: 4,
        }}
      >
        <Text
          style={[
            styles.senderName,
            { marginBottom: 0, marginLeft: 0, marginRight: 0 },
            isMe && { color: Colors.muted, textAlign: "right" },
            isLecturer && !isMe && { color: "#e67e22" },
          ]}
        >
          {isMe ? "Saya" : sender?.name || "User"}
        </Text>
        {isLecturer && !isMe && (
          <View
            style={{
              backgroundColor: "#fef3e2",
              borderRadius: 4,
              paddingHorizontal: 5,
              paddingVertical: 1,
              borderWidth: 0.5,
              borderColor: "#f0a500",
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: "700", color: "#e67e22" }}>
              Dosen
            </Text>
          </View>
        )}
      </View>

      <View
        style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}
      >
        {m.reply_to && !deleted && (
          <QuoteBubble replyTo={m.reply_to} isMe={isMe} />
        )}

        {deleted ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons
              name="ban-outline"
              size={13}
              color={isMe ? "rgba(255,255,255,0.5)" : Colors.muted}
            />
            <Text
              style={[
                styles.deletedText,
                isMe && { color: "rgba(255,255,255,0.5)" },
              ]}
            >
              Pesan telah dihapus
            </Text>
          </View>
        ) : (
          <>
            {attUrl && isImageUrl(attUrl) && (
              <Image
                source={{ uri: attUrl }}
                style={styles.attachmentImage}
                resizeMode="cover"
              />
            )}
            {attUrl && !isImageUrl(attUrl) && (
              <View
                style={[
                  styles.attachmentFile,
                  isMe ? styles.attachmentFileMe : styles.attachmentFileOther,
                ]}
              >
                <Ionicons
                  name="document-outline"
                  size={22}
                  color={isMe ? "rgba(255,255,255,0.85)" : Colors.primary}
                />
                <Text
                  style={[
                    styles.attachmentFileName,
                    isMe && { color: "rgba(255,255,255,0.9)" },
                  ]}
                  numberOfLines={1}
                >
                  {attName ?? "File"}
                </Text>
              </View>
            )}
            {!!m.message?.trim() && (
              <Text
                style={[
                  styles.messageText,
                  isMe ? { color: "#fff" } : { color: Colors.text },
                ]}
              >
                {stripHtml(m.message)}
              </Text>
            )}
          </>
        )}

        <View style={styles.metaRow}>
          <Text
            style={[
              styles.timeText,
              isMe
                ? { color: "rgba(255,255,255,0.6)" }
                : { color: Colors.hint },
            ]}
          >
            {formatTime(m.created_at ?? m.timestamp ?? "")}
          </Text>
          {isMe && !deleted && (
            <Ionicons
              name="checkmark-done"
              size={12}
              color="rgba(255,255,255,0.6)"
              style={{ marginLeft: 3 }}
            />
          )}
        </View>
      </View>

      {showActions && !deleted && (
        <View
          style={[
            styles.actionRow,
            isMe ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" },
          ]}
        >
          {onReply && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onReply}
              activeOpacity={0.7}
            >
              <Ionicons
                name="return-down-back-outline"
                size={12}
                color={Colors.muted}
              />
              <Text style={styles.actionBtnText}>Balas</Text>
            </TouchableOpacity>
          )}
          {isMe && onDelete && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDelete]}
              onPress={onDelete}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={12} color="#e74c3c" />
              <Text style={[styles.actionBtnText, { color: "#e74c3c" }]}>
                Hapus
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

// ─── Thread Modal ─────────────────────────────────────────────────────────────
const ThreadModal = ({
  visible,
  thread,
  user,
  token,
  forum,
  wsRef,
  onClose,
  onDeleteMessage,
  setActiveThreadChats,
}: {
  visible: boolean;
  thread: ActiveThread | null;
  user: any;
  token: string;
  forum: any;
  wsRef: React.MutableRefObject<WebSocket | null>;
  onClose: () => void;
  onDeleteMessage: (msgId: string) => void;
  setActiveThreadChats: (
    updater: (prev: ChatMessage[]) => ChatMessage[],
  ) => void;
}) => {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<{
    uri: string;
    type: "image" | "file";
    name: string;
    path?: string;
    url?: string;
  } | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(
        () => scrollRef.current?.scrollToEnd({ animated: false }),
        200,
      );
    }
  }, [visible, thread?.chats]);

  useEffect(() => {
    if (!visible || !thread?.id) return;
    const interval = setInterval(() => {
      wsRef.current?.send(
        JSON.stringify({
          intent: "select-thread",
          body: {
            id: thread.id,
            groupId: forum?.id_group_chat,
            forumId: forum?.id_forum_chat,
          },
          token,
        }),
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [visible, thread?.id]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await uploadAttachment(asset.uri, "image", asset.fileName ?? "image.jpg");
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await uploadAttachment(asset.uri, "file", asset.name);
  };

  const handleAttachmentPick = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Pilih Gambar", "Pilih File", "Batal"],
          cancelButtonIndex: 2,
        },
        async (idx) => {
          if (idx === 0) await pickImage();
          if (idx === 1) await pickFile();
        },
      );
    } else {
      Alert.alert("Lampiran", "Pilih jenis lampiran", [
        { text: "Gambar", onPress: pickImage },
        { text: "File", onPress: pickFile },
        { text: "Batal", style: "cancel" },
      ]);
    }
  };

  const uploadAttachment = async (
    uri: string,
    type: "image" | "file",
    name: string,
  ) => {
    setUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri,
        name,
        type: type === "image" ? "image/jpeg" : "application/octet-stream",
      } as any);
      if (forum?.id_forum_chat) formData.append("forumId", forum.id_forum_chat);
      const res = await API.post("/v2/chat/chat/attach", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAttachmentPreview({
        uri,
        type,
        name,
        path: res.data.path,
        url: res.data.url,
      });
    } catch {
      Alert.alert("Gagal", "Gagal mengunggah lampiran. Coba lagi.");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleSend = async () => {
    const hasText = input.trim().length > 0;
    const hasAttachment = !!attachmentPreview?.url;
    if ((!hasText && !hasAttachment) || !thread?.id) return;

    setSending(true);
    try {
      const payload: any = {
        intent: "group-send-message",
        body: {
          groupId: forum?.id_group_chat,
          forumId: forum?.id_forum_chat,
          message: input.trim(),
          threadId: thread.id, // ← ini kuncinya
        },
        message: input.trim(),
        timestamp: new Date().toISOString(),
        token,
      };

      if (hasAttachment && attachmentPreview) {
        payload.attachment_url = attachmentPreview.url;
        payload.attachment_type = attachmentPreview.type;
        payload.attachment_name = attachmentPreview.name;
      }

      wsRef.current?.send(JSON.stringify(payload));

      // Optimistic update
      const newMsg: ChatMessage = {
        id: String(Date.now()),
        message: input.trim(),
        timestamp: new Date().toISOString(),
        from: { name: user?.nama },
        threadId: thread.id,
        ...(hasAttachment && attachmentPreview
          ? {
              attachment: attachmentPreview.url,
              attachmentFileName: attachmentPreview.name,
            }
          : {}),
      };
      setActiveThreadChats((prev) => [...prev, newMsg]);

      setInput("");
      setAttachmentPreview(null);
    } catch (err: any) {
      Alert.alert("Gagal", "Pesan gagal dikirim.");
    } finally {
      setSending(false);
    }
  };

  if (!thread) return null;

  const parentMsg = thread.parentMessage;
  const parentSender = parentMsg?.from ?? parentMsg?.user;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <View style={styles.threadHeader}>
          <TouchableOpacity onPress={onClose} style={styles.threadCloseBtn}>
            <Ionicons name="close" size={22} color={Colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.threadHeaderTitle}>Balasan</Text>
            <Text style={styles.threadHeaderSub}>
              {thread.chats.length} pesan
            </Text>
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {parentMsg && (
              <View style={styles.threadParentBox}>
                <View style={styles.threadParentLabelRow}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={11}
                    color={Colors.primary}
                  />
                  <Text style={styles.threadParentLabel}>Pesan Asli</Text>
                </View>
                <Text style={styles.threadParentSender}>
                  {parentSender?.name ?? "User"}
                </Text>
                {(() => {
                  const attUrl = getAttachmentUrl(parentMsg);
                  return attUrl && isImageUrl(attUrl) ? (
                    <Image
                      source={{ uri: attUrl }}
                      style={[styles.attachmentImage, { marginTop: 6 }]}
                      resizeMode="cover"
                    />
                  ) : null;
                })()}
                {!!parentMsg.message?.trim() && (
                  <Text style={styles.threadParentText} numberOfLines={4}>
                    {stripHtml(parentMsg.message)}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.dateSeparator}>
              <View style={styles.dateLine} />
              <Text style={styles.dateLabel}>
                {thread.chats.length} Balasan
              </Text>
              <View style={styles.dateLine} />
            </View>

            {thread.loading ? (
              <>
                <BubbleSkeleton align="left" />
                <BubbleSkeleton align="right" />
              </>
            ) : thread.chats.length === 0 ? (
              <View style={g.empty}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={36}
                  color={Colors.border}
                />
                <Text style={g.emptyTitle}>Belum ada balasan</Text>
              </View>
            ) : (
              thread.chats.map((m, i) => {
                const sender = m.from ?? m.user;

                const isMe =
                  !!user?.nama &&
                  (sender?.name === user?.nama ||
                    (m.from?.id ?? m.from?.uuid) ===
                      decodeJwtUuid(token ?? ""));

                return (
                  <MessageBubble
                    key={m.id ?? i}
                    m={m}
                    isMe={isMe}
                    showActions={true}
                    onDelete={
                      isMe
                        ? () => {
                            const msgId = m._id ?? m.id;

                            if (!msgId) return;
                            Alert.alert(
                              "Hapus Pesan",
                              "Yakin mau menghapus pesan ini?",
                              [
                                { text: "Batal", style: "cancel" },
                                {
                                  text: "Hapus",
                                  style: "destructive",
                                  onPress: () => onDeleteMessage(msgId),
                                },
                              ],
                            );
                          }
                        : undefined
                    }
                  />
                );
              })
            )}
          </ScrollView>

          {attachmentPreview && (
            <View style={styles.attachmentPreviewBar}>
              {attachmentPreview.type === "image" ? (
                <Image
                  source={{ uri: attachmentPreview.uri }}
                  style={styles.attachmentPreviewImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.attachmentPreviewFile}>
                  <Ionicons
                    name="document-outline"
                    size={20}
                    color={Colors.primary}
                  />
                  <Text style={styles.attachmentPreviewName} numberOfLines={1}>
                    {attachmentPreview.name}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => setAttachmentPreview(null)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Ionicons name="close-circle" size={20} color={Colors.muted} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputBar}>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={handleAttachmentPick}
              disabled={uploadingAttachment}
              activeOpacity={0.7}
            >
              {uploadingAttachment ? (
                <Ionicons
                  name="hourglass-outline"
                  size={20}
                  color={Colors.muted}
                />
              ) : (
                <Ionicons name="attach" size={22} color={Colors.primary} />
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Tulis balasan..."
              placeholderTextColor={Colors.hint}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                ((!input.trim() && !attachmentPreview) ||
                  sending ||
                  uploadingAttachment) && { opacity: 0.4 },
              ]}
              onPress={handleSend}
              disabled={
                (!input.trim() && !attachmentPreview) ||
                sending ||
                uploadingAttachment
              }
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const decodeJwtUuid = (token: string): string => {
  try {
    const base64 = token.split(".")[1];
    const decoded = JSON.parse(atob(base64));
    return decoded.uuid ?? "";
  } catch {
    return "";
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ForumDetail() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);

  const [forum, setForum] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threads, setThreads] = useState<ThreadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<{
    uri: string;
    type: "image" | "file";
    name: string;
    path?: string;
    url?: string;
  } | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [activeThread, setActiveThread] = useState<ActiveThread | null>(null);
  const [threadModalVisible, setThreadModalVisible] = useState(false);
  const [soalExpanded, setSoalExpanded] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (id) getData();
    return () => {
      wsRef.current?.close();
    };
  }, [id]);

  // ── API & WS ────────────────────────────────────────────────────────────────
  const getData = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await API.get(`/v2/lms/forum/${id}`);
      const data = res.data.data;
      setForum(data);
      if (!data?.id_forum_chat || !data?.id_group_chat) return;

      let allChats: ChatMessage[] = [];
      let allThreads: ThreadData[] = []; // ✅ FIX: akumulasi semua threads dari semua halaman
      let lastId: string | undefined = undefined;
      let hasMore = true;

      while (hasMore) {
        const chatRes = await API.get(`/v2/chat/group_chat`, {
          params: {
            forumId: data.id_forum_chat,
            groupId: data.id_group_chat,
            type: "group",
            ...(lastId ? { lastId } : {}),
          },
        });
        const chats: ChatMessage[] = chatRes.data.chats || [];
        const pageThreads: ThreadData[] = chatRes.data.threads || [];

        // ✅ FIX: merge threads dari setiap halaman, hindari duplikat
        pageThreads.forEach((t) => {
          if (!allThreads.find((existing) => existing.id === t.id)) {
            allThreads.push(t);
          }
        });

        if (chats.length === 0) {
          hasMore = false;
        } else {
          allChats = [...chats, ...allChats];
          lastId = chats[0].id;
          if (chats.length < 10) hasMore = false;
        }
      }

      setMessages(allChats.filter((m: ChatMessage) => !m.threadId));

      setThreads(allThreads);

      connectWS(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const connectWS = (data: any) => {
    // ✅ Tutup WS lama sebelum buat baru
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = new WebSocket("wss://chat.multisite.kampusmu.com/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          intent: "register",
          body: { id: decodeJwtUuid(token ?? ""), usage: "lms" },
          token,
        }),
      );
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
      } catch {}

      try {
        if (typeof event.data !== "string" || !event.data.startsWith("{"))
          return;
        const res = JSON.parse(event.data);

        if (res.topic === "newMessage") {
          const newMsg = res.chat;
          setMessages((prev) => {
            const updated = [...prev, newMsg];
            return updated;
          });

          if (newMsg?.id && !newMsg?.threadId) {
            setThreads((prev) => {
              const alreadyExists = prev.some(
                (t) => (t.firstChat as any)?.id === newMsg.id,
              );
              if (alreadyExists) return prev;
              return [
                ...prev,
                {
                  id: newMsg.id,
                  totalChat: 0,
                  unreadChat: 0,
                  firstChat: {
                    id: newMsg.id,
                    from: newMsg.from,
                    message: newMsg.message,
                  },
                },
              ];
            });
          }

          setTimeout(
            () => scrollRef.current?.scrollToEnd({ animated: true }),
            100,
          );
        }

        if (res.topic === "deleteMessage") {
          const deletedId = res.messageId ?? res.id;
          setMessages((prev) =>
            prev.map((m) =>
              (m._id ?? m.id) === deletedId
                ? { ...m, deleted: true, isUnsent: true }
                : m,
            ),
          );
        }

        // ✅ Server sudah terbukti mengirim topic ini dengan benar
        if (res.topic === "selectThreadResponse") {
          const chats = (res.chats || []).map((c: any) => ({
            ...c,
            deleted: c.isUnsent === true,
          }));
          setActiveThread((prev) =>
            prev ? { ...prev, chats, loading: false } : prev,
          );
        }

        if (res.topic === "newThreadMessage") {
          setActiveThread((prev) =>
            prev && res.chat?.threadId === prev.id
              ? { ...prev, chats: [...prev.chats, res.chat] }
              : prev,
          );
          setThreads((prev) =>
            prev.map((t) =>
              t.id === res.chat?.threadId
                ? { ...t, totalChat: t.totalChat + 1 }
                : t,
            ),
          );
        }

        const newMsg: ChatMessage = {
          id: res.id,
          message: res.message,
          timestamp: res.timestamp,
          from: res.from,
          threadId: res.threadId,
        };
      } catch {
        // abaikan pesan malformed
      }
    };

    ws.onerror = () => {};
    ws.onclose = () => {};
  };

  // ── Buka thread ─────────────────────────────────────────────────────────────
  const openThread = (msg: ChatMessage) => {
    const msgId = msg._id ?? msg.id ?? "";
    if (!msgId) return;

    const thread = threads.find((t) => (t.firstChat as any)?.id === msgId);

    if (!thread) return; // tidak ada thread untuk pesan ini

    setActiveThread({
      id: thread.id,
      chats: [],
      loading: true,
      parentMessage: msg,
    });
    setThreadModalVisible(true);

    // ✅ Pakai WS — sudah terbukti server merespons dengan selectThreadResponse
    wsRef.current?.send(
      JSON.stringify({
        intent: "select-thread",
        body: {
          id: thread.id,
          groupId: forum?.id_group_chat,
          forumId: forum?.id_forum_chat,
        },
        token,
      }),
    );
  };

  // ── Hapus pesan ─────────────────────────────────────────────────────────────
  const handleDelete = (msg: ChatMessage) => {
    const msgId = msg._id ?? msg.id;
    const groupId = forum?.id_group_chat;
    if (!msgId || !groupId) return;

    Alert.alert("Hapus Pesan", "Yakin mau menghapus pesan ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            const deleteRes = await API.delete(
              `/v2/chat/group_chat/${groupId}/${msgId}`,
            );

            const logRes = await fetch(
              `https://mahasiswa.lms.uym.ac.id/v2/lms/log_aktivitas/forum/${id}/log_hapus_komentar`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                  "college-id": "041105",
                },
                body: JSON.stringify({
                  waktu_posting: msg.created_at ?? msg.timestamp,
                  user_deleted: decodeJwtUuid(token ?? ""),
                }),
              },
            );
            setMessages((prev) =>
              prev.map((m) =>
                (m._id ?? m.id) === msgId
                  ? { ...m, deleted: true, isUnsent: true }
                  : m,
              ),
            );
          } catch (err: any) {
            const status = err?.response?.status;
            const detail = err?.response?.data?.detail ?? "";
            const msg =
              status === 400 && detail.includes("1 hour")
                ? "Pesan hanya bisa dihapus dalam 1 jam setelah dikirim."
                : "Pesan gagal dihapus. Coba lagi.";
            Alert.alert("Gagal", msg);
          }
        },
      },
    ]);
  };

  // ── Upload attachment ────────────────────────────────────────────────────────
  const handleAttachmentPick = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Pilih Gambar", "Pilih File", "Batal"],
          cancelButtonIndex: 2,
        },
        async (idx) => {
          if (idx === 0) await pickImage();
          if (idx === 1) await pickFile();
        },
      );
    } else {
      Alert.alert("Lampiran", "Pilih jenis lampiran", [
        { text: "Gambar", onPress: pickImage },
        { text: "File", onPress: pickFile },
        { text: "Batal", style: "cancel" },
      ]);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Izin dibutuhkan",
        "Izinkan akses galeri untuk mengirim gambar.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await uploadAttachment(asset.uri, "image", asset.fileName ?? "image.jpg");
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await uploadAttachment(asset.uri, "file", asset.name);
  };

  const uploadAttachment = async (
    uri: string,
    type: "image" | "file",
    name: string,
  ) => {
    setUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri,
        name,
        type: type === "image" ? "image/jpeg" : "application/octet-stream",
      } as any);
      if (forum?.id_forum_chat) formData.append("forumId", forum.id_forum_chat);
      const res = await API.post("/v2/chat/chat/attach", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAttachmentPreview({
        uri,
        type,
        name,
        path: res.data.path,
        url: res.data.url,
      });
    } catch {
      Alert.alert("Gagal", "Gagal mengunggah lampiran. Coba lagi.");
    } finally {
      setUploadingAttachment(false);
    }
  };

  // ── Kirim pesan ─────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const hasText = input.trim().length > 0;
    const hasAttachment = !!attachmentPreview?.url;
    if ((!hasText && !hasAttachment) || !forum?.id_forum_chat) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      Alert.alert("Gagal", "Koneksi terputus. Coba lagi.");
      return;
    }

    setSending(true);
    try {
      const payload: any = {
        intent: "group-send-message",
        body: {
          groupId: forum.id_group_chat,
          forumId: forum.id_forum_chat,
          message: input.trim(), // ← pindahkan ke dalam body
        },
        from: { id: decodeJwtUuid(token ?? "") },
        message: input.trim(), // ← tetap di sini juga (double)
        timestamp: new Date().toISOString(),
        token,
      };

      if (replyTo) {
        const sender = replyTo.from ?? replyTo.user;
        payload.reply_to = {
          id: replyTo._id ?? replyTo.id,
          message: replyTo.message,
          sender_name: sender?.name ?? "User",
          attachment_url: getAttachmentUrl(replyTo),
        };
      }

      if (hasAttachment && attachmentPreview) {
        payload.attachment_url = attachmentPreview.url;
        payload.attachment_type = attachmentPreview.type;
        payload.attachment_name = attachmentPreview.name;
      }

      wsRef.current.send(JSON.stringify(payload));

      // Optimistic update — tampilkan pesan langsung
      const newMsg: ChatMessage = {
        id: String(Date.now()),
        message: input.trim(),
        timestamp: new Date().toISOString(),
        from: { name: user?.nama },
        ...(replyTo
          ? {
              reply_to: {
                id: replyTo._id ?? replyTo.id,
                message: replyTo.message,
                sender_name: (replyTo.from ?? replyTo.user)?.name ?? "User",
                attachment_url: getAttachmentUrl(replyTo),
              },
            }
          : {}),
        ...(hasAttachment && attachmentPreview
          ? {
              attachment: attachmentPreview.url,
              attachmentFileName: attachmentPreview.name,
            }
          : {}),
      };

      setMessages((prev) => [...prev, newMsg]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

      setInput("");
      setReplyTo(null);
      setAttachmentPreview(null);
    } catch (err: any) {
      Alert.alert("Gagal", "Pesan gagal dikirim.");
    } finally {
      setSending(false);
    }
  };

  // ── Group messages by date ───────────────────────────────────────────────────
  const groupedMessages = messages.reduce((groups: any[], m, i) => {
    const dateStr = m.created_at ?? m.timestamp;
    const date = dateStr ? new Date(dateStr).toDateString() : null;
    const prevDateStr =
      i > 0 ? (messages[i - 1].created_at ?? messages[i - 1].timestamp) : null;
    const prevDate = prevDateStr ? new Date(prevDateStr).toDateString() : null;

    if (date && date !== prevDate) {
      const msgDate = new Date(dateStr!);
      const now = new Date();
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

  const myPostCount = messages.filter((m) => {
    const senderId = m.from?.id ?? m.from?.uuid;
    return senderId === decodeJwtUuid(token ?? "") && !isDeleted(m);
  }).length;

  const sudahCukup =
    forum?.minimal_post > 0 && myPostCount >= forum.minimal_post;

  // ── Render ───────────────────────────────────────────────────────────────────
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
        <Text style={g.headerTitle} numberOfLines={1}>
          {loading ? "Memuat..." : forum?.judul || "Forum"}
        </Text>
        <Text style={g.headerSub}>
          {error
            ? "Gagal memuat data"
            : messages.length > 0
              ? `${messages.length} pesan`
              : "Forum Diskusi"}
        </Text>
      </View>

      {/* SOAL DISKUSI */}
      {forum?.deskripsi ? (
        <TouchableOpacity
          style={[g.infoBox, { margin: 12 }]}
          onPress={() => setSoalExpanded((v) => !v)}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.soalLabelRow}>
              <Ionicons
                name="document-text-outline"
                size={12}
                color={Colors.primary}
              />
              <Text style={styles.soalLabel}>Soal Diskusi</Text>
            </View>
            <Text
              style={styles.soalText}
              numberOfLines={soalExpanded ? undefined : 2}
            >
              {stripHtml(forum.deskripsi)}
            </Text>
          </View>
          <Ionicons
            name={soalExpanded ? "chevron-up" : "chevron-down"}
            size={14}
            color={Colors.primary}
          />
        </TouchableOpacity>
      ) : null}

      {/* REMINDER BOX */}
      {!loading && forum?.minimal_post > 0 && (
        <View
          style={[
            g.warningBox,
            { marginHorizontal: 12, marginBottom: 4 },
            sudahCukup && styles.reminderBoxDone,
          ]}
        >
          <Ionicons
            name={
              sudahCukup
                ? "checkmark-circle-outline"
                : "information-circle-outline"
            }
            size={14}
            color={sudahCukup ? "#27ae60" : "#e67e22"}
          />
          <Text
            style={[g.warningBoxText, sudahCukup && styles.reminderTextDone]}
          >
            {sudahCukup
              ? `Kamu sudah mengirim ${myPostCount} pesan · syarat terpenuhi ✓`
              : `Wajib kirim minimal `}
            {!sudahCukup && (
              <Text style={{ fontWeight: "700" }}>
                {forum.minimal_post} pesan
              </Text>
            )}
            {!sudahCukup &&
              (forum?.penilaian_keaktifan ? " · dinilai keaktifan" : "")}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* CHAT AREA */}
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
            <>
              <BubbleSkeleton align="left" />
              <BubbleSkeleton align="right" />
              <BubbleSkeleton align="left" />
            </>
          ) : error ? (
            <View style={g.empty}>
              <Ionicons name="wifi-outline" size={40} color={Colors.border} />
              <Text style={g.emptyTitle}>Gagal memuat forum</Text>
              <Text style={g.emptyHint}>Periksa koneksi internet kamu</Text>
              <TouchableOpacity style={g.retryBtn} onPress={getData}>
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={g.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : messages.length === 0 ? (
            <View style={g.empty}>
              <Ionicons
                name="chatbubbles-outline"
                size={40}
                color={Colors.border}
              />
              <Text style={g.emptyTitle}>Belum ada diskusi</Text>
              <Text style={g.emptyHint}>Jadilah yang pertama memulai</Text>
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

              const m: ChatMessage = item.data;
              const sender = m.from ?? m.user;
              const isMe =
                !!user?.nama &&
                (sender?.name === user?.nama ||
                  (m.from?.id ?? m.from?.uuid) === decodeJwtUuid(token ?? ""));
              const msgId = m._id ?? m.id ?? "";

              const thread = threads.find(
                (t) => (t.firstChat as any)?.id === msgId,
              );
              const replyCount = thread?.totalChat ?? 0;

              return (
                <View key={i}>
                  <MessageBubble
                    m={m}
                    isMe={isMe}
                    onReply={() => setReplyTo(m)}
                    onDelete={() => handleDelete(m)}
                  />

                  {/* ✅ Tombol thread — hanya tampil kalau ada thread di server */}
                  {!isDeleted(m) && thread && (
                    <TouchableOpacity
                      style={[
                        styles.threadBtn,
                        isMe
                          ? { alignSelf: "flex-end" }
                          : { alignSelf: "flex-start" },
                      ]}
                      onPress={() => openThread(m)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="chatbubble-outline"
                        size={12}
                        color={replyCount > 0 ? Colors.primary : Colors.muted}
                      />
                      <Text
                        style={[
                          styles.threadBtnText,
                          replyCount > 0 && {
                            color: Colors.primary,
                            fontWeight: "600",
                          },
                        ]}
                      >
                        {replyCount > 0
                          ? `${replyCount} Balasan`
                          : "Balas di Thread"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        {/* REPLY PREVIEW */}
        {replyTo && (
          <ReplyPreview replyTo={replyTo} onCancel={() => setReplyTo(null)} />
        )}

        {/* ATTACHMENT PREVIEW */}
        {attachmentPreview && (
          <View style={styles.attachmentPreviewBar}>
            {attachmentPreview.type === "image" ? (
              <Image
                source={{ uri: attachmentPreview.uri }}
                style={styles.attachmentPreviewImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.attachmentPreviewFile}>
                <Ionicons
                  name="document-outline"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.attachmentPreviewName} numberOfLines={1}>
                  {attachmentPreview.name}
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => setAttachmentPreview(null)}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Ionicons name="close-circle" size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>
        )}

        {/* INPUT BAR */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={handleAttachmentPick}
            disabled={uploadingAttachment}
            activeOpacity={0.7}
          >
            {uploadingAttachment ? (
              <Ionicons
                name="hourglass-outline"
                size={20}
                color={Colors.muted}
              />
            ) : (
              <Ionicons name="attach" size={22} color={Colors.primary} />
            )}
          </TouchableOpacity>

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
              ((!input.trim() && !attachmentPreview) ||
                sending ||
                uploadingAttachment) && { opacity: 0.4 },
            ]}
            onPress={handleSend}
            disabled={
              (!input.trim() && !attachmentPreview) ||
              sending ||
              uploadingAttachment
            }
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* THREAD MODAL */}
      <ThreadModal
        visible={threadModalVisible}
        thread={activeThread}
        user={user}
        token={token ?? ""}
        forum={forum}
        wsRef={wsRef}
        onClose={() => {
          setThreadModalVisible(false);
          setActiveThread(null);
        }}
        setActiveThreadChats={(updater) =>
          setActiveThread((prev) =>
            prev ? { ...prev, chats: updater(prev.chats) } : prev,
          )
        }
        onDeleteMessage={async (msgId) => {
          const groupId = forum?.id_group_chat;
          if (!msgId || !groupId) return;
          try {
            await API.delete(`/v2/chat/group_chat/${groupId}/${msgId}`);

            await fetch(
              `https://mahasiswa.lms.uym.ac.id/v2/lms/log_aktivitas/forum/${id}/log_hapus_komentar`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                  "college-id": "041105",
                },
                body: JSON.stringify({
                  waktu_posting: new Date().toISOString(),
                  user_deleted: decodeJwtUuid(token ?? ""),
                }),
              },
            );

            setActiveThread((prev) =>
              prev
                ? {
                    ...prev,
                    chats: prev.chats.map((c) =>
                      (c._id ?? c.id) === msgId
                        ? { ...c, deleted: true, isUnsent: true }
                        : c,
                    ),
                  }
                : prev,
            );
          } catch (err: any) {
            const status = (err as any)?.response?.status;
            const detail = (err as any)?.response?.data?.detail ?? "";
            const msg =
              status === 400 && detail.includes("1 hour")
                ? "Pesan hanya bisa dihapus dalam 1 jam setelah dikirim."
                : "Pesan gagal dihapus. Coba lagi.";
            Alert.alert("Gagal", msg);
          }
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
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
  soalText: { fontSize: 13, color: Colors.text, lineHeight: 20 },

  reminderBoxDone: {
    backgroundColor: "#eafaf1",
    borderLeftColor: "#27ae60",
  },
  reminderTextDone: {
    color: "#1e8449",
  },

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

  bubbleWrap: { marginBottom: 2 },
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
    borderWidth: 0.5,
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
  deletedText: { fontSize: 13, fontStyle: "italic", color: Colors.muted },

  actionRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 3,
    marginHorizontal: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  actionBtnDelete: { borderColor: "#fcd4d4", backgroundColor: "#fff5f5" },
  actionBtnText: { fontSize: 11, color: Colors.muted, fontWeight: "500" },

  threadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
    marginBottom: 8,
    marginHorizontal: 4,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 0.5,
    borderColor: Colors.border,
    alignSelf: "flex-start",
  },
  threadBtnText: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: "500",
  },

  threadHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  threadCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  threadHeaderTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  threadHeaderSub: { fontSize: 11, color: Colors.muted, marginTop: 1 },

  threadParentBox: {
    backgroundColor: Colors.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  threadParentLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  threadParentLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  threadParentSender: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 4,
  },
  threadParentText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },

  quoteBubble: {
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
  },
  quoteBubbleMe: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderLeftColor: "rgba(255,255,255,0.6)",
  },
  quoteBubbleOther: {
    backgroundColor: Colors.primaryLight,
    borderLeftColor: Colors.primary,
  },
  quoteNameText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 2,
  },
  quoteText: { fontSize: 12, color: Colors.muted },

  replyPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  replyPreviewBar: {
    width: 3,
    height: 36,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  replyPreviewName: { fontSize: 12, fontWeight: "700", color: Colors.primary },
  replyPreviewText: { fontSize: 12, color: Colors.muted, marginTop: 1 },

  attachmentPreviewBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  attachmentPreviewImage: { width: 52, height: 52, borderRadius: 8 },
  attachmentPreviewFile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  attachmentPreviewName: { flex: 1, fontSize: 13, color: Colors.text },

  attachmentImage: {
    width: 200,
    height: 160,
    borderRadius: 8,
    marginBottom: 6,
  },
  attachmentFile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderWidth: 0.5,
  },
  attachmentFileMe: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  attachmentFileOther: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.border,
  },
  attachmentFileName: { flex: 1, fontSize: 13, color: Colors.text },

  skeletonBubble: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    maxWidth: "60%",
    borderWidth: 0.5,
    borderColor: Colors.border,
    gap: 6,
  },

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
  attachBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderWidth: 0.5,
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
});
