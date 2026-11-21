import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SCHOOL_NAME = "مجموعة مدارس الآفاق (Groupe scolaire AL AFAK)";

interface BookEntry {
  level: string;
  title: string;
  subject: string;
}

const books: BookEntry[] = [
  // CP - السنة الأولى ابتدائي
  { level: "CP", title: "المفيد في اللغة العربية", subject: "Langue arabe" },
  { level: "CP", title: "المفيد في الاستماع و التحدث حكاياتي", subject: "Langue arabe" },
  { level: "CP", title: "المفيد في الكتابة", subject: "Langue arabe" },
  { level: "CP", title: "في رحاب التربية الاسلامية", subject: "Education islamique" },
  { level: "CP", title: "Taoki et compagnie CP (Manuel + Cahiers 1, 2 + Ecriture)", subject: "Francais" },
  { level: "CP", title: "SUPER MINDS - CAMBRIDGE SECOND EDITION 1 (Student's Book + Workbook)", subject: "Anglais" },
  { level: "CP", title: "Genie des MATHS + CP", subject: "Mathematiques" },
  { level: "CP", title: "Mon cahier d'investigation CP", subject: "Investigation" },
  { level: "CP", title: "Les Cahiers de la Luciole Sciences CP", subject: "Sciences" },
  { level: "CP", title: "Informatique Robotique 1", subject: "Informatique" },
  { level: "CP", title: "Asasi fi al-maharat al-hayatiya", subject: "Competences de vie" },
  { level: "CP", title: "Le bibliobus - La petite poule rousse", subject: "Lecture" },
  { level: "CP", title: "Alam al-tarbiya al-tashiliya", subject: "Arts plastiques" },
  { level: "CP", title: "La Musique a ma portee! (LIVRE JAUNE)", subject: "Musique" },

  // CE1 - السنة الثانية ابتدائي
  { level: "CE1", title: "Fi rahab al-lugha al-arabiya", subject: "Langue arabe" },
  { level: "CE1", title: "Hkayati al-musawwara", subject: "Langue arabe" },
  { level: "CE1", title: "Murshidi fi al-tarbiya al-islamiya", subject: "Education islamique" },
  { level: "CE1", title: "Mot de Passe - CE1 (Manuel + Cahier d'activites)", subject: "Francais" },
  { level: "CE1", title: "Meilleur en ecriture CE1", subject: "Francais" },
  { level: "CE1", title: "Dictionnaire: Larousse junior", subject: "Francais" },
  { level: "CE1", title: "SUPER MINDS - CAMBRIDGE SECOND EDITION 2", subject: "Anglais" },
  { level: "CE1", title: "Genie des MATHS + CE1", subject: "Mathematiques" },
  { level: "CE1", title: "Mon cahier d'investigation CE1", subject: "Investigation" },
  { level: "CE1", title: "Les Cahiers de la Luciole Sciences CE1", subject: "Sciences" },
  { level: "CE1", title: "Informatique Robotique 2", subject: "Informatique" },
  { level: "CE1", title: "Asasi fi al-maharat al-hayatiya", subject: "Competences de vie" },
  { level: "CE1", title: "Al-mukhtar fi al-tarbiya al-tashiliya", subject: "Arts plastiques" },
  { level: "CE1", title: "La Musique a ma portee! (LIVRE BLEU)", subject: "Musique" },
  { level: "CE1", title: "Little Red Riding Hood Level 2", subject: "Lecture" },
  { level: "CE1", title: "Bibliobus - Le loup et les sept chevreaux", subject: "Lecture" },

  // CE2 - السنة الثالثة ابتدائي
  { level: "CE2", title: "Al-mufid fi al-lugha al-arabiya", subject: "Langue arabe" },
  { level: "CE2", title: "Al-mufid fi al-istima' wa al-tahadduth", subject: "Langue arabe" },
  { level: "CE2", title: "Al-mumtaz fi al-tarbiya al-islamiya", subject: "Education islamique" },
  { level: "CE2", title: "Mot de Passe - CE2 (Manuel + Cahier d'activites)", subject: "Francais" },
  { level: "CE2", title: "Meilleur en ecriture CE2", subject: "Francais" },
  { level: "CE2", title: "Dictionnaire: Larousse junior", subject: "Francais" },
  { level: "CE2", title: "Bibliobus - CE2 (Les six serviteurs)", subject: "Lecture" },
  { level: "CE2", title: "SUPER MINDS - CAMBRIDGE SECOND EDITION 3", subject: "Anglais" },
  { level: "CE2", title: "Genie des MATHS + CE2", subject: "Mathematiques" },
  { level: "CE2", title: "Munhal al-nashat al-ilmi", subject: "Sciences" },
  { level: "CE2", title: "Les Cahiers de la Luciole Sciences CE2", subject: "Sciences" },
  { level: "CE2", title: "Mon Cahier D'investigation CE2", subject: "Investigation" },
  { level: "CE2", title: "Informatique Robotique 3", subject: "Informatique" },
  { level: "CE2", title: "L'essentiel en competences de vie 3AP", subject: "Competences de vie" },
  { level: "CE2", title: "Asasi fi al-tarbiya al-tashiliya", subject: "Arts plastiques" },
  { level: "CE2", title: "La Musique a ma portee! (LIVRE ROUGE)", subject: "Musique" },
  { level: "CE2", title: "Muhawalat 'aysh", subject: "Lecture" },
  { level: "CE2", title: "Robinson Crusoe", subject: "Lecture" },
  { level: "CE2", title: "Robin Hood", subject: "Lecture" },

  // CM1 - السنة الرابعة ابتدائي
  { level: "CM1", title: "Al-mufid fi al-lugha al-arabiya", subject: "Langue arabe" },
  { level: "CM1", title: "Al-mufid fi al-tarbiya al-islamiya", subject: "Education islamique" },
  { level: "CM1", title: "Al-jadid fi al-ijtima'iyyat", subject: "Geographie" },
  { level: "CM1", title: "Mot de Passe - CM1 (Manuel + Cahier d'activites)", subject: "Francais" },
  { level: "CM1", title: "Meilleur en ecriture CM1", subject: "Francais" },
  { level: "CM1", title: "Dictionnaire: Robert Junior", subject: "Francais" },
  { level: "CM1", title: "SUPER MINDS - CAMBRIDGE SECOND EDITION 4", subject: "Anglais" },
  { level: "CM1", title: "Genie des MATHS + CM1", subject: "Mathematiques" },
  { level: "CM1", title: "Al-munir fi al-nashat al-ilmi", subject: "Sciences" },
  { level: "CM1", title: "Mon cahier d'investigation CM1", subject: "Investigation" },
  { level: "CM1", title: "Les Cahiers de la Luciole Sciences CM1", subject: "Sciences" },
  { level: "CM1", title: "Informatique Robotique 4", subject: "Informatique" },
  { level: "CM1", title: "L'essentiel en competences de vie 4AP", subject: "Competences de vie" },
  { level: "CM1", title: "Al-mufid fi al-tarbiya al-tashiliya", subject: "Arts plastiques" },
  { level: "CM1", title: "Musique a ma portee! (LIVRE VERT)", subject: "Musique" },
  { level: "CM1", title: "The Jungle book", subject: "Lecture" },
  { level: "CM1", title: "Le bibliobus - La petite sirene", subject: "Lecture" },

  // CM2 - السنة الخامسة ابتدائي
  { level: "CM2", title: "Murshidi fi al-lugha al-arabiya", subject: "Langue arabe" },
  { level: "CM2", title: "Fi rahab al-tarbiya al-islamiya", subject: "Education islamique" },
  { level: "CM2", title: "Al-jadid fi al-ijtima'iyyat", subject: "Geographie" },
  { level: "CM2", title: "Mot de Passe - CM2 (Manuel + Cahier d'activites)", subject: "Francais" },
  { level: "CM2", title: "Meilleur en ecriture CM2", subject: "Francais" },
  { level: "CM2", title: "Dictionnaire: Robert Junior", subject: "Francais" },
  { level: "CM2", title: "SUPER MINDS - CAMBRIDGE SECOND EDITION 5", subject: "Anglais" },
  { level: "CM2", title: "Genie des MATHS + CM2", subject: "Mathematiques" },
  { level: "CM2", title: "Munhal al-nashat al-ilmi", subject: "Sciences" },
  { level: "CM2", title: "Les cahiers de la Luciole Sciences CM2", subject: "Sciences" },
  { level: "CM2", title: "Mon cahier d'investigation CM2", subject: "Investigation" },
  { level: "CM2", title: "Informatique Robotique 5", subject: "Informatique" },
  { level: "CM2", title: "L'essentiel en competences de vie 5AP", subject: "Competences de vie" },
  { level: "CM2", title: "Al-jadid fi al-tarbiya al-tashiliya", subject: "Arts plastiques" },
  { level: "CM2", title: "La musique a ma portee! LIVRE VIOLET", subject: "Musique" },
  { level: "CM2", title: "Uncle Jack and the Emperor Penguins", subject: "Lecture" },
  { level: "CM2", title: "Le bibliobus: Le chat botte", subject: "Lecture" },

  // CE6 - السنة السادسة ابتدائي
  { level: "CE6", title: "Kitabi fi al-lugha al-arabiya", subject: "Langue arabe" },
  { level: "CE6", title: "Al-mufid fi al-tarbiya al-islamiya", subject: "Education islamique" },
  { level: "CE6", title: "Al-jadid fi al-ijtima'iyyat", subject: "Geographie" },
  { level: "CE6", title: "Rives bleues Francais Livre unique 6eme", subject: "Francais" },
  { level: "CE6", title: "Mes apprentissages en francais 6", subject: "Francais" },
  { level: "CE6", title: "Dictionnaire: Robert Junior", subject: "Francais" },
  { level: "CE6", title: "SUPER MINDS - CAMBRIDGE SECOND EDITION 6", subject: "Anglais" },
  { level: "CE6", title: "Genie des MATHS + CM2", subject: "Mathematiques" },
  { level: "CE6", title: "Al-mufid fi al-nashat al-ilmi", subject: "Sciences" },
  { level: "CE6", title: "Les cahiers Istra Sciences 6eme", subject: "Sciences" },
  { level: "CE6", title: "Mon cahier d'investigation 6", subject: "Investigation" },
  { level: "CE6", title: "Informatique et Robotique 6", subject: "Informatique" },
  { level: "CE6", title: "L'essentiel en competences de vie 6AP", subject: "Competences de vie" },
  { level: "CE6", title: "Al-mumtaz fi al-tarbiya al-tashiliya", subject: "Arts plastiques" },
  { level: "CE6", title: "Musique a portee! (LIVRE ORANGE)", subject: "Musique" },
  { level: "CE6", title: "Sirr al-mujallad al-ghamidh", subject: "Lecture" },
  { level: "CE6", title: "Al-tariq ila safina al-kanz", subject: "Lecture" },
  { level: "CE6", title: "Le Petit Nicolas", subject: "Lecture" },
  { level: "CE6", title: "Moi, Touria Chaoui", subject: "Lecture" },
  { level: "CE6", title: "L'affaire CAIUS", subject: "Lecture" },
  { level: "CE6", title: "Alice in Wonderland", subject: "Lecture" },

  // 1AC - السنة الأولى ثانوي إعدادي
  { level: "1AC", title: "Al-mufid fi al-lugha al-arabiya", subject: "Langue arabe" },
  { level: "1AC", title: "Fi rahab al-ijtima'iyyat", subject: "Geographie" },
  { level: "1AC", title: "Fi rahab al-tarbiya al-islamiya", subject: "Education islamique" },
  { level: "1AC", title: "L'Archipel des MATHS 1AC (Manuel + Cahier d'activites)", subject: "Mathematiques" },
  { level: "1AC", title: "L'Univers de physique chimie Plus 1AC", subject: "Physique-chimie" },
  { level: "1AC", title: "L'Archipel des SVT 1AC (Manuel + Cahier d'activites)", subject: "SVT" },
  { level: "1AC", title: "Texto college 5", subject: "Francais" },
  { level: "1AC", title: "THINK 1 (Student's book + Workbook)", subject: "Anglais" },
  { level: "1AC", title: "La revolte des animaux", subject: "Lecture" },
  { level: "1AC", title: "Antigone", subject: "Lecture" },
  { level: "1AC", title: "Informatique Robotique 1AC", subject: "Informatique" },
  { level: "1AC", title: "Fi al-tufula", subject: "Lecture" },
  { level: "1AC", title: "Gulliver's Travels", subject: "Lecture" },
  { level: "1AC", title: "Les enfants terribles", subject: "Lecture" },
  { level: "1AC", title: "Pere Goriot", subject: "Lecture" },
  { level: "1AC", title: "Al-ayyam", subject: "Lecture" },
  { level: "1AC", title: "Sheherazade", subject: "Lecture" },

  // 2AC - السنة الثانية ثانوي إعدادي
  { level: "2AC", title: "Fi rahab al-lugha al-arabiya", subject: "Langue arabe" },
  { level: "2AC", title: "Minar al-ijtima'iyyat", subject: "Geographie" },
  { level: "2AC", title: "Ihya' al-tarbiya al-islamiya", subject: "Education islamique" },
  { level: "2AC", title: "OXYGENE 2AC Mathematiques", subject: "Mathematiques" },
  { level: "2AC", title: "L'Univers de physique chimie Plus 2AC", subject: "Physique-chimie" },
  { level: "2AC", title: "L'Archipel des SVT 2AC (Manuel + Cahier d'activites)", subject: "SVT" },
  { level: "2AC", title: "Texto college 4", subject: "Francais" },
  { level: "2AC", title: "THINK 2 (Student's book + Workbook)", subject: "Anglais" },
  { level: "2AC", title: "La Revolte des enfants", subject: "Lecture" },
  { level: "2AC", title: "La Boite a merveilles", subject: "Lecture" },
  { level: "2AC", title: "Informatique Robotique 2AC", subject: "Informatique" },
  { level: "2AC", title: "Les lettres de mon moulin", subject: "Lecture" },
  { level: "2AC", title: "Issa enfant des sables", subject: "Lecture" },
  { level: "2AC", title: "Al-ibarat", subject: "Lecture" },
  { level: "2AC", title: "The Boy and the sea", subject: "Lecture" },
  { level: "2AC", title: "Contes d'ici et d'ailleurs", subject: "Lecture" },
  { level: "2AC", title: "L'avare", subject: "Lecture" },
  { level: "2AC", title: "Les enfants du nouveau monde", subject: "Lecture" },
  { level: "2AC", title: "Ila waladi", subject: "Lecture" },
  { level: "2AC", title: "The adventures of Tom Sawyer", subject: "Lecture" },

  // 3AC - السنة الثالثة ثانوي إعدادي
  { level: "3AC", title: "Al-mukhtar fi al-lugha al-arabiya", subject: "Langue arabe" },
  { level: "3AC", title: "Minar al-ijtima'iyyat", subject: "Geographie" },
  { level: "3AC", title: "Fi rahab al-tarbiya al-islamiya", subject: "Education islamique" },
  { level: "3AC", title: "OXYGENE 3AC Mathematiques", subject: "Mathematiques" },
  { level: "3AC", title: "L'Univers de physique-chimie Plus 3AC", subject: "Physique-chimie" },
  { level: "3AC", title: "L'archipel des SVT 3AC (Manuel + Cahier d'activites)", subject: "SVT" },
  { level: "3AC", title: "Texto college 3", subject: "Francais" },
  { level: "3AC", title: "Passerelle 3eme annee", subject: "Anglais" },
  { level: "3AC", title: "THINK 3 (Student's book + Workbook)", subject: "Anglais" },
  { level: "3AC", title: "Le mystere des 3 tableaux", subject: "Lecture" },
  { level: "3AC", title: "Le Dernier jour d'un condamne", subject: "Lecture" },
  { level: "3AC", title: "Informatique et Robotique 3AC", subject: "Informatique" },
  { level: "3AC", title: "La parure", subject: "Lecture" },
  { level: "3AC", title: "La promesse de l'aube", subject: "Lecture" },
  { level: "3AC", title: "Muhawalat 'aysh", subject: "Lecture" },
  { level: "3AC", title: "Robinson Crusoe", subject: "Lecture" },
  { level: "3AC", title: "L'envers du decor", subject: "Lecture" },
  { level: "3AC", title: "La civilisation, ma mere", subject: "Lecture" },
  { level: "3AC", title: "Tuq al-hamama", subject: "Lecture" },
  { level: "3AC", title: "Robin Hood", subject: "Lecture" },

  // TC SC - الجذع المشترك العلمي
  { level: "TC SC", title: "Al-ra'id fi al-lugha al-arabiya", subject: "Langue arabe" },
  { level: "TC SC", title: "Al-masar tarikh wa jughrafiya", subject: "Histoire-Geographie" },
  { level: "TC SC", title: "Fi rahab al-falsafa", subject: "Philosophie" },
  { level: "TC SC", title: "Fi rahab al-tarbiya al-islamiya", subject: "Education islamique" },
  { level: "TC SC", title: "AL MOFID EN MATHEMATIQUES TCS", subject: "Mathematiques" },
  { level: "TC SC", title: "ETINCELLE Physique/chimie TC", subject: "Physique-chimie" },
  { level: "TC SC", title: "L'Archipel des SVT TC", subject: "SVT" },
  { level: "TC SC", title: "Think Student's book 4 + Workbook 4", subject: "Anglais" },
  { level: "TC SC", title: "Antigone", subject: "Lecture" },
  { level: "TC SC", title: "La Boite a merveilles", subject: "Lecture" },
  { level: "TC SC", title: "Le Dernier jour d'un condamne", subject: "Lecture" },
  { level: "TC SC", title: "Informatique", subject: "Informatique" },

  // 1BAC SC EXP - السنة الأولى باك علوم تجريبية
  { level: "1BAC SC EXP", title: "Al-manar fi al-lugha al-arabiya", subject: "Langue arabe" },
  { level: "1BAC SC EXP", title: "Al-manar fi al-tarikh wa al-jughrafiya", subject: "Histoire-Geographie" },
  { level: "1BAC SC EXP", title: "Fi rahab al-falsafa", subject: "Philosophie" },
  { level: "1BAC SC EXP", title: "Fi rahab al-tarbiya al-islamiya", subject: "Education islamique" },
  { level: "1BAC SC EXP", title: "MAXI MATHS 1ere Bac Sc.Ex", subject: "Mathematiques" },
  { level: "1BAC SC EXP", title: "Etincelle Physique/Chimie 1ere Bac Sc.Ex", subject: "Physique-chimie" },
  { level: "1BAC SC EXP", title: "Sciences de la vie et de la terre Moynier", subject: "SVT" },
  { level: "1BAC SC EXP", title: "La Boite a merveilles", subject: "Lecture" },
  { level: "1BAC SC EXP", title: "Antigone", subject: "Lecture" },
  { level: "1BAC SC EXP", title: "Le Dernier jour d'un condamne", subject: "Lecture" },
  { level: "1BAC SC EXP", title: "THINK (C1) Student's book 5 + Workbook 5", subject: "Anglais" },

  // 1BAC SC MATHS - السنة الأولى باك علوم رياضية
  { level: "1BAC SC MATHS", title: "Al-manar fi al-lugha al-arabiya", subject: "Langue arabe" },
  { level: "1BAC SC MATHS", title: "Al-manar fi al-tarikh wa al-jughrafiya", subject: "Histoire-Geographie" },
  { level: "1BAC SC MATHS", title: "Fi rahab al-falsafa", subject: "Philosophie" },
  { level: "1BAC SC MATHS", title: "Fi rahab al-tarbiya al-islamiya", subject: "Education islamique" },
  { level: "1BAC SC MATHS", title: "AL MOFID EN MATHS 1ere Bac SC Maths (Tome 1 + Tome 2)", subject: "Mathematiques" },
  { level: "1BAC SC MATHS", title: "Etincelle Physique-Chimie 1ere Bac SC Maths", subject: "Physique-chimie" },
  { level: "1BAC SC MATHS", title: "Sciences de la Vie et de la Terre Moynier", subject: "SVT" },
  { level: "1BAC SC MATHS", title: "La Boite a merveilles", subject: "Lecture" },
  { level: "1BAC SC MATHS", title: "Antigone", subject: "Lecture" },
  { level: "1BAC SC MATHS", title: "Le Dernier jour d'un condamne", subject: "Lecture" },
  { level: "1BAC SC MATHS", title: "THINK (C1) Student's book 5 + Workbook 5", subject: "Anglais" },

  // 1BAC SC EXP (Economique) - السنة الأولى باك علوم اقتصادية وتدبير
  { level: "1BAC SC EXP", title: "Al-manar fi al-lugha al-arabiya (Eco)", subject: "Langue arabe" },
  { level: "1BAC SC EXP", title: "Al-manar fi al-tarikh wa al-jughrafiya (Eco)", subject: "Histoire-Geographie" },
  { level: "1BAC SC EXP", title: "Fi rahab al-falsafa (Eco)", subject: "Philosophie" },
  { level: "1BAC SC EXP", title: "Fi rahab al-tarbiya al-islamiya (Eco)", subject: "Education islamique" },
  { level: "1BAC SC EXP", title: "PANORAMA MATHS 1ere Bac Eco", subject: "Mathematiques" },
  { level: "1BAC SC EXP", title: "J'assimile la comptabilite", subject: "Comptabilite" },
  { level: "1BAC SC EXP", title: "Plan comptable general marocain", subject: "Comptabilite" },
  { level: "1BAC SC EXP", title: "Le Plaisir d'apprendre: l'economie et l'organisation", subject: "Economie" },
  { level: "1BAC SC EXP", title: "Manuel pratique du droit civil et commercial", subject: "Droit" },
  { level: "1BAC SC EXP", title: "La Boite a merveilles", subject: "Lecture" },
  { level: "1BAC SC EXP", title: "Antigone", subject: "Lecture" },
  { level: "1BAC SC EXP", title: "Le Dernier jour d'un condamne", subject: "Lecture" },
  { level: "1BAC SC EXP", title: "THINK (C1) Student's book 5 + Workbook 5", subject: "Anglais" },

  // 2BAC SC PC - السنة الثانية باك علوم فيزيائية
  { level: "2BAC SC PC", title: "Al-ra'id fi al-lugha al-arabiya", subject: "Langue arabe" },
  { level: "2BAC SC PC", title: "Fi rahab al-falsafa", subject: "Philosophie" },
  { level: "2BAC SC PC", title: "Fi rahab al-tarbiya al-islamiya", subject: "Education islamique" },
  { level: "2BAC SC PC", title: "Maxi Maths 2eme Annee Bac SP", subject: "Mathematiques" },
  { level: "2BAC SC PC", title: "Physique/Chimie CDPL 2eme Bac SP", subject: "Physique-chimie" },
  { level: "2BAC SC PC", title: "Sciences de la vie et de la terre 2eme Bac SP", subject: "SVT" },
  { level: "2BAC SC PC", title: "Candide", subject: "Lecture" },
  { level: "2BAC SC PC", title: "Il etait une fois un vieux couple heureux", subject: "Lecture" },
  { level: "2BAC SC PC", title: "Le Pere Goriot", subject: "Lecture" },
  { level: "2BAC SC PC", title: "Gateway To English 2", subject: "Anglais" },

  // 2BAC SC EXP - السنة الثانية باك علوم اقتصادية
  { level: "2BAC SC EXP", title: "Al-ra'id fi al-lugha al-arabiya", subject: "Langue arabe" },
  { level: "2BAC SC EXP", title: "Fi rahab al-falsafa", subject: "Philosophie" },
  { level: "2BAC SC EXP", title: "Fi rahab al-tarbiya al-islamiya", subject: "Education islamique" },
  { level: "2BAC SC EXP", title: "PANORAMA MATHS 2eme Bac Eco", subject: "Mathematiques" },
  { level: "2BAC SC EXP", title: "Le Plaisir d'apprendre la comptabilite", subject: "Comptabilite" },
  { level: "2BAC SC EXP", title: "Plan comptable general marocain", subject: "Comptabilite" },
  { level: "2BAC SC EXP", title: "Economie generale", subject: "Economie" },
  { level: "2BAC SC EXP", title: "Economie et organisation", subject: "Economie" },
  { level: "2BAC SC EXP", title: "Droit", subject: "Droit" },
  { level: "2BAC SC EXP", title: "Candide", subject: "Lecture" },
  { level: "2BAC SC EXP", title: "Il etait une fois un vieux couple heureux", subject: "Lecture" },
  { level: "2BAC SC EXP", title: "Le Pere Goriot", subject: "Lecture" },
  { level: "2BAC SC EXP", title: "Gateway To English 2", subject: "Anglais" },

  // 2BAC SC MATHS - السنة الثانية باك علوم رياضية
  { level: "2BAC SC MATHS", title: "Al-ra'id fi al-lugha al-arabiya", subject: "Langue arabe" },
  { level: "2BAC SC MATHS", title: "Fi rahab al-falsafa", subject: "Philosophie" },
  { level: "2BAC SC MATHS", title: "Fi rahab al-tarbiya al-islamiya", subject: "Education islamique" },
  { level: "2BAC SC MATHS", title: "EL MOFID EN MATHEMATIQUES 2eme S.Maths A et B (Tome 1 + Tome 2)", subject: "Mathematiques" },
  { level: "2BAC SC MATHS", title: "COLLECTION GALILLE: PHYSIQUE/CHIMIE 2AC SM", subject: "Physique-chimie" },
  { level: "2BAC SC MATHS", title: "Sciences de la Vie et de la Terre CDPL", subject: "SVT" },
  { level: "2BAC SC MATHS", title: "Candide", subject: "Lecture" },
  { level: "2BAC SC MATHS", title: "Il etait une fois un vieux Couple heureux", subject: "Lecture" },
  { level: "2BAC SC MATHS", title: "Le Pere Goriot", subject: "Lecture" },
  { level: "2BAC SC MATHS", title: "Gateway To English 2", subject: "Anglais" },
];

async function main() {
  console.log(`Seeding ${SCHOOL_NAME}...`);

  const school = await prisma.school.upsert({
    where: { name: SCHOOL_NAME },
    update: {},
    create: {
      name: SCHOOL_NAME,
      region: "Khemisset",
    },
  });

  console.log(`School: ${school.name} (id: ${school.id})`);

  let created = 0;
  let skipped = 0;

  for (const entry of books) {
    const existing = await prisma.book.findFirst({
      where: {
        title: entry.title,
        subject: entry.subject,
        level: entry.level,
        schoolId: school.id,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.book.create({
      data: {
        title: entry.title,
        subject: entry.subject,
        level: entry.level,
        schoolId: school.id,
      },
    });
    created++;
  }

  console.log(`Done: ${created} books created, ${skipped} skipped (already exist)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
