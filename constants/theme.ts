import { StyleSheet } from "react-native";

export const Colors = {
  // BASE
  bg: "#F1F5FB",
  card: "#FFFFFF",

  // PRIMARY
  primary: "#1A3F6F",
  primaryLight: "#EBF2FF",
  primaryMid: "#C7DEFF",

  // TEXT & BORDER
  text: "#0F1F3D",
  muted: "#5A6A85",
  hint: "#9BAABB",
  border: "#DDE4EF",

  // ERROR
  error: "#C62828",
  errorBg: "#FFF0F0",

  // STATUS
  successBg: "#F0FAF4",
  successText: "#1A7A45",
  successBorder: "#A3D9B8",

  warningBg: "#FFF8E6",
  warningText: "#9A6200",
  warningBorder: "#F5CC6A",

  dangerBg: "#FFF0F0",
  dangerText: "#C62828",
  dangerBorder: "#F5AAAA",

  // SKELETON
  skeletonBase: "#E2E8F4",

  // TAMBAHAN
  headerOverlay: "rgba(10,30,70,0.18)",
  gold: "#B8860B",
  goldLight: "#FFF9E6",
  goldBorder: "#E8CC6A",
} as const;

export const globalStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },

  // CARD
  card: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    shadowColor: "#1A3F6F",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // SECTION HEADER
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // INFO ROW
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 7,
    padding: 7,
    borderWidth: 1,
    borderColor: Colors.primaryMid,
  },
  infoLabel: {
    fontSize: 10,
    color: Colors.muted,
    fontWeight: "600",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },

  // INPUT
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.bg,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 46,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.muted,
    letterSpacing: 0.6,
    marginBottom: 6,
    textTransform: "uppercase",
  },

  // BUTTON
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  btnDanger: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: 8,
    paddingVertical: 13,
    marginTop: 4,
  },
  btnDangerText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.dangerText,
  },

  // BADGE
  badgePrimary: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.primaryMid,
  },
  badgePrimaryText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  badgeSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.successBg,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeSuccessText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.successText,
  },

  // INFO & ERROR BOX
  infoBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primaryMid,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    padding: 12,
    alignItems: "flex-start",
    marginTop: 16,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 11,
    color: Colors.primary,
    lineHeight: 17,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    backgroundColor: Colors.errorBg,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderColor: Colors.dangerBorder,
    borderLeftColor: Colors.dangerText,
    padding: 10,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    flex: 1,
  },

  // FOOTER & DOT
  footer: {
    textAlign: "center",
    color: Colors.hint,
    fontSize: 10,
    marginTop: 20,
    letterSpacing: 0.3,
  },
  dot: {
    fontSize: 14,
    color: Colors.muted,
  },

  // SUMMARY CARD
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 3,
    borderTopColor: Colors.primary,
    padding: 12,
    alignItems: "center",
    gap: 4,
    shadowColor: "#1A3F6F",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.primary,
  },
  summaryLabel: {
    fontSize: 10,
    color: Colors.muted,
    textAlign: "center",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // FILTER CHIP
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: Colors.muted,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "700",
  },

  // QUICK LINK
  quickLinkRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  quickLinkCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  quickLinkTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text,
  },
  quickLinkSub: {
    fontSize: 10,
    color: Colors.muted,
  },

  // TABS
  tabContainer: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: Colors.bg,
    borderRadius: 8,
    padding: 3,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.muted,
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "800",
  },
});
