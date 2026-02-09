import { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link } from "react-router";
import { ptBR, enUS } from "date-fns/locale";
import { useNotifications } from "../../context/NotificationContext";

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [, setLocale] = useState(enUS);

    useEffect(() => {
        // Detecta a preferência do usuário (você pode pegar isso do seu contexto de auth/settings)
        const userPreference = localStorage.getItem("language") || "en";
        setLocale(userPreference === "pt-BR" ? ptBR : enUS);
    }, []);

    function toggleDropdown() {
        setIsOpen(!isOpen);
    }

    function closeDropdown() {
        setIsOpen(false);
    }


    const handleNotificationClick = (notificationId: number, isRead: boolean) => {
        if (!isRead) {
            markAsRead(notificationId);
        }
        closeDropdown();
    };

    const handleMarkAllAsRead = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        markAllAsRead();
    };

    const getTypeColor = (type: string | undefined): string => {
        switch (type) {
            case "SUCCESS":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
            case "ERROR":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
            case "WARNING":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
            default:
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
        }
    };

    const getStatusColor = (isRead: boolean) => {
        return isRead
            ? "bg-gray-400 dark:bg-gray-600"
            : "bg-success-500 dark:bg-success-400";
    };

    return (
        <div className="relative">
            <button
                className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-[#FFB81C] dark:border-gray-800 dark:bg-[#1e1e1e] dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                onClick={toggleDropdown}
            >
                {unreadCount > 0 && (
                    <span className="absolute right-0 top-0.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-orange-400 text-[10px] font-semibold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                        <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
                    </span>
                )}
                <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
                        fill="currentColor"
                    />
                </svg>
            </button>

            <Dropdown
                isOpen={isOpen}
                onClose={closeDropdown}
                className="absolute right-0 mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-[#1e1e1e] sm:w-[361px]"
            >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
                    <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Notifications
                    </h5>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs font-medium text-blue-600 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                Mark all as read
                            </button>
                        )}
                        <button
                            onClick={toggleDropdown}
                            className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        >
                            <svg
                                className="fill-current"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                                    fill="currentColor"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <li className="flex flex-col items-center justify-center py-12 text-center">
                            <svg
                                className="w-16 h-16 mb-3 text-gray-300 dark:text-gray-700"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                />
                            </svg>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                No notifications yet
                            </p>
                        </li>
                    ) : (
                        notifications.map((notification) => (
                            <li key={notification.id}>
                                <DropdownItem
                                    onItemClick={() =>
                                        handleNotificationClick(notification.id, notification.is_read)
                                    }
                                    className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${!notification.is_read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                                        }`}
                                    to={notification.link || undefined}
                                >
                                    <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                                        <div className="flex items-center justify-center w-full h-full overflow-hidden bg-gray-200 rounded-full dark:bg-gray-700">
                                            <svg
                                                className="w-5 h-5 text-gray-500 dark:text-gray-400"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                        <span
                                            className={`absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white dark:border-gray-900 ${getStatusColor(
                                                notification.is_read
                                            )}`}
                                        ></span>
                                    </span>

                                    <span className="flex-1 block">
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <span className="font-medium text-sm text-gray-800 dark:text-white/90">
                                                {notification.title}
                                            </span>
                                            <span
                                                className={`px-2 py-0.5 text[10px] font-medium rounded ${getTypeColor(
                                                    String(notification.type)
                                                )}`}
                                            >
                                                {String(notification.type)}
                                            </span>
                                        </div>

                                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                            {notification.message}
                                        </p>

                                        <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                                            <span className="text-xs text-gray-400 block mt-2">
                                                {new Date(notification.created_at).toLocaleString("pt-BR")}
                                            </span>
                                            {!notification.is_read && (
                                                <>
                                                    <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                                                    <span className="text-blue-600 dark:text-blue-400">New</span>
                                                </>
                                            )}
                                        </span>
                                    </span>
                                </DropdownItem>
                            </li>
                        ))
                    )}
                </ul>

                {notifications.length > 0 && (
                    <Link
                        to="/notifications"
                        onClick={closeDropdown}
                        className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                        View All Notifications
                    </Link>
                )}
            </Dropdown>
        </div >
    );
}
