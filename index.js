// index.js (backend)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import users from "./users.js"; // Notre fichier users.js créé plus haut
import axios from "axios";

dotenv.config();
const app = express();

// Lecture de la clé secrète depuis .env
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_URGENTLY"; // Remplace par une vraie valeur dans .env

// Activation de CORS pour autoriser le frontend (http://localhost:5173)
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// ========== ROUTE DE LOGIN ==========
/*
  POST /login
  Body attendu : { email: string, password: string }
  Réponse : { token: string, role: string, name: string } ou 401 si échec
*/
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }

  // Cherche l’utilisateur par email dans notre tableau “users”
  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(401).json({ error: "Identifiants invalides." });
  }

  // Vérifie le mot de passe
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: "Identifiants invalides." });
  }

  // Génère un token JWT contenant l’ID, le rôle et le nom
  const payload = { id: user.id, role: user.role, name: user.name };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });

  return res.json({ token, role: user.role, name: user.name });
});

// ========== MIDDLEWARE POUR VÉRIFIER LE JWT ==========
/*
  Ce middleware lit l’en-tête “Authorization: Bearer <token>”, vérifie le token
  et ajoute `req.user = { id, role, name }` si tout est OK.
  Sinon, renvoie 401.
*/
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant ou invalide." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // payload === { id, role, name, iat, exp }
    req.user = { id: payload.id, role: payload.role, name: payload.name };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }
}

// ========== ROUTE DE TEST “/test-openai” (protégée) ==========
app.get("/test-openai", authenticateJWT, (req, res) => {
  res.json({ message: `Salut ${req.user.name}, tu es bien authentifié !` });
});

// ========== ROUTE POUR LE GPT “ask-nucleocr” (protégée) ==========
app.post("/ask-nucleocr", authenticateJWT, async (req, res) => {
  const { messages, files } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages requis (array)." });
  }

  try {
    // Requête à l’API OpenAI pour le modèle personnalisé
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo", // ou ton modèle perso si accessible
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
    console.error("Erreur lors de l’appel OpenAI :", error.response?.data || error.message);
    return res.status(500).json({ error: "Erreur GPT perso." });
  }
});

// ========== ROUTE POUR LE GPT “ask” (protégée) ==========
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
    console.error("Erreur lors de l’appel GPT-4 :", error.response?.data || error.message);
    return res.status(500).json({ error: "Erreur GPT-4." });
  }
});

// ========== LANCEMENT DU SERVEUR ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend Nucleocr lancé sur http://localhost:${PORT}`);
});
