// ads.txt: declara a Google como vendedor autorizado. Se genera a partir de NEXT_PUBLIC_ADSENSE_CLIENT.
export const dynamic = "force-static";

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const body = client ? `google.com, ${client.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n` : "# AdSense todavía no configurado\n";
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
