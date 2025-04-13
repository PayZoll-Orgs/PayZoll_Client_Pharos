import React from 'react';
import useFullPageLoader from '@/hooks/usePageLoader'
import Loader from '@/components/ui/loader'
import { AuroraBackground } from '@/components/ui/aurora';
import { TypewriterEffectSmooth } from '@/components/ui/typewriter';
import { MONTSERRAT } from '@/lib/fonts';

function IntroPage() {
    const words = [
        {
            text: "Global",
        },
        {
            text: "payroll",
        },
        {
            text: "coverage",
        },
        {
            text: "with",
        },
        {
            text: "PAYZOLL.",
            className: `bg-gradient-to-r from-indigo-500 to-purple-400 text-transparent bg-clip-text ${MONTSERRAT.className}  text-6xl font-bold`,
        },
    ];

    return (
        <AuroraBackground>
            <div className="flex flex-col items-center justify-center w-screen h-screen">
                <TypewriterEffectSmooth words={words} />
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-0 md:space-x-4">
                    <button className="w-40 h-10 rounded-xl bg-black border dark:border-white border-transparent text-white text-sm">
                        Join now
                    </button>
                    <button className="w-40 h-10 rounded-xl bg-white text-black border border-black  text-sm">
                        Signup
                    </button>
                </div>
            </div>
        </AuroraBackground>
    );
}

const Intro = useFullPageLoader(IntroPage, <Loader />);

export default Intro;

