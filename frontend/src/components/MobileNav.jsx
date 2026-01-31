import { Link, useLocation } from "react-router";
import { BellIcon, HomeIcon, UsersIcon, UserCircle } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications.jsx";

const MobileNav = () => {
    const location = useLocation();
    const currentPath = location.pathname;
    const { notificationCount, hasNewNotifications } = useNotifications();

    const navItems = [
        { path: "/", icon: HomeIcon, label: "Home" },
        {
            path: "/notifications",
            icon: BellIcon,
            label: "Notifications",
            badge: notificationCount,
            pulse: hasNewNotifications,
        },
        { path: "/groups", icon: UsersIcon, label: "Groups" },
        { path: "/profile", icon: UserCircle, label: "Profile" },
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-base-200 border-t border-base-300 z-50 safe-bottom">
            <div className="grid grid-cols-4 h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPath === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center gap-1 transition-colors ${isActive
                                    ? "text-primary bg-base-300"
                                    : "text-base-content/70 hover:text-base-content hover:bg-base-300/50"
                                }`}
                        >
                            <div className="relative">
                                <Icon
                                    className={`size-6 ${item.pulse ? "animate-pulse" : ""}`}
                                />
                                {item.badge > 0 && (
                                    <span className="absolute -top-2 -right-2 badge badge-xs badge-error">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileNav;
