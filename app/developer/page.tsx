"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useCadStore } from "@/store/useCadStore";
import Header from "@/components/editor/Header";
import SidebarLeft from "@/components/editor/SidebarLeft";
import SidebarRight from "@/components/editor/SidebarRight";

// Dynamically import components that use client-side features
const Editor = dynamic(() => import("@/components/editor/Editor"), { ssr: false });
const MobileView = dynamic(() => import("@/components/editor/MobileView"), { ssr: false });

export default function DeveloperPage() {
    const mode = useCadStore((state: any) => state.mode);
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Check if mobile on mount
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkMobile();

        // Listen to resize events
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!mounted) return null;

    if (isMobile) {
        return <MobileView />;
    }

    return (
        <main className={`flex flex-col h-screen w-screen overflow-hidden ${mode} ${mode === 'dark' ? 'bg-[#050505]' : 'bg-[#fcfcfc]'}`}>
            <Header />
            <div className="flex flex-1 overflow-hidden relative">
                <SidebarLeft />
                <div className="flex-1 relative overflow-hidden bg-white">
                    <Editor />
                </div>
                <SidebarRight />
            </div>
        </main>
    );
}
