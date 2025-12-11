import ForgotPassForm from "../../components/auth/ForgotPassForm";
import PageMeta from "../../components/common/PageMeta";
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