import React, { useState, useRef, useEffect } from 'react';
import { RevealLinks } from '../ui/reveaLinks';
import { AuroraBackground } from '../ui/aurora';
import emailApi from "@/api/emailApi";
import EncryptButton from "../ui/encryptBtn";
import { Cover } from "../ui/cover";

export default function Footer() {
    return (
        <AuroraBackground className='relative'>
            <div className="min-h-screen min-w-screen xl:grid xl:grid-cols-2">
                <div className='xl:h-screen pt-10 xl:pt-0'>
                    <RevealLinks />
                </div>
                <div className='xl:h-screen'>
                    <FooterHelper />
                </div>
            </div>
        </AuroraBackground>
    );
}

const FooterHelper = () => {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{
        type: 'success' | 'error' | null;
        message: string;
    }>({ type: null, message: '' });

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleWaitlistSubmit = async () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        if (!email) {
            setSubmitStatus({
                type: 'error',
                message: 'Please enter your email address'
            });

            setTimeout(() => {
                setSubmitStatus({ type: null, message: '' });
            }, 2000);

            return;
        }

        setIsSubmitting(true);
        setSubmitStatus({ type: null, message: '' });

        try {
            const response = await emailApi.joinWaitlist({ email });

            if (response.success) {
                setEmail("");
                setSubmitStatus({
                    type: 'success',
                    message: 'Thank you for joining our waitlist!'
                });
            } else {
                setSubmitStatus({
                    type: 'error',
                    message: response.message || 'Failed to join waitlist. Please try again.'
                });
            }
        } catch (error) {
            console.error('Waitlist registration error:', error);
            setSubmitStatus({
                type: 'error',
                message: 'An error occurred. Please try again later.'
            });
        } finally {
            setIsSubmitting(false);
            timeoutRef.current = setTimeout(() => {
                setSubmitStatus({ type: null, message: '' });
                timeoutRef.current = null;
            }, 5000);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full md:gap-6 gap-3 md:px-8 md:py-24 py-4 dark:text-white text-black">
            <div className='flex items-center justify-center'>
                <div>
                    <h1 className="text-3xl md:text-4xl lg:text-6xl font-semibold max-w-7xl md:mx-auto text-center z-20 py-6 bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-neutral-700 to-neutral-700 dark:from-neutral-800 dark:via-white dark:to-white">
                        Join us to revolutionize fintech at <br /> <Cover>payzoll's speed</Cover>
                    </h1>
                </div>
            </div>
            <div className="w-[80%] md:max-w-lg  flex flex-col items-center justify-center gap-6">
                <input
                    type="email"
                    placeholder="Enter your email address"
                    className="relative w-full px-6 py-4 text-lg rounded-full bg-neutral-200 dark:bg-black text-black dark:text-white placeholder-gray-900 dark:placeholder-gray-300 focus:outline-none focus:ring-2 dark:focus:ring-gray-100 focus:ring-gray-800  focus:ring-offset-2 focus:ring-offset-transparent transition-shadow duration-200"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    aria-label="Email for waitlist"
                />
                <EncryptButton
                    TARGET_TEXT="Join Waitlist"
                    onClick={handleWaitlistSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Processing...' : 'Join Waitlist'}
                </EncryptButton>
            </div>
            <div className="h-6 mt-4 text-center">
                {submitStatus.type && (
                    <p className={`text-base ${submitStatus.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {submitStatus.message}
                    </p>
                )}
            </div>
        </div>
    );
}