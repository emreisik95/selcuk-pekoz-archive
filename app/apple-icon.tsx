import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 96,
          background: "#0d0c0a",
          color: "#faf9f6",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          fontWeight: 800,
          letterSpacing: "-0.04em",
        }}
      >
        SP
      </div>
    ),
    { ...size },
  );
}
