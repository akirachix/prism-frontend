import ForgotForm from "@/_components/auth/ForgotForm";
import TeacherAuth from "../TeacherAuth";

export const metadata = { title: "Forgot password · Mirai" };

export default function TeacherForgotPage() {
  return (
    <TeacherAuth panel="shine" mobileHeader="plain">
      <h1 className="auth-title">Forgot your password?</h1>
      <p className="auth-lead">
        Enter the email your school used for your account. We will send you a
        link to set a new password.
      </p>
      <ForgotForm portal="teacher" />
    </TeacherAuth>
  );
}
