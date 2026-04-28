import FirstLogin from "../../shared/components/auth/FirstLogin";
import PageMeta from "../../shared/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function FirstLoginPage() {
    return (
        <>
            <PageMeta title="First Login | Nexventory" description="Reset Password" />
            <AuthLayout>
                <FirstLogin />
            </AuthLayout>
        </>
    )
}