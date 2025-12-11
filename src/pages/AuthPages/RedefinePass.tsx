import RedefinePassForm from "../../components/auth/RedefinePassForm";
import PageMeta from "../../components/common/PageMeta";
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