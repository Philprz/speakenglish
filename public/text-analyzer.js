// Analyseur de texte intelligent pour l'évaluation des réponses
class TextAnalyzer {
    constructor() {
        this.phrasesDatabase = new PhrasesDatabase();
    }

    // Évaluer la qualité d'une réponse par rapport à une question
    evaluateResponseQuality(question, response) {
        if (!response || response.trim() === '') {
            return 0;
        }

        // Normaliser la question et la réponse
        const normalizedQuestion = this.normalizeText(question);
        const normalizedResponse = this.normalizeText(response);

        // Obtenir les réponses attendues pour cette question
        const expectedResponses = this.getExpectedResponses(normalizedQuestion);
        if (!expectedResponses || expectedResponses.length === 0) {
            return 50; // Score par défaut si aucune réponse attendue n'est trouvée
        }

        // Calculer le meilleur score parmi toutes les réponses attendues
        let bestScore = 0;
        for (const expectedResponse of expectedResponses) {
            const score = this.calculateResponseScore(normalizedResponse, expectedResponse);
            if (score > bestScore) {
                bestScore = score;
            }
        }

        return bestScore;
    }

    // Calculer le score d'une réponse par rapport à une réponse attendue
    calculateResponseScore(response, expectedResponse) {
        // Extraire les mots-clés de la réponse attendue
        const keywords = this.extractKeywords(expectedResponse);
        
        // Compter combien de mots-clés sont présents dans la réponse
        let keywordsFound = 0;
        for (const keyword of keywords) {
            if (response.includes(keyword)) {
                keywordsFound++;
            }
        }
        
        // Calculer le score basé sur le pourcentage de mots-clés trouvés
        const keywordScore = keywords.length > 0 ? (keywordsFound / keywords.length) * 100 : 0;
        
        // Calculer la similarité de structure entre la réponse et la réponse attendue
        const structureScore = this.calculateStructureSimilarity(response, expectedResponse);
        
        // Calculer la similarité sémantique (simplifiée)
        const semanticScore = this.calculateSemanticSimilarity(response, expectedResponse);
        
        // Pondérer les différents scores pour obtenir un score global
        // Donner plus d'importance aux mots-clés et à la sémantique qu'à la structure exacte
        return (keywordScore * 0.5) + (structureScore * 0.2) + (semanticScore * 0.3);
    }

    // Extraire les mots-clés d'un texte
    extractKeywords(text) {
        // Diviser le texte en mots
        const words = text.split(/\s+/);
        
        // Filtrer les mots vides (stop words)
        const stopWords = ['a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 
                          'to', 'of', 'and', 'or', 'but', 'in', 'on', 'at', 'for', 'with', 
                          'about', 'against', 'between', 'into', 'through', 'during', 'before', 
                          'after', 'above', 'below', 'from', 'up', 'down', 'by', 'as', 'i', 
                          'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 
                          'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 
                          'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 
                          'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 
                          'whom', 'this', 'that', 'these', 'those', 'am', 'have', 'has', 'had', 
                          'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 
                          'could', 'may', 'might', 'must', 'ought', 'im', 'youre', 'hes', 
                          'shes', 'its', 'were', 'theyre', 'ive', 'youve', 'weve', 'theyve', 
                          'id', 'youd', 'hed', 'shed', 'wed', 'theyd', 'ill', 'youll', 
                          'hell', 'shell', 'well', 'theyll', 'isnt', 'arent', 'wasnt', 
                          'werent', 'hasnt', 'havent', 'hadnt', 'doesnt', 'dont', 'didnt', 
                          'wont', 'wouldnt', 'shant', 'shouldnt', 'cant', 'couldnt', 'mustnt', 
                          'lets', 'thats', 'whos', 'whats', 'heres', 'theres', 'whens', 
                          'wheres', 'whys', 'hows'];
        
        return words.filter(word => 
            word.length > 1 && !stopWords.includes(word.toLowerCase())
        );
    }

    // Calculer la similarité de structure entre deux textes
    calculateStructureSimilarity(text1, text2) {
        // Diviser les textes en mots
        const words1 = text1.split(/\s+/);
        const words2 = text2.split(/\s+/);
        
        // Calculer la différence de longueur
        const lengthDiff = Math.abs(words1.length - words2.length);
        const lengthScore = Math.max(0, 100 - (lengthDiff * 10));
        
        // Calculer l'ordre des mots (simplifié)
        let orderScore = 0;
        const minLength = Math.min(words1.length, words2.length);
        let matchCount = 0;
        
        for (let i = 0; i < minLength; i++) {
            if (words1[i].toLowerCase() === words2[i].toLowerCase()) {
                matchCount++;
            }
        }
        
        if (minLength > 0) {
            orderScore = (matchCount / minLength) * 100;
        }
        
        // Combiner les scores
        return (lengthScore * 0.4) + (orderScore * 0.6);
    }

    // Calculer la similarité sémantique entre deux textes (version simplifiée)
    calculateSemanticSimilarity(text1, text2) {
        // Cette fonction est une version simplifiée de l'analyse sémantique
        // Dans une implémentation réelle, on utiliserait des embeddings de mots ou des modèles NLP
        
        // Normaliser les textes
        const normalized1 = this.normalizeText(text1);
        const normalized2 = this.normalizeText(text2);
        
        // Diviser en mots
        const words1 = normalized1.split(/\s+/);
        const words2 = normalized2.split(/\s+/);
        
        // Créer des ensembles de mots
        const set1 = new Set(words1);
        const set2 = new Set(words2);
        
        // Calculer l'intersection
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        
        // Calculer l'union
        const union = new Set([...set1, ...set2]);
        
        // Calculer le coefficient de Jaccard
        const jaccardCoefficient = union.size > 0 ? (intersection.size / union.size) : 0;
        
        // Vérifier les synonymes pour les mots qui ne correspondent pas directement
        let synonymScore = 0;
        const nonMatchingWords1 = [...set1].filter(x => !set2.has(x));
        
        for (const word of nonMatchingWords1) {
            const synonyms = this.getSynonyms(word);
            for (const synonym of synonyms) {
                if (set2.has(synonym)) {
                    synonymScore += 1;
                    break;
                }
            }
        }
        
        // Normaliser le score de synonymes
        const maxSynonymScore = nonMatchingWords1.length;
        const normalizedSynonymScore = maxSynonymScore > 0 ? (synonymScore / maxSynonymScore) * 100 : 0;
        
        // Combiner les scores
        return (jaccardCoefficient * 100 * 0.7) + (normalizedSynonymScore * 0.3);
    }

    // Obtenir les synonymes d'un mot (version simplifiée)
    getSynonyms(word) {
        // Dans une implémentation réelle, on utiliserait une API ou une base de données de synonymes
        // Voici quelques exemples de synonymes pour les mots courants en anglais
        const synonymsMap = {
            'good': ['great', 'excellent', 'fine', 'nice', 'wonderful'],
            'bad': ['poor', 'terrible', 'awful', 'horrible', 'unpleasant'],
            'happy': ['glad', 'joyful', 'pleased', 'delighted', 'content'],
            'sad': ['unhappy', 'depressed', 'down', 'miserable', 'gloomy'],
            'big': ['large', 'huge', 'enormous', 'gigantic', 'massive'],
            'small': ['little', 'tiny', 'miniature', 'petite', 'compact'],
            'beautiful': ['pretty', 'lovely', 'gorgeous', 'attractive', 'stunning'],
            'ugly': ['unattractive', 'hideous', 'unsightly', 'plain', 'homely'],
            'smart': ['intelligent', 'clever', 'bright', 'brilliant', 'wise'],
            'stupid': ['dumb', 'foolish', 'idiotic', 'silly', 'dense'],
            'fast': ['quick', 'rapid', 'swift', 'speedy', 'hasty'],
            'slow': ['sluggish', 'unhurried', 'leisurely', 'gradual', 'tardy'],
            'hot': ['warm', 'boiling', 'heated', 'burning', 'fiery'],
            'cold': ['cool', 'chilly', 'freezing', 'icy', 'frosty'],
            'easy': ['simple', 'effortless', 'straightforward', 'uncomplicated', 'painless'],
            'difficult': ['hard', 'challenging', 'tough', 'complicated', 'complex'],
            'interesting': ['engaging', 'fascinating', 'intriguing', 'compelling', 'captivating'],
            'boring': ['dull', 'tedious', 'monotonous', 'uninteresting', 'tiresome'],
            'important': ['significant', 'crucial', 'essential', 'vital', 'critical'],
            'unimportant': ['insignificant', 'trivial', 'minor', 'negligible', 'inconsequential'],
            'like': ['enjoy', 'love', 'adore', 'appreciate', 'fancy'],
            'dislike': ['hate', 'detest', 'loathe', 'despise', 'abhor'],
            'begin': ['start', 'commence', 'initiate', 'launch', 'embark'],
            'end': ['finish', 'conclude', 'terminate', 'complete', 'cease'],
            'create': ['make', 'produce', 'generate', 'form', 'construct'],
            'destroy': ['demolish', 'ruin', 'wreck', 'annihilate', 'obliterate'],
            'increase': ['grow', 'rise', 'expand', 'enlarge', 'escalate'],
            'decrease': ['reduce', 'shrink', 'diminish', 'lessen', 'decline'],
            'buy': ['purchase', 'acquire', 'obtain', 'procure', 'get'],
            'sell': ['vend', 'trade', 'market', 'auction', 'peddle'],
            'find': ['discover', 'locate', 'uncover', 'detect', 'spot'],
            'lose': ['misplace', 'mislay', 'forfeit', 'drop', 'surrender'],
            'help': ['assist', 'aid', 'support', 'back', 'abet'],
            'hinder': ['impede', 'obstruct', 'hamper', 'thwart', 'block'],
            'remember': ['recall', 'recollect', 'reminisce', 'retain', 'mind'],
            'forget': ['overlook', 'omit', 'neglect', 'disregard', 'ignore'],
            'talk': ['speak', 'converse', 'chat', 'communicate', 'discuss'],
            'listen': ['hear', 'heed', 'attend', 'note', 'mind'],
            'watch': ['observe', 'view', 'witness', 'see', 'notice'],
            'hide': ['conceal', 'cover', 'mask', 'cloak', 'veil'],
            'laugh': ['chuckle', 'giggle', 'snicker', 'cackle', 'guffaw'],
            'cry': ['weep', 'sob', 'wail', 'whimper', 'bawl'],
            'walk': ['stroll', 'stride', 'saunter', 'amble', 'trudge'],
            'run': ['sprint', 'dash', 'race', 'jog', 'bolt'],
            'eat': ['consume', 'devour', 'ingest', 'dine', 'feast'],
            'drink': ['sip', 'gulp', 'swallow', 'imbibe', 'quaff'],
            'sleep': ['slumber', 'doze', 'nap', 'rest', 'snooze'],
            'wake': ['awaken', 'rouse', 'stir', 'arise', 'get up'],
            'live': ['exist', 'survive', 'subsist', 'reside', 'dwell'],
            'die': ['perish', 'expire', 'decease', 'pass away', 'succumb'],
            'work': ['labor', 'toil', 'exert', 'function', 'operate'],
            'play': ['frolic', 'sport', 'game', 'recreate', 'romp'],
            'learn': ['study', 'discover', 'grasp', 'comprehend', 'master'],
            'teach': ['instruct', 'educate', 'train', 'tutor', 'coach'],
            'think': ['ponder', 'contemplate', 'reflect', 'meditate', 'muse'],
            'feel': ['sense', 'perceive', 'experience', 'undergo', 'endure'],
            'see': ['view', 'observe', 'notice', 'spot', 'perceive'],
            'hear': ['listen', 'detect', 'catch', 'overhear', 'eavesdrop'],
            'touch': ['feel', 'handle', 'stroke', 'pat', 'caress'],
            'smell': ['sniff', 'scent', 'whiff', 'inhale', 'detect'],
            'taste': ['sample', 'savor', 'flavor', 'relish', 'experience'],
            'give': ['donate', 'present', 'offer', 'provide', 'supply'],
            'take': ['grab', 'seize', 'grasp', 'clutch', 'snatch'],
            'come': ['arrive', 'approach', 'near', 'reach', 'appear'],
            'go': ['leave', 'depart', 'exit', 'withdraw', 'retire'],
            'stay': ['remain', 'linger', 'abide', 'continue', 'persist'],
            'leave': ['depart', 'exit', 'withdraw', 'retire', 'abandon'],
            'open': ['unlock', 'unfasten', 'release', 'free', 'loosen'],
            'close': ['shut', 'seal', 'fasten', 'secure', 'lock'],
            'start': ['begin', 'commence', 'initiate', 'launch', 'embark'],
            'stop': ['cease', 'halt', 'pause', 'discontinue', 'terminate'],
            'move': ['shift', 'transfer', 'relocate', 'displace', 'reposition'],
            'rest': ['relax', 'repose', 'recline', 'ease', 'unwind'],
            'change': ['alter', 'modify', 'adjust', 'vary', 'transform'],
            'remain': ['stay', 'continue', 'persist', 'endure', 'abide'],
            'grow': ['develop', 'increase', 'expand', 'enlarge', 'mature'],
            'shrink': ['contract', 'reduce', 'decrease', 'diminish', 'lessen'],
            'rise': ['ascend', 'climb', 'mount', 'scale', 'soar'],
            'fall': ['drop', 'plunge', 'plummet', 'descend', 'tumble'],
            'win': ['triumph', 'succeed', 'prevail', 'conquer', 'overcome'],
            'lose': ['fail', 'forfeit', 'surrender', 'yield', 'succumb'],
            'love': ['adore', 'cherish', 'treasure', 'worship', 'idolize'],
            'hate': ['detest', 'loathe', 'abhor', 'despise', 'execrate'],
            'fine': ['good', 'well', 'ok', 'okay', 'alright'],
            'thank': ['appreciate', 'grateful', 'thankful'],
            'how': ['what way', 'in what manner', 'by what means'],
            'about': ['regarding', 'concerning', 'on', 'of'],
            'you': ['yourself', 'yourselves']
        };
        
        return synonymsMap[word.toLowerCase()] || [];
    }

    // Normaliser un texte
    normalizeText(text) {
        return text.toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // Supprimer la ponctuation
            .replace(/\s{2,}/g, ' ') // Remplacer les espaces multiples par un seul espace
            .trim();
    }

    // Obtenir les réponses attendues pour une question
    getExpectedResponses(question) {
        // Rechercher dans la base de données de phrases
        return this.phrasesDatabase.getExpectedResponses(question);
    }

    // Générer une correction pour une réponse incorrecte
    generateCorrection(question, response) {
        // Obtenir les réponses attendues
        const expectedResponses = this.getExpectedResponses(question);
        if (!expectedResponses || expectedResponses.length === 0) {
            return "I'm not sure what the correct answer is.";
        }
        
        // Trouver la réponse attendue la plus proche
        let bestMatch = expectedResponses[0];
        let bestScore = 0;
        
        for (const expectedResponse of expectedResponses) {
            const score = this.calculateResponseScore(this.normalizeText(response), this.normalizeText(expectedResponse));
            if (score > bestScore) {
                bestScore = score;
                bestMatch = expectedResponse;
            }
        }
        
        return bestMatch;
    }
}

// Base de données de phrases pour l'apprentissage et l'évaluation
class PhrasesDatabase {
    constructor() {
        // Initialiser les phrases pour l'apprentissage
        this.learningPhrases = {
            "How are you today?": [
                "I am fine, thank you. How about you?",
                "I'm doing well, thanks. And you?",
                "I'm good, thank you. How are you?",
                "I'm fine, thanks for asking. How about yourself?",
                "I'm great, thank you. And yourself?"
            ],
            "What is your favorite hobby?": [
                "My favorite hobby is reading books.",
                "I enjoy playing tennis in my free time.",
                "I like to paint and draw.",
                "I love hiking and exploring nature.",
                "I'm passionate about photography."
            ],
            "Where do you live?": [
                "I live in New York City.",
                "I'm from London, England.",
                "I currently live in Paris, France.",
                "I reside in Tokyo, Japan.",
                "I'm based in Sydney, Australia."
            ],
            "What did you do yesterday?": [
                "Yesterday, I went to the cinema with my friends.",
                "I worked on a project at home yesterday.",
                "I visited my family yesterday.",
                "Yesterday, I read a book and relaxed at home.",
                "I went shopping at the mall yesterday."
            ],
            "What are your plans for tomorrow?": [
                "Tomorrow, I plan to go to the gym.",
                "I'm going to meet my friends for lunch tomorrow.",
                "I have a meeting at work tomorrow.",
                "Tomorrow, I'll be studying for my exam.",
                "I'm planning to visit the museum tomorrow."
            ]
        };
        
        // Initialiser les phrases pour l'évaluation
        this.evaluationQuestions = [
            "How are you today?",
            "What is your name?",
            "Where do you live?",
            "What do you do for a living?",
            "What are your hobbies?",
            "What did you do yesterday?",
            "What are your plans for tomorrow?",
            "Can you describe your family?",
            "What is your favorite food?",
            "What kind of music do you like?"
        ];
        
        // Réponses attendues pour les questions d'évaluation
        this.evaluationResponses = {
            "How are you today?": [
                "I am fine, thank you.",
                "I'm doing well, thanks.",
                "I'm good, thank you.",
                "I'm fine, thanks for asking.",
                "I'm great, thank you."
            ],
            "What is your name?": [
                "My name is [Name].",
                "I'm [Name].",
                "I am [Name].",
                "My name's [Name].",
                "They call me [Name]."
            ],
            "Where do you live?": [
                "I live in [City/Country].",
                "I'm from [City/Country].",
                "I currently live in [City/Country].",
                "I reside in [City/Country].",
                "I'm based in [City/Country]."
            ],
            "What do you do for a living?": [
                "I work as a [Profession].",
                "I'm a [Profession].",
                "I am employed as a [Profession].",
                "I work in [Industry] as a [Role].",
                "My job is [Job Description]."
            ],
            "What are your hobbies?": [
                "My hobbies include [Hobby1] and [Hobby2].",
                "I enjoy [Hobby] in my free time.",
                "I like to [Activity].",
                "I love [Activity] and [Activity].",
                "I'm passionate about [Interest]."
            ],
            "What did you do yesterday?": [
                "Yesterday, I [Activity].",
                "I [Activity] yesterday.",
                "I spent yesterday [Activity].",
                "Yesterday, I was busy with [Activity].",
                "I was [Activity] yesterday."
            ],
            "What are your plans for tomorrow?": [
                "Tomorrow, I plan to [Activity].",
                "I'm going to [Activity] tomorrow.",
                "I have [Event] tomorrow.",
                "Tomorrow, I'll be [Activity].",
                "I'm planning to [Activity] tomorrow."
            ],
            "Can you describe your family?": [
                "My family consists of [Family Members].",
                "I have [Family Description].",
                "My family includes [Family Members].",
                "There are [Number] people in my family: [List].",
                "I live with [Family Members]."
            ],
            "What is your favorite food?": [
                "My favorite food is [Food].",
                "I love eating [Food].",
                "I enjoy [Food] the most.",
                "I'm particularly fond of [Food].",
                "I really like [Food]."
            ],
            "What kind of music do you like?": [
                "I like [Music Genre] music.",
                "I enjoy listening to [Music Genre].",
                "My favorite type of music is [Music Genre].",
                "I'm a fan of [Music Genre] and [Music Genre].",
                "I prefer [Music Genre] over other genres."
            ]
        };
    }

    // Obtenir les réponses attendues pour une question
    getExpectedResponses(question) {
        // Normaliser la question
        const normalizedQuestion = question.toLowerCase().trim();
        
        // Chercher dans les phrases d'apprentissage
        for (const [q, responses] of Object.entries(this.learningPhrases)) {
            if (q.toLowerCase().includes(normalizedQuestion) || normalizedQuestion.includes(q.toLowerCase())) {
                return responses;
            }
        }
        
        // Chercher dans les phrases d'évaluation
        for (const [q, responses] of Object.entries(this.evaluationResponses)) {
            if (q.toLowerCase().includes(normalizedQuestion) || normalizedQuestion.includes(q.toLowerCase())) {
                return responses;
            }
        }
        
        // Si aucune correspondance exacte n'est trouvée, chercher des correspondances partielles
        for (const [q, responses] of Object.entries(this.learningPhrases)) {
            const qWords = q.toLowerCase().split(/\s+/);
            const normalizedWords = normalizedQuestion.split(/\s+/);
            
            // Vérifier si au moins 50% des mots correspondent
            const commonWords = qWords.filter(word => normalizedWords.includes(word));
            if (commonWords.length >= qWords.length * 0.5) {
                return responses;
            }
        }
        
        // Faire de même pour les phrases d'évaluation
        for (const [q, responses] of Object.entries(this.evaluationResponses)) {
            const qWords = q.toLowerCase().split(/\s+/);
            const normalizedWords = normalizedQuestion.split(/\s+/);
            
            const commonWords = qWords.filter(word => normalizedWords.includes(word));
            if (commonWords.length >= qWords.length * 0.5) {
                return responses;
            }
        }
        
        // Si aucune correspondance n'est trouvée, retourner une réponse générique
        return ["I'm not sure how to respond to that question."];
    }
}
