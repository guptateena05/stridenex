const withPWA = require("next-pwa")({
  dest: "public",
  disable: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    webpackBuildWorker: false,
    cpus: 1,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "devstridenex.quantcloud.in",
      },
      {
        protocol: "https",
        hostname: "officestridenex.quantcloud.in",
      },
      {
        protocol: "https",
        hostname: "www.tbsnews.net",
        pathname: "/sites/default/files/**",
      },
    ],
  },

  async rewrites() {
    return [
      // Direct LMS wildcard
      {
        source: "/lms/:path*",
        destination: "http://127.0.0.1:3003/:path*",
      },
      {
        source: "/courses",
        destination: "http://127.0.0.1:3003/courses",
      },
      {
        source: "/courses/:slug",
        destination: "http://127.0.0.1:3003/course/:slug",
      },
      {
        source: "/course/:path*",
        destination: "http://127.0.0.1:3003/course/:path*",
      },
      {
        source: "/certificates",
        destination: "http://127.0.0.1:3003/certificates",
      },
      {
        source: "/certificates/:path*",
        destination: "http://127.0.0.1:3003/certificates/:path*",
      },
      {
        source: "/certificate-evaluations",
        destination: "http://127.0.0.1:3003/certificate-evaluations",
      },
      {
        source: "/certificate-evaluations/:path*",
        destination: "http://127.0.0.1:3003/certificate-evaluations/:path*",
      },
      {
        source: "/dashboard",
        destination: "http://127.0.0.1:3003/dashboard",
      },
      {
        source: "/enrollments",
        destination: "http://127.0.0.1:3003/enrollments",
      },
      {
        source: "/batches",
        destination: "http://127.0.0.1:3003/batches",
      },
      {
        source: "/batches/:path*",
        destination: "http://127.0.0.1:3003/batches/:path*",
      },
      {
        source: "/batch",
        destination: "http://127.0.0.1:3003/batch",
      },
      {
        source: "/batch/:path*",
        destination: "http://127.0.0.1:3003/batch/:path*",
      },
      {
        source: "/programs",
        destination: "http://127.0.0.1:3003/programs",
      },
      {
        source: "/programs/:path*",
        destination: "http://127.0.0.1:3003/programs/:path*",
      },
      {
        source: "/quizzes",
        destination: "http://127.0.0.1:3003/quizzes",
      },
      {
        source: "/quizzes/:path*",
        destination: "http://127.0.0.1:3003/quizzes/:path*",
      },
      {
        source: "/assignments",
        destination: "http://127.0.0.1:3003/assignments",
      },
      {
        source: "/assignments/:path*",
        destination: "http://127.0.0.1:3003/assignments/:path*",
      },
      {
        source: "/programming-exercises",
        destination: "http://127.0.0.1:3003/programming-exercises",
      },
      {
        source: "/programming-exercises/:path*",
        destination: "http://127.0.0.1:3003/programming-exercises/:path*",
      },
      {
        source: "/my-payments",
        destination: "http://127.0.0.1:3003/my-payments",
      },
      {
        source: "/profile/payments",
        destination: "http://127.0.0.1:3003/profile/payments",
      },
      {
        source: "/sales-earnings",
        destination: "http://127.0.0.1:3003/sales-earnings",
      },
      {
        source: "/instructor/settings",
        destination: "http://127.0.0.1:3003/instructor/settings",
      },
      {
        source: "/instructor/settings/:path*",
        destination: "http://127.0.0.1:3003/instructor/settings/:path*",
      },
      {
        source: "/categories",
        destination: "http://127.0.0.1:3003/categories",
      },
      {
        source: "/badges",
        destination: "http://127.0.0.1:3003/badges",
      },
      {
        source: "/badges/:path*",
        destination: "http://127.0.0.1:3003/badges/:path*",
      },
      {
        source: "/course-evaluators",
        destination: "http://127.0.0.1:3003/course-evaluators",
      },
      {
        source: "/evaluators",
        destination: "http://127.0.0.1:3003/evaluators",
      },
      {
        source: "/questions",
        destination: "http://127.0.0.1:3003/questions",
      },
      {
        source: "/questions/:path*",
        destination: "http://127.0.0.1:3003/questions/:path*",
      },
      {
        source: "/progress",
        destination: "http://127.0.0.1:3003/progress",
      },
      {
        source: "/coupons",
        destination: "http://127.0.0.1:3003/coupons",
      },
      {
        source: "/coupons/:path*",
        destination: "http://127.0.0.1:3003/coupons/:path*",
      },
      {
        source: "/checkout",
        destination: "http://127.0.0.1:3003/checkout",
      },
      {
        source: "/payment-success",
        destination: "http://127.0.0.1:3003/payment-success",
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
