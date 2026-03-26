export default class Env {
    static get appConfig(): AppConfig {
        // TODO: make synchronized between threads
        if (!window.appConfig) {
            const request = new XMLHttpRequest();
            request.open('GET', `${window.location.origin}/config/env.json`, false);
            request.send(null);
            if (request.status === 200) {
                window.appConfig = JSON.parse(request.response);
            }
        }
        return window.appConfig;
    }

    public static get ENV_ID() {
        return Env.appConfig.ENV_ID;
    }

    public static get VERSION() {
        return Env.appConfig.VERSION;
    }

    public static get API_SERVER_URL() {
        return Env.appConfig.API_SERVER_URL;
    }

    public static get AUTH_SERVER_URL() {
        return Env.appConfig.AUTH_SERVER_URL;
    }

    public static get AUTH_CLIENT_ID() {
        return Env.appConfig.AUTH_CLIENT_ID;
    }

    public static get AUTH_CLIENT_SECRET() {
        return Env.appConfig.AUTH_CLIENT_SECRET;
    }

    public static get LOGIN_URL() {
        return Env.appConfig.LOGIN_URL;
    }

    public static get LOGOUT_URL() {
        return Env.appConfig.LOGOUT_URL;
    }
}
