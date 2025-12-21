export function createResponse<T>(
  statusCode: number,
  message: string,
  data?: T | null,
  meta?: Record<string, any>
) {
  return new Response(
    JSON.stringify({
      statusCode,
      message,
      data: data ?? null,
      meta,
    }),
    {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
