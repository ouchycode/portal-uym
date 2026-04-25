import { useAuth } from "@/store/auth";
import { Redirect } from "expo-router";

export default function Index() {
  const token = useAuth((s) => s.token);

  if (!token) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
