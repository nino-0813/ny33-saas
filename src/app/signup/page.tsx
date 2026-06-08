import AuthForm from "@/components/AuthForm";

export const metadata = { title: "新規登録 — NY33 Company Dock" };

export default function SignupPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-5 py-10">
      <AuthForm mode="signup" />
    </div>
  );
}
