# Réorganisation de jmon/algo

Le tableau des 301 entrées publiques de `jm`, telles que `src/index.js` les assemble aujourd'hui, avec ce que j'en propose. Rien n'est changé dans le code : c'est ici que les décisions se prennent, ligne par ligne, avant de toucher à quoi que ce soit.

Colonnes : la sorte d'entrée (183 fonctions, 27 classes, 91 données), qui l'appelle (les pièces de `compositions/oa`, les tests d'algo, la bibliothèque elle-même, en nombre de fichiers), l'action proposée, le nom proposé quand il change. Les comptes viennent d'une recherche du nom dans les fichiers ; pour un nom court ou courant (`key`, `range`, `metric`) ils peuvent compter d'autres choses. **Action** vaut : garder (même nom, nouvel espace), renommer, déplacer, à plat (un sous-espace dissous), fusionner, ne plus exporter (utile en interne, inutile au compositeur), retirer (rien ne l'appelle ; git la garde).

## Les principes

1. **Rangé par question musicale, pas par technique.** Un espace par chose qu'un compositeur cherche.
2. **Un mot, une chose.** `track`, `notes`, `chord` (une liste de hauteurs), `pitch`, `key`, `scale`. Les noms disent le domaine : `neoRiemannian`, pas `transform`.
3. **Un verbe pour une action, un nom pour une valeur.** Ce qui transforme des notes est un verbe à l'impératif : `shift`, `transpose`, `humanize`, `sustain`, `corrupt`. Ce qui mesure ou construit rend une valeur et porte un nom : `range`, `span`, `onsets`, `track`, `key`. Les classes gardent leur nom, mais une classe qui ne fait qu'une action devient ce verbe.
4. **La règle d'appel partout.** Le sujet d'abord, puis un nombre ou un objet nommé ; une classe prend un objet.
5. **Ce que rien n'appelle sort.** Une fonction sans appelant et sans test est retirée, pas gardée au cas où.
6. **recipe.js est le test humain.** Chaque espace doit pouvoir s'expliquer en une cellule à quelqu'un qui découvre.

## Avancement

- `jm.notes` : fait (5.0.0, `jm.utils` reste une façade des anciens noms pour une version).

## La cible

| Espace | Ce qu'il contient |
|---|---|
| `jm.notes` | transformer des listes de notes |
| `jm.harmony` | dans une tonalité : clé, gamme, accords, progressions |
| `jm.voices` | ce que font les voix d'un accord à l'autre : gestes néo-riemanniens, marches, choral, contrepoint |
| `jm.rhythm` | rythmes, claves, profils |
| `jm.performance` | le jeu : tenues, archet, humanisation, ornements, groove, corruption |
| `jm.generative` | la matière : marches, automates, fractales, minimalisme, génétique, batteur |
| `jm.analysis` | une seule API d'analyse |
| `jm.constants` | les tables |


## `jm.notes`

| Aujourd'hui | Sorte | Pièces | Tests | Interne | Action | Nom proposé | Remarque |
|---|---|---|---|---|---|---|---|
| `utils.augment` | fonction | 1 | 1 | 1 | déplacer |  |  |
| `utils.beatsToTime` | fonction | 0 | 0 | 6 | déplacer |  |  |
| `utils.canon` | fonction | 4 | 1 | 1 | déplacer |  | ajouté hier ; quatre pièces |
| `utils.chordNotes` | fonction | 1 | 3 | 7 | déplacer |  | garde son nom : une construction rend une valeur, et se nomme (renommé ce matin, était chordTrack) |
| `utils.combineNotes` | fonction | 0 | 0 | 0 | renommer | combine | renommé ce matin (était combineTracks) ; c'est [...a, ...b] ; rien ne l'appelle : à retirer ? |
| `utils.concatenateNotes` | fonction | 0 | 0 | 1 | renommer | concatenate | renommé ce matin (était concatenateTracks) |
| `utils.createPiece` | fonction | 0 | 1 | 1 | renommer | piece(tracks, { tempo }) | une construction : un nom, comme key(…) |
| `utils.createTrack` | fonction | 0 | 1 | 1 | renommer | track(notes, { label, synth }) | une construction : un nom, comme key(…) |
| `utils.diatonic` | fonction | 0 | 3 | 6 | déplacer |  | ajouté hier |
| `utils.extractRhythm` | fonction | 0 | 1 | 0 | renommer | onsets (une valeur : un nom) |  |
| `utils.getPitchRange` | fonction | 0 | 1 | 0 | renommer | range (une valeur : un nom) |  |
| `utils.getTotalDuration` | fonction | 0 | 1 | 1 | renommer | span (une valeur : un nom) |  |
| `utils.invert` | fonction | 0 | 1 | 1 | déplacer |  |  |
| `utils.noOverlap` | fonction | 0 | 1 | 0 | retirer |  | fait : travaillait sur des tuples djalgo, pas sur des notes JMON |
| `utils.normalizeVelocities` | fonction | 0 | 1 | 0 | renommer | normalize(notes, { min, max }) |  |
| `utils.quantize` | fonction | 0 | 2 | 2 | déplacer |  |  |
| `utils.quantizeEvents` | fonction | 0 | 1 | 1 | renommer | quantize (fusion avec quantize sur une valeur ?) |  |
| `utils.removeDuplicates` | fonction | 0 | 1 | 0 | renommer | deduplicate |  |
| `utils.retrograde` | fonction | 0 | 2 | 1 | renommer | reverse |  |
| `utils.shiftTime` | fonction | 9 | 0 | 1 | renommer | shift |  |
| `utils.splitLongNotes` | fonction | 0 | 1 | 1 | renommer | split |  |
| `utils.tile` | fonction | 1 | 2 | 5 | déplacer |  |  |
| `utils.timeToBeats` | fonction | 0 | 0 | 8 | déplacer |  |  |
| `utils.transpose` | fonction | 5 | 1 | 2 | déplacer |  |  |
| `utils.transposeDiatonic` | fonction | 1 | 1 | 0 | déplacer |  |  |
| `utils.truncate` | fonction | 2 | 0 | 0 | déplacer |  |  |

## `jm.harmony`

| Aujourd'hui | Sorte | Pièces | Tests | Interne | Action | Nom proposé | Remarque |
|---|---|---|---|---|---|---|---|
| `theory.harmony.Key` | classe | 0 | 3 | 5 | garder |  |  |
| `theory.harmony.Progression` | classe | 3 | 2 | 6 | garder |  | se sépare : reste chiffres romains + cercle (harmony) ; applyTransforms, nrtWalk, smooth partent dans voices |
| `theory.harmony.Scale` | classe | 0 | 2 | 11 | fusionner | key.scale({ start, length }) rend la liste | la classe ne sert qu'à generate une liste de hauteurs : un appel suffit |
| `theory.harmony.Solfege.SYLLABLES` | donnée | 0 | 0 | 1 | à plat |  |  |
| `theory.harmony.Solfege.chordDistance` | fonction | 0 | 1 | 3 | à plat |  |  |
| `theory.harmony.Solfege.degree` | fonction | 4 | 2 | 9 | à plat |  |  |
| `theory.harmony.Solfege.doPitchClass` | fonction | 0 | 0 | 2 | à plat |  |  |
| `theory.harmony.Solfege.isChordTone` | fonction | 0 | 1 | 1 | à plat |  |  |
| `theory.harmony.Solfege.scalePitchClasses` | fonction | 0 | 0 | 4 | à plat |  |  |
| `theory.harmony.Solfege.solfege` | fonction | 0 | 2 | 3 | à plat |  |  |
| `theory.harmony.Solfege.stability` | fonction | 0 | 2 | 9 | à plat |  |  |
| `theory.harmony.Solfege.triadOf` | fonction | 0 | 1 | 3 | à plat |  |  |
| `theory.harmony.Voice` | classe | 0 | 2 | 6 | renommer | harmonize(melody, { key, measureLength }) | generate met des accords sous une mélodie : c'est l'action ; lead et leadProgression partent, smoothWalk fait mieux |
| `theory.harmony.chordify` | fonction | 0 | 1 | 4 | renommer | chord ? |  |
| `theory.harmony.chordifyMany` | fonction | 0 | 1 | 4 | renommer | chords ? (ou fusion avec chordify) |  |
| `theory.harmony.key` | fonction | 9 | 5 | 20 | garder |  |  |

## `jm.voices`

| Aujourd'hui | Sorte | Pièces | Tests | Interne | Action | Nom proposé | Remarque |
|---|---|---|---|---|---|---|---|
| `theory.harmony.counterpoint` | fonction | 2 | 1 | 2 | déplacer |  |  |
| `theory.harmony.parallelPerfects` | fonction | 0 | 1 | 2 | déplacer |  |  |
| `theory.harmony.voiceChorale` | fonction | 2 | 1 | 2 | renommer | voices.lead(chords, { ranges }) | conduire les voix : le verbe du solfège |

## `jm.performance`

| Aujourd'hui | Sorte | Pièces | Tests | Interne | Action | Nom proposé | Remarque |
|---|---|---|---|---|---|---|---|
| `processors.Corruptor` | classe | 1 | 1 | 2 | renommer | corrupt(piece, { entropy, … }) | une pièce (oooaaa) ; la classe reste dessous si sa configuration ne tient pas dans un appel |
| `processors.GROOVE_STEPS.rhythmCode` | donnée | 0 | 1 | 5 | déplacer |  |  |
| `processors.anticipate` | fonction | 0 | 1 | 6 | déplacer |  |  |
| `processors.applySteps` | fonction | 0 | 1 | 2 | renommer | step ? |  |
| `processors.corruptJmon` | fonction | 0 | 1 | 1 | renommer | corrupt |  |
| `processors.groove` | fonction | 3 | 2 | 4 | déplacer |  |  |
| `theory.harmony.Arpeggiate` | classe | 0 | 1 | 3 | retirer |  | double la fonction arpeggiate(), qui reste |
| `theory.harmony.Articulation` | classe | 0 | 1 | 2 | renommer | articulate(notes, { type, at }) | une action : un verbe, plus de classe |
| `theory.harmony.Ornament` | classe | 0 | 3 | 5 | renommer | ornament(notes, { type, at }) | une action : un verbe, plus de classe |
| `theory.harmony.Strum` | classe | 0 | 1 | 3 | retirer |  | double la fonction strum(), qui reste |
| `theory.harmony.arpeggiate` | fonction | 0 | 1 | 3 | déplacer |  |  |
| `theory.harmony.strum` | fonction | 0 | 1 | 3 | déplacer |  |  |
| `utils.applySwing` | fonction | 0 | 1 | 0 | déplacer |  |  |
| `utils.bow` | fonction | 2 | 1 | 1 | déplacer |  |  |
| `utils.expressivize` | fonction | 4 | 0 | 0 | renommer | embellish | quatre pièces : bends et vibratos au hasard |
| `utils.humanize` | fonction | 7 | 3 | 3 | déplacer |  |  |
| `utils.sustained` | fonction | 5 | 1 | 1 | renommer | sustain |  |

## `jm.rhythm`

| Aujourd'hui | Sorte | Pièces | Tests | Interne | Action | Nom proposé | Remarque |
|---|---|---|---|---|---|---|---|
| `theory.profile.Profile` | classe | 0 | 1 | 7 | garder |  |  |
| `theory.profile.RHYTHM_CODE_23` | donnée | 0 | 1 | 2 | garder |  |  |
| `theory.profile.STABILITY_MAJOR` | donnée | 0 | 0 | 3 | garder |  |  |
| `theory.profile.TONALITY_CODE` | donnée | 0 | 0 | 2 | garder |  |  |
| `theory.profile.presets.rhythmCode` | fonction | 0 | 1 | 5 | garder |  |  |
| `theory.profile.presets.stability` | fonction | 0 | 2 | 9 | garder |  |  |
| `theory.profile.presets.tonalityCode` | fonction | 0 | 0 | 2 | garder |  |  |
| `theory.rhythm.CLAVES.afro.grid` | donnée | 1 | 4 | 14 | garder |  |  |
| `theory.rhythm.CLAVES.afro.pulsesPerBar` | donnée | 0 | 0 | 1 | garder |  |  |
| `theory.rhythm.CLAVES.bossa.grid` | donnée | 1 | 4 | 14 | garder |  |  |
| `theory.rhythm.CLAVES.bossa.pulsesPerBar` | donnée | 0 | 0 | 1 | garder |  |  |
| `theory.rhythm.CLAVES.rumba.grid` | donnée | 1 | 4 | 14 | garder |  |  |
| `theory.rhythm.CLAVES.rumba.pulsesPerBar` | donnée | 0 | 0 | 1 | garder |  |  |
| `theory.rhythm.CLAVES.son.grid` | donnée | 1 | 4 | 14 | garder |  |  |
| `theory.rhythm.CLAVES.son.pulsesPerBar` | donnée | 0 | 0 | 1 | garder |  |  |
| `theory.rhythm.CLAVES.tresillo.grid` | donnée | 1 | 4 | 14 | garder |  |  |
| `theory.rhythm.CLAVES.tresillo.pulsesPerBar` | donnée | 0 | 0 | 1 | garder |  |  |
| `theory.rhythm.Rhythm` | classe | 1 | 3 | 11 | garder |  | random() et darwin() rendent des notes |
| `theory.rhythm.beatcycle` | fonction | 0 | 1 | 1 | garder |  |  |
| `theory.rhythm.clave` | fonction | 1 | 3 | 11 | garder |  |  |
| `theory.rhythm.clavePattern` | fonction | 0 | 1 | 3 | garder |  |  |
| `theory.rhythm.draw` | fonction | 0 | 2 | 8 | garder |  |  |
| `theory.rhythm.euclid` | fonction | 0 | 2 | 6 | garder |  |  |
| `theory.rhythm.euclidPattern` | fonction | 0 | 2 | 4 | garder |  |  |
| `theory.rhythm.fromOnsets` | fonction | 0 | 1 | 4 | garder |  |  |
| `theory.rhythm.isorhythm` | fonction | 1 | 2 | 2 | garder |  |  |
| `theory.rhythm.metricStrengths` | fonction | 0 | 1 | 3 | garder |  |  |
| `theory.rhythm.onsets` | fonction | 0 | 6 | 14 | garder |  |  |
| `theory.rhythm.parsePattern` | fonction | 0 | 0 | 2 | garder |  |  |

## `jm.generative`

| Aujourd'hui | Sorte | Pièces | Tests | Interne | Action | Nom proposé | Remarque |
|---|---|---|---|---|---|---|---|
| `generative.automata.CellularAutomata` | classe | 4 | 2 | 3 | garder |  | quatre pièces |
| `generative.drummer` | fonction | 2 | 2 | 7 | garder |  | ses presets avec |
| `generative.fractals.BurningShip` | classe | 0 | 1 | 4 | garder |  |  |
| `generative.fractals.Fractal` | classe | 0 | 1 | 4 | garder |  |  |
| `generative.fractals.Julia` | classe | 0 | 2 | 5 | garder |  |  |
| `generative.fractals.LogisticMap` | classe | 0 | 1 | 2 | garder |  |  |
| `generative.fractals.Mandelbrot` | classe | 1 | 2 | 5 | garder |  | une pièce |
| `generative.genetic.Darwin` | classe | 0 | 2 | 9 | garder |  |  |
| `generative.genetic.metric` | fonction | 0 | 3 | 7 | garder |  |  |
| `generative.genetic.metrics.anticipationRate` | fonction | 0 | 2 | 2 | garder |  |  |
| `generative.genetic.metrics.chordToneRate` | fonction | 0 | 1 | 2 | garder |  |  |
| `generative.genetic.metrics.claveFit` | fonction | 0 | 1 | 1 | garder |  |  |
| `generative.genetic.metrics.firstChordTone` | fonction | 0 | 0 | 0 | garder |  | rien ne l'appelle : à retirer ? |
| `generative.genetic.metrics.lastStability` | fonction | 0 | 0 | 0 | garder |  | rien ne l'appelle : à retirer ? |
| `generative.genetic.metrics.quadrantBalance` | fonction | 0 | 0 | 0 | garder |  | rien ne l'appelle : à retirer ? |
| `generative.genetic.metrics.rareRate` | fonction | 0 | 2 | 2 | garder |  |  |
| `generative.genetic.metrics.resolveRate` | fonction | 0 | 0 | 0 | garder |  | rien ne l'appelle : à retirer ? |
| `generative.genetic.metrics.stopRate` | fonction | 0 | 0 | 2 | garder |  |  |
| `generative.genetic.metrics.sweetness` | fonction | 0 | 2 | 2 | garder |  |  |
| `generative.genetic.metrics.tonalityFit` | fonction | 0 | 1 | 0 | garder |  |  |
| `generative.genetic.metrics.upbeatRatio` | fonction | 0 | 2 | 2 | garder |  |  |
| `generative.genetic.operators.anticipateOnset` | fonction | 0 | 1 | 1 | garder |  |  |
| `generative.genetic.operators.default.anticipateOnset` | fonction | 0 | 1 | 1 | garder |  |  |
| `generative.genetic.operators.default.delayOnset` | fonction | 0 | 1 | 1 | garder |  |  |
| `generative.genetic.operators.default.melodyOperators` | donnée | 0 | 0 | 1 | garder |  |  |
| `generative.genetic.operators.default.mergeRest` | fonction | 0 | 1 | 1 | garder |  |  |
| `generative.genetic.operators.default.relayout` | fonction | 0 | 1 | 2 | garder |  |  |
| `generative.genetic.operators.default.restify` | fonction | 0 | 1 | 1 | garder |  |  |
| `generative.genetic.operators.default.rhythmOperators` | donnée | 0 | 1 | 1 | garder |  |  |
| `generative.genetic.operators.default.stepStability` | fonction | 0 | 1 | 1 | garder |  |  |
| `generative.genetic.operators.default.swapDurations` | fonction | 0 | 0 | 1 | garder |  |  |
| `generative.genetic.operators.default.toChordTone` | fonction | 0 | 1 | 1 | garder |  |  |
| `generative.genetic.operators.default.toNonChordTone` | fonction | 0 | 1 | 1 | garder |  |  |
| `generative.genetic.operators.delayOnset` | fonction | 0 | 1 | 1 | garder |  |  |
| `generative.genetic.operators.melodyOperators` | donnée | 0 | 0 | 1 | garder |  |  |
| `generative.genetic.operators.mergeRest` | fonction | 0 | 1 | 1 | garder |  |  |
| `generative.genetic.operators.relayout` | fonction | 0 | 1 | 2 | garder |  |  |
| `generative.genetic.operators.restify` | fonction | 0 | 1 | 1 | garder |  |  |
| `generative.genetic.operators.rhythmOperators` | donnée | 0 | 1 | 1 | garder |  |  |
| `generative.genetic.operators.stepStability` | fonction | 0 | 1 | 1 | garder |  |  |
| `generative.genetic.operators.swapDurations` | fonction | 0 | 0 | 1 | garder |  |  |
| `generative.genetic.operators.toChordTone` | fonction | 0 | 1 | 1 | garder |  |  |
| `generative.genetic.operators.toNonChordTone` | fonction | 0 | 1 | 1 | garder |  |  |
| `generative.genetic.phraseToNotes` | fonction | 0 | 1 | 3 | garder |  |  |
| `generative.loops.Loop` | classe | 0 | 2 | 4 | retirer |  | tile répète, euclid fait les rythmes euclidiens ; deux polyloops sont tile deux fois avec deux cycle |
| `generative.minimalism.MinimalismProcess` | classe | 1 | 1 | 3 | renommer | unfold(notes, { operation, direction, repetition }) | dérouler un motif par ajouts ou retraits : l'action, pas l'école |
| `generative.minimalism.Tintinnabuli` | classe | 5 | 1 | 2 | garder |  | cinq pièces : à garder tel quel |
| `generative.minimalism.phaseShift` | fonction | 0 | 1 | 3 | renommer | phase |  |
| `generative.walks.Chain` | classe | 0 | 3 | 5 | garder |  |  |
| `generative.walks.Phasor` | classe | 0 | 1 | 3 | garder |  |  |
| `generative.walks.PhasorSystem` | classe | 0 | 1 | 3 | garder |  |  |
| `generative.walks.RandomWalk` | classe | 0 | 1 | 3 | garder |  |  |

## `jm.analysis`

| Aujourd'hui | Sorte | Pièces | Tests | Interne | Action | Nom proposé | Remarque |
|---|---|---|---|---|---|---|---|
| `analysis.MusicalAnalysis` | classe | 0 | 2 | 4 | fusionner | analysis.density(notes), analysis.gini(values)… | une seule couche de fonctions plates ; chaque mesure est un nom qui rend une valeur |
| `analysis.MusicalIndex` | classe | 0 | 1 | 4 | retirer |  | l'instance n'ajoute qu'un état à retenir aux mêmes fonctions |
| `analysis.melody.chordAt` | fonction | 1 | 0 | 2 | fusionner |  |  |
| `analysis.melody.chordChangeBehaviours` | fonction | 0 | 0 | 1 | fusionner |  |  |
| `analysis.melody.emotionalMap` | fonction | 1 | 1 | 2 | fusionner |  |  |
| `analysis.melody.mapNotes` | fonction | 0 | 1 | 1 | fusionner |  |  |
| `analysis.melody.pillars` | fonction | 0 | 1 | 1 | fusionner |  |  |
| `analysis.melody.quadrantOf` | fonction | 0 | 0 | 1 | fusionner |  |  |
| `analysis.rhythm.analyzeRhythm` | fonction | 0 | 1 | 1 | fusionner |  |  |
| `analysis.rhythm.anticipationRate` | fonction | 0 | 2 | 2 | fusionner |  |  |
| `analysis.rhythm.anticipations` | fonction | 0 | 1 | 3 | fusionner |  |  |
| `analysis.rhythm.detectOrientation` | fonction | 0 | 2 | 1 | fusionner |  |  |
| `analysis.rhythm.metricHistogram` | fonction | 0 | 1 | 1 | fusionner |  |  |
| `analysis.rhythm.onsetGrid` | fonction | 0 | 1 | 3 | fusionner |  |  |
| `analysis.rhythm.profileFit` | fonction | 0 | 0 | 2 | fusionner |  |  |
| `analysis.rhythm.profileFromTracks` | fonction | 0 | 1 | 1 | fusionner |  |  |
| `analysis.rhythm.stopRate` | fonction | 0 | 0 | 2 | fusionner |  |  |
| `analysis.rhythm.stops` | fonction | 0 | 3 | 7 | fusionner |  |  |
| `analysis.rhythm.upbeatRatio` | fonction | 0 | 2 | 2 | fusionner |  |  |
| `analysis.salience.MODES.accents` | fonction | 2 | 2 | 4 | fusionner |  |  |
| `analysis.salience.MODES.anchors` | fonction | 1 | 2 | 6 | fusionner |  |  |
| `analysis.salience.MODES.chordChanges` | fonction | 0 | 2 | 2 | fusionner |  |  |
| `analysis.salience.MODES.contourPeaks` | fonction | 0 | 0 | 2 | fusionner |  |  |
| `analysis.salience.MODES.long` | fonction | 7 | 6 | 8 | fusionner |  |  |
| `analysis.salience.MODES.motifEdges` | fonction | 0 | 1 | 1 | fusionner |  |  |
| `analysis.salience.MODES.onsets` | fonction | 0 | 6 | 14 | fusionner |  |  |
| `analysis.salience.MODES.repeated` | fonction | 0 | 2 | 5 | fusionner |  |  |
| `analysis.salience.MODES.stops` | fonction | 0 | 3 | 7 | fusionner |  |  |
| `analysis.salience.accents` | fonction | 2 | 2 | 4 | fusionner |  |  |
| `analysis.salience.anchors` | fonction | 1 | 2 | 6 | fusionner |  |  |
| `analysis.salience.chordChanges` | fonction | 0 | 2 | 2 | fusionner |  |  |
| `analysis.salience.contourPeaks` | fonction | 0 | 0 | 2 | fusionner |  |  |
| `analysis.salience.long` | fonction | 7 | 6 | 8 | fusionner |  |  |
| `analysis.salience.motifEdges` | fonction | 0 | 1 | 1 | fusionner |  |  |
| `analysis.salience.onsetPositions` | fonction | 0 | 0 | 3 | fusionner |  |  |
| `analysis.salience.onsets` | fonction | 0 | 6 | 14 | fusionner |  |  |
| `analysis.salience.repeated` | fonction | 0 | 2 | 5 | fusionner |  |  |
| `analysis.salience.salience` | fonction | 0 | 2 | 6 | fusionner |  |  |
| `analysis.salience.salient` | fonction | 0 | 1 | 2 | fusionner |  |  |
| `analysis.salience.stops` | fonction | 0 | 3 | 7 | fusionner |  |  |

## `jm.constants`

| Aujourd'hui | Sorte | Pièces | Tests | Interne | Action | Nom proposé | Remarque |
|---|---|---|---|---|---|---|---|
| `constants.articulations.accent.complex` | donnée | 0 | 0 | 6 | garder |  |  |
| `constants.articulations.accent.description` | donnée | 0 | 0 | 5 | garder |  |  |
| `constants.articulations.bend.complex` | donnée | 0 | 0 | 6 | garder |  |  |
| `constants.articulations.bend.description` | donnée | 0 | 0 | 5 | garder |  |  |
| `constants.articulations.bend.optionalParams` | donnée | 0 | 0 | 3 | garder |  |  |
| `constants.articulations.bend.requiredParams` | donnée | 0 | 0 | 4 | garder |  |  |
| `constants.articulations.crescendo.complex` | donnée | 0 | 0 | 6 | garder |  |  |
| `constants.articulations.crescendo.description` | donnée | 0 | 0 | 5 | garder |  |  |
| `constants.articulations.crescendo.optionalParams` | donnée | 0 | 0 | 3 | garder |  |  |
| `constants.articulations.crescendo.requiredParams` | donnée | 0 | 0 | 4 | garder |  |  |
| `constants.articulations.diminuendo.complex` | donnée | 0 | 0 | 6 | garder |  |  |
| `constants.articulations.diminuendo.description` | donnée | 0 | 0 | 5 | garder |  |  |
| `constants.articulations.diminuendo.optionalParams` | donnée | 0 | 0 | 3 | garder |  |  |
| `constants.articulations.diminuendo.requiredParams` | donnée | 0 | 0 | 4 | garder |  |  |
| `constants.articulations.glissando.complex` | donnée | 0 | 0 | 6 | garder |  |  |
| `constants.articulations.glissando.description` | donnée | 0 | 0 | 5 | garder |  |  |
| `constants.articulations.glissando.requiredParams` | donnée | 0 | 0 | 4 | garder |  |  |
| `constants.articulations.legato.complex` | donnée | 0 | 0 | 6 | garder |  |  |
| `constants.articulations.legato.description` | donnée | 0 | 0 | 5 | garder |  |  |
| `constants.articulations.marcato.complex` | donnée | 0 | 0 | 6 | garder |  |  |
| `constants.articulations.marcato.description` | donnée | 0 | 0 | 5 | garder |  |  |
| `constants.articulations.portamento.complex` | donnée | 0 | 0 | 6 | garder |  |  |
| `constants.articulations.portamento.description` | donnée | 0 | 0 | 5 | garder |  |  |
| `constants.articulations.portamento.optionalParams` | donnée | 0 | 0 | 3 | garder |  |  |
| `constants.articulations.portamento.requiredParams` | donnée | 0 | 0 | 4 | garder |  |  |
| `constants.articulations.staccatissimo.complex` | donnée | 0 | 0 | 6 | garder |  |  |
| `constants.articulations.staccatissimo.description` | donnée | 0 | 0 | 5 | garder |  |  |
| `constants.articulations.staccato.complex` | donnée | 0 | 0 | 6 | garder |  |  |
| `constants.articulations.staccato.description` | donnée | 0 | 0 | 5 | garder |  |  |
| `constants.articulations.tenuto.complex` | donnée | 0 | 0 | 6 | garder |  |  |
| `constants.articulations.tenuto.description` | donnée | 0 | 0 | 5 | garder |  |  |
| `constants.articulations.tremolo.complex` | donnée | 0 | 0 | 6 | garder |  |  |
| `constants.articulations.tremolo.description` | donnée | 0 | 0 | 5 | garder |  |  |
| `constants.articulations.tremolo.optionalParams` | donnée | 0 | 0 | 3 | garder |  |  |
| `constants.articulations.vibrato.complex` | donnée | 0 | 0 | 6 | garder |  |  |
| `constants.articulations.vibrato.description` | donnée | 0 | 0 | 5 | garder |  |  |
| `constants.articulations.vibrato.optionalParams` | donnée | 0 | 0 | 3 | garder |  |  |
| `constants.describe` | fonction | 0 | 0 | 2 | garder |  |  |
| `constants.get` | fonction | 1 | 1 | 12 | garder |  |  |
| `constants.list` | fonction | 1 | 2 | 15 | garder |  |  |
| `constants.listArticulations` | fonction | 0 | 1 | 2 | garder |  |  |
| `constants.listIntervals` | fonction | 0 | 0 | 2 | garder |  |  |
| `constants.listOrnaments` | fonction | 0 | 0 | 2 | garder |  |  |
| `constants.listScales` | fonction | 0 | 0 | 2 | garder |  |  |
| `constants.ornaments.arpeggio.conflicts` | donnée | 0 | 0 | 3 | garder |  |  |
| `constants.ornaments.arpeggio.defaultParams.direction` | donnée | 5 | 4 | 7 | garder |  |  |
| `constants.ornaments.arpeggio.description` | donnée | 0 | 0 | 5 | garder |  |  |
| `constants.ornaments.arpeggio.optionalParams` | donnée | 0 | 0 | 3 | garder |  |  |
| `constants.ornaments.arpeggio.requiredParams` | donnée | 0 | 0 | 4 | garder |  |  |
| `constants.ornaments.arpeggio.validate` | fonction | 0 | 0 | 5 | garder |  |  |
| `constants.ornaments.grace_note.conflicts` | donnée | 0 | 0 | 3 | garder |  |  |
| `constants.ornaments.grace_note.defaultParams.graceNoteType` | donnée | 0 | 2 | 2 | garder |  |  |
| `constants.ornaments.grace_note.description` | donnée | 0 | 0 | 5 | garder |  |  |
| `constants.ornaments.grace_note.optionalParams` | donnée | 0 | 0 | 3 | garder |  |  |
| `constants.ornaments.grace_note.requiredParams` | donnée | 0 | 0 | 4 | garder |  |  |
| `constants.ornaments.grace_note.validate` | fonction | 0 | 0 | 5 | garder |  |  |
| `constants.ornaments.mordent.conflicts` | donnée | 0 | 0 | 3 | garder |  |  |
| `constants.ornaments.mordent.defaultParams.by` | donnée | 0 | 8 | 35 | garder |  |  |
| `constants.ornaments.mordent.description` | donnée | 0 | 0 | 5 | garder |  |  |
| `constants.ornaments.mordent.optionalParams` | donnée | 0 | 0 | 3 | garder |  |  |
| `constants.ornaments.mordent.requiredParams` | donnée | 0 | 0 | 4 | garder |  |  |
| `constants.ornaments.mordent.validate` | fonction | 0 | 0 | 5 | garder |  |  |
| `constants.ornaments.trill.conflicts` | donnée | 0 | 0 | 3 | garder |  |  |
| `constants.ornaments.trill.defaultParams.by` | donnée | 0 | 8 | 35 | garder |  |  |
| `constants.ornaments.trill.defaultParams.trillRate` | donnée | 0 | 2 | 2 | garder |  |  |
| `constants.ornaments.trill.description` | donnée | 0 | 0 | 5 | garder |  |  |
| `constants.ornaments.trill.minDuration` | donnée | 2 | 0 | 3 | garder |  |  |
| `constants.ornaments.trill.optionalParams` | donnée | 0 | 0 | 3 | garder |  |  |
| `constants.ornaments.trill.requiredParams` | donnée | 0 | 0 | 4 | garder |  |  |
| `constants.ornaments.trill.validate` | fonction | 0 | 0 | 5 | garder |  |  |
| `constants.ornaments.turn.conflicts` | donnée | 0 | 0 | 3 | garder |  |  |
| `constants.ornaments.turn.description` | donnée | 0 | 0 | 5 | garder |  |  |
| `constants.ornaments.turn.optionalParams` | donnée | 0 | 0 | 3 | garder |  |  |
| `constants.ornaments.turn.requiredParams` | donnée | 0 | 0 | 4 | garder |  |  |
| `constants.ornaments.turn.validate` | fonction | 0 | 0 | 5 | garder |  |  |
| `constants.search` | fonction | 0 | 0 | 3 | garder |  |  |
| `constants.theory` | fonction | 5 | 7 | 13 | garder |  |  |

## Interne : ne plus exporter

| Aujourd'hui | Sorte | Pièces | Tests | Interne | Action | Nom proposé | Remarque |
|---|---|---|---|---|---|---|---|
| `utils.findClosestPitchAtMeasureStart` | fonction | 0 | 0 | 1 | ne plus exporter |  |  |
| `utils.gcd` | fonction | 0 | 1 | 2 | ne plus exporter |  |  |
| `utils.getDegreeFromPitch` | fonction | 0 | 0 | 0 | ne plus exporter |  |  |
| `utils.getPitchFromDegree` | fonction | 0 | 0 | 0 | ne plus exporter |  |  |
| `utils.lcm` | fonction | 0 | 2 | 2 | ne plus exporter |  |  |
| `utils.normalizeNotes` | fonction | 0 | 0 | 1 | ne plus exporter |  |  |
| `utils.repeatPolyloops` | fonction | 0 | 0 | 0 | ne plus exporter |  |  |
| `utils.scaleList` | fonction | 0 | 0 | 1 | ne plus exporter |  |  |

## À retirer

| Aujourd'hui | Sorte | Pièces | Tests | Interne | Action | Nom proposé | Remarque |
|---|---|---|---|---|---|---|---|
| `utils.adjustNoteDurationsToPreventOverlaps` | fonction | 0 | 0 | 1 | retirer |  |  |
| `utils.at` | fonction | 0 | 1 | 0 | renommer | place(notes, { time, octave, velocity }) | fait : placer une phrase, avec son octave et sa nuance ; testée, donc gardée sous un verbe |
| `utils.cdeToMidi` | fonction | 0 | 1 | 2 | retirer |  |  |
| `utils.chain` | fonction | 0 | 2 | 2 | retirer |  | doublon de concatenateNotes avec les listes en arguments séparés |
| `utils.checkInput` | fonction | 0 | 0 | 0 | retirer |  |  |
| `utils.concatSections` | fonction | 0 | 0 | 1 | retirer |  |  |
| `utils.createScale` | fonction | 0 | 0 | 1 | retirer |  | des notes depuis une liste de hauteurs : une boucle de trois lignes |
| `utils.fibonacci` | fonction | 0 | 0 | 1 | retirer |  |  |
| `utils.fillGapsWithRests` | fonction | 0 | 0 | 2 | retirer |  |  |
| `utils.getOctave` | fonction | 0 | 0 | 0 | retirer |  |  |
| `utils.getSharp` | fonction | 0 | 0 | 0 | retirer |  |  |
| `utils.getTimingInfo` | fonction | 0 | 0 | 0 | retirer |  |  |
| `utils.instrumentMapping.Acoustic Grand Piano` | donnée | 0 | 0 | 1 | retirer (vers jmon/sound) |  |  |
| `utils.instrumentMapping.Bright Acoustic Piano` | donnée | 0 | 0 | 1 | retirer (vers jmon/sound) |  |  |
| `utils.instrumentMapping.Clavinet` | donnée | 0 | 0 | 1 | retirer (vers jmon/sound) |  |  |
| `utils.instrumentMapping.Electric Grand Piano` | donnée | 0 | 0 | 1 | retirer (vers jmon/sound) |  |  |
| `utils.instrumentMapping.Electric Piano 1` | donnée | 0 | 0 | 1 | retirer (vers jmon/sound) |  |  |
| `utils.instrumentMapping.Electric Piano 2` | donnée | 0 | 0 | 1 | retirer (vers jmon/sound) |  |  |
| `utils.instrumentMapping.Gunshot` | donnée | 0 | 0 | 1 | retirer (vers jmon/sound) |  |  |
| `utils.instrumentMapping.Harpsichord` | donnée | 0 | 0 | 1 | retirer (vers jmon/sound) |  |  |
| `utils.instrumentMapping.Honky-tonk Piano` | donnée | 0 | 0 | 1 | retirer (vers jmon/sound) |  |  |
| `utils.midiToCde` | fonction | 0 | 0 | 0 | retirer |  |  |
| `utils.offsetTrack` | fonction | 0 | 0 | 1 | retirer |  |  |
| `utils.qlToSeconds` | fonction | 0 | 0 | 0 | retirer |  |  |
| `utils.quantizeNotes` | fonction | 0 | 1 | 1 | retirer |  |  |
| `utils.quantizePiece` | fonction | 0 | 1 | 1 | retirer |  |  |
| `utils.quantizeTrack` | fonction | 0 | 1 | 1 | retirer |  |  |
| `utils.recalculateTiming` | fonction | 0 | 0 | 0 | retirer |  |  |
| `utils.repairNotes` | fonction | 0 | 0 | 0 | retirer |  |  |
| `utils.roundToList` | fonction | 0 | 0 | 1 | retirer |  |  |
| `utils.setTimeAccordingToDurations` | fonction | 0 | 0 | 0 | retirer |  |  |
| `utils.tracksToDict` | fonction | 0 | 0 | 0 | retirer |  |  |
| `utils.tune` | fonction | 0 | 0 | 1 | retirer |  |  |

## Les méthodes qui changent de maison

| Aujourd'hui | Après |
|---|---|
| `Progression.applyTransforms(ops)` | `voices.neoRiemannian(chord, ops)` |
| `Progression.nrtWalk(length, { seed, … })` | `voices.neoRiemannianWalk(chord, { length, seed, vocabulary, opWeights, inKey })` |
| `Progression.smooth(length, { seed, … })` | `voices.smoothWalk(chord, { length, seed, maxVoiceLeading, qualities, bassRange, octaveBounds })` |
| `Progression` (constructeur) | ne garde que `tonic`, `mode`, `circleOf`, `radius`, `weights` |
| `Voice.lead`, `Voice.leadProgression` | à comparer avec `smoothWalk` ; garder un seul |


## Ce que le tableau compte

| Action | Entrées |
|---|---|
| garder | 160 |
| fusionner | 40 |
| retirer | 33 |
| renommer | 28 |
| déplacer | 23 |
| à | 9 |
| ne | 8 |

## La méthode, une fois le tableau tranché

1. Un commit par espace, les tests et le README déplacés avec, les pièces mises à jour dans la foulée.
2. Après chaque commit, chaque pièce est rendue et ses notes comparées à celles d'avant : identiques, ou la différence est nommée.
3. Version 5.0. L'ancien `jm` reste un temps comme façade qui appelle le nouveau, pour que les carnets d'archive s'ouvrent.

