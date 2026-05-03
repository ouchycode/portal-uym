import { StyleSheet } from "react-native";

// ─────────────────────────────────────────────
// COLORS — Tema Universitas Yatsi Madani
// Biru UYM sebagai primary, Kuning/Emas sebagai accent
// Background putih bersih & cerah, dinamis
// ─────────────────────────────────────────────
export const Colors = {
  // ── BASE ──────────────────────────────────
  bg: "#F4F6FB", // biru sangat muda — fresh & bersih
  card: "#FFFFFF",

  // ── PRIMARY — Biru UYM ────────────────────
  primary: "#0D47A1", // biru UYM utama (deep blue)
  primaryDark: "#0A3580", // biru gelap (pressed, active)
  primaryLight: "#E3EAF8", // biru sangat terang (background field)
  primaryMid: "#BBCEF0", // biru border / soft divider
  primarySoft: "#90AAE0", // biru border kuat
  primaryMuted: "#1565C0", // biru tengah (icon, ilustrasi)

  // ── ACCENT — Kuning/Emas UYM ──────────────
  accent: "#F9A825", // kuning UYM (energik, muda)
  accentDark: "#E65100", // oranye gelap (teks di atas kuning light)
  accentLight: "#FFF8E1", // kuning sangat terang (background)
  accentBorder: "#FFD54F", // kuning border

  // ── TEXT & BORDER ──────────────────────────
  text: "#1A1F36", // hampir hitam, sedikit biru
  muted: "#5C6B8A", // biru abu — teks sekunder
  hint: "#9DAABF", // placeholder, hint
  border: "#D8E0F0", // border default (biru tipis)
  borderStrong: "#BBCEF0", // border tegas

  // ── ERROR ──────────────────────────────────
  error: "#B71C1C",
  errorBg: "#FFEBEE",

  // ── STATUS ─────────────────────────────────
  successBg: "#E8F5E9",
  successText: "#1B5E20",
  successBorder: "#A5D6A7",

  warningBg: "#FFF8E1",
  warningText: "#E65100",
  warningBorder: "#FFD54F",

  dangerBg: "#FFEBEE",
  dangerText: "#B71C1C",
  dangerBorder: "#FFCDD2",

  // ── PROGRESS ───────────────────────────────
  progressBg: "#BBCEF0",
  progressFill: "#0D47A1",

  // ── SKELETON ───────────────────────────────
  skeletonBase: "#DDE5F5",
  skeletonHighlight: "#EEF2FB",

  // ── SURFACE ────────────────────────────────
  surface: "#E3EAF8",
  surfaceHover: "#BBCEF0",
  cream: "#F4F6FB",

  // ── MISC ───────────────────────────────────
  headerOverlay: "rgba(13,71,161,0.22)",
  slate: "#546E8A",
  white: "#FFFFFF",
  black: "#000000",
} as const;

// ─────────────────────────────────────────────
// GLOBAL STYLES — UYM Theme
// ─────────────────────────────────────────────
export const globalStyles = StyleSheet.create({
  // ── SAFE AREA & SCROLL ────────────────────
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },

  // ── PAGE HEADER TEXT ─────────────────────
  pageTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    marginTop: 2,
    fontWeight: "400",
    letterSpacing: 0.2,
  },

  // ── HEADER — FIRST TABS (simple) ─────────
  headerSection: {
    backgroundColor: Colors.primary,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 22,
    // Efek gradien simulasi lewat shadow
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
  headerLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.accent,
    letterSpacing: 1.6,
    marginBottom: 3,
    textTransform: "uppercase",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  // ── UYM BADGE ─────────────────────────────
  uymBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(249,168,37,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,213,79,0.55)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  uymBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.accent,
    letterSpacing: 1,
  },

  // ── HEADER — SECOND TABS (rich) ───────────
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 52,
    overflow: "hidden",
    gap: 4,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  headerSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    marginTop: 2,
  },
  headerDivider: {
    height: 0.5,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 12,
  },

  // Stat inside header
  headerStatRow: {
    flexDirection: "row",
    gap: 20,
  },
  headerStatItem: {
    flexDirection: "column",
    gap: 2,
  },
  headerStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerStatLabel: {
    fontSize: 9,
    fontWeight: "500",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // ── BODY ──────────────────────────────────
  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
  },

  // ── SECTION LABEL ─────────────────────────
  sectionLabel: {
    fontSize: 11,
    color: Colors.muted,
    marginBottom: 10,
    letterSpacing: 0.2,
  },

  // ── SECTION HEADER (dengan garis bawah) ───
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent, // kuning UYM sebagai aksen garis
    marginBottom: 12,
  },
  sectionHeaderIcon: {
    width: 14,
    height: 14,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },

  // ── RETRY BUTTON ──────────────────────────
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    backgroundColor: Colors.primaryLight,
    borderWidth: 0.5,
    borderColor: Colors.primaryMid,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },

  // ── BACK BUTTON ───────────────────────────
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  backLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // ── EMPTY / ERROR ─────────────────────────
  empty: {
    alignItems: "center",
    paddingVertical: 56,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.muted,
    textAlign: "center",
  },
  emptyHint: {
    fontSize: 12,
    color: Colors.hint,
    textAlign: "center",
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },

  // ── CARD (standard) ───────────────────────
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 10,
    gap: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  // Kartu dengan aksen garis kiri biru UYM
  cardAccent: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    borderRadius: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  // Kartu dengan aksen garis kiri kuning UYM
  cardAccentGold: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    borderRadius: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },

  // ── COURSE CARD ───────────────────────────
  courseCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  courseThumb: {
    height: 80,
    backgroundColor: Colors.primary,
    alignItems: "flex-end",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  courseThumbLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  courseBody: {
    padding: 12,
    gap: 6,
  },
  courseTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 18,
  },
  courseMeta: {
    fontSize: 11,
    color: Colors.muted,
  },
  courseMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  courseMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: Colors.border,
  },

  // ── INFO ROW ──────────────────────────────
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    padding: 8,
    borderWidth: 0.5,
    borderColor: Colors.primaryMid,
  },
  infoLabel: {
    fontSize: 9,
    color: Colors.muted,
    fontWeight: "600",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text,
  },

  // ── INPUT ─────────────────────────────────
  inputLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.muted,
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.bg,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 44,
  },
  inputWrapFocused: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: 12,
    height: 44,
  },
  inputWrapError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.errorBg,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.dangerBorder,
    paddingHorizontal: 12,
    height: 44,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },

  // ── BUTTON ────────────────────────────────
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  btnPrimaryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  btnSecondary: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    flexDirection: "row",
    gap: 6,
  },
  btnSecondaryText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  // Tombol gold/kuning — unduh, transkrip, ijazah
  btnGold: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    borderWidth: 0,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    flexDirection: "row",
    gap: 7,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  btnGoldText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  btnGhost: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    backgroundColor: Colors.bg,
  },
  btnGhostText: {
    color: Colors.muted,
    fontSize: 14,
    fontWeight: "500",
  },
  btnDanger: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: 10,
    height: 46,
    marginTop: 4,
  },
  btnDangerText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dangerText,
  },

  // ── BADGE ─────────────────────────────────
  // Biru UYM (status aktif, kategori)
  badgePrimary: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: Colors.primaryMid,
  },
  badgePrimaryText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.primary,
  },
  // Hijau (lulus, selesai)
  badgeSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.successBg,
    borderWidth: 0.5,
    borderColor: Colors.successBorder,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeSuccessText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.successText,
  },
  // Kuning (peringatan, batas waktu)
  badgeWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.warningBg,
    borderWidth: 0.5,
    borderColor: Colors.warningBorder,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeWarningText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.warningText,
  },
  // Gold/Kuning UYM (cumlaude, penghargaan)
  badgeGold: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.accentLight,
    borderWidth: 0.5,
    borderColor: Colors.accentBorder,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeGoldText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.accentDark,
  },
  // Slate (netral, cuti, tidak aktif)
  badgeSlate: {
    backgroundColor: "#EEF2FA",
    borderWidth: 0.5,
    borderColor: "#D0DBEF",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeSlateText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.slate,
  },
  // Merah (gagal, tidak hadir)
  badgeDanger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.dangerBg,
    borderWidth: 0.5,
    borderColor: Colors.dangerBorder,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeDangerText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.dangerText,
  },

  // ── PROGRESS BAR ──────────────────────────
  progressWrap: {
    height: 6,
    backgroundColor: Colors.progressBg,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.progressFill,
    borderRadius: 999,
  },
  // Varian gold (untuk SKS cumlaude progress)
  progressFillGold: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: 999,
  },

  // ── INFO & ERROR BOX ──────────────────────
  infoBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 0,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.primaryMid,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    padding: 12,
    alignItems: "flex-start",
    marginTop: 4,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primary,
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: Colors.warningBg,
    borderRadius: 0,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.warningBorder,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    padding: 12,
    alignItems: "flex-start",
    marginTop: 4,
  },
  warningBoxText: {
    flex: 1,
    fontSize: 12,
    color: Colors.warningText,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
    backgroundColor: Colors.dangerBg,
    borderRadius: 0,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 0.5,
    borderLeftWidth: 3,
    borderColor: Colors.dangerBorder,
    borderLeftColor: Colors.dangerText,
    padding: 12,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    flex: 1,
    lineHeight: 18,
  },

  // ── FOOTER ────────────────────────────────
  footer: {
    textAlign: "center",
    color: Colors.hint,
    fontSize: 10,
    marginTop: 24,
    letterSpacing: 0.5,
  },
  dot: {
    fontSize: 14,
    color: Colors.hint,
  },

  // ── SUMMARY / STAT CARD ───────────────────
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.primaryMid,
    padding: 12,
    alignItems: "center",
    gap: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.primary,
  },
  summaryLabel: {
    fontSize: 9,
    color: Colors.muted,
    textAlign: "center",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  // Stat card gold (IPK cumlaude highlight)
  summaryCardGold: {
    flex: 1,
    backgroundColor: Colors.accentLight,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.accentBorder,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  summaryValueGold: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.accentDark,
  },

  // ── FILTER CHIP ───────────────────────────
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowOpacity: 0.2,
    elevation: 3,
  },
  filterChipText: {
    fontSize: 12,
    color: Colors.muted,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // ── QUICK LINK ────────────────────────────
  quickLinkRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  quickLinkCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  quickLinkTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  quickLinkSub: {
    fontSize: 10,
    color: Colors.muted,
    marginTop: 1,
  },

  // ── TABS ──────────────────────────────────
  tabContainer: {
    flexDirection: "row",
    gap: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
    marginBottom: -1,
  },
  tabActive: {
    borderBottomColor: Colors.accent, // garis bawah kuning UYM
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.muted,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },

  // ── DIVIDER ───────────────────────────────
  divider: {
    height: 0.5,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  dividerThick: {
    height: 1.5,
    backgroundColor: Colors.primaryMid,
    marginVertical: 12,
  },

  // ── LIST ROW ─────────────────────────────
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  listRowTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 18,
  },
  listRowSub: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },

  // ── AVATAR / INISIAL ──────────────────────
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primaryMid,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 0.5,
  },

  // ── NILAI GRADE BADGE (A, B+, C, dst) ────
  gradeBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primaryLight,
    borderWidth: 0.5,
    borderColor: Colors.primaryMid,
  },
  gradeBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  gradeBadgeA: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.successBorder,
  },
  gradeBadgeAText: {
    color: Colors.successText,
  },
  gradeBadgeD: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.dangerBorder,
  },
  gradeBadgeDText: {
    color: Colors.dangerText,
  },

  // ── SKELETON LOADER ───────────────────────
  skeletonLine: {
    height: 12,
    backgroundColor: Colors.skeletonBase,
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonBlock: {
    height: 80,
    backgroundColor: Colors.skeletonBase,
    borderRadius: 10,
    marginBottom: 10,
  },
});
