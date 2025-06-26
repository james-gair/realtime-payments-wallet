import { createApp } from "./createApp";

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `The backend runs on port ${PORT} inside Docker, but is exposed to your machine on port 4000. Access it at http://localhost:4000`
  );
});
