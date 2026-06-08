import AuthForm from "@/components/AuthForm";

export const metadata = { title: "ログイン — NY33 Company Dock" };

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-5 py-10">
      <AuthForm mode="login" />
    </div>
  );
}
