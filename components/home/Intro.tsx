import React from 'react';
import useFullPageLoader from '@/hooks/usePageLoader'
import Loader from '@/components/ui/loader'
import { AuroraBackground } from '@/components/ui/aurora';
import { MONTSERRAT } from '@/lib/fonts';
import { IntroCards } from '../intro/IntroCards';
import { useRouter } from 'next/navigation';
import { GlowingEffect } from '../ui/glowingEffect';

function IntroPage() {
    const router = useRouter();
    const handleAuth = () => {
        router.push('/pages/auth')
    };

    return (
        <AuroraBackground>
            <div className='w-screen h-screen flex items-center justify-center bg-black'>
                <div className='2xl:grid 2xl:grid-cols-2 2xl:place-content-center bg-transparent p-4'>
                    <div className='2xl:w-[55vw] 3xl:w-auto md:block hidden'>
                        <IntroCards />
                    </div>
                    <div className='flex flex-col items-center justify-center mt-10'>
                        <span className={`text-white text-6xl md:text-5xl lg:text-6xl xl:text-7xl mt-6 font-bold ${MONTSERRAT.className} text-center`}>
                            Let's get started
                        </span>
                        <div className="mt-4 flex justify-center">
                                <button
                                    className={`${MONTSERRAT.className} relative text-xl bg-gradient-to-r from-indigo-600 via-blue-600-400 to-blue-700 text-white py-3 px-8 rounded-full hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all duration-300 transform hover:scale-105`}
                                    onClick={handleAuth}
                                >
                                    <span>Join Payzoll</span>
                                </button>

                        </div>
                        <span className='text-white max-w-xl mt-4'> Need to add that button that opens multiple menus one of which will lead you to the auth page, to the offramp etc and other service.</span>
                    </div>
                </div>
            </div>
        </AuroraBackground>
    );
}

const Intro = useFullPageLoader(IntroPage, <Loader />);

export default Intro;

