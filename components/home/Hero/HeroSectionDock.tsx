import React from "react";
import { FloatingDock } from "@/components/ui/floating-dock";
import {
    IconHome,
    IconListCheck,
    IconMail,
    IconUser,
    IconBriefcase,
} from "@tabler/icons-react";
import Link from "next/link";

export function HeroSectionDock({
    activeSection = 0,
    onSectionChange
}: {
    activeSection?: number,
    onSectionChange: (index: number) => void
}) {
    // Combined navigation items (sections + external links)
    const navItems = [
        // Section links (internal navigation)
        {
            title: "Intro",
            icon: <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
            href: "#intro",
            type: "section",
            sectionIndex: 0
        },
        {
            title: "Features",
            icon: <IconListCheck className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
            href: "#features",
            type: "section",
            sectionIndex: 1
        },
        {
            title: "Footer",
            icon: <IconMail className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
            href: "#footer",
            type: "section",
            sectionIndex: 2
        },
        // External page links
        {
            title: "About",
            icon: <IconUser className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
            href: "/about",
            type: "link"
        },
        {
            title: "Services",
            icon: <IconBriefcase className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
            href: "/services",
            type: "link"
        }
    ];

    // Transform the items for the FloatingDock component
    const dockItems = navItems.map(item => ({
        title: item.title,
        icon: item.icon,
        href: item.href,
        onClick: item.type === "section" ? () => onSectionChange(item.sectionIndex!) : undefined
    }));

    // Calculate active index based on section links only
    const getActiveIndex = () => {
        const sectionItems = navItems.filter(item => item.type === "section");
        const activeSectionItem = sectionItems.find(item => item.sectionIndex === activeSection);
        return navItems.findIndex(item => item.title === activeSectionItem?.title);
    };

    return (
        <div className="flex items-center justify-center w-full">
            <FloatingDock
                items={dockItems}
                activeIndex={getActiveIndex()}
            />
        </div>
    );
}