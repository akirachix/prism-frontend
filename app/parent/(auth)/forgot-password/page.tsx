import ForgotForm from "@/_components/auth/ForgotForm";
import ParentAuth from "../ParentAuth";

export const metadata = { title: "Forgot password · Mirai for parents" };

export default function ParentForgotPage() {
  return (
    <ParentAuth>
      <h1 className="auth-title">Forgot your password?</h1>
      <p className="auth-lead">
        Enter the email the school has for you. We will send you a link to set a
        new password.
      </p>
      <ForgotForm portal="parent" framed={false} />
    </ParentAuth>
  );
}
