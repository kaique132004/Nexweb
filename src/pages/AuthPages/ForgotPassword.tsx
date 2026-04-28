import ForgotPassForm from "../../shared/components/auth/ForgotPassForm";
import PageMeta from "../../shared/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function ForgotPassword() {
    return (
        <>
            <PageMeta
                title="Nexventory Application Login"
                description="Nexventory Application Login"
            />
            <AuthLayout>
                <ForgotPassForm />
            </AuthLayout>
        </>
    )
}