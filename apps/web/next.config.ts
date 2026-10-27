import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // MVP は localhost でのみ動かす（外部公開しない）
  poweredByHeader: false,
};

export default nextConfig;
