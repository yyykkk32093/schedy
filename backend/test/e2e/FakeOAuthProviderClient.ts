// test/e2e/FakeOAuthProviderClient.ts
import type {
    IOAuthProviderClient,
    OAuthProfile,
    OAuthProvider,
} from "@/integration/oauth/IOAuthProviderClient.js";

/**
 * テスト用のFake OAuth Provider Client
 * 
 * 事前に設定したプロフィールを返すことで、外部IdPへの通信をバイパスする。
 * code をキーにして返すプロフィールを決定するので、テストケースごとに異なるcode/profileを設定できる。
 */
export class FakeOAuthProviderClient implements IOAuthProviderClient {
    readonly provider: OAuthProvider;

    /**
     * code → OAuthProfile のマッピング
     * null を設定するとエラーをスローする（IdP障害をシミュレート）
     */
    private profileMap: Map<string, OAuthProfile | Error> = new Map();

    constructor(provider: OAuthProvider) {
        this.provider = provider;
    }

    /**
     * 特定のcodeに対して返すプロフィールを設定
     */
    setProfile(code: string, profile: OAuthProfile): void {
        this.profileMap.set(code, profile);
    }

    /**
     * 特定のcodeに対してエラーをスローするよう設定
     */
    setError(code: string, error: Error): void {
        this.profileMap.set(code, error);
    }

    /**
     * 設定をクリア
     */
    clear(): void {
        this.profileMap.clear();
    }

    async fetchProfile(params: { code: string; redirectUri?: string }): Promise<OAuthProfile> {
        const result = this.profileMap.get(params.code);

        if (result === undefined) {
            throw new Error(`[FakeOAuthProviderClient] No profile configured for code: ${params.code}`);
        }

        if (result instanceof Error) {
            throw result;
        }

        return result;
    }
}

/**
 * 全プロバイダーのFakeクライアントを管理するレジストリ
 */
export class FakeOAuthProviderRegistry {
    private static instance: FakeOAuthProviderRegistry | null = null;

    readonly google: FakeOAuthProviderClient;
    readonly line: FakeOAuthProviderClient;
    readonly apple: FakeOAuthProviderClient;

    private constructor() {
        this.google = new FakeOAuthProviderClient("google");
        this.line = new FakeOAuthProviderClient("line");
        this.apple = new FakeOAuthProviderClient("apple");
    }

    static getInstance(): FakeOAuthProviderRegistry {
        if (!FakeOAuthProviderRegistry.instance) {
            FakeOAuthProviderRegistry.instance = new FakeOAuthProviderRegistry();
        }
        return FakeOAuthProviderRegistry.instance;
    }

    /**
     * 全プロバイダーの設定をクリア
     */
    clearAll(): void {
        this.google.clear();
        this.line.clear();
        this.apple.clear();
    }

    /**
     * usecaseFactory に渡すための providerClients オブジェクトを取得
     */
    getProviderClients(): Record<string, IOAuthProviderClient | undefined> {
        return {
            password: undefined,
            google: this.google,
            line: this.line,
            apple: this.apple,
        };
    }
}
