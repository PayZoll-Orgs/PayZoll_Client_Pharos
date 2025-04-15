"use client";

import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { LoginFormData, RegisterFormData } from "@/lib/interfaces";
import { useAuth } from "@/context/authContext";
import { authApi } from "@/api/authApi";
import { backendDomain } from "@/lib/network";

import { LoginForm, RegisterForm, ResetPasswordForm, ForgotPasswordForm } from "@/components/auth/Forms"
import { BackgroundBeams } from "@/components/ui/beams";



// --- Type Definitions ---
type AuthStep = "register" | "login" | "forgotPassword" | "resetPasswordOtp";
type ForgotPasswordFormData = { email: string };
type ResetPasswordFormData = { otp: string; password: string; confirmPassword: string };


const AuthPage: React.FC = () => {
    const [authStep, setAuthStep] = useState<AuthStep>("register");
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [userEmailForOtp, setUserEmailForOtp] = useState<string | null>(null);

    const { login, register: registerUser } = useAuth();

    // Form Hooks
    const registerForm = useForm<RegisterFormData>();
    const loginForm = useForm<LoginFormData>();
    const forgotPasswordForm = useForm<ForgotPasswordFormData>();
    const resetPasswordForm = useForm<ResetPasswordFormData>();

    // Submit Handlers (remain in the parent component to manage state and API calls)
    const onRegisterSubmit: SubmitHandler<RegisterFormData> = async (data) => {
        setIsLoading(true);
        setApiError(null);
        setSuccessMessage(null);
        try {
            const result = await registerUser(data);
            if (result.success) {
                setSuccessMessage("Registration successful! Please log in.");
                registerForm.reset();
                setAuthStep("login");
            } else {
                setApiError(result.error || "Registration failed");
            }
        } catch (error: any) {
            setApiError(error.response?.data?.message || "An unexpected error occurred during registration.");
        } finally {
            setIsLoading(false);
        }
    };

    const onLoginSubmit: SubmitHandler<LoginFormData> = async (data) => {
        setIsLoading(true);
        setApiError(null);
        setSuccessMessage(null);
        try {
            const result = await login(data);
            if (result.success) {
                console.log("Login successful");
                setSuccessMessage("Login successful! Redirecting..."); // Add actual redirect logic here
                loginForm.reset();
                // Example: router.push('/dashboard');
            } else {
                setApiError(result.error || "Login failed. Check your credentials.");
            }
        } catch (error: any) {
            setApiError(error.response?.data?.message || "An unexpected error occurred during login.");
        } finally {
            setIsLoading(false);
        }
    };

    const onForgotPasswordSubmitHandler: SubmitHandler<ForgotPasswordFormData> = async (data) => {
        setIsLoading(true);
        setApiError(null);
        setSuccessMessage(null);
        try {
            await authApi.forgotPassword(data.email);
            setUserEmailForOtp(data.email);
            setSuccessMessage(`OTP sent to ${data.email}. Check your inbox.`);
            setAuthStep("resetPasswordOtp");
            forgotPasswordForm.reset();
        } catch (error: any) {
            setApiError(error.response?.data?.message || "Failed to send OTP. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const onResetPasswordSubmitHandler: SubmitHandler<ResetPasswordFormData> = async (data) => {
        setIsLoading(true);
        setApiError(null);
        setSuccessMessage(null);
        try {
            const payload = { ...data, email: userEmailForOtp };
            const response = await fetch(`${backendDomain}/auth/resetPassword/otp`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await response.json();

            if (response.ok) {
                setSuccessMessage("Password reset successfully. You can now log in.");
                resetPasswordForm.reset();
                setUserEmailForOtp(null);
                setAuthStep("login");
            } else {
                setApiError(result.message || "Failed to reset password. Invalid OTP or other issue.");
            }
        } catch (error) {
            setApiError("An error occurred while resetting the password.");
        } finally {
            setIsLoading(false);
        }
    };

    // Effect to clear messages on step change
    useEffect(() => {
        setApiError(null);
        setSuccessMessage(null);
    }, [authStep]);

    // Render the correct form based on authStep
    const renderFormContent = () => {
        const commonProps = {
            isLoading,
            apiError,
            successMessage,
            setAuthStep,
        };

        switch (authStep) {
            case "register":
                return <RegisterForm formMethods={registerForm} onSubmit={onRegisterSubmit} {...commonProps} />;
            case "login":
                return <LoginForm formMethods={loginForm} onSubmit={onLoginSubmit} {...commonProps} />;
            case "forgotPassword":
                return <ForgotPasswordForm formMethods={forgotPasswordForm} onSubmit={onForgotPasswordSubmitHandler} {...commonProps} />;
            case "resetPasswordOtp":
                return <ResetPasswordForm formMethods={resetPasswordForm} onSubmit={onResetPasswordSubmitHandler} userEmailForOtp={userEmailForOtp} {...commonProps} />;
            default:
                return null;
        }
    };

    return (
        <>
            <BackgroundBeams />
            <div className="grid xl:grid-cols-2 min-h-screen xl:place-content-center bg-white dark:bg-black p-4">
                <div className="dark:text-white text-black items-center justify-center hidden xl:flex">
                    <p className="text-5xl font-bold">
                        Welcome to our platform! <br /> Please register or log in to continue.
                    </p>
                </div>
                <div className="flex relative items-center justify-center">
                    <div className="w-full max-w-xl rounded-lg">
                        {renderFormContent()}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AuthPage;
