import PageMeta from "../../shared/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../shared/components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Nexventory Application Login"
        description="Nexventory Application Login"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
