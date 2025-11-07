import packageJson from '../../package.json'

// App Router compatible config utility
// Replaces next/config's publicRuntimeConfig
export const publicRuntimeConfig = {
    version: packageJson.version,
}

