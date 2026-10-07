import { redirect } from "next/navigation";

// Index of the flow redirects to the first step (was <Navigate to="verify" />).
export default function ForgotPasswordIndex() {
  redirect("/forgot-password/verify");
}
