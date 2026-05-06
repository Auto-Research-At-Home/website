import { ImageResponse } from "next/og";

export const alt =
  "OpenResearch - decentralized agent-driven research powered by benchmarks";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#000000",
          color: "#ffffff",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "radial-gradient(circle at 78% 22%, rgba(143, 212, 234, 0.34), transparent 30%), radial-gradient(circle at 16% 78%, rgba(69, 181, 165, 0.22), transparent 28%), linear-gradient(135deg, #000000 0%, #071015 46%, #000000 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.34,
            backgroundImage:
              "linear-gradient(rgba(143, 212, 234, 0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(143, 212, 234, 0.16) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 70,
            right: 70,
            top: 70,
            bottom: 70,
            display: "flex",
            border: "1px solid rgba(143, 212, 234, 0.28)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            padding: "88px 92px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 112,
                lineHeight: 1,
                letterSpacing: 0,
                fontWeight: 800,
              }}
            >
              OpenResearch
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 28,
                maxWidth: 820,
                color: "#d7eef5",
                fontSize: 42,
                lineHeight: 1.16,
              }}
            >
              The benchmark is the oracle.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              fontSize: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                color: "#ffffff",
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  marginRight: 14,
                  borderRadius: 999,
                  background: "#45b5a5",
                }}
              />
              openresearch.xyz
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
