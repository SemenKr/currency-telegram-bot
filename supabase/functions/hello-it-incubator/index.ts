const jsonHeaders = {
  "Content-Type": "application/json",
};

const fetch = (request: Request): Response => {
  if (request.method !== "GET") {
    return Response.json(
      { error: "Method Not Allowed" },
      {
        status: 405,
        headers: {
          ...jsonHeaders,
          Allow: "GET",
        },
      },
    );
  }

  return Response.json(
    { message: "hello, it-incubator", studentId: 5966 },
    { status: 200, headers: jsonHeaders },
  );
};

export default { fetch };
