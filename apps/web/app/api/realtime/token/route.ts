import { NextResponse } from "next/server";
import { auth } from "@crm/auth";
import { headers } from "next/headers";
import * as jose from "jose";

const CENTRIFUGO_SECRET = new TextEncoder().encode(
  process.env.CENTRIFUGO_SECRET!
);

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await new jose.SignJWT({
    sub: session.user.id,
    info: {
      name: session.user.name,
    },
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .setIssuedAt()
    .sign(CENTRIFUGO_SECRET);

  return NextResponse.json({ token });
}
