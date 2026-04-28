// components/auth/UserMetaCard.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../../shared/components/form/input/InputField";
import Label from "../../shared/components/form/Label.tsx";
import { authFetch, AuthFetchError } from "../../api/apiAuth"; // Mantenha authFetch para dados de texto
import { uploadProfilePicture, deleteProfilePicture, ImageUploadError } from "../../api/imageUpload"; // Importe as novas funções
import { API_ENDPOINTS } from "../../api/endpoint";

interface UserData {
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  profile_picture_url?: string;
}

interface UserMetaCardProps {
  userId: string;
}

export default function UserMetaCard({ userId }: UserMetaCardProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  useEffect(() => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else if (user?.profile_picture_url) {
      setProfilePicturePreview(`${API_ENDPOINTS.upload}/profile-pictures/${user.profile_picture_url}`);
    } else {
      setProfilePicturePreview(null);
    }
  }, [selectedFile, user?.profile_picture_url]);

  const loadUserData = async () => {
    setLoading(true);
    setSaveError(null);
    try {
      const data = await authFetch<UserData>(
          `${API_ENDPOINTS.auth}/user-detail/${userId}`, {
            method: "GET"
          }
      );

      if (data) {
        setUser(data);
        setFormData(data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      if (error instanceof AuthFetchError) {
        setSaveError(error.message);
      } else {
        setSaveError('Failed to load user data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSaveError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setSaveError(null);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    console.log("Attempting to save user data and/or profile picture...");
    try {
      // 1. Atualiza os dados do usuário (username, email, etc.)
      // Defina userUpdatePayload com os dados do formulário
      const userUpdatePayload = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        // Não inclua role, is_active ou user_id aqui, pois geralmente não são atualizáveis pelo usuário
      };

      await authFetch(
          `${API_ENDPOINTS.auth}/update/${userId}`,
          {
            method: 'PUT',
            body: JSON.stringify(userUpdatePayload),
            headers: {
              'Content-Type': 'application/json',
            },
          }
      );
      console.log('User information updated successfully (text data).');

      // 2. Se houver um arquivo selecionado, faz o upload da imagem de perfil
      if (selectedFile) {
        console.log("Selected file found, attempting to upload profile picture using dedicated function.");
        const uploadResult = await uploadProfilePicture(selectedFile); // <--- Chama a função de upload
        console.log('Profile picture uploaded successfully:', uploadResult);

        // AQUI ESTÁ A MUDANÇA: Atualiza o estado do usuário com a nova URL da imagem
        if (uploadResult && uploadResult.data) {
          setUser(prevUser => {
            if (prevUser) {
              return { ...prevUser, profile_picture_url: uploadResult.data };
            }
            return null;
          });
          // O useEffect que lida com profilePicturePreview já deve pegar essa mudança
          // e atualizar a prévia automaticamente.
        }
      } else {
        console.log("No new profile picture selected for upload.");
      }

      console.log('All save operations completed successfully.');
      await loadUserData(); // Recarrega os dados do usuário para garantir consistência
      setSelectedFile(null);
      closeModal();
    } catch (error) {
      console.error('Error during save operation:', error);
      if (error instanceof AuthFetchError || error instanceof ImageUploadError) {
        setSaveError(error.message);
      } else {
        setSaveError('An unexpected error occurred while saving changes.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    setSaving(true);
    setSaveError(null);
    console.log("Attempting to delete profile picture...");
    try {
      await deleteProfilePicture(); // <--- Usando a nova função
      console.log('Profile picture deleted successfully.');
      await loadUserData();
      setSelectedFile(null);
      setProfilePicturePreview(null);
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      if (error instanceof ImageUploadError) { // Trata erros da função de imagem
        setSaveError(error.message);
      } else {
        setSaveError('Failed to delete profile picture.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData(user || {});
    setSelectedFile(null);
    setSaveError(null);
    closeModal();
  };

  const fullName = user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.username || "User";

  const currentProfilePicture = profilePicturePreview || "/SITA_LOGO-AVATAR-GREEN.png";

  if (loading) {
    return (
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
        </div>
    );
  }

  return (
      <>
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
              <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
                <img src={currentProfilePicture} alt="user profile" className="object-cover w-full h-full" />
              </div>
              <div className="order-3 xl:order-2">
                <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 xl:text-left">
                  {fullName}
                </h4>
                <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{user?.username || "username"}
                  </p>
                  <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.email || "email@example.com"}
                  </p>
                </div>
              </div>
            </div>
            <button
                onClick={openModal}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
            >
              <svg
                  className="fill-current"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
              >
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.12620 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                    fill=""
                />
              </svg>
              Edit
            </button>
          </div>
        </div>

        <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[700px] m-4">
          <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-[#1e1e1e] lg:p-11">
            <div className="px-2 pr-14">
              <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                Edit Personal Information
              </h4>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                Update your details to keep your profile up-to-date.
              </p>
            </div>
            <form className="flex flex-col" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="custom-scrollbar max-h-[450px] overflow-y-auto px-2 pb-3">
                <div className="mb-6 flex flex-col items-center gap-4">
                  <div className="w-24 h-24 overflow-hidden rounded-full border border-gray-300 dark:border-gray-700">
                    <img
                        src={currentProfilePicture}
                        alt="Profile Preview"
                        className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving}
                    >
                      Upload New Photo
                    </Button>
                    {user?.profile_picture_url && (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleDeleteProfilePicture}
                            disabled={saving}
                            className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900"
                        >
                          Remove Photo
                        </Button>
                    )}
                  </div>
                  {saveError && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
                        {saveError}
                      </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Username</Label>
                    <Input
                        type="text"
                        value={formData.username || ""}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        placeholder="username"
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="email@example.com"
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>First Name</Label>
                    <Input
                        type="text"
                        value={formData.first_name || ""}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        placeholder="First name"
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Last Name</Label>
                    <Input
                        type="text"
                        value={formData.last_name || ""}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        placeholder="Last name"
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Phone</Label>
                    <Input
                        type="text"
                        value={formData.phone || ""}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+55 11 99999-9999"
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Role</Label>
                    <Input
                        type="text"
                        value={formData.role || ""}
                        disabled
                        className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClose}
                    disabled={saving}
                    type="button"
                >
                  Close
                </Button>
                <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    type="submit"
                >
                  {saving ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                        Saving...
                      </>
                  ) : (
                      "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      </>
  );
}