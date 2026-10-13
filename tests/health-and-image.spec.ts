import { expect, test } from "@playwright/test";

// check.sh starts the image with the flags and the environment of the node's unit file,
// and publishes its port 3000. So this request comes from outside the container, to an
// image that runs the way the node runs it.
test("answers GET /api/health with status 200 when started the way the node starts it", async ({
  request,
}) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
});
