"use client";

import React from "react";
import dynamic from "next/dynamic";
import Loader from "@/components/ui/loader";

import { FlipWords } from "@/components/ui/flipWords";
import { MONTSERRAT } from "@/lib/fonts";
import useFullPageLoader from "@/hooks/usePageLoader";

const Carousel = dynamic(() => import("@/components/ui/cardsCarousel").then(mod => mod.Carousel), {
    ssr: false,
    loading: () => <Loader />
});

const Card = dynamic(() => import("@/components/ui/cardsCarousel").then(mod => mod.Card), {
    ssr: false,
    loading: () => <Loader />
});


const DummyContent = () => {
    return (
        <div
            key={"dummy-content"}
            // Adjust padding for responsiveness
            className="bg-[#F5F5F7] dark:bg-neutral-800 p-4 md:p-6 lg:p-8 xl:p-14 rounded-3xl mb-4"
        >
            <p className="text-neutral-600 dark:text-neutral-400 text-sm md:text-base lg:text-lg font-sans max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto">
                <span className="font-bold text-neutral-700 dark:text-neutral-200">
                    Feature Description
                </span>{" "}
                Have all the details about the features and the functionality.
            </p>
        </div>
    );
};

const data = [
    {
        category: "Fiat Ramps",
        title: "Buy crypto with your fiat, get fiat for your crypto",
        src: "./fiat-ramp.png",
        content: <DummyContent />,
    },
    {
        category: "Payroll",
        title: "Globally pay your workforce.",
        src: "./fiat-ramp.png",
        content: <DummyContent />,
    },
    {
        category: "Streaming",
        title: "Long Term Payroll",
        src: "./fiat-ramp.png",
        content: <DummyContent />,
    },

    {
        category: "Secure Payments",
        title: "Recoverable Secure Payments",
        src: "./fiat-ramp.png",
        content: <DummyContent />,
    },
    {
        category: "AI Finance Agents",
        title: "Fintech just got better.",
        src: "./fiat-ramp.png",
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
                <div className="max-w-7xl overflow-x-scroll">
                    <Carousel items={cards} />
                </div>
            </div>
        </div>
    );
}

const Features = useFullPageLoader(FeaturesPage, <Loader />);
export default Features;