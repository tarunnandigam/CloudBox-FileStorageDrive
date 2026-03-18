
import { useEffect } from "react";
import { useNavigate as useRouter } from "react-router-dom";
import { useUser } from "@/context/user.context";

export default function Home() {
  const router = useRouter();
  const { current: user, loading } = useUser();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router("/dashboard");
      } else {
        router("/auth");
      }
    }
  }, [router, user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>);

  }

  return null;
}