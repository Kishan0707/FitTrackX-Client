import React from "react";
import {
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
  FaLinkedin,
  FaLink,
} from "react-icons/fa";

const SocialShare = ({ title, text, url }) => {
  const shareUrl = url || window.location.href;
  const shareText = text || "Check out my fitness progress on FitTrack!";
  // eslint-disable-next-line no-unused-vars
  const shareTitle = title || "FitTrack Progress";

  const handleShare = (platform) => {
    let shareLink = "";

    switch (platform) {
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "whatsapp":
        shareLink = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
        break;
      case "linkedin":
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
        return;
      default:
        return;
    }

    window.open(shareLink, "_blank", "width=600,height=400");
  };

  return (
    <div className="flex gap-3 items-center">
      <p className="text-slate-400 text-sm">Share:</p>
      <button
        onClick={() => handleShare("facebook")}
        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition"
        aria-label="Share on Facebook"
      >
        <FaFacebook size={18} />
      </button>
      <button
        onClick={() => handleShare("twitter")}
        className="p-2 bg-sky-500 hover:bg-sky-600 rounded-full transition"
        aria-label="Share on Twitter"
      >
        <FaTwitter size={18} />
      </button>
      <button
        onClick={() => handleShare("whatsapp")}
        className="p-2 bg-green-500 hover:bg-green-600 rounded-full transition"
        aria-label="Share on WhatsApp"
      >
        <FaWhatsapp size={18} />
      </button>
      <button
        onClick={() => handleShare("linkedin")}
        className="p-2 bg-blue-700 hover:bg-blue-800 rounded-full transition"
        aria-label="Share on LinkedIn"
      >
        <FaLinkedin size={18} />
      </button>
      <button
        onClick={() => handleShare("copy")}
        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full transition"
        aria-label="Copy link"
      >
        <FaLink size={18} />
      </button>
    </div>
  );
};

export default SocialShare;
