const jsonHeaders = {
  "Content-Type": "application/json",
};

const STUDENT_ID = 5966;

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return Response.json(
        { error: "Method Not Allowed" },
        {
          status: 405,
          headers: {
            ...jsonHeaders,
            Allow: "POST",
          },
        },
      );
    }

    return Response.json(
      {
        status: "ok",
        runtime: "supabase-edge",
        studentId: STUDENT_ID,
      },
      {
        headers: jsonHeaders,
      },
    );
  },
};
