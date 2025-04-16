import React from 'react';
import useFullPageLoader from '@/hooks/usePageLoader'
import Loader from '@/components/ui/loader'
import { AuroraBackground } from '@/components/ui/aurora';
import { MONTSERRAT } from '@/lib/fonts';
import { IntroCards } from '../intro/IntroCards';
import { useRouter } from 'next/navigation';

function IntroPage() {
    const router = useRouter();
    const handleAuth = () => {
        router.push('/pages/auth')
    };

    return (
        <AuroraBackground>
            <div className='max-w-screen h-screen flex dark:bg-black p-2'>
                <div className='2xl:grid 2xl:grid-cols-2 grid-cols-1 place-content-center bg-transparent p-4'>
                    <div className='2xl:w-[52vw] 3xl:w-auto lg:block hidden'>
                        <IntroCards />
                    </div>
                    <div className='flex flex-col lg:flex-row 2xl:flex-col items-center justify-center lg:mt-5 gap-4'>
                        <span className={`text-white text-6xl md:text-7xl lg:text-4xl xl:text-6xl mt-6 font-bold ${MONTSERRAT.className} text-center`}>
                            Let's get started
                        </span>
                        <div className="mt-4 lg:mt-6 2xl:mt-4 flex justify-center">
                            <button
                                className={`${MONTSERRAT.className} relative lg:text-xl text-lg bg-gradient-to-r from-indigo-600 via-blue-600-400 to-blue-700 text-white py-2 px-8 rounded-full hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all duration-300 transform hover:scale-105`}
                                onClick={handleAuth}
                            >
                                <span>Join Payzoll</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AuroraBackground>
    );
}

const Intro = useFullPageLoader(IntroPage, <Loader />);

export default Intro;

