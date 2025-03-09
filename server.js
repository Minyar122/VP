const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const path = require("path");
const session = require("express-session"); // Pour gérer les sessions
const { engine } = require("express-handlebars");
const jsPDF = require('jspdf');
const { autoTable } = require('jspdf-autotable');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const { format, addMonths } = require('date-fns');
require('dotenv').config();
const cors = require('cors');
const app = express();
const port = 3001;

// Configuration de Handlebars
app.engine("hbs", exphbs.engine({ extname: ".hbs" }));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static('public'));

// Configuration de la base de données
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // Mot de passe de votre base de données
  database: "vipjob", // Nom de la base de données
});

// Connexion à la base de données
db.connect((err) => {
  if (err) {
    console.error("Erreur de connexion à la base de données:", err);
  } else {
    console.log("Connecté à la base de données MySQL");
  }
});

// Middleware pour parser les requêtes JSON et les données de formulaire
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuration des sessions
app.use(
  session({
    secret: "votre_clé_secrète", // Clé secrète pour signer les cookies de session
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // À mettre à `true` si vous utilisez HTTPS
  })
);

// Configuration de Nodemailer pour envoyer des e-mails
const transporter = nodemailer.createTransport({
  host: "mail.itqanlabs.com",
  port: 587,
  secure: false,
  auth: {
    user: "vipjob-project@itqanlabs.com",
    pass: "JNLFWgG0A9QYNq2",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Vérification de la connexion SMTP
transporter.verify((error, success) => {
  if (error) {
    console.error("Erreur de connexion SMTP :", error);
  } else {
    console.log("Serveur SMTP prêt à envoyer des e-mails");
  }
});

// Route pour gérer la connexion
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Vérifier si l'utilisateur existe dans la base de données
  db.query("SELECT * FROM utilisateur WHERE email = ?", [email], (err, results) => {
    if (err) {
      console.error("Erreur lors de la vérification de l'e-mail:", err);
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
    if (results.length === 0) {
      return res.status(400).json({ success: false, message: "Cet e-mail n'est pas enregistré." });
    }

    // Vérifier le mot de passe
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
    if (hashedPassword !== results[0].mot_de_passe) {
      return res.status(400).json({ success: false, message: "Mot de passe incorrect." });
    }

    // Si tout est correct, créer une session pour l'utilisateur
    req.session.user = {
      id: results[0].id,
      email: results[0].email,
      role: results[0].role_id,
    };

    // Renvoyer une réponse de succès
    res.status(200).json({ success: true, data:results  });
  });
});

// Route pour la page de tableau de bord
app.get("/profile", (req, res) => {
  // Vérifier si l'utilisateur est connecté
  if (!req.session.user) {
    return res.redirect("/login"); // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
  }
  app.get("/abonnement", (req, res) => {
    res.render("abonnement");
  });
  // Afficher la page de tableau de bord
  res.render("profile", { title: "Tableau de bord - VipJob.tn", user: req.session.user });
});

// Route pour gérer la déconnexion
app.get("/logout", (req, res) => {
  // Détruire la session
  req.session.destroy((err) => {
    if (err) {
      console.error("Erreur lors de la déconnexion:", err);
      return res.status(500).json({ success: false, message: "Erreur lors de la déconnexion" });
    }
    res.redirect("/login"); // Rediriger vers la page de connexion
  });
});

// Route pour gérer l'inscription
app.post("/signup", (req, res) => {
  const { prenom, nom, email, telephone, password, confirmPassword, gouvernorat } = req.body;






  // Vérifier que les mots de passe correspondent
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Les mots de passe ne correspondent pas." });
  }

  // Vérifier que tous les champs sont remplis
  if (!prenom || !nom || !email || !telephone || !password || !gouvernorat) {
    return res.status(400).json({ success: false, message: "Tous les champs sont obligatoires." });
  }

  // Vérifier que l'e-mail n'existe pas déjà
  db.query("SELECT * FROM utilisateur WHERE email = ?", [email], (err, results) => {
    if (err) {
      console.error("Erreur lors de la vérification de l'e-mail:", err);
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
    if (results.length > 0) {
      return res.status(400).json({ success: false, message: "Cet e-mail est déjà utilisé." });
    }

    // Générer un code de confirmation
    const confirmationCode = crypto.randomBytes(3).toString("hex").toUpperCase();

    // Hacher le mot de passe (pour la sécurité)
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");





    
// Route pour l'inscription
app.post('/signup', (req, res) => {
  try {
    const { email, password, prenom, nom, telephone, gouvernorat } = req.body;

    // Vérifier que tous les champs sont présents
    if (!email || !password || !prenom || !nom || !telephone || !gouvernorat) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
    }

    // Vérifier si l'utilisateur existe déjà
    if (users.find(user => user.email === email)) {
      return res.status(400).json({ message: 'Cet e-mail est déjà utilisé.' });
    }

    // Ajouter l'utilisateur à la "base de données"
    users.push({ email, password, prenom, nom, telephone, gouvernorat });

    // Répondre avec un message de succès
    res.status(200).json({ message: 'Inscription réussie !' });
  } catch (error) {
    console.error('Erreur :', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
});

    // Insérer l'utilisateur dans la base de données
    const query =
      "INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, numero_telephone, role_id, etat, etat_email, code_email, gouvernorat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const values = [nom, prenom, email, hashedPassword, telephone, 3, 1, 0, confirmationCode, gouvernorat];

    db.query(query, values, (err, results) => {
      if (err) {
        console.error("Erreur lors de l'inscription:", err);
        return res.status(500).json({ success: false, message: "Erreur lors de l'inscription" });
      }

      // Envoyer un e-mail de confirmation
      const mailOptions = {
        from: "vipjob-project@itqanlabs.com",
        to: email,
        subject: "Confirmation d'inscription - VipJob.tn",
        text: `Bonjour ${prenom},\n\nVotre code de confirmation est : ${confirmationCode}\n\nMerci de vous inscrire sur VipJob.tn.`,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Erreur lors de l'envoi de l'e-mail:", err);
          return res.status(500).json({ success: false, message: "Erreur lors de l'envoi de l'e-mail de confirmation" });
        }
        console.log("E-mail envoyé:", info.response);
        res.status(200).json({ success: true, message: "Inscription réussie. Vérifiez votre e-mail pour le code de confirmation." });
      });
    });
  });
});

// Route pour vérifier le code de confirmation
app.post("/verify", (req, res) => {
  const { email, code } = req.body; // Récupérer l'e-mail et le code du formulaire

  // Vérifier si le code correspond à celui dans la base de données
  db.query(
    "SELECT * FROM utilisateur WHERE email = ? AND code_email = ?",
    [email, code],
    (err, results) => {
      if (err) {
        console.error("Erreur lors de la vérification du code:", err);
        return res.status(500).json({ success: false, message: "Erreur serveur" });
      }
      if (results.length === 0) {
        return res.status(400).json({ success: false, message: "Code de confirmation invalide." });
      }

      // Si le code est valide, marquer l'utilisateur comme vérifié
      db.query(
        "UPDATE utilisateur SET etat_email = 1 WHERE email = ?",
        [email],
        (err, results) => {
          if (err) {
            console.error("Erreur lors de la mise à jour de l'utilisateur:", err);
            return res.status(500).json({ success: false, message: "Erreur lors de la vérification" });
          }
          res.status(200).json({ success: true, message: "Compte vérifié avec succès !" });
        }
      );
    }
  );
});

// Route pour la page d'accueil
app.get("/", (req, res) => {
  res.render("home", { title: "Accueil - VipJob.tn" });
});

// Route pour la page d'inscription
app.get("/signup", (req, res) => {
  res.render("signup", { title: "Inscription - VipJob.tn" });
});

// Route pour la page de vérification
app.get('/verify', (req, res) => {
  res.render('verify', { title: "Vérification - VipJob.tn" });
});
// Route pour la page des offres
app.get("/offre", (req, res) => {
  res.render("offre", { title: "Offres - VipJob.tn" });
});

// Route pour la page de profil
app.get("/profile", (req, res) => {
  res.render("profile", { title: "Profil - VipJob.tn" });
});

// Route pour la page de connexion
app.get("/login", (req, res) => {
  res.render("login", { title: "Connexion - VipJob.tn" });
});

// Route pour la page "Mot de passe oublié"
app.get("/forgot-password", (req, res) => {
  res.render("forgot-password", { title: "Mot de passe oublié - VipJob.tn" });
});





// Route pour traiter la soumission du formulaire "Mot de passe oublié"
app.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  // Route pour la page des offres
app.get("/reset-password", (req, res) => {
  res.render("reset-password", { title: " - VipJob.tn" });
});

  // Vérifier si l'e-mail existe dans la base de données
  db.query("SELECT * FROM utilisateur WHERE email = ?", [email], (err, results) => {
    if (err) {
      console.error("Erreur lors de la vérification de l'e-mail:", err);
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
    if (results.length === 0) {
      return res.status(400).json({ success: false, message: "Cet e-mail n'est pas enregistré." });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Enregistrer le token dans la base de données
    db.query(
      "UPDATE utilisateur SET reset_token = ? WHERE email = ?",
      [resetToken, email],
      (err, results) => {
        if (err) {
          console.error("Erreur lors de la génération du token:", err);
          return res.status(500).json({ success: false, message: "Erreur lors de la génération du token" });
        }

        // Envoyer un e-mail avec le lien de réinitialisation
        const resetLink = `http://localhost:3001/reset-password?token=${resetToken}`;
        const mailOptions = {
          from: "vipjob-project@itqanlabs.com",
          to: email,
          subject: "Réinitialisation de mot de passe - VipJob.tn",
          text: `Bonjour,\n\nPour réinitialiser votre mot de passe, cliquez sur ce lien : ${resetLink}\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail.`,
        };

        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.error("Erreur lors de l'envoi de l'e-mail:", err);
            return res.status(500).json({ success: false, message: "Erreur lors de l'envoi de l'e-mail de réinitialisation" });
          }
          console.log("E-mail envoyé:", info.response);
          res.status(200).json({ success: true, message: "Un e-mail de réinitialisation a été envoyé." });
        });
      }
    );
  });
});



app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Simulated database
const users = [
  {
    id: 1,
    email: 'user@example.com',
    password: '$2a$10$...', // Hashed password
    resetToken: '543ebf23fd2b7b7e3cb235673ea06dd81ea8eaf5', // Example token
  },
];

// Simuler une base de données (remplacez par votre vraie base de données)
const user = [
  { id: 1, email: 'user@example.com', password: '$2a$10$...' } // Mot de passe hashé
];


// Endpoint pour réinitialiser le mot de passe
app.post('/reset-password', (req, res) => {
  const { token, password } = req.body;

  // Vérifier si le token est valide
  db.query('SELECT * FROM utilisateur WHERE reset_token = ?', [token], (err, results) => {
    if (err) {
      console.error('Erreur lors de la recherche de l\'utilisateur:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: 'Token invalide ou expiré.' });
    }

    const user = results[0];

    // Hacher le nouveau mot de passe
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    // Mettre à jour le mot de passe et effacer le token
    db.query(
      'UPDATE utilisateur SET mot_de_passe = ?, reset_token = NULL WHERE id = ?',
      [hashedPassword, user.id],
      (err, results) => {
        if (err) {
          console.error('Erreur lors de la mise à jour du mot de passe:', err);
          return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json({ message: 'Mot de passe réinitialisé avec succès.' });
      }
    );
  });
});



//profil

// Dans votre fichier server.js (Node.js/Express)
app.get('/profil/:id', (req, res) => {
  const userId = req.params.id;

  db.query(
    `SELECT nom, prenom, email, numero_telephone AS telephone, gouvernorat, domaine 
     FROM utilisateur WHERE id = ?`,
    [userId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.length === 0) return res.status(404).json({ error: "Utilisateur non trouvé" });
      
      res.json(result[0]);
    }
  );
});

// Route POST pour enregistrer un profil
app.post("/profil/:id", (req, res) => {
  let userId = req.params.id;

  // Générer un ID si c'est un nouvel utilisateur
  if (userId === "nouvel_utilisateur") {
    userId = generateUniqueUserId(); // Fonction à créer pour générer un ID unique
  }

  const {
    prenom, nom, email, telephone, domaine, 
    experience, diplome, gouvernorat, bio, skills, langues
  } = req.body;

  const sql = `
    INSERT INTO utilisateur (id, prenom, nom, email, numero_telephone, domaine, experience, diplome, gouvernorat, bio, skills, langues)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      prenom = VALUES(prenom), nom = VALUES(nom), email = VALUES(email), 
      numero_telephone = VALUES(numero_telephone), domaine = VALUES(domaine), 
      experience = VALUES(experience), diplome = VALUES(diplome), gouvernorat = VALUES(gouvernorat),
      bio = VALUES(bio), skills = VALUES(skills), langues = VALUES(langues);
  `;

  const values = [
    userId, prenom, nom, email, telephone, domaine, 
    experience, diplome, gouvernorat, bio, 
    JSON.stringify(Array.isArray(skills) && skills.length ? skills : []),
    JSON.stringify(langues || [])
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Erreur SQL:", err.sqlMessage);
      return res.status(500).json({ error: "Erreur base de données", details: err.sqlMessage });
    }

    res.json({ success: true, message: "Profil mis à jour ou créé avec succès", userId });
  });
});


// Nouvelle route pour générer le PDF

const upload = multer({ dest: 'uploads/' });


app.post('/api/generate-cv', upload.single('photo'), (req, res) => {
  try {
    const data = req.body;
    const photoPath = req.file ? req.file.path : null;

    if (!data.prenom || !data.nom) {
      return res.status(400).json({ error: "Prénom et nom requis" });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="CV_${data.prenom}_${data.nom}.pdf"`);

    doc.pipe(res);

    // 🔵 Bannière Bleue
    doc.rect(0, 0, doc.page.width, 100).fill('#1E88E5'); // Couleur bleu
    doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text(`${data.prenom} ${data.nom}`, { align: 'center' });
    doc.fontSize(16).text('INFORMATIQUE', { align: 'center' });
    doc.moveDown(2);
    doc.fillColor('black'); // Revenir à la couleur noire

    // 🖼️ Ajout de la photo
    if (photoPath) {
      doc.image(photoPath, { fit: [100, 100], align: 'center', valign: 'top' });
      doc.moveDown(2);
    }

    // 📌 Fonctions utilitaires
    const drawSectionTitle = (title) => {
      doc.fontSize(14).font('Helvetica-Bold').text(title);
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(); // Ligne horizontale
      doc.moveDown(0.5);
    };

    const drawText = (text) => {
      doc.fontSize(12).font('Helvetica').text(text);
      doc.moveDown();
    };

    // 📍 Coordonnées
    drawSectionTitle('Coordonnées');
    drawText(`Email: ${data.email || 'Non spécifié'}`);
    drawText(`Téléphone: ${data.telephone || 'Non spécifié'}`);
    drawText(`Gouvernorat: ${data.gouvernorat || 'Non spécifié'}`);

    // 📍 À propos de moi
    drawSectionTitle('À propos de moi');
    drawText(data.bio?.trim() || 'Pas d’informations disponibles');

    // 🎓 Formation
    drawSectionTitle('Formation');
    drawText(data.formation || 'Non spécifiée');

    // 🏆 Expérience
    drawSectionTitle('Expérience');
    drawText(data.experience || 'Débutant (0-1 an)');

    // 🔧 Compétences
    drawSectionTitle('Compétences');
    drawText((data.skills || []).join('\n• ') || 'Aucune');

    // 🗣️ Langues
    drawSectionTitle('Langues');
    drawText((data.langues || []).join('\n• ') || 'Aucune');

    doc.end();

    // 🗑️ Supprimer l'image après génération
    if (photoPath) {
      setTimeout(() => fs.unlink(photoPath, (err) => { if (err) console.error(err); }), 5000);
    }

  } catch (error) {
    console.error('Erreur génération PDF:', error);
    res.status(500).json({ error: "Erreur interne", details: error.message });
  }
});



// Route pour s'abonner
app.post('/abonnement/subscribe', (req, res) => {
  const { duration, price } = req.body;
  const userId = 1; // Exemple d'id utilisateur, à remplacer selon le contexte de votre application
  const dateDeDebut = new Date();
  const dateDeFin = new Date();
  
  // Calcul de la date de fin selon la durée de l'abonnement (en mois)
  dateDeFin.setMonth(dateDeDebut.getMonth() + duration);

  const abonnementData = {
    id_utilisateur: userId,
    date_debut: dateDeDebut.toISOString().split('T')[0], // Format YYYY-MM-DD
    date_fin: dateDeFin.toISOString().split('T')[0],
    montant: price,
    type_abonnement: duration === 1 ? 'Mensuel' : (duration === 3 ? 'Trimestriel' : 'Annuel')
  };

  // Insérer dans la table 'abonnement'
  const query = 'INSERT INTO abonnement SET ?';
  db.query(query, abonnementData, (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'abonnement:', err);
      return res.status(500).json({ success: false, message: 'Erreur lors de l\'abonnement' });
    }
    res.status(200).json({ success: true, message: 'Abonnement réussi' });
  });
});

// Route pour se désabonner
app.post('/abonnement/unsubscribe', (req, res) => {
  const userId = 1; // Exemple d'id utilisateur, à remplacer selon le contexte de votre application

  // Supprimer l'abonnement de l'utilisateur
  const query = 'DELETE FROM abonnement WHERE id_utilisateur = ?';
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Erreur lors du désabonnement:', err);
      return res.status(500).json({ success: false, message: 'Erreur lors du désabonnement' });
    }
    res.status(200).json({ success: true, message: 'Désabonnement réussi' });
  });
});





// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});