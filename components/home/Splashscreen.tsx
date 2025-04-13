"use client"

import React from 'react'
import useFullPageLoader from '@/hooks/usePageLoader'
import Loader from '@/components/ui/loader'
import { TextRevealCard } from '@/components/ui/textRevealCard'
import { AuroraBackground } from '@/components/ui/aurora'

const revealText = ["DECENTRALIZED", "PAYROLL", "PROTOCOL", "PAYZOLL"]

const SplashscreenPage = ({
    onFinish,
}: {
    onFinish: () => void
}) => {
    return (
        <AuroraBackground>
            <section className='w-screen h-screen flex items-center justify-center'>
                <TextRevealCard
                    text="Welcome to the ... "
                    revealText={revealText}
                    onFinish={onFinish}
                />
            </section>
        </AuroraBackground>
    )
};

const Splashscreen = useFullPageLoader(SplashscreenPage, <Loader />);

export default Splashscreen