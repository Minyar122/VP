const express = require("express");
const { engine } = require("express-handlebars");
const path = require("path");
const mysql = require("mysql");
const bodyParser = require('body-parser');
const jsPDF = require('jspdf');
const { autoTable } = require('jspdf-autotable');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const { format, addMonths } = require('date-fns');
const session = require('express-session');

const app = express();
const port = 3001;

// Set up Handlebars as the template engine
app.engine("hbs", engine({ extname: ".hbs" }));
app.set("view engine", "hbs");
app.set("views", "./views");

// Serve static files
app.use(express.static(path.join(process.cwd(), "public")));

// Middleware pour analyser les requêtes JSON
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.render("home", { title: "VipJob.tn - Trouvez votre emploi idéal" });
});

app.get("/login", (req, res) => {
  res.render("login", { title: "Connexion - VipJob.tn" });
});

app.get("/signup", (req, res) => {
  res.render("signup", { title: "Inscription - VipJob.tn" });
});

app.get("/offre", (req, res) => {
  // This should be protected and only accessible after login
  res.render("offre");
});

app.get("/profile", (req, res) => {
  // This should be protected and only accessible after login
  res.render("profile", { title: "Profil - VipJob.tn", user: { name: "John Doe", email: "john@example.com" } });
});

app.get("/abonnement", (req, res) => {
  res.render("abonnement");
});

// Connexion à la base de données MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "vipjob",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Erreur de connexion à MySQL :", err);
    process.exit(1);
  }
  console.log("✅ Connecté à MySQL");
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


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
