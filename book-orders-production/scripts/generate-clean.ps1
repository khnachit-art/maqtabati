# encoding: UTF-8
$ErrorActionPreference = 'Stop'

$raw = Get-Content -Raw -LiteralPath 'C:\Users\PC-PJD\Documents\Default Project\book-orders\scripts\seed-data.json'
$seedData = $raw | ConvertFrom-Json

$results = @()
$seen = @{}

foreach ($item in $seedData) {
    $t = $item.title
    $l = $item.level
    
    # Clean spaces
    $c = $t -replace '\s+', ' ' -replace '^\s+|\s+$', ''
    
    if ($c.Length -lt 4) { continue }
    
    # Skip pure RTL garbage (arabic text fragments without recognizable book names)
    $nonAscii = [regex]::Matches($c, '[\x00-\x7F]').Count
    $totalLen = $c.Length
    if ($nonAscii -lt 2 -and $totalLen -gt 10) { continue }
    
    $n = $c.ToLowerInvariant()
    
    # Skip school supplies
    if ($n -match '(^|\s)(cahier|carnet|crayon|stylo|gomme|trousse|papier|compas|equerre|rapporteur|ardoise|feutre|ciseaux|pinceau|agenda|lutin|classeur|protege|feuill|colle|calculatr)') { continue }
    if ($n -match 'boite.*crayon|paquet.*feuille|craie|fournitur|tournez.*page|etablissement|institut') { continue }
    if ($n -match 'maternelle|tablier|pochette|papier.*canson|porte.*vue|taille.*crayon|classeur|ardoise|brosse') { continue }
    if ($n -match '^(les |les |les )(cahiers|livres|cahier)\s*$') { continue }
    
    # Known subjects determined by content
    $subj = $null
    $clean = $null
    
    # ===== FRENCH =====
    if ($n -match 'taoki') { $subj = 'Francais'; $clean = 'Taoki et compagnie' }
    elseif ($n -match 'mot de passe') { $subj = 'Francais'; $clean = 'Mot de Passe' }
    elseif ($n -match 'tresor des') { $subj = 'Francais'; $clean = 'Le tresor des mots' }
    elseif ($n -match '^mots$') { $subj = 'Francais'; $clean = 'Le tresor des mots' }
    elseif ($n -match 'rives bleues') { $subj = 'Francais'; $clean = 'Rives Bleues' }
    elseif ($n -match 'mes apprentissages') { $subj = 'Francais'; $clean = 'Mes apprentissages en francais' }
    elseif ($n -match 'methodes.*pratiques') { $subj = 'Francais'; $clean = 'Francais Methodes et Pratiques' }
    elseif ($n -match 'texto college') { $subj = 'Francais'; $clean = 'Texto college' }
    elseif ($n -match 'textes.*langages') { $subj = 'Francais'; $clean = 'Textes, langages et litteratures' }
    elseif ($n -match 'passerelles') { $subj = 'Francais'; $clean = 'Passerelles' }
    elseif ($n -match 'le francais au college') { $subj = 'Francais'; $clean = 'Le francais au college' }
    elseif ($n -match "l'heure de francais") { $subj = 'Francais'; $clean = "L'heure de francais" }
    elseif ($n -match 'nenuphar') { $subj = 'Francais'; $clean = 'Nenuphar' }
    elseif ($n -match 'la bo[i1]te') { $subj = 'Francais'; $clean = 'La boite a merveilles' }
    elseif ($n -match 'antigone') { $subj = 'Francais'; $clean = 'Antigone' }
    elseif ($n -match 'dernier jour') { $subj = 'Francais'; $clean = "Le dernier jour d'un condamne" }
    elseif ($n -match 'aux champs') { $subj = 'Francais'; $clean = 'Aux champs' }
    elseif ($n -match 'chevalier double') { $subj = 'Francais'; $clean = 'Le chevalier double' }
    elseif ($n -match 'bourgeois') { $subj = 'Francais'; $clean = 'Le bourgeois gentilhomme' }
    elseif ($n -match 'la ficelle') { $subj = 'Francais'; $clean = 'La ficelle' }
    elseif ($n -match 'candide') { $subj = 'Francais'; $clean = 'Candide' }
    elseif ($n -match 'pere goriot') { $subj = 'Francais'; $clean = 'Le pere Goriot' }
    elseif ($n -match 'vieux couple') { $subj = 'Francais'; $clean = 'Il etait une fois un vieux couple heureux' }
    elseif ($n -match 'promesse') { $subj = 'Francais'; $clean = "La promesse de l'aube" }
    elseif ($n -match 'revolte des animaux') { $subj = 'Francais'; $clean = 'La revolte des animaux' }
    elseif ($n -match 'revolte des enfants') { $subj = 'Francais'; $clean = 'La revolte des enfants' }
    elseif ($n -match 'mystere') { $subj = 'Francais'; $clean = 'Le mystere des 3 tableaux' }
    elseif ($n -match 'moi.*touria') { $subj = 'Francais'; $clean = 'Moi, Touria Chaoui' }
    elseif ($n -match 'bibliobus') { $subj = 'Francais'; $clean = 'Bibliobus' }
    elseif ($n -match 'petite poule') { $subj = 'Francais'; $clean = 'La petite poule rousse' }
    elseif ($n -match 'petite sirene') { $subj = 'Francais'; $clean = 'La petite sirene' }
    elseif ($n -match 'six serviteurs') { $subj = 'Francais'; $clean = 'Les six serviteurs' }
    elseif ($n -match 'couleurs.*arc') { $subj = 'Francais'; $clean = "Les couleurs de l'arc en ciel" }
    elseif ($n -match 'majuscules') { $subj = 'Francais'; $clean = 'Pour apprendre les majuscules' }
    elseif ($n -match 'meilleur en ecriture') { $subj = 'Francais'; $clean = 'Meilleur en ecriture' }
    elseif ($n -match 'dictionnaire') { $subj = 'Francais'; $clean = 'Dictionnaire' }
    elseif ($n -match 'atelier.*competences') { $subj = 'Francais'; $clean = 'Mon Atelier des Competences de vie' }
    elseif ($n -match 'historiettes') { $subj = 'Francais'; $clean = 'Historiettes' }
    elseif ($n -match 'ecole.*amies') { $subj = 'Francais'; $clean = "L'ecole et les amies" }
    elseif ($n -match 'campagne.*ville') { $subj = 'Francais'; $clean = 'La campagne et la ville' }
    elseif ($n -match 'monde.*technologie') { $subj = 'Francais'; $clean = 'Le monde de la technologie' }
    elseif ($n -match 'corps.*nutrition') { $subj = 'Francais'; $clean = "Le corps, la nutrition et l'hygiene" }
    elseif ($n -match 'famille.*maison') { $subj = 'Francais'; $clean = 'La famille et la maison' }
    elseif ($n -match 'quartier.*parties') { $subj = 'Francais'; $clean = 'Le quartier et ses parties' }
    elseif ($n -match 'meli.*melo') { $subj = 'Francais'; $clean = 'Meli-Melo des mots' }
    elseif ($n -match 'reading.*obligatory|vendredi|aventures|vendr') { $subj = 'Francais'; $clean = "Roman d'aventures" }
    elseif ($n -match 'nouveau monde') { $subj = 'Francais'; $clean = 'Nouveau monde' }
    elseif ($n -match 'parcours') { continue }
    
    # ===== ENGLISH =====
    elseif ($n -match 'little red') { $subj = 'Anglais'; $clean = 'Little Red Riding Hood' }
    elseif ($n -match 'super minds') { $subj = 'Anglais'; $clean = 'Super Minds' }
    elseif ($n -match 'i wonder') { $subj = 'Anglais'; $clean = 'I Wonder' }
    elseif ($n -match 'on screen') { $subj = 'Anglais'; $clean = 'On Screen' }
    elseif ($n -match 'gateway.*english') { $subj = 'Anglais'; $clean = 'Gateway to English' }
    elseif ($n -match 'english iq') { $subj = 'Anglais'; $clean = 'English IQ' }
    elseif ($n -match "let's speak") { $subj = 'Anglais'; $clean = "Let's Speak English" }
    elseif ($n -match 'student') { $subj = 'Anglais'; $clean = "Student's Book / Workbook" }
    elseif ($n -match 'workbook|work book') { $subj = 'Anglais'; $clean = 'Workbook' }
    
    # ===== MATHEMATIQUES =====
    elseif ($n -match 'genie des') { $subj = 'Mathematiques'; $clean = 'Genie des Maths' }
    elseif ($n -match 'fichier de l') { $subj = 'Mathematiques'; $clean = "Genie des Maths - Fichier de l'apprenant" }
    elseif ($n -match 'top math') { $subj = 'Mathematiques'; $clean = 'TOP Mathematiques' }
    elseif ($n -match 'maxi') { $subj = 'Mathematiques'; $clean = 'Maxi Maths' }
    elseif ($n -match 'al moufid') { $subj = 'Mathematiques'; $clean = 'AL MOUFID EN MATHEMATIQUES' }
    elseif ($n -match 'al mofid.*math') { $subj = 'Mathematiques'; $clean = 'AL MOFID EN MATHEMATIQUES' }
    elseif ($n -match 'el moufid') { $subj = 'Mathematiques'; $clean = 'EL MOUFID EN MATHEMATIQUES' }
    elseif ($n -match 'oxygene') { $subj = 'Mathematiques'; $clean = 'Oxygene Mathematiques' }
    elseif ($n -match 'panorama') { $subj = 'Mathematiques'; $clean = 'Panorama Maths' }
    elseif ($n -match 'maths\+') { $subj = 'Mathematiques'; $clean = 'Maths+' }
    elseif ($n -match 'mathematiques') { $subj = 'Mathematiques'; $clean = 'Mathematiques College' }
    elseif ($n -match '^archipel$') { $subj = 'Mathematiques'; $clean = 'Archipel des Maths' }
    elseif ($n -match 'archipel des math') { $subj = 'Mathematiques'; $clean = 'Archipel des Maths' }
    elseif ($n -match "l'archipel des math") { $subj = 'Mathematiques'; $clean = 'Archipel des Maths' }
    elseif ($n -match 'calculator') { $subj = 'Mathematiques'; $clean = 'Calculator' }
    
    # ===== ECONOMIE =====
    elseif ($n -match 'j.assimile') { $subj = 'Economie'; $clean = "J'assimile la comptabilite" }
    elseif ($n -match 'plaisir d.apprendre.*comptab') { $subj = 'Economie'; $clean = "Le plaisir d'apprendre la comptabilite" }
    elseif ($n -match 'plaisir d.apprendre.*econom') { $subj = 'Economie'; $clean = "Le plaisir d'apprendre l'economie" }
    elseif ($n -match 'plan comptable') { $subj = 'Economie'; $clean = 'Plan comptable general marocain' }
    elseif ($n -match 'dictionnaire economique') { $subj = 'Economie'; $clean = 'Dictionnaire economique' }
    elseif ($n -match 'tables financieres') { $subj = 'Economie'; $clean = 'Tables financieres' }
    
    # ===== SVT =====
    elseif ($n -match "archipel.*sciences.*vie|archipel.*svt") { $subj = 'SVT'; $clean = "L'Archipel des Sciences de la Vie et de la Terre" }
    elseif ($n -match 'sciences de la vie') { $subj = 'SVT'; $clean = 'Sciences de la Vie et de la Terre' }
    elseif ($n -match 'svt panoram') { $subj = 'SVT'; $clean = 'SVT Panorama' }
    elseif ($n -match 'cdpl.*svt') { $subj = 'SVT'; $clean = 'CDPL Sciences de la Vie et de la Terre' }
    elseif ($n -match 'i sciences') { $subj = 'SVT'; $clean = 'I Sciences' }
    
    # ===== PHYSIQUE-CHIMIE =====
    elseif ($n -match 'etincelle') { $subj = 'Physique-Chimie'; $clean = 'Etincelle Physique-Chimie' }
    elseif ($n -match "l'univers.*physique") { $subj = 'Physique-Chimie'; $clean = "L'Univers de Physique-Chimie" }
    elseif ($n -match "archipel.*physique|archipel.*chimie") { $subj = 'Physique-Chimie'; $clean = "L'Archipel de Physique-Chimie" }
    elseif ($n -match 'i physique') { $subj = 'Physique-Chimie'; $clean = 'I Physique Chimie' }
    elseif ($n -match 'galill|galilee') { $subj = 'Physique-Chimie'; $clean = 'Galilee Physique-Chimie' }
    elseif ($n -match 'cdpl.*physique') { $subj = 'Physique-Chimie'; $clean = 'CDPL Physique-Chimie' }
    elseif ($n -match 'al moufid.*chimie|al moufid.*physique') { $subj = 'Physique-Chimie'; $clean = 'AL MOUFID Physique-Chimie' }
    
    # ===== SCIENCES (primary) =====
    elseif ($n -match 'mon cahier.*investig') { $subj = 'Sciences'; $clean = "Mon cahier d'investigation" }
    elseif ($n -match 'cahiers de la luciole') { $subj = 'Sciences'; $clean = 'Les cahiers de la Luciole' }
    elseif ($n -match 'abc en sciences') { $subj = 'Sciences'; $clean = 'ABC en Sciences' }
    elseif ($n -match 'top sciences') { $subj = 'Sciences'; $clean = 'TOP Sciences' }
    
    # ===== INFORMATIQUE =====
    elseif ($n -match 'informatique.*robotique') { $subj = 'Informatique'; $clean = 'Informatique et Robotique au College' }
    elseif ($n -match 'informatique.*intelligence') { $subj = 'Informatique'; $clean = 'Informatique et Intelligence Artificielle' }
    elseif ($n -match 'robotique.*intelligence|intelligence artificielle') { $subj = 'Informatique'; $clean = 'Robotique et Intelligence Artificielle' }
    elseif ($n -match 'evoluer') { $subj = 'Informatique'; $clean = 'Evoluer en Informatique' }
    
    # ===== MUSIQUE =====
    elseif ($n -match 'musique.*port') { $subj = 'Musique'; $clean = 'La Musique a ma portee' }
    
    # ===== UNKNOWN =====
    else { continue }
    
    if (-not $subj -or -not $clean) { continue }
    
    $keylow = "$clean|$l|$subj".ToLowerInvariant()
    if ($seen.ContainsKey($keylow)) { continue }
    $seen[$keylow] = $true
    
    $results += [PSCustomObject]@{
        title = $clean
        subject = $subj
        level = $l
    }
}

$results = $results | Sort-Object level, title

$results | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath 'C:\Users\PC-PJD\Documents\Default Project\book-orders\scripts\clean-seed.json' -Encoding UTF8

Write-Host ("Total clean entries: " + $results.Count)
