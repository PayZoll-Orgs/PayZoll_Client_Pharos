"use client"

import React, { useEffect } from 'react'
import useFullPageLoader from '@/hooks/usePageLoader'
import Loader from '@/components/ui/loader'
import Splashscreen from '@/components/home/Splashscreen';
import { motion, AnimatePresence } from 'framer-motion'
import Hero from '@/components/home/Hero';

const HomePage = () => {
    const [isSplashscreenVisible, setSplashscreenVisible] = React.useState(false);
    const [isFirstLoad, setIsFirstLoad] = React.useState(true);
    const [showSplashOption, setShowSplashOption] = React.useState(false);

    useEffect(() => {
        // Check if this is the first visit
        const hasSeenSplash = localStorage.getItem('hasSeenSplash') === 'true';

        if (!hasSeenSplash) {
            // First visit - show splash screen
            setSplashscreenVisible(true);
            localStorage.setItem('hasSeenSplash', 'true');
        } else {
            // Returning visitor - show hero directly
            setSplashscreenVisible(false);
            setShowSplashOption(true);
        }
        setIsFirstLoad(false);
    }, []);

    const handleShowSplash = () => {
        setSplashscreenVisible(true);
        setShowSplashOption(false);
    };

    // Don't render anything during the initial check to prevent flash
    if (isFirstLoad) return null;

    return (
        <>
            <AnimatePresence mode="wait">
                {isSplashscreenVisible ? (
                    <motion.div
                        key="splashscreen"
                        initial={{ opacity: 1 }}
                        exit={{
                            opacity: 0,
                            transition: { duration: 0.8, ease: "easeInOut" }
                        }}
                        className="fixed inset-0 z-50"
                    >
                        <Splashscreen onFinish={() => {
                            setSplashscreenVisible(false);
                            setShowSplashOption(true);
                        }} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="home-content"
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: 1,
                            transition: {
                                duration: 0.8,
                                ease: "easeInOut",
                                delay: 0.2
                            }
                        }}
                        className="w-screen h-screen"
                    >
                        <Hero />

                        {/* Option to view splash screen again */}
                        {showSplashOption && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="fixed top-4 right-4 z-40"
                            >
                                <button
                                    onClick={handleShowSplash}
                                    className="px-3 py-2 text-xs rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                                >
                                    View Intro
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

const Home = useFullPageLoader(HomePage, <Loader />);

export default Home