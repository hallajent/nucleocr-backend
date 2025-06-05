// users.js corrigé
import bcrypt from "bcrypt";

const users = [
  {
    id: 1,
    email: "admin@nucleocr.com", // ✅ mis à jour
    // mot de passe : admin123
    passwordHash: bcrypt.hashSync("admin123", 10),
    role: "admin",
    name: "Administrateur",
  },
  {
    id: 2,
    email: "iyad@nucleocr.com", // ✅ mis à jour
    // mot de passe : iyad123
    passwordHash: bcrypt.hashSync("iyad123", 10),
    role: "user",
    name: "Iyad Hallaj",
  },
];

export default users;
