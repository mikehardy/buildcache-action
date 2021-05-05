export declare function printConfig(): Promise<void>;
export declare function printStats(): Promise<void>;
export declare function zeroStats(): Promise<void>;
export declare function getEnvVar(key: string, defaultValue: string): string;
export declare function getAccessToken(): string;
export declare function getCacheKeys(): {
    base: string;
    withInput: string;
    unique: string;
};
