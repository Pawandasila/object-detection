/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // Optimize for PWA and camera usage
    experimental: {
        optimizeCss: true,
    },
    // Handle audio files and media
    webpack: (config) => {
        config.module.rules.push({
            test: /\.(mp3|wav|ogg)$/,
            type: 'asset/resource',
        });
        return config;
    },
    // Optimize images and media
    images: {
        domains: [],
        formats: ['image/webp', 'image/avif'],
    },
    // PWA optimization
    async headers() {
        return [
            {
                source: '/manifest.json',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'application/manifest+json',
                    },
                ],
            },
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
