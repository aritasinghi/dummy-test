interface AppConfig {
    ENV_ID: string;
    VERSION: string;
    API_SERVER_URL: string;
    AUTH_SERVER_URL: string;
    AUTH_CLIENT_ID: string;
    AUTH_CLIENT_SECRET: string;
    LOGIN_URL: string;
    LOGOUT_URL: string;
}

interface Window {
    appConfig: AppConfig;
}
