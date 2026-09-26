import React from "react";

const DETAIL_ENABLED_NAMES = new Set([
  "website",
  "web development",
  "web app",
  "seo",
  "smm",
  "sem",
  "content",
  "content writing"
]);

export const isDesignService = (service) => {
  const cat = String(service?.categoryName || "").trim().toLowerCase();
  const name = String(service?.name || "").trim().toLowerCase();
  return cat.includes("design") || name.includes("design");
};

export const isContentService = (service) => {
  const cat = String(service?.categoryName || "").trim().toLowerCase();
  const name = String(service?.name || "").trim().toLowerCase();
  return cat.includes("content") || name.includes("content");
};

export const isWebDevService = (service) => {
  const cat = String(service?.categoryName || "").trim().toLowerCase();
  const name = String(service?.name || "").trim().toLowerCase();
  return (
    cat.includes("web") ||
    name.includes("web") ||
    name === "website" ||
    name === "web app" ||
    name === "web development"
  );
};

export const hasServiceDetails = (service) =>
  DETAIL_ENABLED_NAMES.has(String(service?.name || "").toLowerCase()) ||
  isDesignService(service) ||
  isContentService(service) ||
  isWebDevService(service);

// Renders the dynamic detail fields for a single selected service.
// `onDetailChange(field, value)` / `onListToggle(field, value)` are scoped
// to this service by the caller (no serviceId needed here).
export default function ServiceDetailFields({ service, details = {}, onDetailChange, onListToggle }) {
  const key = service?.name?.toLowerCase() || "";

  if (isDesignService(service)) {
    return (
      <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Number of designs</label>
          <input
            type="text"
            min="0"
            value={details.designCount || ""}
            onChange={(e) => onDetailChange("designCount", e.target.value)}
            placeholder="Design count"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Additional Information</label>
          <textarea
            rows={3}
            value={details.additionalInfo || ""}
            onChange={(e) => onDetailChange("additionalInfo", e.target.value)}
            placeholder="Enter design specifications, dimensions, color preferences, etc."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    );
  }

  if (isContentService(service)) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <label className="mb-1 block text-sm font-medium text-gray-700">Additional Information</label>
        <textarea
          rows={3}
          value={details.additionalInfo || ""}
          onChange={(e) => onDetailChange("additionalInfo", e.target.value)}
          placeholder="Enter content guidelines, word count, tone of voice, reference links, etc."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    );
  }

  if (isWebDevService(service)) {
    const isWebsite = key === "website" || key === "web development";

    return (
      <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
        {isWebsite ? (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Technology</label>
              <div className="grid grid-cols-3 gap-2">
                {["WordPress", "Shopify", "Custom"].map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => onDetailChange("technology", tech)}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-medium ${
                      details.technology === tech
                        ? "border-blue-600 bg-blue-100 text-blue-700"
                        : "border-gray-300 bg-white text-gray-700"
                    }`}
                  >
                    {tech === "Custom" ? "Custom Website" : tech}
                  </button>
                ))}
              </div>
            </div>

            {details.technology === "WordPress" && (
              <>
                <p className="text-sm font-medium text-gray-700">WordPress Development</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {["Theme Development", "Minor Customization", "Full Customization"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onDetailChange("wpType", type)}
                      className={`rounded-lg border px-2 py-1.5 text-xs font-medium ${
                        details.wpType === type
                          ? "border-blue-600 bg-blue-100 text-blue-700"
                          : "border-gray-300 bg-white text-gray-700"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={
                    details.wpType === "Theme Development"
                      ? details.themeName || ""
                      : details.customDetails || ""
                  }
                  onChange={(e) =>
                    onDetailChange(
                      details.wpType === "Theme Development" ? "themeName" : "customDetails",
                      e.target.value
                    )
                  }
                  placeholder={
                    details.wpType === "Theme Development" ? "Theme name" : "Customization details"
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                />
              </>
            )}

            {details.technology === "Shopify" && (
              <>
                <p className="text-sm font-medium text-gray-700">Shopify Development</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {["Theme Development", "Minor Customization", "Full Customization"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onDetailChange("shopifyType", type)}
                      className={`rounded-lg border px-2 py-1.5 text-xs font-medium ${
                        details.shopifyType === type
                          ? "border-blue-600 bg-blue-100 text-blue-700"
                          : "border-gray-300 bg-white text-gray-700"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={
                    details.shopifyType === "Theme Development"
                      ? details.shopifyThemeName || ""
                      : details.shopifyCustomDetails || ""
                  }
                  onChange={(e) =>
                    onDetailChange(
                      details.shopifyType === "Theme Development"
                        ? "shopifyThemeName"
                        : "shopifyCustomDetails",
                      e.target.value
                    )
                  }
                  placeholder={
                    details.shopifyType === "Theme Development" ? "Theme name" : "Customization details"
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                />
              </>
            )}

            {details.technology === "Custom" && (
              <>
                <p className="text-sm font-medium text-gray-700">Custom Website Development</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {[
                    "UI/UX Design + Development",
                    "Existing Website Customization",
                    "Fully Custom Website Development"
                  ].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onDetailChange("customType", type)}
                      className={`rounded-lg border px-2 py-1.5 text-xs font-medium ${
                        details.customType === type
                          ? "border-blue-600 bg-blue-100 text-blue-700"
                          : "border-gray-300 bg-white text-gray-700"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={details.techStack || ""}
                  onChange={(e) => onDetailChange("techStack", e.target.value)}
                  placeholder="Tech stack (e.g. React, Node.js)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                />
              </>
            )}
          </>
        ) : (
          <>
            <input
              type="text"
              value={details.techStack || ""}
              onChange={(e) => onDetailChange("techStack", e.target.value)}
              placeholder="Tech stack"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
            />
            <textarea
              rows={2}
              value={details.features || ""}
              onChange={(e) => onDetailChange("features", e.target.value)}
              placeholder="Features"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
            />
          </>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Additional Information</label>
          <textarea
            rows={3}
            value={details.additionalInfo || ""}
            onChange={(e) => onDetailChange("additionalInfo", e.target.value)}
            placeholder="Add any additional requirements, domain/hosting details, or notes..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    );
  }

  if (key === "seo") {
    return (
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <input
          type="number"
          value={details.keywordCount || ""}
          onChange={(e) => onDetailChange("keywordCount", e.target.value)}
          placeholder="Keyword count"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
        />
        <input
          type="number"
          value={details.blogCount || ""}
          onChange={(e) => onDetailChange("blogCount", e.target.value)}
          placeholder="Blog count"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
        />
      </div>
    );
  }

  if (key === "smm") {
    const subs = details.subServices || [];
    return (
      <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3 grid grid-cols-5 gap-3">
        {[
          { key: "Poster", label: "Posters", countKey: "posterCount" },
          { key: "Video", label: "Video", countKey: "videoCount" },
          { key: "VideoProduction", label: "Video Production", countKey: "videoproductionCount" },
          { key: "Stories", label: "Stories", countKey: "storiesCount" },
          { key: "Banners", label: "Banners", countKey: "bannersCount" }
        ].map((item) => (
          <div key={item.key} className="rounded-lg border border-gray-200 bg-white p-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={subs.includes(item.key)}
                onChange={() => onListToggle("subServices", item.key)}
              />
              {item.label}
            </label>
            {subs.includes(item.key) && (
              <input
                type="number"
                min="0"
                value={details[item.countKey] || ""}
                onChange={(e) => onDetailChange(item.countKey, e.target.value)}
                placeholder={`Number of ${item.label.toLowerCase()}`}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  if (key === "sem") {
    const platforms = details.platforms || [];
    return (
      <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <p className="text-sm font-medium text-gray-700">Platform</p>
        <div className="flex flex-wrap gap-2">
          {["Google", "Meta", "LinkedIn"].map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => onListToggle("platforms", platform)}
              className={`rounded-lg border px-3 py-1 text-xs ${
                platforms.includes(platform)
                  ? "border-blue-600 bg-blue-100 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              {platform}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
