import RedefinePassForm from "../../shared/components/auth/RedefinePassForm";
import PageMeta from "../../shared/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function RedefinePassword() {
    return (
        <>
            <PageMeta title="Redefine Password | Nexventory" description="Reset Password" />
            <AuthLayout>
                <RedefinePassForm />
            </AuthLayout>
        </>
    )
}