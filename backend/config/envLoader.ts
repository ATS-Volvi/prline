import dotenv from 'dotenv'
dotenv.config()

const ENV = [
    "DB_USERNAME",
    "DB_PASSWORD",
    "DB_NAME",
    "JWT_SECRET",
    "PORT",
    "WORKSPACE_PASSWORD",
    "WORKSPACE_EMAIL",
    "BASE_URL",
    "DATABASE_URL"
] as const

const loadVar = (env: readonly string[]): Record<string, string> => {
    const variables: Record<string, string> = {}
    env.forEach(name => {
        const value = process.env[`${name}`]
        if (value) {
            variables[`${name}`] = value
        }
    })
    return variables
}

export const variables: Record<string, string> = loadVar(ENV)
