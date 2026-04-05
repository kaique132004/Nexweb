// pages/UserProfiles.tsx

import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import PageMeta from "../components/common/PageMeta";

export default function UserProfiles() {
    // Certifique-se de que userSession.id é um string (UUID)
    const userSession = JSON.parse(sessionStorage.getItem('user-session') || '{}');
    const userId: string = userSession.id; // Garante que é string

    return (
        <>
            <PageMeta
                title="Profile" // Adicione um título
                description="User profile and settings" // Adicione uma descrição
            />
            <PageBreadcrumb pageTitle="Profile" />
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 lg:p-6">
                <div className="space-y-6">
                    <UserMetaCard userId={userId}/>
                    <UserInfoCard userId={userId}/>
                    <UserAddressCard userId={userId}/>
                </div>
            </div>
        </>
    );
}