import { GET as getComments, POST as postComment } from '@/app/api/ticket-comments/[ticketId]/route';

/** Ruta legacy: redirige al handler estable en dev/prod. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return getComments(req, { params: Promise.resolve({ ticketId: id }) });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return postComment(req, { params: Promise.resolve({ ticketId: id }) });
}
