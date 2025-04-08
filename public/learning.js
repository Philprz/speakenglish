// Gestionnaire de la page d'apprentissage avec contrôle manuel du microphone
document.addEventListener('DOMContentLoaded', function() {
    // Éléments de l'interface
    const micButton = document.getElementById('micButton');
    const statusText = document.getElementById('statusText');
    const conversationArea = document.getElementById('conversationArea');
    const instructionText = document.getElementById('instructionText');
    const feedbackArea = document.getElementById('feedbackArea');
    const feedbackText = document.getElementById('feedbackText');
    const correctionText = document.getElementById('correctionText');
    const continueButton = document.getElementById('continueButton');
    const exitButton = document.getElementById('exitButton');
    const userResponseDisplay = document.getElementById('userResponseDisplay');

    // Initialisation des gestionnaires
    const speechRecognition = new SpeechRecognitionManager();
    const textToSpeech = new TextToSpeechManager();
    const textAnalyzer = new TextAnalyzer();

    // État de la session
    let currentQuestion = 0;
    let isCorrectResponse = false;
    let correctionNeeded = false;
    let microphonePermissionGranted = false;
    let userHasResponded = false;
    let initializationAttempts = 0;
    const maxInitAttempts = 3;
    let isRecording = false;
    
    // Questions pour la session d'apprentissage
    const questions = [
        "How are you today?",
        "What is your favorite hobby?",
        "Where do you live?",
        "What did you do yesterday?",
        "What are your plans for tomorrow?"
    ];

    // Initialisation
    function initialize() {
        console.log("Initialisation de la page d'apprentissage...");
        
        // Vérifier la compatibilité
        if (!SpeechRecognitionManager.isSupported()) {
            showError("Votre navigateur ne supporte pas la reconnaissance vocale. Veuillez utiliser Chrome, Edge ou Safari.");
            micButton.disabled = true;
            // Ajouter quand même le bouton continuer pour permettre la progression
            enableContinueButton();
            return;
        }

        // Initialiser la synthèse vocale d'abord
        textToSpeech.initialize(function(success, errorMsg) {
            if (!success) {
                console.warn("Problème avec la synthèse vocale:", errorMsg);
                // Continuer quand même, ce n'est pas critique
            }
            
            // Ensuite vérifier les permissions du microphone
            checkMicrophonePermission();
        });

        // Configurer les écouteurs d'événements
        micButton.addEventListener('click', handleMicButtonClick);
        continueButton.addEventListener('click', moveToNextQuestion);
        exitButton.addEventListener('click', () => window.location.href = 'index.html');

        // S'assurer que le bouton continuer est caché au départ
        if (continueButton) {
            continueButton.style.display = 'none';
        }

        // Démarrer avec la première question
        askQuestion(currentQuestion);
    }

    // Vérifier la permission du microphone
    function checkMicrophonePermission() {
        console.log("Vérification des permissions du microphone...");
        
        SpeechRecognitionManager.requestMicrophonePermission()
            .then(result => {
                microphonePermissionGranted = result.granted;
                
                if (!result.granted) {
                    showError(result.error || "L'accès au microphone est nécessaire pour utiliser cette application.");
                    micButton.disabled = true;
                    // Ajouter quand même le bouton continuer pour permettre la progression
                    enableContinueButton();
                    return;
                }
                
                // Initialiser la reconnaissance vocale seulement après avoir obtenu la permission
                initializeSpeechRecognition();
            })
            .catch(error => {
                console.error("Erreur lors de la vérification des permissions:", error);
                showError("Impossible de vérifier les permissions du microphone.");
                micButton.disabled = true;
                // Ajouter quand même le bouton continuer pour permettre la progression
                enableContinueButton();
            });
    }
    
    // Initialiser la reconnaissance vocale avec tentatives multiples
    function initializeSpeechRecognition() {
        console.log(`Tentative d'initialisation de la reconnaissance vocale (${initializationAttempts + 1}/${maxInitAttempts})...`);
        
        const initSuccess = speechRecognition.initialize({
            onSpeechStart: handleSpeechStart,
            onSpeechResult: handleSpeechResult,
            onSpeechUpdate: handleSpeechUpdate,
            onSpeechError: handleSpeechError,
            onSpeechEnd: handleSpeechEnd
        });

        if (!initSuccess) {
            initializationAttempts++;
            
            if (initializationAttempts < maxInitAttempts) {
                console.log("Échec de l'initialisation, nouvelle tentative dans 1 seconde...");
                setTimeout(initializeSpeechRecognition, 1000);
            } else {
                console.error("Impossible d'initialiser la reconnaissance vocale après plusieurs tentatives.");
                showError("Impossible d'initialiser la reconnaissance vocale. Veuillez réessayer ou utiliser un autre navigateur.");
                // Activer le mode de secours
                enableFallbackMode();
            }
        } else {
            console.log("Reconnaissance vocale initialisée avec succès.");
            statusText.textContent = "Cliquez sur le microphone pour commencer à parler";
            statusText.className = "mt-2 text-muted";
            micButton.disabled = false;
        }
    }

    // Activer le mode de secours
    function enableFallbackMode() {
        console.log("Activation du mode de secours...");
        
        // Permettre à l'utilisateur de continuer même sans reconnaissance vocale
        enableContinueButton();
        
        // Ajouter un champ de texte pour saisir les réponses manuellement
        const fallbackInput = document.createElement('input');
        fallbackInput.type = 'text';
        fallbackInput.id = 'fallbackInput';
        fallbackInput.className = 'form-control mb-3';
        fallbackInput.placeholder = 'Tapez votre réponse ici...';
        
        const fallbackButton = document.createElement('button');
        fallbackButton.id = 'fallbackButton';
        fallbackButton.className = 'btn btn-primary mb-3';
        fallbackButton.textContent = 'Soumettre';
        
        const fallbackContainer = document.createElement('div');
        fallbackContainer.className = 'text-center mb-3';
        fallbackContainer.appendChild(fallbackInput);
        fallbackContainer.appendChild(document.createElement('br'));
        fallbackContainer.appendChild(fallbackButton);
        
        // Insérer avant le bouton du microphone
        micButton.parentNode.insertBefore(fallbackContainer, micButton);
        
        // Cacher le bouton du microphone
        micButton.style.display = 'none';
        
        // Configurer l'écouteur d'événement pour le bouton de secours
        fallbackButton.addEventListener('click', function() {
            const text = fallbackInput.value.trim();
            if (text) {
                handleFallbackInput(text);
                fallbackInput.value = '';
            }
        });
        
        // Permettre l'envoi avec la touche Entrée
        fallbackInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const text = fallbackInput.value.trim();
                if (text) {
                    handleFallbackInput(text);
                    fallbackInput.value = '';
                }
            }
        });
    }
    
    // Gérer l'entrée de texte en mode de secours
    function handleFallbackInput(text) {
        addToConversation(`<div class="user-message">${text}</div>`);
        
        // Marquer que l'utilisateur a répondu
        userHasResponded = true;
        
        // Analyser la réponse
        const score = textAnalyzer.evaluateResponseQuality(questions[currentQuestion], text);
        isCorrectResponse = score > 70;
        
        feedbackArea.style.display = 'block';
        
        if (isCorrectResponse) {
            // Réponse correcte
            feedbackText.textContent = "Perfect! You said it correctly.";
            feedbackText.className = "feedback-correct";
            correctionText.textContent = "";
            
            textToSpeech.speak("Perfect! You said it correctly.", function(success, errorMsg) {
                if (!success) {
                    console.warn("Problème avec la synthèse vocale:", errorMsg);
                }
            });
        } else {
            // Réponse incorrecte
            correctionNeeded = true;
            const correction = textAnalyzer.generateCorrection(questions[currentQuestion], text);
            feedbackText.textContent = "Almost correct! The phrase should be:";
            feedbackText.className = "feedback-incorrect";
            correctionText.textContent = correction;
            
            textToSpeech.speak(`Almost correct! The phrase should be: ${correction}`, function(success, errorMsg) {
                if (!success) {
                    console.warn("Problème avec la synthèse vocale:", errorMsg);
                }
            });
        }
        
        // Toujours afficher le bouton continuer après une réponse
        continueButton.style.display = 'block';
    }
    
    // Activer le bouton continuer
    function enableContinueButton() {
        if (continueButton) {
            continueButton.style.display = 'block';
            
            // Ajouter un message pour indiquer à l'utilisateur qu'il peut continuer
            if (!userHasResponded) {
                const helpMessage = document.createElement('p');
                helpMessage.className = 'text-info mt-2';
                helpMessage.textContent = "Vous pouvez cliquer sur 'Continuer' pour passer à la question suivante.";
                continueButton.parentNode.insertBefore(helpMessage, continueButton);
            }
        }
    }

    // Gérer le clic sur le bouton du microphone
    function handleMicButtonClick() {
        if (!microphonePermissionGranted) {
            checkMicrophonePermission();
            return;
        }

        if (textToSpeech.isCurrentlySpeaking()) {
            textToSpeech.stop();
        }
        
        if (!isRecording) {
            // Commencer l'enregistrement
            startListening();
            isRecording = true;
            micButton.classList.add('listening');
            statusText.textContent = "Parlez maintenant... Cliquez à nouveau sur le micro quand vous avez terminé";
            statusText.className = "mt-2 text-primary";
        } else {
            // Arrêter l'enregistrement
            stopListening();
            isRecording = false;
            micButton.classList.remove('listening');
            statusText.textContent = "Cliquez sur le microphone pour commencer à parler";
            statusText.className = "mt-2 text-muted";
        }
    }

    // Afficher une erreur
    function showError(message) {
        statusText.textContent = message;
        statusText.className = "mt-2 text-danger";
        console.error(message);
    }

    // Poser une question
    function askQuestion(index) {
        if (index < questions.length) {
            const question = questions[index];
            addToConversation(`<div class="app-message">${question}</div>`);
            
            textToSpeech.speak(question, function(success, errorMsg) {
                if (!success) {
                    console.warn("Problème avec la synthèse vocale:", errorMsg);
                }
            });
            
            instructionText.textContent = question;
            continueButton.style.display = 'none';
            feedbackArea.style.display = 'none';
            userHasResponded = false;
            
            // Réinitialiser l'affichage de la réponse en cours
            if (userResponseDisplay) {
                userResponseDisplay.textContent = "";
                userResponseDisplay.style.display = 'none';
            }
        } else {
            // Fin des questions
            addToConversation(`<div class="app-message">Congratulations! You have completed this learning session.</div>`);
            
            textToSpeech.speak("Congratulations! You have completed this learning session.", function(success, errorMsg) {
                if (!success) {
                    console.warn("Problème avec la synthèse vocale:", errorMsg);
                }
            });
            
            instructionText.textContent = "Session terminée";
            micButton.disabled = true;
            
            // Cacher le mode de secours s'il est actif
            const fallbackContainer = document.getElementById('fallbackInput');
            if (fallbackContainer) {
                fallbackContainer.parentNode.style.display = 'none';
            }
        }
    }

    // Démarrer l'écoute
    function startListening() {
        const success = speechRecognition.startListening();
        
        if (!success) {
            handleSpeechError("Impossible de démarrer la reconnaissance vocale. Veuillez réessayer.");
        }
    }
    
    // Arrêter l'écoute
    function stopListening() {
        speechRecognition.stopListening();
    }

    // Ajouter un message à la zone de conversation
    function addToConversation(html) {
        if (conversationArea) {
            conversationArea.innerHTML += html;
            // Faire défiler vers le bas
            conversationArea.scrollTop = conversationArea.scrollHeight;
        }
    }

    // Gérer le début de la reconnaissance vocale
    function handleSpeechStart() {
        console.log("Reconnaissance vocale démarrée");
    }
    
    // Gérer les mises à jour intermédiaires de la reconnaissance vocale
    function handleSpeechUpdate(text) {
        console.log("Mise à jour de la reconnaissance:", text);
        
        // Afficher la réponse en cours si un élément d'affichage est disponible
        if (userResponseDisplay) {
            userResponseDisplay.textContent = text;
            userResponseDisplay.style.display = 'block';
        }
    }

    // Gérer le résultat de la reconnaissance vocale
    function handleSpeechResult(text, confidence) {
        console.log("Résultat final de la reconnaissance:", text);
        
        addToConversation(`<div class="user-message">${text}</div>`);

        // Marquer que l'utilisateur a répondu
        userHasResponded = true;

        // Analyser la réponse
        const score = textAnalyzer.evaluateResponseQuality(questions[currentQuestion], text);
        isCorrectResponse = score > 70;
        
        feedbackArea.style.display = 'block';
        
        if (isCorrectResponse) {
            // Réponse correcte
            feedbackText.textContent = "Perfect! You said it correctly.";
            feedbackText.className = "feedback-correct";
            correctionText.textContent = "";
            
            textToSpeech.speak("Perfect! You said it correctly.", function(success, errorMsg) {
                if (!success) {
                    console.warn("Problème avec la synthèse vocale:", errorMsg);
                }
            });
        } else {
            // Réponse incorrecte
            correctionNeeded = true;
            const correction = textAnalyzer.generateCorrection(questions[currentQuestion], text);
            feedbackText.textContent = "Almost correct! The phrase should be:";
            feedbackText.className = "feedback-incorrect";
            correctionText.textContent = correction;
            
            textToSpeech.speak(`Almost correct! The phrase should be: ${correction}`, function(success, errorMsg) {
                if (!success) {
                    console.warn("Problème avec la synthèse vocale:", errorMsg);
                }
            });
        }
        
        // Toujours afficher le bouton continuer après une réponse
        continueButton.style.display = 'block';
        
        // Masquer l'affichage de la réponse en cours
        if (userResponseDisplay) {
            userResponseDisplay.style.display = 'none';
        }
    }

    // Gérer les erreurs de reconnaissance vocale
    function handleSpeechError(error) {
        statusText.textContent = `Erreur: ${error}. Réessayez.`;
        statusText.className = "mt-2 text-danger";
        micButton.classList.remove('listening');
        isRecording = false;
        
        console.error("Erreur de reconnaissance vocale:", error);
        
        // Si l'erreur persiste, activer le mode de secours
        if (error.includes("Impossible de démarrer") || error.includes("initialiser")) {
            enableFallbackMode();
        }
        
        // Si l'utilisateur a déjà répondu, afficher quand même le bouton continuer
        if (userHasResponded) {
            continueButton.style.display = 'block';
        }
    }

    // Gérer la fin de la reconnaissance vocale
    function handleSpeechEnd(hasError) {
        console.log("Reconnaissance vocale terminée");
        
        // Ne pas réinitialiser l'interface ici, car en mode manuel,
        // c'est l'utilisateur qui décide quand arrêter l'enregistrement
    }

    // Passer à la question suivante
    function moveToNextQuestion() {
        currentQuestion++;
        askQuestion(currentQuestion);
    }

    // Initialiser la page
    initialize();
});
