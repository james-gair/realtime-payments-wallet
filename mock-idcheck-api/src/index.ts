import express from "express";
import kycVerifyrouter from "./routes/kycVerify";
import { Request, Response, NextFunction } from "express";

const app = express();
const PORT = 4001;

app.use(express.json());

// Handle invalid req body
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "Invalid JSON payload" });
    return;
  }
  next(err);
});

// The backend server will need to include a mock api key in the header
// and here in this mock api we check the key, if the key does not
// match our api keys, we reject to serve the request.
// We only accept server-to-server communication for security reason
app.use("/kyc", kycVerifyrouter);

app.listen(PORT, () => {
  console.log(`mock idcheck service is running on port ${PORT}`);
});
