export interface Stats {
    entries: number;
    misses: number;
}
export declare function printConfig(): Promise<void>;
export declare function printStats(): Promise<Stats>;
export declare function zeroStats(): Promise<void>;
export declare function getEnvVar(key: string, defaultValue: string, quiet?: boolean): string;
export declare function getAccessToken(): string;
export declare function getInstallDir(): Promise<string>;
export declare function getCacheDir(): Promise<string>;
export declare function getCacheKeys(): {
    base: string;
    withInput: string;
    unique: string;
};
