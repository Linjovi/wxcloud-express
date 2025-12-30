import React from "react";

// Using a cuter, more "Anime/Cartoon" style cat image
export const CatJudgeAvatar = ({
  className = "w-24 h-24",
}: {
  className?: string;
}) => (
  <div
    className={`${className} relative overflow-hidden rounded-full border-4 border-orange-200 shadow-xl bg-white`}
  >
    <img
      src="https://pic1.imgdb.cn/item/6938116c00233646958db30e.png"
      alt="Anime Cat Judge"
      className="w-full h-full object-cover transform scale-110"
    />
  </div>
);

export const GossipCatAvatar = ({
  className = "w-24 h-24",
}: {
  className?: string;
}) => (
  <div
    className={`${className} relative overflow-hidden rounded-full border-4 border-pink-200 shadow-xl bg-white`}
  >
    <img
      src="https://pic1.imgdb.cn/item/6938117f00233646958db3b6.png"
      alt="Gossip Cat"
      className="w-full h-full object-cover"
    />
  </div>
);

export const PawIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C10.9 2 10 2.9 10 4s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-5 2C5.9 4 5 4.9 5 6s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-5 5c-2.21 0-4 1.79-4 4 0 1.5.8 2.77 2 3.46v2.04c0 .83.67 1.5 1.5 1.5h1c.83 0 1.5-.67 1.5-1.5v-2.04c1.2-.69 2-1.96 2-3.46 0-2.21-1.79-4-4-4z" />
  </svg>
);

export const CatFaceIcon = ({
  className = "w-6 h-6",
}: {
  className?: string;
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 4v1l3 3c.6.6 1 1.4 1 2.3v3.4c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4v-3.4c0-.9.4-1.7 1-2.3l3-3V4m0 0a2 2 0 012-2h4a2 2 0 012 2M9 13h.01M15 13h.01M10 16a2 2 0 004 0"
    />
  </svg>
);

export const GavelIcon = ({
  className = "w-6 h-6",
}: {
  className?: string;
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

export const ChevronLeft = ({
  className = "w-6 h-6",
}: {
  className?: string;
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

export const ArrowLeftIcon = ({
  className = "w-6 h-6",
}: {
  className?: string;
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    />
  </svg>
);

export const BookIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

export const SparklesIcon = ({
  className = "w-6 h-6",
}: {
  className?: string;
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  </svg>
);

export const FortuneCatAvatar = ({
  className = "w-24 h-24",
}: {
  className?: string;
}) => (
  <div
    className={`${className} relative overflow-hidden rounded-full border-4 border-blue-200 shadow-xl bg-purple-50`}
  >
    <img
      src="https://pic1.imgdb.cn/item/69315edc1f1698c4ff0bedaf.png"
      alt="Fortune Cat"
      className="w-full h-full object-cover transform scale-110"
    />
  </div>
);

export const TarotCatAvatar = ({
  className = "w-24 h-24",
}: {
  className?: string;
}) => (
  <div
    className={`${className} relative overflow-hidden rounded-full border-4 border-purple-200 shadow-xl bg-purple-50`}
  >
    <img
      src="https://pic1.imgdb.cn/item/6938119300233646958db43a.png"
      alt="Tarot Cat"
      className="w-full h-full object-cover transform scale-110"
    />
  </div>
);

export const PhotographyCatAvatar = ({
  className = "w-24 h-24",
}: {
  className?: string;
}) => (
  <div
    className={`${className} relative overflow-hidden rounded-full border-4 border-yellow-200 shadow-xl bg-yellow-50`}
  >
    {/* Using a bright/happy cat image for Photography Cat */}
    <img
      src="https://pic1.imgdb.cn/item/6943c1dd2ee916d1a3af9521.png"
      alt="Photography Cat"
      className="w-full h-full object-cover transform scale-110"
    />
  </div>
);

export const MemeCatAvatar = ({
  className = "w-24 h-24",
}: {
  className?: string;
}) => (
  <div
    className={`${className} relative overflow-hidden rounded-full border-4 border-green-200 shadow-xl bg-green-50`}
  >
    <img
      src="https://pic1.imgdb.cn/item/693921056166b8110136209c.png"
      alt="Meme Cat"
      className="w-full h-full object-cover transform scale-110"
    />
  </div>
);
