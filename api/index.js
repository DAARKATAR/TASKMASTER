import app from "../dist/server.js";

export default function handler(req, res) {
  try {
    return app(req, res);
  } catch (err) {
    console.error("Vercel Serverless Invocation Error:", err);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}
