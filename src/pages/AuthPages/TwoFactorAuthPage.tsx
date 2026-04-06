// pages/TwoFactorAuthPage.tsx

import AuthLayout from "./AuthPageLayout";
import PageMeta from "../../components/common/PageMeta.tsx";
import TwoFactorAuthForm from "../../components/auth/TwoFactorAuthForm.tsx";

export default function TwoFactorAuthPage() {
    return (
        <>
            <PageMeta
                title="2FA Verification"
                description="Two-Factor Authentication verification page"
            />
            <AuthLayout>
                <TwoFactorAuthForm />
            </AuthLayout>
        </>
    );
}