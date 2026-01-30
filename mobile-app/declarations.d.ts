declare module '../../src/db/sqlite' {
    export const initDB: () => void;
    export const getDB: () => any;
}

declare module '../../src/api/client' {
    const client: any;
    export default client;
}
