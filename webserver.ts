// Run this script with: deno run --allow-net webserver.ts

// Start listening on port 8000 of localhost.
const server = Deno.listen({ port: 8000 });
console.log(`HTTP webserver running.  Access it at:  http://localhost:8000/`);

// Connections to the server will be yielded up as an async iterable.
for await (const conn of server) {
  // In order to not be blocking, we need to handle each connection individually
  // without awaiting the function
  serveHttp(conn);
}

async function serveHttp(conn: Deno.Conn) {
  // This "upgrades" a network connection into an HTTP connection.
  const httpConn = Deno.serveHttp(conn);
  // Each request sent over the HTTP connection will be yielded as an async
  // iterator from the HTTP connection.
  for await (const requestEvent of httpConn) {
    // The native HTTP server uses the web standard `Request` and `Response`
    // objects.
    console.log(
      `Incoming request at ${new Date(Date.now()).toLocaleTimeString(
        "en-US"
      )} \n`,
      requestEvent.request
    );

    const result = await requestEvent.request.text();
    console.log("TEMP: ", result);

    const body = JSON.stringify({
      message: `Message from server: Your user-agent is:\n\n${
        requestEvent.request.headers.get("user-agent") ?? "Unknown"
      }`,
    });

    const response = new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "http://localhost:8080",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST",
      },
    });

    // The requestEvent's `.respondWith()` method is how we send the response
    // back to the client.
    requestEvent.respondWith(response);
  }
}
