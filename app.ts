import express from "express";

const app = express();

const port = 3000;

app.get("/resource", (req, res) => {
  const instance = process.env.INSTANCE || "VM-06";

  console.log("Request hit: ", instance);

  res.json({
    machine: instance,
    message: "Resource checking",
  });
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.listen(port, "0.0.0.0", () => {
  console.log("server running on port: ", port);
});
