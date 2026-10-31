import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = site.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#0b0f17", color: "#e6e9ef" }}>
        <div style={{ fontSize: 40, color: "#38bdf8" }}>{site.name}</div>
        <div style={{ fontSize: 72, fontWeight: 700, marginTop: 20, lineHeight: 1.1 }}>{site.tagline}</div>
        <div style={{ fontSize: 32, marginTop: 30, color: "#97a0b0" }}>Precios en vivo · Dólar cripto · Conversores</div>
      </div>
    ),
    size,
  );
}
