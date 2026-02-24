export interface TenantContactInfo {
    address: string;
    phone: string;
    email: string;
}

export interface TenantInfo {
    id: string;
    name: string;
    code: string;
    logoUrl: string | null;
    contact: TenantContactInfo;
}

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface VerificationInfo {
    status: VerificationStatus;
    businessLicenseUrl: string | null;
    legalRepName: string | null;
    registeredCapital: string | null;
    businessScope: string | null;
    verifiedAt: Date | null;
    verificationRejectReason: string | null;
}
