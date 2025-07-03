import express from "express";

const app = express();
const PORT = 4001;

app.use(express.json());

app.get("/verify", (req, res) => {
  res.send({
    id: "just testing verify route",
  });
});

app.listen(PORT, () => {
  console.log(`mock idcheck service is running on port ${PORT}`);
});
