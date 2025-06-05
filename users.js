// users.js
// -------
// Ce fichier définit deux comptes “hard-codés” pour commencer :
//   - admin (mail: admin@exemple.com, mdp: AdminPass123)
//   - utilisateur Iyad Hallaj (mail: iyad@exemple.com, mdp: IyadPass123)
//
// Les mots de passe sont hashés ici avec bcrypt. On va comparer le hash
// lors du login.

import bcrypt from "bcrypt";

// Pour générer ces hash, tu peux utiliser Node REPL et la fonction bcrypt.hashSync("tonMdp", 10).
// Ici, on inclut déjà les hash. Si tu veux en changer, remplace par ton propre hash.

const users = [
  {
    id: 1,
    email: "admin@exemple.com",
    // mot de passe “AdminPass123” hashé (bcrypt saltRounds = 10)
    passwordHash: "$2b$10$KIXJVCb5oR1NbmAH8pKnCeY6KzXNg98Dg0iv6wYAQggmJRw3BQ.Z6",
    role: "admin",
    name: "Administrateur",
  },
  {
    id: 2,
    email: "iyad@exemple.com",
    // mot de passe “IyadPass123” hashé
    passwordHash: "$2b$10$oEj07L168tHQ2vD2HBf2C.6.Uy/izhyfo4T2nxMZLZ2OJ6BGGfLxO",
    role: "user",
    name: "Iyad Hallaj",
  },
];

export default users;
