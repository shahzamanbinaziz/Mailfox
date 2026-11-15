import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/context";

export const dynamic = "force-dynamic";

export default async function Home() {
  redirect((await getAuth()) ? "/dashboard" : "/login");
}
