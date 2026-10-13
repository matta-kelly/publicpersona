export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: false }, { status: 503 });
}
