import React, { useRef, useState, useEffect } from 'react';
import useFullPageLoader from '@/hooks/usePageLoader';
import Loader from '@/components/ui/loader';
import { HeroSectionDock } from './Hero/HeroSectionDock';
import { motion } from 'framer-motion';

import Intro from './Hero/Intro';
import Features from './Hero/Features';
import Footer from './Hero/Footer';

function HeroPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [activeSection, setActiveSection] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const [lastScrollTime, setLastScrollTime] = useState(0);

    const sections = [
        { id: "intro", component: <Intro />, label: "Intro" },
        { id: "features", component: <Features />, label: "Features" },
        { id: "footer", component: <Footer />, label: "Footer" }
    ];

    // Enhanced smooth scrolling function
    const scrollToSection = (index: number) => {
        if (!containerRef.current || !sectionRefs.current[index]) return;

        // Don't interrupt existing scroll animations
        if (isScrolling) return;

        setIsScrolling(true);
        setActiveSection(index);

        // Get the section element
        const section = sectionRefs.current[index];
        const sectionTop = section?.offsetTop || 0;

        // Get scroll start position
        const startPosition = window.pageYOffset;
        const distance = sectionTop - startPosition;

        // Smooth scrolling animation with easing
        const duration = 1000; // ms
        const startTime = performance.now();

        function animate(currentTime: number) {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);

            // Easing function for smoother acceleration/deceleration
            const easeInOutCubic = (progress: number): number =>
                progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            const easedProgress = easeInOutCubic(progress);

            window.scrollTo({
                top: startPosition + distance * easedProgress,
                behavior: 'auto' // We're handling the animation manually
            });

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Ensure we end exactly at the target position
                window.scrollTo({
                    top: sectionTop,
                    behavior: 'auto'
                });

                setTimeout(() => {
                    setIsScrolling(false);
                }, 100);
            }
        }

        requestAnimationFrame(animate);
    };

    // Enhanced wheel event handler with throttling
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();

            // Throttle wheel events
            const now = performance.now();
            if (now - lastScrollTime < 200 || isScrolling) return;
            setLastScrollTime(now);

            const direction = Math.sign(e.deltaY);
            if (direction > 0 && activeSection < sections.length - 1) {
                // Scroll down
                scrollToSection(activeSection + 1);
            } else if (direction < 0 && activeSection > 0) {
                // Scroll up
                scrollToSection(activeSection - 1);
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            if (container) {
                container.removeEventListener('wheel', handleWheel);
            }
        };
    }, [activeSection, isScrolling, lastScrollTime]);

    // Improved intersection observer with higher priority zones
    useEffect(() => {
        // Multi-threshold observer for more precise detection
        const observer = new IntersectionObserver((entries) => {
            if (isScrolling) return;

            for (const entry of entries) {
                if (entry.isIntersecting) {
                    const index = sectionRefs.current.findIndex(ref => ref === entry.target);
                    if (index !== -1 && index !== activeSection) {
                        setActiveSection(index);
                        break;
                    }
                }
            }
        }, {
            root: null,
            rootMargin: '-10% 0px -10% 0px', // Focus on center 80%
            threshold: [0.25, 0.5, 0.75] // Multiple thresholds for better accuracy
        });

        sectionRefs.current.forEach(section => {
            if (section) observer.observe(section);
        });

        return () => observer.disconnect();
    }, [activeSection, isScrolling]);

    // Prevent default scroll behavior
    useEffect(() => {
        const preventScrollDefault = (e: WheelEvent) => {
            if (isScrolling) {
                e.preventDefault();
            }
        };

        window.addEventListener('wheel', preventScrollDefault, { passive: false });

        return () => {
            window.removeEventListener('wheel', preventScrollDefault);
        };
    }, [isScrolling]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isScrolling) return;

            if (e.key === 'ArrowDown' && activeSection < sections.length - 1) {
                e.preventDefault();
                scrollToSection(activeSection + 1);
            } else if (e.key === 'ArrowUp' && activeSection > 0) {
                e.preventDefault();
                scrollToSection(activeSection - 0);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeSection, isScrolling]);

    // Scroll to active section on page load/refresh
    useEffect(() => {
        // Delay to allow refs to be populated
        const timer = setTimeout(() => {
            scrollToSection(0);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="w-full relative overflow-hidden">
            {/* Progress indicator */}
            <div className="fixed left-8 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-3">
                {sections.map((_, idx) => (
                    <div
                        key={`progress-${idx}`}
                        className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${idx === activeSection
                            ? "w-8 bg-indigo-400"
                            : "bg-gray-400/30"
                            }`}
                        onClick={() => scrollToSection(idx)}
                    />
                ))}
            </div>

            {/* Main content container */}
            <div
                ref={containerRef}
                className="w-full scroll-smooth overflow-hidden"
            >
                {sections.map((section, index) => (
                    <div
                        key={section.id}
                        id={section.id}
                        ref={(el) => { sectionRefs.current[index] = el; }}
                        className="w-full h-screen relative overflow-hidden"
                    >
                        {/* Add transition effects between sections */}
                        <motion.div
                            className="w-full h-full"
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: activeSection === index ? 1 : 0.3,
                                scale: activeSection === index ? 1 : 0.95
                            }}
                            transition={{ duration: 0.5 }}
                        >
                            {section.component}
                        </motion.div>
                    </div>
                ))}
            </div>

            {/* Dock navigation */}
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40">
                <HeroSectionDock
                    activeSection={activeSection}
                    onSectionChange={scrollToSection}
                />
            </div>
        </div>
    );
}

const Hero = useFullPageLoader(HeroPage, <Loader />);

export default Hero;