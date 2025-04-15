import React from 'react';
import useFullPageLoader from '@/hooks/usePageLoader'
import Loader from '@/components/ui/loader'
import { AuroraBackground } from '@/components/ui/aurora';
import { MONTSERRAT } from '@/lib/fonts';
import { IntroCards } from '../intro/IntroCards';
import { HoverBorderGradient } from '../ui/hoverBorderGradient';
import { useRouter } from 'next/navigation';

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
                            <HoverBorderGradient
                                containerClassName="rounded-full"
                                as="button"
                                onClick={() => handleAuth()}
                                className="bg-black text-white flex items-center space-x-2 text-lg font-bold"
                            >
                                <span>Join Payzoll</span>
                            </HoverBorderGradient>
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

