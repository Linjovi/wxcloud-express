import React from "react";
import { Helmet } from "react-helmet";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  jsonLd?: Record<string, any>;
}

export const SEO: React.FC<SEOProps> = ({
  title = "呼噜呼噜事务所",
  description = "呼噜呼噜事务所提供猫猫摄影师、猫猫法官裁决、吃瓜热搜、塔罗占卜等趣味功能，为您提供温暖与乐趣。",
  keywords = "猫猫摄影师, 猫猫法官, 塔罗牌, 热搜, 趣味应用, 呼噜呼噜事务所, AI应用, 治愈系",
  image = "https://static-index-4gtuqm3bfa95c963-1304825656.tcloudbaseapp.com/official-website/favicon.svg",
  url,
  jsonLd,
}) => {
  const fullTitle =
    title === "呼噜呼噜事务所" ? title : `${title} | 呼噜呼噜事务所`;
  const currentUrl =
    url || (typeof window !== "undefined" ? window.location.href : "https://huluhulu.cn");

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={currentUrl} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};
