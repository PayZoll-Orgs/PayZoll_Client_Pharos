"use client";
import React, { useEffect, useRef, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MONTSERRAT } from "@/lib/fonts";

export const TextRevealCard = ({
    text,
    revealText,
    className = "",
    headingLevel = "h1",
    typewriterSpeed =30, // ms per percentage point
    startDelay = 400, // delay before animation starts
    repeat = false, // whether to repeat the animation
    repeatDelay = 3000, // delay before repeating animation
    intermediateDelay = 100, // delay between intermediate text displays
    onFinish, // callback when the animation finishes
}: {
    text: string;
    revealText: string[]; // Now an array of strings
    className?: string;
    headingLevel?: "h1" | "h2" | "h3" | "h4";
    typewriterSpeed?: number;
    startDelay?: number;
    repeat?: boolean;
    repeatDelay?: number;
    intermediateDelay?: number;
    onFinish: () => void; // Callback when the animation finishes
}) => {
    const [widthPercentage, setWidthPercentage] = useState(0);
    const [isShowingReveal, setIsShowingReveal] = useState(false);
    const [isRevealStarted, setIsRevealStarted] = useState(false);
    const [currentTextIndex, setCurrentTextIndex] = useState(-1); // -1 means showing base text
    const cardRef = useRef<HTMLDivElement | null>(null);
    const [localWidth, setLocalWidth] = useState(0);
    const isFinalReveal = currentTextIndex === revealText.length - 1;

    // Initialize dimensions
    useEffect(() => {
        if (cardRef.current) {
            const { width } = cardRef.current.getBoundingClientRect();
            setLocalWidth(width);
        }
    }, []);

    // Typewriter animation effect
    useEffect(() => {
        let animationTimer: NodeJS.Timeout;
        let resetTimer: NodeJS.Timeout;
        let showRevealTimer: NodeJS.Timeout;
        let hideRevealTimer: NodeJS.Timeout;
        let nextTextTimer: NodeJS.Timeout;

        const runSingleAnimation = (textIndex: number) => {
            let progress = 0;
            setCurrentTextIndex(textIndex);

            // Initial state
            setWidthPercentage(0);
            setIsShowingReveal(false);

            const typewriterInterval = setInterval(() => {
                progress += 1;
                setWidthPercentage(progress);
                setIsRevealStarted(true);

                // At 10% start fading in the reveal text
                if (progress === 20) {
                    showRevealTimer = setTimeout(() => {
                        setIsShowingReveal(true);
                    }, 200);
                }

                if (progress >= 100) {
                    clearInterval(typewriterInterval);

                    // If we're not yet at the final text, move to the next one after delay
                    if (textIndex < revealText.length - 1) {
                        hideRevealTimer = setTimeout(() => {
                            setIsShowingReveal(false);
                        }, intermediateDelay - 300);

                        nextTextTimer = setTimeout(() => {
                            runSingleAnimation(textIndex + 1);
                        }, intermediateDelay);
                    } else if (repeat) {
                        // If at the last text and repeat is true
                        hideRevealTimer = setTimeout(() => {
                            setIsShowingReveal(false);
                        }, repeatDelay - 800);

                        resetTimer = setTimeout(() => {
                            runSingleAnimation(-1); // Back to showing base text
                        }, repeatDelay);
                    }
                }
            }, typewriterSpeed);

            return typewriterInterval;
        };

        const startAnimation = () => {
            // Start with the first intermediate text (index 0)
            return runSingleAnimation(0);
        };

        animationTimer = setTimeout(() => {
            const interval = startAnimation();
            return () => clearInterval(interval);
        }, startDelay);



        return () => {
            clearTimeout(animationTimer);
            clearTimeout(resetTimer);
            clearTimeout(showRevealTimer);
            clearTimeout(hideRevealTimer);
            clearTimeout(nextTextTimer);
        };

    }, [typewriterSpeed, startDelay, repeat, repeatDelay, revealText.length, intermediateDelay]);

    const rotateDeg = (widthPercentage - 50) * 0.1;

    // Dynamic heading element based on prop
    const HeadingTag = headingLevel;

    // Get current text to display from the array
    const currentRevealText = currentTextIndex >= 0 ? revealText[currentTextIndex] : "";

    if (isFinalReveal) {
        setTimeout(() => {
            onFinish();
        }, 6000);
    }

    return (
        <div
            ref={cardRef}
            className={`w-full rounded-lg p-4 md:p-6 lg:p-8 relative overflow-hidden ${className}`}
        >
            <div className="h-auto relative flex text-center items-center justify-center overflow-hidden p-1">
                <AnimatePresence>
                    <motion.div
                        key={`reveal-${currentTextIndex}`}
                        style={{
                            width: "100%",
                        }}
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: isShowingReveal ? 1 : 0,
                            clipPath: `inset(0 ${100 - widthPercentage}% 0 0)`,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            opacity: { duration: 0.5, ease: "easeIn" },
                            clipPath: { duration: 0.4, ease: "easeOut" }
                        }}
                        className="absolute z-20 will-change-transform"
                    >
                        <HeadingTag
                            style={isFinalReveal ? {
                                textShadow: "6px 6px 25px rgba(0,0,0,0.5)",
                                fontSize: "clamp(4rem, 15vw, 14rem)",
                                letterSpacing: "-0.02em",
                                lineHeight: "0.9",
                            } : {
                                fontSize: "clamp(3rem, 8vw, 8rem)",
                                letterSpacing: "-0.02em",
                                lineHeight: "0.9",
                            }}
                            className={isFinalReveal ?
                                `py-6 lg:py-10 bg-gradient-to-r from-indigo-500 to-purple-400 text-transparent bg-clip-text ${MONTSERRAT.className} font-black` :
                                `py-6 lg:py-10 font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-200 via-blue-200 to-gray-500 ${MONTSERRAT.className}`
                            }
                        >
                            {currentRevealText}
                        </HeadingTag>
                    </motion.div>
                </AnimatePresence>

                <motion.div
                    animate={{
                        left: `${widthPercentage}%`,
                        rotate: `${rotateDeg}deg`,
                        opacity: widthPercentage > 0 && widthPercentage < 100 ? 1 : 0,
                        height: ["80%", "90%", "80%"],
                    }}
                    transition={{
                        duration: 0.4,
                        ease: "easeInOut",
                        height: {
                            repeat: Infinity,
                            duration: 2,
                            ease: "easeInOut",
                        }
                    }}
                    className="w-px bg-gradient-to-b from-transparent via-neutral-500 to-transparent absolute z-50 will-change-transform"
                ></motion.div>

                <motion.div
                    className="overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,white,transparent)]"
                    animate={{
                        opacity: isRevealStarted ? 0.1 : 1,
                    }}
                    transition={{
                        opacity: { duration: 0.5, ease: "easeInOut" }
                    }}
                >
                    <HeadingTag
                        style={{
                            fontSize: "clamp(2.5rem, 6vw, 6rem)",
                            letterSpacing: "-0.02em",
                            lineHeight: "0.9",
                        }}
                        className={`py-6 lg:py-10 font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-600 to-neutral-600`}
                    >
                        {text}
                    </HeadingTag>
                    <MemoizedStars />
                </motion.div>
            </div>
        </div>
    );
};

const Stars = () => {
    const randomMove = () => Math.random() * 4 - 2;
    const randomOpacity = () => Math.random();
    const random = () => Math.random();
    return (
        <div className="absolute inset-0">
            {[...Array(180)].map((_, i) => (
                <motion.span
                    key={`star-${i}`}
                    animate={{
                        top: `calc(${random() * 100}% + ${randomMove()}px)`,
                        left: `calc(${random() * 100}% + ${randomMove()}px)`,
                        opacity: randomOpacity(),
                        scale: [1, 1.2, 0],
                    }}
                    transition={{
                        duration: random() * 10 + 20,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    style={{
                        position: "absolute",
                        top: `${random() * 100}%`,
                        left: `${random() * 100}%`,
                        width: `2px`,
                        height: `2px`,
                        backgroundColor: "white",
                        borderRadius: "50%",
                        zIndex: 1,
                    }}
                    className="inline-block"
                ></motion.span>
            ))}
        </div>
    );
};

export const MemoizedStars = memo(Stars);