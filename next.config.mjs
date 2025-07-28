/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // Basic webpack config for audio files
    webpack: (config) => {
        config.module.rules.push({
            test: /\.(mp3|wav|ogg)$/,
            type: 'asset/resource',
        });
        return config;
    },
};

export default nextConfig;
