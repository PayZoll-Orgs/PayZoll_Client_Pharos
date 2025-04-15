
export interface Employee {
    name: string;
    email: string;
    designation: string;
    salary: string;
    wallet: string;
    company: string;
}

export interface PayrollData {
    company: string;
    employees: Array<{
        wallet: string;
        amount: string;
    }>;
    totalAmount: string;
    tokenSymbol: string;
    chain: String;
    transactionHash?: string;
}

export interface Payment {
    id: string;
    amount: string;
    date: string;
    status: "completed" | "pending" | "failed";
}


export interface RegisterFormData {
    email: string;
    password: string;
    confirmPassword: string;
    company: string;
}

export interface LoginFormData {
    email: string;
    password: string;
}

export interface AuditLogData {
    company: string;
    action: string;
    details: Record<string, any>;
    entity: string;
}

export interface EmailRequest {
    email: string;
}

export interface EmailResponse {
    success: boolean;
    message: string;
    error?: string;
}

export interface NewsletterSubscriptionRequest extends EmailRequest { }
export interface WaitlistRegistrationRequest extends EmailRequest { }