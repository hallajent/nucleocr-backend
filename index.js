// index.js (backend)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import users from "./users.js";
import axios from "axios";

dotenv.config();
const app = express();

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_URGENTLY";

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://nucleocr-frontend-iju0907k9-hallajents-projects.vercel.app"
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ========== ROUTE DE LOGIN ==========
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }

  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(401).json({ error: "Identifiants invalides." });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: "Identifiants invalides." });
  }

  const payload = { id: user.id, role: user.role, name: user.name };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });

  return res.json({ token, role: user.role, name: user.name });
});

// ========== MIDDLEWARE AUTHENTIFICATION ==========
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant ou invalide." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, role: payload.role, name: payload.name };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }
}

// ========== ROUTE DE TEST ==========
app.get("/test-openai", authenticateJWT, (req, res) => {
  res.json({ message: `Salut ${req.user.name}, tu es bien authentifié !` });
});

// ========== ROUTE GPT PERSONNALISÉ ==========
app.post("/ask-nucleocr", authenticateJWT, async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages requis (array)." });
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const answer = response.data.choices[0].message.content;
    return res.json({ answer });
  } catch (error) {
    console.error("Erreur OpenAI :", error.response?.data || error.message);
    return res.status(500).json({ error: "Erreur GPT perso." });
  }
});

// ========== ROUTE GPT STANDARD ==========
app.post("/ask", authenticateJWT, async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: "Question requise." });
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [{ role: "user", content: question }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    const answer = response.data.choices[0].message.content;
    return res.json({ answer });
  } catch (error) {
    console.error("Erreur GPT-4 :", error.response?.data || error.message);
    return res.status(500).json({ error: "Erreur GPT-4." });
  }
});

// ========== LANCEMENT SERVEUR ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend Nucleocr lancé sur http://localhost:${PORT}`);
});
