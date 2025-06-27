import { Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";
import Register from "./Register";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;