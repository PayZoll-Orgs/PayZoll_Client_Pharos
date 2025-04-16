"use client";
import Image from "next/image";
import React from "react";
import { Carousel, Card } from "@/components/ui/cardsCarousel";
import { FlipWords } from "@/components/ui/flipWords";
import { MONTSERRAT } from "@/lib/fonts";
import useFullPageLoader from "@/hooks/usePageLoader";
import Loader from "@/components/ui/loader";

const DummyContent = () => {
    return (
        <div
            key={"dummy-content"}
            // Adjust padding for responsiveness
            className="bg-[#F5F5F7] dark:bg-neutral-800 p-4 md:p-6 lg:p-8 xl:p-14 rounded-3xl mb-4"
        >
            <p className="text-neutral-600 dark:text-neutral-400 text-sm md:text-base lg:text-lg font-sans max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto">
                <span className="font-bold text-neutral-700 dark:text-neutral-200">
                    The first rule of Apple club is that you boast about Apple club.
                </span>{" "}
                Keep a journal, quickly jot down a grocery list, and take amazing
                class notes. Want to convert those notes to text? No problem.
                Langotiya jeetu ka mara hua yaar is ready to capture every
                thought.
            </p>
        </div>
    );
};

const data = [
    {
        category: "Artificial Intelligence",
        title: "You can do more with AI.",
        src: "./fiat-ramp.png",
        content: <DummyContent />,
    },
    {
        category: "Productivity",
        title: "Enhance your productivity.",
        src: "https://images.unsplash.com/photo-1531554694128-c4c6665f59c2?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        content: <DummyContent />,
    },
    {
        category: "Product",
        title: "Launching the new Apple Vision Pro.",
        src: "./fiat-ramp.png",
        content: <DummyContent />,
    },

    {
        category: "Product",
        title: "Maps for your iPhone 15 Pro Max.",
        src: "https://images.unsplash.com/photo-1599202860130-f600f4948364?q=80&w=2515&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        content: <DummyContent />,
    },
    {
        category: "iOS",
        title: "Photography just got better.",
        src: "https://images.unsplash.com/photo-1602081957921-9137a5d6eaee?q=80&w=2793&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        content: <DummyContent />,
    },
    {
        category: "Hiring",
        title: "Hiring for a Staff Software Engineer",
        src: "https://images.unsplash.com/photo-1511984804822-e16ba72f5848?q=80&w=2048&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        content: <DummyContent />,
    },
];

function FeaturesPage() {
    const cards = data.map((card, index) => (
        // Pass layout prop for smoother animation if desired
        <Card key={card.src} card={card} index={index} layout />
    ));

    return (
        // Adjust width, use min-height instead of fixed height percentage
        <div className="h-screen w-screen dark:bg-black p-10 flex items-center justify-center mt-2">
            <div className="grid grid-rows-1 place-content-center">
                <div className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl mx-auto font-semibold xl:font-bold text-neutral-600 dark:text-neutral-400 text-center flex flex-col sm:flex-row">
                    <span className={`bg-gradient-to-br mr-2 dark:from-indigo-500 dark:to-purple-400 from-indigo-400 to-purple-300 text-transparent bg-clip-text ${MONTSERRAT.className}`}>PayZoll</span>
                    offers
                    <FlipWords words={["Security", "Seamlessness", "Fast Transfers", "Global Payments", "Multi-Chain Support", "Off-Ramps", "Stable Token Marketplace", "AI Finance Agents"]} className={` ${MONTSERRAT.className} text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl`} />
                </div>
                <div className="">
                    <Carousel items={cards} />
                </div>
            </div>
        </div>
    );
}

const Features = useFullPageLoader(FeaturesPage, <Loader />);
export default Features;