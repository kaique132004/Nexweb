import FirstLogin from "../../components/auth/FirstLogin";
import PageMeta from "../../components/common/PageMeta";
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