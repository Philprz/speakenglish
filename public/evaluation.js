// Gestionnaire de la page d'évaluation
document.addEventListener('DOMContentLoaded', function() {
    // Éléments de l'interface
    const micButton = document.getElementById('micButton');
    const statusText = document.getElementById('statusText');
    const questionText = document.getElementById('questionText');
    const userResponseText = document.getElementById('userResponseText');
    const feedbackArea = document.getElementById('feedbackArea');
    const feedbackText = document.getElementById('feedbackText');
    const correctionText = document.getElementById('correctionText');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const exitButton = document.getElementById('exitButton');

    // Initialisation des gestionnaires
    const speechRecognition = new SpeechRecognitionManager();
    const textToSpeech = new TextToSpeechManager();
    const textAnalyzer = new TextAnalyzer();

    // État de l'évaluation
    let currentQuestionIndex = 0;
    let correctAnswers = 0;
    let totalQuestions = 10;
    let evaluationQuestions = [];

    // Initialisation
    function initialize() {
        // Initialiser la reconnaissance vocale
        speechRecognition.initialize({
            onSpeechStart: handleSpeechStart,
            onSpeechResult: handleSpeechResult,
            onSpeechError: handleSpeechError,
            onSpeechEnd: handleSpeechEnd
        });

        // Initialiser la synthèse vocale
        textToSpeech.initialize();

        // Vérifier la compatibilité
        if (!SpeechRecognitionManager.isSupported()) {
            alert("Votre navigateur ne supporte pas la reconnaissance vocale. Veuillez utiliser Chrome, Edge ou Safari.");
            micButton.disabled = true;
        }

        // Demander la permission d'utiliser le microphone
        SpeechRecognitionManager.requestMicrophonePermission()
            .then(hasPermission => {
                if (!hasPermission) {
                    alert("L'accès au microphone est nécessaire pour utiliser cette application.");
                    micButton.disabled = true;
                }
            });

        // Configurer les écouteurs d'événements
        micButton.addEventListener('click', startListening);
        exitButton.addEventListener('click', () => window.location.href = 'index.html');

        // Charger les questions d'évaluation
        loadEvaluationQuestions();

        // Configurer la barre de progression
        progressBar.setAttribute('aria-valuemax', totalQuestions);
        updateProgress(0);

        // Démarrer avec la première question
        askQuestion(currentQuestionIndex);
    }

    // Charger les questions d'évaluation
    function loadEvaluationQuestions() {
        // Utiliser les questions de la base de données
        evaluationQuestions = textAnalyzer.phrasesDatabase.evaluationQuestions;
        totalQuestions = evaluationQuestions.length;
    }

    // Poser une question
    function askQuestion(index) {
        if (index < totalQuestions) {
            const question = evaluationQuestions[index];
            questionText.textContent = question;
            userResponseText.textContent = "Votre réponse apparaîtra ici...";
            feedbackArea.style.display = 'none';
            
            // Mettre à jour la progression
            updateProgress(index);
            
            // Prononcer la question
            textToSpeech.speak(question);
        } else {
            // Fin de l'évaluation
            finishEvaluation();
        }
    }

    // Mettre à jour la barre de progression
    function updateProgress(index) {
        const percentage = ((index) / totalQuestions) * 100;
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('aria-valuenow', index);
        progressText.textContent = `Question ${index + 1}/${totalQuestions}`;
    }

    // Démarrer l'écoute
    function startListening() {
        if (textToSpeech.isCurrentlySpeaking()) {
            textToSpeech.stop();
        }
        
        statusText.textContent = "J'écoute...";
        micButton.classList.add('listening');
        speechRecognition.startListening();
    }

    // Gérer le début de la reconnaissance vocale
    function handleSpeechStart() {
        micButton.disabled = true;
        micButton.classList.add('listening');
    }

    // Gérer le résultat de la reconnaissance vocale
    function handleSpeechResult(text, confidence) {
        statusText.textContent = "Cliquez sur le microphone pour parler";
        userResponseText.textContent = text;

        // Analyser la réponse
        const currentQuestion = evaluationQuestions[currentQuestionIndex];
        const score = textAnalyzer.evaluateResponseQuality(currentQuestion, text);
        const isCorrect = score > 70;
        
        feedbackArea.style.display = 'block';
        
        if (isCorrect) {
            // Réponse correcte
            correctAnswers++;
            feedbackText.textContent = "Perfect! You said it correctly.";
            feedbackText.className = "feedback-correct";
            correctionText.textContent = "";
            textToSpeech.speak("Perfect! You said it correctly.");
        } else {
            // Réponse incorrecte
            const correction = textAnalyzer.generateCorrection(currentQuestion, text);
            feedbackText.textContent = "Almost correct! The phrase should be:";
            feedbackText.className = "feedback-incorrect";
            correctionText.textContent = correction;
            textToSpeech.speak(`Almost correct! The phrase should be: ${correction}`);
        }

        // Passer à la question suivante après un délai
        setTimeout(() => {
            moveToNextQuestion();
        }, 3000);
    }

    // Gérer les erreurs de reconnaissance vocale
    function handleSpeechError(error) {
        statusText.textContent = `Erreur: ${error}. Réessayez.`;
        micButton.classList.remove('listening');
        micButton.disabled = false;
    }

    // Gérer la fin de la reconnaissance vocale
    function handleSpeechEnd() {
        micButton.classList.remove('listening');
        micButton.disabled = false;
    }

    // Passer à la question suivante
    function moveToNextQuestion() {
        currentQuestionIndex++;
        
        if (currentQuestionIndex < totalQuestions) {
            askQuestion(currentQuestionIndex);
        } else {
            finishEvaluation();
        }
    }

    // Terminer l'évaluation
    function finishEvaluation() {
        // Calculer le score final
        const score = (correctAnswers / totalQuestions) * 100;
        
        // Déterminer le niveau approximatif
        let level;
        if (score >= 90) {
            level = "Advanced";
        } else if (score >= 70) {
            level = "Upper Intermediate";
        } else if (score >= 50) {
            level = "Intermediate";
        } else if (score >= 30) {
            level = "Elementary";
        } else {
            level = "Beginner";
        }
        
        // Afficher le résultat final
        questionText.textContent = "Évaluation terminée";
        userResponseText.textContent = "";
        feedbackArea.style.display = 'block';
        feedbackText.textContent = `Votre score: ${correctAnswers}/${totalQuestions} (${Math.round(score)}%)`;
        feedbackText.className = "feedback-correct";
        correctionText.textContent = `Niveau estimé: ${level}`;
        
        // Mettre à jour la barre de progression
        progressBar.style.width = "100%";
        progressBar.setAttribute('aria-valuenow', totalQuestions);
        
        // Désactiver le bouton du microphone
        micButton.disabled = true;
        
        // Prononcer le résultat
        textToSpeech.speak(`Your evaluation is complete. Your score is ${Math.round(score)} percent. Your estimated level is ${level}.`);
    }

    // Initialiser la page
    initialize();
});
