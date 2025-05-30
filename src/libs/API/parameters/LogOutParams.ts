type LogOutParams = {
    authToken: string | null;
    partnerUserID: string;
    partnerName: string;
    partnerPassword: string;
    shouldRetry: boolean;
    skipReauthentication?: boolean;
};

export default LogOutParams;
